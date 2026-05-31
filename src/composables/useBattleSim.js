import { reactive, computed } from 'vue'
import { SIM_SKILLS } from '../constants/battleSim.js'
import {
  skillDamagePct,
  skillVmatrixBonus,
  skillIgnoreDefPct,
  skillExplosionFinalDmgPct,
  skillExplosionCount,
  skillFinalAttackPcts,
  skillIgnitePcts,
  BURNING_MAGIC,
} from '../constants/skills/archmageFP.js'
import {
  ENEMY_ELEM_RESIST_PCT,
  ELEM_IGNORE_BY_JOB,
  levelDiffFinalDmgPct,
} from '../constants/enemySettings.js'
import { useEnemySettings } from './useEnemySettings.js'
import { useCharacter } from './useCharacter.js'
import { useCpDamage, computeEffectiveCooldown } from './useCpDamage.js'
import { useVMatrix } from './useVMatrix.js'
import { useBattleBuffs } from './useBattleBuffs.js'
import { useDotTracker } from './useDotTracker.js'
import { useCpToggles } from './useCpToggles.js'
import { useHyperSkills } from './useHyperSkills.js'
import { clean, add, sub, mul, applyPct, combineIgnorePct, floor } from '../utils/numerics.js'

const SKILL_BY_ID = Object.fromEntries(SIM_SKILLS.map((s) => [s.id, s]))

// DoT 通用係數 — 直接乘進所有 DoT tick (不影響主擊)
const DOT_COEFFICIENT = 1.5

function defaultSkillLevels() {
  const out = {}
  for (const s of SIM_SKILLS) out[s.id] = s.baseLevel
  return out
}

function emptyPerSkill() {
  const out = {}
  for (const s of SIM_SKILLS) {
    out[s.id] = {
      total: 0,
      useCount: 0,
      attackCount: 0,
      avgPerSec: 0,
      avgPerCast: 0,
      avgPerHit: 0,
      maxHit: 0,
      minHit: 0,
      share: 0,
    }
  }
  return out
}

function emptyResult(durationSec) {
  return {
    durationSec,
    totalDmg: 0,
    avgDmgPerSec: 0,
    perSkill: emptyPerSkill(),
    events: [],
    // Meteor Shower 追加擊除錯統計:{ [sourceSkillId]: { rolls, procs, dmg } }
    meteorProcs: {},
    // Ignite 觸發除錯統計:{ [sourceSkillId]: { rolls, procs, dmg } } (dmg 累計該來源所有火牆的傷害)
    igniteProcs: {},
    // 第一次 Megiddo Flame 施放的 snapshot(debug 面板用)— null 表尚未施放
    megiddoFirstCast: null,
  }
}

// mulberry32 — 32-bit 種子、品質遠優於 Numerical Recipes LCG。
// 原本用的 LCG (a=1664525,c=1013904223,m=2^32) 在固定 seed + 固定 stride 下有明顯 bias
// (例:seed=42 + Flame Sweep 每 cast ~18 rng 的採樣節奏,proc roll 平均落在 0.7+,觀察 proc 率 ≈ 20-40%)。
// mulberry32 通過所有常見 PRNG 檢測 (BigCrush 除外,對遊戲模擬足夠)。
function makeRng(seed) {
  let a = seed >>> 0 || 1
  return function rng() {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const state = reactive({
  durationSec: 180,
  result: null,
  // 預設 seed 用當下時間戳 — 避免固定 seed 造成的 stride bias 樣本
  // 要重現特定一段戰鬥時,用 setSeed(n) 手動設回;同一個 seed 下結果完全可重現
  seed: (Date.now() >>> 0) || 1,
  running: false,
  elapsedMs: 0,
  attackSpeed: 8,                            // 7 或 8 (依 skill.castDelayBySpeed 查表)
  skillLevels: defaultSkillLevels(),         // { [skillId]: level }
  // 給 UI 使用的「下次可施放時間」reactive 快照 — tick() 結束時同步一次
  //   remainingMs = max(0, nextCastAt[id] - elapsedMs)
  //   讀源是模組級 nextCastAt,避免每 frame 寫進 reactive 影響效能
  nextCastAt: {},
  // CD 面板專用 — 只反映「遊戲 CD」(不含 scheduler 的動畫鎖 / cast lock)
  //   Mist Eruption 重置 Flame Haze CD 後,flame_haze 這裡會回到 tCast (remaining=0),
  //   即使 scheduler nextCastAt 還被 Mist Eruption 的動畫鎖延後 720ms
  cooldownEndAt: {},
})

// 從 useVMatrix 讀取該技能在 V 矩陣面板 (角色頁) 設定的等級
function vmatrixLevelOf(skillId) {
  try {
    const vm = useVMatrix()
    return vm.state.levels?.[skillId] ?? 0
  } catch {
    return 0
  }
}

let rafId = null
let startedAt = 0
// Ignite 火牆清單 — 每次 proc 生成一面獨立火牆,互不干擾
//   [{ sourceSkillId, spawnAt, nextTickAt, expireAt, tickIntervalMs, tickPct, hitsPerTick }]
let igniteWalls = []
// refreshDerived 節流 — 衍生統計 (share / avgPerSec / avgDmgPerSec / avgPerCast / avgPerHit)
// 每秒才算一次,避免在 rAF (~60Hz) 頻率下頻繁閃動。raw counter (total / useCount /
// attackCount / maxHit / minHit) 由 emitHit / emitCast 即時寫入,不受此節流影響。
let lastRefreshMs = 0

// 模組級「遊戲 CD 結束時間」— 與 nextCastAt 分開記錄,避免動畫鎖汙染 UI CD 顯示
//   - 施放後:cooldownEndAt[id] = tCast + effCdMs (純遊戲 CD,不含 animDelay)
//   - 被其他技能 reset:cooldownEndAt[target] = tCast (立即 ready)
let cooldownEndAt = {}

// 同步模組級 nextCastAt / cooldownEndAt → state,供 UI CD 面板讀取
function syncNextCastAt() {
  const out1 = {}
  for (const k of Object.keys(nextCastAt)) out1[k] = nextCastAt[k]
  state.nextCastAt = out1
  const out2 = {}
  for (const k of Object.keys(cooldownEndAt)) out2[k] = cooldownEndAt[k]
  state.cooldownEndAt = out2
}
let rng = null
let nextCastAt = {}
let burnState = {}       // { [skillId]: { nextTickAt, expireAt, intervalMs } }
let fieldState = {}      // { [skillId]: { expireAt } } — 場地技能持續時間(例:Poison Mist)
// 最近一次施放時間 — 供 waitForSkillCast / cloudDetonate 等跨技能排程規則使用
//   { [skillId]: tCast (ms) };-Infinity 表示本場戰鬥未曾施放
let lastCastAt = {}
// 最近一次 cloudDetonate 引爆時間 — 供「雲是否已消耗」判斷
//   { [sourceSkillId]: tLastDetonate }
//   場上是否仍有雲:lastCastAt[src] != null && cloudDetonatedAt[src] < lastCastAt[src]
let cloudDetonatedAt = {}
// 延遲命中的火球 — 施放時 schedule,tick 到期才觸發傷害 / useCount / Meteor Shower / Ignite
//   [{ skillId, fireAt, orbIndex, fd, attacksPerOrb }]
let pendingOrbHits = []

// Poison Nova 毒雲衰減公式:t<grace → 0(不可引爆) / t≥grace → max(0, initial − floor((t−grace)/decay))
//   讀 skill.sim.clouds 設定 (initialCount / detonateGraceMs / decayIntervalMs)
//   若 cloudDetonatedAt[src] >= lastCastAt[src] → 雲已被引爆消耗,返回 0
function cloudCountOf(sourceSkillId, tNow) {
  const src = SKILL_BY_ID[sourceSkillId]
  const cfg = src?.sim?.clouds
  if (!cfg) return 0
  const lastCast = lastCastAt[sourceSkillId]
  if (lastCast == null || lastCast === -Infinity) return 0
  const lastDetonate = cloudDetonatedAt[sourceSkillId]
  if (lastDetonate != null && lastDetonate >= lastCast) return 0
  const elapsedSinceCast = tNow - lastCast
  const grace = cfg.detonateGraceMs || 0
  if (elapsedSinceCast < grace) return 0
  const decay = Math.max(1, cfg.decayIntervalMs || 300)
  const n = (cfg.initialCount || 0) - Math.floor((elapsedSinceCast - grace) / decay)
  return Math.max(0, n)
}

// 場上是否仍有特定來源技能的雲(未被引爆消耗)
function hasActiveCloudsOf(sourceSkillId) {
  const lastCast = lastCastAt[sourceSkillId]
  if (lastCast == null || lastCast === -Infinity) return false
  const lastDetonate = cloudDetonatedAt[sourceSkillId]
  if (lastDetonate != null && lastDetonate >= lastCast) return false
  return true
}

// burnState 異動後立刻同步到 useDotTracker
// — 同一 tick 內後續的 emitCast / 冷卻檢查 / Fervent Drain 疊層都能讀到當下數字
function syncDotCount() {
  useDotTracker().setActiveDotCount(Object.keys(burnState).length)
}
let currentArcMult = 1   // 每一 tick 重新取得
let currentJobKey = ''   // 當前玩家職業 (用於屬性無視查表)
let currentCharLevel = 0  // 角色等級 (等差終傷查表用)
let currentEnemyLevel = 0 // 怪物等級 (等差終傷查表用)
let cpAttStats = null    // useCpDamage().attStatsInfo (lazy init)
let cpStatTotal = null   // useCpDamage().statTotal (lazy init) — 讀 buffDuration%

// 針對單一技能計算屬性減傷係數:
//   1 − 怪物屬性耐性% × (1 − 無視屬性耐性%/100) / 100
// 若技能無屬性 (skill.element 為空),則一律回 1。
function elemMultFor(skill, enemy) {
  if (!skill.element) return 1
  const resist = ENEMY_ELEM_RESIST_PCT[enemy?.elementalDmg] ?? 50
  const ignore = ELEM_IGNORE_BY_JOB[currentJobKey] || 0
  return Math.max(0, 1 - (resist * (1 - ignore / 100)) / 100)
}

// DoT 專用的怪物類型乘區(一般怪物 未減半基準 = 1;Boss 另外放大)
//   normal     → 1.00   (一般怪物 未減半)
//   boss full  → 1.86   (首領對屬性全額,無減半)
//   boss half  → 1.41   (首領屬性減半)
//   boss none  → 0      (首領完全不吃屬性,DoT 為屬性傷害 → 0)
function dotEnemyMult(enemy) {
  if (enemy?.type !== 'boss') return 1
  switch (enemy?.elementalDmg) {
    case 'full': return 1.86
    case 'half': return 1.41
    case 'none': return 0
    default:     return 1.86
  }
}


// 計算技能當前的實際等級
//   5 轉 V 技能(vmatrix.kind === 'skill')→ 直接使用角色頁 V 矩陣面板的等級
//     Combat Orders 只作用於特定 4 轉技能,不覆蓋 5 轉 V 技能
//   其他技能 → state.skillLevels[id](或 baseLevel);若 combatOrdersEligible 且啟用則 +1
//   Combat Orders 套用範圍:部分 4 轉技能(目前:Flame Sweep / Flame Haze / Mist Eruption / Meteor Shower / Ifrit)
function effSkillLevel(skill) {
  if (skill?.vmatrix?.kind === 'skill') {
    // V 矩陣 skill core — 等級完全由角色頁設定(0..maxLevel)
    return vmatrixLevelOf(skill.id)
  }
  const base = state.skillLevels[skill.id] || skill.baseLevel
  if (!skill?.combatOrdersEligible) return base
  let active = false
  try { active = useCpToggles().isBuffActive('combat_orders') } catch {}
  return active ? base + 1 : base
}

// 取得技能當前等級的原始倍率 (不含超技能 — 超技能的 damagePct / burnDamagePct
// 改「加算到 Damage%」在 rebuildAtt 時一起算,不乘進技能 % 本身)
function skillPctOf(skill) {
  return skillDamagePct(skill, effSkillLevel(skill))
}

// 單一技能的超技能效果合計 (lazy;失敗回空 bag,避免在測試 / 無 Vue context 情境炸)
function hyperBagFor(skillId) {
  try { return useHyperSkills().effectsForSkill(skillId) }
  catch { return {} }
}

// 以戰鬥力計算 (useCpDamage) 提供的實際傷害為基礎,乘上技能倍率 + 其他乘區
// ─────────────────────────────────────────────────────────────────────────
//   技能 V 矩陣 (每個技能獨立,不顯示於角色面板):
//     skillFinalDmgMult = 1 + vmFinalDmgPct/100                ← 僅此技能
//     combinedIgnoreDef = 1 − (1 − CP 無視/100)(1 − VM 無視/100)  ← 主擊才吃,DoT 本來就無視防禦
//
//   主擊傷害:
//     bossMin ≤ bossBase ≤ bossMax   (已含 Damage% / BossDmg% / fm / 爆擊範圍 / 熟練度)
//     defMult = 1 − 怪物DEF × (1 − combinedIgnoreDef%/100) / 100
//     mainHit = bossBase × (主技能倍率/100) × 屬性 × ARC 終傷 × Buff × skillFinalDmgMult × defMult
//
//   DoT 傷害:
//     dotTick = basic × (DoT 技能倍率/100) × 屬性 × ARC 終傷 × Buff × skillFinalDmgMult
//     basic = base × (1 + Damage%/100) × fm                    (不含 BossDmg%、不含爆擊、無視防禦)
// ─────────────────────────────────────────────────────────────────────────

function combinedIgnoreDefPct(...values) {
  return combineIgnorePct(...values)
}

function defMultFor(enemy, totalIgnorePct) {
  const enemyDef = Math.max(0, Number(enemy?.defense) || 0)
  const effective = mul(enemyDef, clean(1 - totalIgnorePct / 100))
  return Math.max(0, clean(1 - effective / 100))
}

// 以 (buff Damage% + 超技能 Damage%) 重算 boss / basic
//   — Damage% 所有來源都相加後進同一個 (1 + Damage%/100) 乘區;不乘進技能 % 本身
function rebuildAtt(att, extraDmgPct) {
  const baseRaw = att?.baseRaw || 0
  const fm = att?.fm || 1
  const totalDmg = add(att?.dmgPct || 0, extraDmgPct || 0)
  const bossDmg = att?.bossDmg || 0
  const abnormalMobDmg = att?.abnormalMobDmg || 0
  const critDmg = att?.critDmg || 0
  const mastery = att?.mastery || 100
  const basicRaw = mul(applyPct(baseRaw, totalDmg), fm)
  const bossRaw  = mul(applyPct(baseRaw, add(totalDmg, bossDmg, abnormalMobDmg)), fm)
  const bossMaxRaw = mul(bossRaw, clean(1.5 + critDmg / 100))
  const bossMinRaw = mul(bossRaw, clean(1.2 + critDmg / 100), mastery / 100)
  return { basicRaw, bossRaw, bossMinRaw, bossMaxRaw }
}

// 單次「主擊」傷害(隨機 bossMin~bossMax 區間取樣)
//   Damage% 桶 = CP Damage% + Buff Damage% + 超技能 damagePct
//   技能自帶 ignoreDef 與爆炸終傷(Mist Eruption 依 DoT 數)也併入
//   pctOverride:傳入時以此取代 skillPctOf(skill).hit,用於 Meteor Shower Final Attack 追加擊
function mainHitDmg(skill, elemMult, enemy, att, pctOverride) {
  const lv = effSkillLevel(skill)
  const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
  const skillFinalMult = clean(1 + vm.finalDmgPct / 100)
  const buffBonuses = useBattleBuffs().currentBonuses(currentJobKey, state.elapsedMs)
  const hs = hyperBagFor(skill.id)
  const extraDmgPct = add(buffBonuses.dmgPct || 0, hs.damagePct || 0)
  const { bossMinRaw, bossMaxRaw } = rebuildAtt(att, extraDmgPct)
  const skillIgDef = skillIgnoreDefPct(skill, lv)
  const totalIgnore = combinedIgnoreDefPct(
    att?.ignoreDef || 0,
    vm.ignoreDefPct,
    buffBonuses.ignoreDefPct,
    hs.ignoreDefPct || 0,
    skillIgDef,
  )
  const defMult = defMultFor(enemy, totalIgnore)

  // 爆炸終傷 (Mist Eruption):依目標身上 DoT 層數查表 → 單次乘區
  //   DoT 層數與爆炸次數分開:爆炸次數固定(explosions.count),DoT 只影響終傷
  const dotCount = useDotTracker().state.activeDotCount
  const explosionFdPct = skillExplosionFinalDmgPct(skill, dotCount)
  const explosionMult = clean(1 + explosionFdPct / 100)

  const range = Math.max(0, sub(bossMaxRaw, bossMinRaw))
  const bossBase = add(bossMinRaw, mul(rng(), range))
  const pct = pctOverride != null ? pctOverride : skillPctOf(skill).hit
  const bmMult = burningMagicFinalDmgMult()
  const ldMult = levelDiffMainMult()
  return mul(bossBase, pct / 100, elemMult, currentArcMult,
             skillFinalMult, buffBonuses.finalDmgMult, defMult, explosionMult, bmMult, ldMult)
}

// 等差 (角色等級 − 怪物等級) 終傷乘區 — 僅主擊套用 (DoT 另有獨立減傷機制,不吃本表)
//   內部查 levelDiffFinalDmgPct(),回 +20% ~ -100% 之間的 %,轉成 ×(1 + pct/100)
function levelDiffMainMult() {
  const pct = levelDiffFinalDmgPct(currentCharLevel, currentEnemyLevel)
  return clean(1 + pct / 100)
}

// Burning Magic (火毒 passive, Lv10) — 場上 DoT 計數 ≥ 1 時 主擊終傷 +20% (與其他終傷相乘)
//   DoT 計數讀 useDotTracker (與 Mist Eruption 爆炸終傷、Fervent Drain 疊層同源)
//   僅 jobs 內的職業生效 (目前只 archmageFP);DoT tick 不吃 (遵循「DoT 不吃通用終傷」規則)
function burningMagicFinalDmgMult() {
  if (!BURNING_MAGIC?.jobs?.includes(currentJobKey)) return 1
  let dotCount = 0
  try { dotCount = useDotTracker().state.activeDotCount } catch {}
  if (dotCount < 1) return 1
  const pct = Number(BURNING_MAGIC.finalDmgPctWhenDotActive) || 0
  return clean(1 + pct / 100)
}

// Burning Magic — DoT 持續時間倍率 (Lv10 = ×2);套用順序:(base + hyper flat) × mult
//   僅 jobs 內的職業生效
function burningMagicDotDurationMult() {
  if (!BURNING_MAGIC?.jobs?.includes(currentJobKey)) return 1
  const m = Number(BURNING_MAGIC.dotDurationMult)
  return Number.isFinite(m) && m > 0 ? m : 1
}

// Ignite — 火屬技能施放時機率生成火牆
//   觸發條件:skill.element === 'fire' 且 skill.id !== 'inferno_aura' (依 MS 描述排除)
//   Ignite 本身是 passive,不會 emitCast,所以不會自我觸發
//   每次觸發生成一面獨立火牆 → 之後由 processIgniteWalls tick
function maybeProcIgnite(skill, tCast, res) {
  if (!skill) return
  if (skill.id === 'inferno_aura') return
  if (skill.element !== 'fire') return
  const ignite = SKILL_BY_ID['ignite']
  if (!ignite) return
  const lvl = effSkillLevel(ignite)
  if (lvl <= 0) return
  const info = skillIgnitePcts(ignite, lvl)
  if (!info || info.procRate <= 0 || info.damage <= 0) return

  const procProb = clean(Math.min(1, Math.max(0, info.procRate / 100)))
  const roll = rng()
  const success = roll < procProb
  const ip = res.igniteProcs[skill.id] || { rolls: 0, procs: 0, dmg: 0 }
  ip.rolls += 1
  if (success) {
    ip.procs += 1
    igniteWalls.push({
      sourceSkillId: skill.id,
      spawnAt: tCast,
      nextTickAt: tCast + info.tickIntervalSec * 1000,
      expireAt: tCast + info.durationSec * 1000,
      tickIntervalMs: info.tickIntervalSec * 1000,
      tickPct: info.damage,
      hitsPerTick: info.hitsPerTick,
    })
    // useCount 由 processIgniteWalls 以 per-tick 方式累加 (每次傷害 = 1 次使用)
  }
  res.igniteProcs[skill.id] = ip
  if (typeof window !== 'undefined' && window.__IGNITE_DEBUG) {
    console.log(
      `[IG] src=${skill.id.padEnd(14)} t=${Math.floor(tCast)}ms ` +
      `roll=${roll.toFixed(4)} prob=${procProb.toFixed(3)} ` +
      `${success ? 'PROC' : 'miss'} (walls=${igniteWalls.length})`
    )
  }
}

// Ignite 火牆 tick 處理:每次 tick 走主擊 pipeline,useCount +=1, attackCount +=hitsPerTick
function processIgniteWalls(elapsed, enemy, att) {
  if (igniteWalls.length === 0) return false
  const ignite = SKILL_BY_ID['ignite']
  if (!ignite) return false
  const res = state.result
  const mStats = res.perSkill[ignite.id]
  if (!mStats) return false
  const elem = elemMultFor(ignite, enemy)
  let changed = false
  for (const wall of igniteWalls) {
    const capped = Math.min(elapsed, wall.expireAt)
    while (wall.nextTickAt <= capped) {
      for (let h = 0; h < wall.hitsPerTick; h++) {
        const raw = mainHitDmg(ignite, elem, enemy, att, wall.tickPct)
        const intDmg = Math.max(1, Math.floor(raw))
        emitHit(mStats, raw)
        const ip = res.igniteProcs[wall.sourceSkillId]
        if (ip) ip.dmg += intDmg
      }
      // 每次 tick 觸發一次傷害 = 1 次 useCount (一次傷害計算一次使用)
      mStats.useCount += 1
      wall.nextTickAt += wall.tickIntervalMs
      changed = true
    }
  }
  // 清掉 tick 完畢 (nextTickAt > expireAt) 的火牆
  igniteWalls = igniteWalls.filter((w) => w.nextTickAt <= w.expireAt)
  return changed
}

// Meteor Shower — Final Attack proc 判定
//   觸發來源:僅「主動施放」的主擊技能 (hitsPerCast > 0 且 sim.role === 'attack')
//     → 排除 'passive' (Meteor Shower 自身,避免自串)
//     → 排除 'derived' (Poison Mist 等衍生命中不觸發)
//     → 排除 'aura'   (Inferno Aura / Ifrit 固定間隔自動觸發的場地/召喚命中不觸發)
//   每次施放固定 1 次 roll(爆炸型如 Mist Eruption 也只算 1 次,不依爆炸數倍增)
function meteorTriggerRolls(skill, meteor) {
  if (!skill || !meteor) return 0
  if (skill.id === meteor.id) return 0
  const role = skill.sim?.role
  if (role === 'passive' || role === 'derived' || role === 'aura') return 0
  if (!skill.hitsPerCast) return 0
  return 1
}

// Meteor Shower — 執行 N 次 proc roll,成功則以 Meteor Shower 主擊管線追加 1 擊
//   emitCast 施放時用(一般技能 1 次、爆炸型 N 次);延遲火球時每顆獨立呼叫(rolls=1)
function rollMeteorShowerTriggers(sourceSkill, rolls, tCast, enemy, att) {
  if (rolls <= 0) return
  const meteor = SKILL_BY_ID['meteor_shower']
  if (!meteor) return
  const mlv = effSkillLevel(meteor)
  const fa = skillFinalAttackPcts(meteor, mlv)
  if (!fa || fa.procRate <= 0 || fa.damage <= 0) return
  const procProb = clean(Math.min(1, Math.max(0, fa.procRate / 100)))
  const mElem = elemMultFor(meteor, enemy)
  const res = state.result
  const mStats = res.perSkill[meteor.id]
  const mp = res.meteorProcs[sourceSkill.id] || { rolls: 0, procs: 0, dmg: 0 }
  mp.rolls += rolls
  for (let r = 0; r < rolls; r++) {
    const roll = rng()
    const success = roll < procProb
    if (typeof window !== 'undefined' && window.__METEOR_DEBUG) {
      console.log(
        `[MS] src=${sourceSkill.id.padEnd(14)} t=${Math.floor(tCast)}ms ` +
        `roll=${roll.toFixed(4)} prob=${procProb.toFixed(3)} ` +
        `${success ? 'PROC' : 'miss'}  (mp.rolls=${mp.rolls} mp.procs=${mp.procs + (success ? 1 : 0)})`
      )
    }
    if (success) {
      const raw = mainHitDmg(meteor, mElem, enemy, att, fa.damage)
      const intDmg = Math.max(1, Math.floor(raw))
      emitHit(mStats, raw)
      // 每顆成功觸發的隕石算 Meteor Shower 的一次「使用」(單擊追加,非 DoT)
      mStats.useCount += 1
      mp.procs += 1
      mp.dmg += intDmg
      // Meteor Shower 追打 (element='fire') 本身也視為一次火屬攻擊事件 → 可觸發 Ignite
      maybeProcIgnite(meteor, tCast, res)
    }
  }
  res.meteorProcs[sourceSkill.id] = mp
}

// 單次 DoT tick — 新公式(與主擊完全獨立):
//   DoT = baseRaw × (DoT 技能倍率/100) × V矩陣終傷 × 特殊終傷 × 怪物類型乘區 × ARC終傷
//
//   baseRaw = 武器係數 × (4×主屬+副屬) × ATK(%後)/100  (att.baseRaw,已包含 ATK% 加成)
//   V矩陣終傷 = 1 + skill.vmatrix 每等累計 finalDmgPct/100
//   特殊終傷 = 目前僅火毒 Fervent Drain 疊層 (每層 +5%,同層相加後轉乘區)
//   怪物類型乘區 = dotEnemyMult(enemy) — 普通怪物 1,Boss 未減半 1.86,Boss 減半 1.41
//   ARC終傷   = 玩家/怪物 ARC 比值對照表換算出的終傷乘區 (例 Boss ARC 比值 +80% → ×1.80)
//
//   ★ 不吃:面板終傷 (fm) / CP Damage% / Buff Damage% / 超技能 Damage%
//          / Boss Damage% / 屬性減傷 / 怪物 DEF / 爆擊 / 熟練度
function dotTickDmg(skill, enemy, att) {
  const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
  const skillFinalMult = clean(1 + vm.finalDmgPct / 100)
  const { mult: specialMult } = useBattleBuffs().dotSpecialFinalMult(currentJobKey, state.elapsedMs)
  const pct = skillPctOf(skill).burn
  const enemyMult = dotEnemyMult(enemy)
  return mul(att?.baseRaw || 0, pct / 100, skillFinalMult, specialMult, enemyMult, currentArcMult, DOT_COEFFICIENT)
}

// 統一累加單次擊中 — 主擊與 DoT tick 都會流經此函式,
// 因此 total / attackCount / maxHit / minHit 皆涵蓋 DoT。
function emitHit(stats, dmg) {
  const d = Math.max(1, Math.floor(dmg))
  stats.total += d
  stats.attackCount += 1
  if (d > stats.maxHit) stats.maxHit = d
  if (stats.minHit === 0 || d < stats.minHit) stats.minHit = d
}

function emitCast(skill, tCast, elemMult, enemy, att) {
  const res = state.result
  res.events.push({ time: tCast, skillId: skill.id, type: 'cast' })
  // 記錄最近一次施放時間 — 供 waitForSkillCast / cloudDetonate 等跨技能規則使用
  lastCastAt[skill.id] = tCast
  // Poison Nova 排程追蹤 — 開啟 `window.__POISON_NOVA_DEBUG = true` 後
  //   每次 emitCast 輸出一行到 console,★ 標記 Poison Nova 自身、✦ 標記引爆 (Mist Eruption)
  //   其它技能以空白標記,方便 Ctrl+F 掃描;可看前後技能的時間點、animDelay 範圍、雲數
  if (typeof window !== 'undefined' && window.__POISON_NOVA_DEBUG) {
    const animDelay = skill.sim?.castDelayBySpeed?.[state.attackSpeed] ?? 0
    const animEnd = tCast + animDelay
    const role = skill.sim?.role
    const tag = skill.id === 'poison_nova'
      ? '★ POISON_NOVA '
      : skill.sim?.cloudDetonate
        ? '✦ DETONATE   '
        : role === 'aura'
          ? '  (aura)     '
          : role === 'derived'
            ? '  (derived)  '
            : '             '
    let extras = ''
    if (skill.id === 'poison_nova') {
      const cfg = skill.sim?.clouds || {}
      const grace = cfg.detonateGraceMs || 0
      extras = `grace_end=${tCast + grace}ms (+${grace})  init=${cfg.initialCount || 0}  decay=${cfg.decayIntervalMs || 0}ms`
    } else if (skill.sim?.cloudDetonate) {
      const srcId = skill.sim.cloudDetonate.sourceSkillId
      const N = cloudCountOf(srcId, tCast)
      const srcLast = lastCastAt[srcId]
      const dt = srcLast != null && Number.isFinite(srcLast) ? (tCast - srcLast) : null
      extras = `src=${srcId} N=${N}${dt != null ? ` (Δ${dt}ms since src)` : ' (src not cast)'}`
    }
    // eslint-disable-next-line no-console
    console.log(
      `[PN] t=${String(Math.floor(tCast)).padStart(6)}ms  anim=${String(animDelay).padStart(4)}→${String(animEnd).padStart(6)}  ${tag}  ${skill.id.padEnd(18)}  ${extras}`,
    )
  }
  const stats = res.perSkill[skill.id]
  const orbs = skill.sim?.orbs
  // 延遲火球型 (例:DoT Punisher / Megiddo Flame) — 施放瞬間不算傷害 / useCount / Meteor Shower / Ignite,
  //   全部延後到每顆 orb 的 fireAt 觸發 (見 processOrbHits)。
  //   依然保留:timeline cast 事件 / rollTriggers / burn 登記 / onHitSpawn / onHitResetCooldown / fieldState
  //
  // 兩種模式:
  //   uniform: orbs.hitDelayRange       → 每顆在 [min,max] ms 內均勻隨機 (DoT Punisher)
  //   cascade: orbs.initialCount/splitPerOrb/initialDelayMs/splitDelayMs → 世代分裂 (Megiddo Flame)
  const hasUniformDelayedOrbs = !!(orbs?.hitDelayRange && orbs?.attacksPerOrb)
  const hasCascadingOrbs = !!(
    orbs?.attacksPerOrb
    && orbs?.initialCount
    && orbs?.splitPerOrb
    && orbs?.initialDelayMs != null
    && orbs?.splitDelayMs != null
    && orbs?.maxTotal
  )
  const hasDelayedOrbs = hasUniformDelayedOrbs || hasCascadingOrbs
  // 爆炸型技能(Mist Eruption):每次爆炸視為一次使用 (useCount += 爆炸數)
  //   一般技能 skillExplosionCount 回傳 1,等同 +1
  //   延遲火球型 (DoT Punisher) 在 processOrbHits per-orb 累加,施放瞬間不加
  const explosionsN = skillExplosionCount(skill)
  if (!hasDelayedOrbs) stats.useCount += explosionsN
  // 實戰 buff: 本次施放先 roll,命中則增加 1 層,後續傷害用新層數計算
  // 若 proc 成功且 buff 標記 appliesDebuff → 連鎖觸發 linkCycle/triggerOn='debuffApplied'(例:Thief's Cunning)
  // linkCycle 屬被動型 buff,不寫進 timeline(僅透過 buff 圖示呈現)
  useBattleBuffs().rollTriggers(rng, currentJobKey, tCast)
  const hs = hyperBagFor(skill.id)
  // 爆炸型:總擊數 = 固定爆炸數 × 每爆擊數 (與 DoT 層數無關)
  const baseHits = (skill.hitsPerCast || 0) * explosionsN
  const hits = Math.max(0, baseHits + (hs.hitsPerCastBonus || 0))
  // 分波火球(例:Megiddo Flame 11 顆 × 4 擊):第 1 顆 FD 100%,其餘 × subsequentFdMult
  //   每擊獨立呼叫 mainHitDmg(各自的 crit / variance),乘上該顆 orb 的 FD 倍率
  if (orbs?.attacksPerOrb) {
    const perOrb = orbs.attacksPerOrb
    const subFd = orbs.subsequentFdMult ?? 1
    if (hasCascadingOrbs) {
      // 世代分裂(Megiddo Flame):首波 initialCount 顆於 tCast + initialDelayMs 命中;
      //   每顆命中後分裂 splitPerOrb 顆,於 splitDelayMs 後命中;累計達 maxTotal 停。
      const maxTotal = orbs.maxTotal
      let orbIndex = 0
      let currentGenCount = orbs.initialCount
      let t = tCast + orbs.initialDelayMs
      while (orbIndex < maxTotal) {
        const toSpawn = Math.min(currentGenCount, maxTotal - orbIndex)
        for (let g = 0; g < toSpawn; g++) {
          const fd = (orbIndex === 0) ? 1 : subFd
          pendingOrbHits.push({
            skillId: skill.id,
            fireAt: t,
            orbIndex,
            fd,
            attacksPerOrb: perOrb,
          })
          orbIndex++
        }
        if (orbIndex >= maxTotal) break
        // 下一代 orb 數 = 當代命中數 × splitPerOrb
        currentGenCount = toSpawn * orbs.splitPerOrb
        if (currentGenCount <= 0) break
        t += orbs.splitDelayMs
      }
    } else {
      // 火球數:基礎 + DoT 層數 × k (DoT Punisher);上限 maxTotal
      const activeDots = useDotTracker().state.activeDotCount
      const baseCount = orbs.baseCount != null ? orbs.baseCount : (orbs.maxTotal || 0)
      const perDotStack = orbs.perDotStack || 0
      const dynamicCount = baseCount + perDotStack * activeDots
      const totalOrbs = orbs.maxTotal ? Math.min(orbs.maxTotal, dynamicCount) : dynamicCount
      if (hasUniformDelayedOrbs) {
        // 延遲命中:每顆 orb 在 tCast + uniformRandom(hitDelayRange) 觸發
        const [minMs, maxMs] = orbs.hitDelayRange
        const span = Math.max(0, maxMs - minMs)
        for (let o = 0; o < totalOrbs; o++) {
          const fd = (o === 0) ? 1 : subFd
          const delay = minMs + rng() * span
          pendingOrbHits.push({
            skillId: skill.id,
            fireAt: tCast + delay,
            orbIndex: o,
            fd,
            attacksPerOrb: perOrb,
          })
        }
      } else {
        // 同 tick 全部命中
        for (let o = 0; o < totalOrbs; o++) {
          const fd = (o === 0) ? 1 : subFd
          for (let h = 0; h < perOrb; h++) {
            emitHit(stats, mainHitDmg(skill, elemMult, enemy, att) * fd)
          }
        }
      }
    }
  } else {
    for (let h = 0; h < hits; h++) {
      // mainHitDmg 已在 bossMin~bossMax 區間隨機取樣 (含爆擊 / 熟練度),不再疊加 variance
      emitHit(stats, mainHitDmg(skill, elemMult, enemy, att))
    }
  }
  // 額外 — 引爆來源技能(sourceSkill)的雲/場地,產生獨立傷害流(例:Mist Eruption → Poison Nova 雲)
  //   傷害公式完全讀 sourceSkill(VM / ignoreDef / element / 等級等)— 引爆技能自身不參與此公式
  //   雲數 N = cloudCountOf(sourceSkillId, tCast);前 fdThresholdCount 發 FD 1.0,其餘 FD fdAfterThreshold
  //   emitHit / useCount 寫入 sourceSkill stats;爆炸部分不觸發追打 / Ignite(見末尾 block)
  if (skill.sim?.cloudDetonate) {
    const cd = skill.sim.cloudDetonate
    const srcSkill = SKILL_BY_ID[cd.sourceSkillId]
    const det = srcSkill?.detonation
    if (srcSkill && det) {
      const N = cloudCountOf(cd.sourceSkillId, tCast)
      const srcStats = res.perSkill[cd.sourceSkillId]
      const perExplosionHits = Math.max(0, det.hitsPerCast || 0)
      const fdRest = det.fdAfterThreshold ?? 0.5
      const threshold = det.fdThresholdCount ?? 3
      const srcLv = effSkillLevel(srcSkill)
      const srcDelta = Math.max(0, srcLv - (srcSkill.baseLevel || 0))
      const detPct = (det.damage?.base || 0) + srcDelta * (det.damage?.perLevel || 0)
      const detElemMult = elemMultFor(srcSkill, enemy)
      if (srcStats && N > 0 && detPct > 0 && perExplosionHits > 0) {
        for (let e = 0; e < N; e++) {
          const fd = e < threshold ? 1 : fdRest
          for (let h = 0; h < perExplosionHits; h++) {
            emitHit(srcStats, mainHitDmg(srcSkill, detElemMult, enemy, att, detPct) * fd)
          }
          srcStats.useCount += 1
        }
        // 標記該來源的雲已被引爆消耗 — 阻止同一批雲被重複計算
        cloudDetonatedAt[cd.sourceSkillId] = tCast
      }
    }
  }
  // Mist Eruption 等技能命中時重置指定技能 CD (例:→ Flame Haze)
  //   scheduler 下一次可施放 = 本施放的動畫完成後 (避免施放重疊) — 由下面的 cast lock 統一處理
  //   UI CD 面板讀 cooldownEndAt → 立即設為 tCast,反映「遊戲 CD 已清零」
  const onHitResetCooldown = skill.sim?.onHitResetCooldown
  if (Array.isArray(onHitResetCooldown) && onHitResetCooldown.length) {
    for (const targetId of onHitResetCooldown) {
      nextCastAt[targetId] = tCast + Math.floor(rng() * 40)
      cooldownEndAt[targetId] = tCast
    }
  }
  // 場地技能 — 記錄到 fieldState 供 requiresField 檢查(例:Poison Mist)
  if (skill.fieldDurationSec) {
    fieldState[skill.id] = { expireAt: tCast + skill.fieldDurationSec * 1000 }
  }
  // 衍生技能 — 於同 tCast 一併施放(例:Flame Haze → Poison Mist)
  const onHitSpawn = skill.sim?.onHitSpawn
  if (Array.isArray(onHitSpawn) && onHitSpawn.length) {
    for (const derivedId of onHitSpawn) {
      const derived = SKILL_BY_ID[derivedId]
      if (derived) emitCast(derived, tCast, elemMultFor(derived, enemy), enemy, att)
    }
  }
  if (skill.burn) {
    // DoT 實際時長 = (base + hyper flat) × Burning Magic 倍率
    const baseDurationSec = skill.burn.durationSec + (hs.burnDurationBonusSec || 0)
    const burnDurationSec = baseDurationSec * burningMagicDotDurationMult()
    const burnMs = burnDurationSec * 1000
    const ivMs = skill.burn.tickIntervalSec * 1000
    const cur = burnState[skill.id]
    if (cur) {
      // 續接(DoT 尚未結束前再次施放):只延長 expireAt,傷害快照不動
      cur.expireAt = tCast + burnMs
    } else {
      // 新 DoT 開始 — 以「當下」面板快照傷害,後續 tick 一律沿用此值
      //   即使 Fervent Drain 層數 / VM 等級 / buff 變動,也不會影響這段 DoT 的傷害
      //   結束後若再觸發,新的一段 DoT 才會重新以當下面板計算
      const snapshotDmg = dotTickDmg(skill, enemy, att)
      burnState[skill.id] = {
        nextTickAt: tCast + ivMs,
        expireAt: tCast + burnMs,
        intervalMs: ivMs,
        dmg: snapshotDmg,
      }
      syncDotCount()
    }
  }

  // [DEBUG] Megiddo Flame — 僅捕捉戰鬥開始後第一次施放的 main hit / DoT snapshot
  if (skill.id === 'megiddo_flame' && !res.megiddoFirstCast) {
    const sampleMain = mainHitDmg(skill, elemMult, enemy, att)
    const orbsMeta = skill.sim?.orbs
    const totalOrbs = orbsMeta?.maxTotal ?? 1
    const perOrb = orbsMeta?.attacksPerOrb ?? hits
    const subFd = orbsMeta?.subsequentFdMult ?? 1
    const firstOrbHit = sampleMain
    const subOrbHit = sampleMain * subFd
    const hitsFirstOrb = perOrb
    const hitsSubOrbs = perOrb * Math.max(0, totalOrbs - 1)
    const mainTotalEst = Math.floor(firstOrbHit * hitsFirstOrb + subOrbHit * hitsSubOrbs)

    const bs = burnState[skill.id]
    const dotTick = bs?.dmg || 0
    const burnDurSec = (skill.burn?.durationSec || 0) + (hs.burnDurationBonusSec || 0)
    const tickIvSec = skill.burn?.tickIntervalSec || 1
    const dotTickCount = Math.max(0, Math.floor(burnDurSec / tickIvSec))
    res.megiddoFirstCast = {
      tCast,
      skillLevel: effSkillLevel(skill),
      hitsRaw: perOrb * totalOrbs,
      orbTotal: totalOrbs,
      perOrb,
      subFdMult: subFd,
      firstOrbHit: Math.floor(firstOrbHit),
      subOrbHit: Math.floor(subOrbHit),
      hitsFirstOrb,
      hitsSubOrbs,
      mainTotalEst,
      dotTickDmg: dotTick,
      dotTickCount,
      dotTotal: dotTick * dotTickCount,
      dotDurationSec: burnDurSec,
      tickIntervalSec: tickIvSec,
    }
  }

  // Meteor Shower 被動 Final Attack — 一般技能於施放瞬間 roll;延遲火球型於每顆 orb 的 fireAt roll
  //   來源只要有 hitsPerCast 就會 roll;僅排除 Meteor Shower 自身 (type='passive')
  //   成功則以 Meteor Shower 自身的傷害管線(含其屬性 / VM / buff / defMult)追加 1 擊
  //   註:cloudDetonate 的「額外雲引爆」不另外觸發追打(只 emitHit 到 sourceSkill),
  //       但引爆技能本身的主 hit 仍照常 roll 一次。
  if (!hasDelayedOrbs) {
    const meteor = SKILL_BY_ID['meteor_shower']
    rollMeteorShowerTriggers(skill, meteorTriggerRolls(skill, meteor), tCast, enemy, att)
    // Ignite — 火屬技能(非 Inferno Aura)施放時機率生成火牆
    maybeProcIgnite(skill, tCast, res)
  }
}

function processBurnTicks(elapsed, enemy, att) {
  let changed = false
  for (const skill of SIM_SKILLS) {
    if (!skill.burn) continue
    const bs = burnState[skill.id]
    if (!bs) continue
    const capped = Math.min(elapsed, bs.expireAt)
    const stats = state.result.perSkill[skill.id]
    // 傷害快照 — 建立 DoT 時即寫入 bs.dmg;續接 / 面板變動一律沿用
    // (舊狀態理論上都會有 dmg,這裡 fallback 以當下面板計算,避免極端情況回 NaN)
    const dotDmg = bs.dmg != null ? bs.dmg : dotTickDmg(skill, enemy, att)
    while (bs.nextTickAt <= capped) {
      // DoT:不爆擊、固定值;流經 emitHit 累加 total / attackCount / maxHit / minHit
      // 時間軸不再顯示 DoT tick(噪音太多),只在 stats 中累積
      emitHit(stats, dotDmg)
      bs.nextTickAt += bs.intervalMs
      changed = true
    }
    if (elapsed >= bs.expireAt) {
      delete burnState[skill.id]
      syncDotCount()
    }
  }
  return changed
}

// 延遲火球處理 — 每 tick 檢查 pendingOrbHits,到期的 orb 觸發傷害 / useCount / MS / Ignite
// 每顆火球獨立:attacksPerOrb 次 mainHitDmg × fd,useCount +1,Meteor Shower 1 次 roll,
// Ignite 1 次 roll (走 maybeProcIgnite)。
function processOrbHits(elapsed, enemy, att) {
  if (!pendingOrbHits.length) return false
  const res = state.result
  let changed = false
  const remaining = []
  for (const p of pendingOrbHits) {
    if (p.fireAt > elapsed) {
      remaining.push(p)
      continue
    }
    const skill = SKILL_BY_ID[p.skillId]
    if (!skill) { changed = true; continue }
    const stats = res.perSkill[skill.id]
    if (!stats) { changed = true; continue }
    const elemMult = elemMultFor(skill, enemy)
    for (let h = 0; h < p.attacksPerOrb; h++) {
      emitHit(stats, mainHitDmg(skill, elemMult, enemy, att) * p.fd)
    }
    stats.useCount += 1
    // 每顆 orb 獨立觸發 Meteor Shower 1 次 + Ignite 1 次
    rollMeteorShowerTriggers(skill, 1, p.fireAt, enemy, att)
    maybeProcIgnite(skill, p.fireAt, res)
    changed = true
  }
  pendingOrbHits = remaining
  return changed
}

function refreshDerived() {
  const res = state.result
  if (!res) return
  const elapsedSec = Math.max(1, state.elapsedMs / 1000)
  let grand = 0
  for (const k of Object.keys(res.perSkill)) grand += res.perSkill[k].total
  res.totalDmg = grand
  res.avgDmgPerSec = Math.floor(grand / elapsedSec)
  for (const k of Object.keys(res.perSkill)) {
    const s = res.perSkill[k]
    s.share = grand > 0 ? (s.total / grand) * 100 : 0
    s.avgPerSec = Math.floor(s.total / elapsedSec)
    s.avgPerCast = s.useCount > 0 ? Math.floor(s.total / s.useCount) : 0
    s.avgPerHit = s.attackCount > 0 ? Math.floor(s.total / s.attackCount) : 0
  }
}

function tick() {
  rafId = null
  if (!state.running || !state.result) return

  const now = performance.now()
  const totalMs = state.durationSec * 1000
  const elapsed = Math.min(now - startedAt, totalMs)
  state.elapsedMs = elapsed

  const { arcInfo, state: enemy } = useEnemySettings()
  const { state: charState } = useCharacter()
  currentArcMult = Math.max(0, (arcInfo.value?.finalDmg ?? 100) / 100)
  currentJobKey = charState.job || ''
  currentCharLevel = Number(charState.level) || 0
  currentEnemyLevel = Number(enemy?.level) || 0
  const att = cpAttStats?.value

  // 自動觸發 activeToggle buff (如 Infinity) — 依當前 attackSpeed / Combat Orders / buffDuration
  const buffDurationPct = cpStatTotal ? cpStatTotal('buffDuration') : 0
  const combatOrdersActive = useCpToggles().isBuffActive('combat_orders')
  const buffActivations = useBattleBuffs().autoTick(elapsed, currentJobKey, {
    attackSpeed: state.attackSpeed,
    combatOrdersActive,
    buffDurationPct,
    cooldownReductionPct: att?.cooldownReductionPct || 0,
    cooldownReductionSec: att?.cooldownReductionSec || 0,
    // 角色頁 V 矩陣面板設定的等級 — 供 useBattleBuffs 解析 useVmatrixLevel 的 buff (例:Mana Overload)
    getVmatrixLevel: vmatrixLevelOf,
  })

  let changed = false
  // 主動 buff 啟動寫入時間軸
  for (const act of buffActivations) {
    state.result.events.push({
      time: act.at,
      skillId: act.id,
      type: 'buff',
      level: act.level,
    })
    changed = true
  }
  // 全域施放排程:每回合取「最早已可施放」的技能 fire(同時多個 ready → priority 高者先)
  // fire 後:
  //   - 主動型:依自身 animDelay 鎖定其他所有主動技能的 nextCastAt (≥ tCast + animDelay)
  //   - Aura 型:僅更新自身 (+ intervalSec),不鎖定其他技能、也不受鎖影響
  //   - Derived 型:永不直接排程 (靠 onHitSpawn)
  let safety = 500
  while (safety-- > 0) {
    let pick = null
    let pickTime = Infinity
    let pickPriority = -Infinity
    for (const s of SIM_SKILLS) {
      const role = s.sim?.role
      if (role === 'derived' || role === 'passive') continue
      const t = nextCastAt[s.id]
      if (t == null || t > elapsed) continue
      const pri = s.sim?.priority || 0
      if (t < pickTime || (t === pickTime && pri > pickPriority)) {
        pick = s
        pickTime = t
        pickPriority = pri
      }
    }
    if (!pick) break
    const skill = pick
    // 前置條件 requiresField — 不滿足就推後 200ms,回圈再選下一個
    const requiresField = skill.sim?.requiresField
    if (requiresField) {
      const fs = fieldState[requiresField]
      if (!fs || elapsed >= fs.expireAt) {
        nextCastAt[skill.id] = elapsed + 200
        continue
      }
    }
    // waitForSkillCast — 等待另一支技能的施放節奏
    //   若目標技能 CD 剩 ≤ cdBelowMs(含 ready / 尚未施放過),推後 100ms 重試
    //   若目標技能剛施放 < delayAfterCastMs,推到 lastCast + delay
    const waitCfg = skill.sim?.waitForSkillCast
    if (waitCfg) {
      const targetId = waitCfg.skillId
      const cdBelowMs = waitCfg.cdBelowMs ?? 0
      const delayMs = waitCfg.delayAfterCastMs ?? 0
      const targetCdEnd = cooldownEndAt[targetId] ?? 0
      const targetCdRem = targetCdEnd - elapsed  // >0 表示還在 CD 中
      const targetLastCast = lastCastAt[targetId]
      const hasTargetCast = targetLastCast != null && Number.isFinite(targetLastCast)
      if (!hasTargetCast || targetCdRem <= cdBelowMs) {
        // 目標尚未施放 或 CD 即將歸零 — 等待其施放完成後再評估
        nextCastAt[skill.id] = elapsed + 100
        continue
      }
      if (hasTargetCast && elapsed < targetLastCast + delayMs) {
        // 目標剛施放 — 推到 lastCast + delay
        nextCastAt[skill.id] = targetLastCast + delayMs
        continue
      }
    }
    const tCast = nextCastAt[skill.id]
    emitCast(skill, tCast, elemMultFor(skill, enemy), enemy, att)
    changed = true

    // Aura:固定間隔觸發,不鎖其他技能
    const auraSim = skill.sim?.aura
    if (auraSim) {
      const intervalMs = Math.max(50, (auraSim.intervalSec || 3) * 1000)
      nextCastAt[skill.id] = tCast + intervalMs
      continue
    }

    const animDelay = skill.sim?.castDelayBySpeed?.[state.attackSpeed] ?? 1000
    const baseCd = Number(skill.cooldown) || 0
    const hsCd = hyperBagFor(skill.id)
    // 條件式優先減免(Mist Eruption 命中 ≥5 爆炸 -2s):爆炸數以施放當下 activeDotCount 判斷
    const activeDots = useDotTracker().state.activeDotCount
    const cdSim = skill.sim?.cooldown || {}
    const priorityThreshold = cdSim.priorityThreshold || 0
    const priorityRed = (priorityThreshold > 0 && activeDots >= priorityThreshold)
      ? (cdSim.priorityRedSec || 0)
      : (priorityThreshold === 0 ? (cdSim.priorityRedSec || 0) : 0)
    const effCdMs = baseCd > 0
      ? computeEffectiveCooldown(baseCd, {
          skillPriorityRedSec: priorityRed,
          skillOwnPctRed: (cdSim.ownPctRed || 0) + (hsCd.cooldownOwnPctRed || 0),
          externalPctRed: att?.cooldownReductionPct || 0,
          hatFlatRedSec: att?.cooldownReductionSec || 0,
          externalPctUsesBaseAsFlat: !!cdSim.externalPctUsesBaseAsFlat,
        }) * 1000
      : 0
    const nextDelta = Math.max(animDelay, effCdMs)
    nextCastAt[skill.id] = tCast + nextDelta + Math.floor(rng() * 40)
    // 遊戲 CD 結束時間 — 僅 effCdMs (不含 animDelay),給 UI CD 面板
    cooldownEndAt[skill.id] = tCast + effCdMs

    // 鎖定其他主動技能至 tCast + animDelay (aura / derived 不受影響)
    //   cooldownEndAt 不受 cast lock 影響 — CD 面板應反映真實遊戲 CD
    const lockUntil = tCast + animDelay
    for (const other of SIM_SKILLS) {
      if (other === skill) continue
      const otherRole = other.sim?.role
      if (otherRole === 'aura' || otherRole === 'derived' || otherRole === 'passive') continue
      const cur = nextCastAt[other.id]
      if (cur != null && cur < lockUntil) nextCastAt[other.id] = lockUntil
    }
    // 雲守衛:如果本次 animEnd 落在 grace end 前 0~200ms 內,
    //   本次允許施放,但把「所有非引爆的主動技能」(含剛施放的自己)推到 graceEnd 之後 —
    //   讓出 Mist Eruption 的引爆時點(否則 CD 短 / 無 CD 的技能會在 animEnd 後又被 pick)
    //   僅對非 cloudDetonate 技能的 cast 生效
    if (!skill.sim?.cloudDetonate) {
      for (const srcId of Object.keys(lastCastAt)) {
        if (!hasActiveCloudsOf(srcId)) continue
        const srcSkill = SKILL_BY_ID[srcId]
        const pnCloudsCfg = srcSkill?.sim?.clouds
        if (!pnCloudsCfg) continue
        const graceEnd = lastCastAt[srcId] + (pnCloudsCfg.detonateGraceMs || 0)
        const timeUntilGrace = graceEnd - lockUntil
        if (timeUntilGrace > 0 && timeUntilGrace < 200) {
          const holdUntil = graceEnd + Math.floor(rng() * 40)
          for (const other of SIM_SKILLS) {
            if (other.sim?.cloudDetonate) continue  // 引爆技能保留其 waitForSkillCast 排程
            const otherRole = other.sim?.role
            if (otherRole === 'aura' || otherRole === 'derived' || otherRole === 'passive') continue
            const cur = nextCastAt[other.id]
            if (cur != null && cur < holdUntil) nextCastAt[other.id] = holdUntil
          }
          break
        }
      }
    }
  }
  if (processOrbHits(elapsed, enemy, att)) changed = true
  if (processBurnTicks(elapsed, enemy, att)) changed = true
  if (processIgniteWalls(elapsed, enemy, att)) changed = true

  // 更新 DoT 數量追蹤:burnState 剩下未過期的 key 數量 = 當前目標身上生效中的 DoT 數
  useDotTracker().setActiveDotCount(Object.keys(burnState).length)

  if (changed) state.result.events.sort((a, b) => a.time - b.time)

  // 每 tick 同步 nextCastAt → state,供 CD 面板讀取最新冷卻狀態
  if (changed) syncNextCastAt()

  // 衍生統計節流:每秒才重算一次(或自然結束時最後一次)
  if (elapsed - lastRefreshMs >= 1000 || elapsed >= totalMs) {
    refreshDerived()
    lastRefreshMs = elapsed
  }

  if (elapsed >= totalMs) {
    // 自然結束 — 與手動 Stop 行為一致 (清實戰 buff / DoT 追蹤)
    state.running = false
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
    return
  }
  rafId = requestAnimationFrame(tick)
}

export function useBattleSim() {
  if (!cpAttStats) {
    const cp = useCpDamage()
    cpAttStats = cp.attStatsInfo
    cpStatTotal = cp.statTotal
  }

  function setDuration(n) {
    if (state.running) return
    const v = Math.max(1, Math.min(3600, Math.floor(Number(n) || 0)))
    state.durationSec = v
  }
  function setSeed(n) {
    state.seed = Math.floor(Number(n) || 0)
  }
  function setAttackSpeed(n) {
    const v = Math.floor(Number(n) || 0)
    if (v === 7 || v === 8) state.attackSpeed = v
  }
  function setSkillLevel(id, lv) {
    if (!(id in state.skillLevels)) return
    const skill = SKILL_BY_ID[id]
    const min = skill?.baseLevel ?? 1
    state.skillLevels[id] = Math.max(min, Math.floor(Number(lv) || min))
  }
  function start() {
    if (state.running) return
    state.result = emptyResult(state.durationSec)
    state.elapsedMs = 0
    lastRefreshMs = 0
    rng = makeRng(state.seed)
    nextCastAt = {}
    cooldownEndAt = {}
    burnState = {}
    fieldState = {}
    igniteWalls = []
    pendingOrbHits = []
    lastCastAt = {}
    cloudDetonatedAt = {}
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
    // 開場排程:
    //   derived 型(例 Poison Mist)→ 完全不排程,靠 onHitSpawn 觸發
    //   aura 型(開關持續技)→ 首次觸發在 firstHitWindowSec 內隨機,不進 priority cascade
    //   一般型                → 依 priority 遞減累加 animDelay,避免同 tick 齊發
    const schedulable = SIM_SKILLS.filter((s) => s.sim?.role !== 'derived' && s.sim?.role !== 'passive')
    const auraSkills = schedulable.filter((s) => s.sim?.aura)
    const normalSkills = schedulable.filter((s) => !s.sim?.aura)
    const ordered = [...normalSkills].sort((a, b) => (b.sim?.priority || 0) - (a.sim?.priority || 0))
    let cursor = 0
    for (const skill of ordered) {
      const anim = skill.sim?.castDelayBySpeed?.[state.attackSpeed] ?? 1000
      cursor += anim
      nextCastAt[skill.id] = cursor + Math.floor(rng() * 40)
    }
    for (const skill of auraSkills) {
      const auraCfg = skill.sim.aura
      const [minSec, maxSec] = auraCfg.firstHitWindowSec || [0, auraCfg.intervalSec || 3]
      const minMs = Math.max(0, minSec) * 1000
      const maxMs = Math.max(minMs, maxSec * 1000)
      nextCastAt[skill.id] = minMs + Math.floor(rng() * Math.max(1, maxMs - minMs))
    }
    syncNextCastAt()
    startedAt = performance.now()
    state.running = true
    rafId = requestAnimationFrame(tick)
  }
  function stop() {
    state.running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    // 手動停止 → 強制重算衍生統計一次,確保顯示是停止當下的最新值
    refreshDerived()
    // 停止 = 結束戰鬥:實戰 buff 與 DoT 追蹤一併清空
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
  }
  function reset() {
    stop()
    state.result = null
    state.elapsedMs = 0
    state.nextCastAt = {}
    state.cooldownEndAt = {}
  }

  // 測試用 — 以當前設定跑一次技能施放,回傳每擊傷害明細。
  // 不影響主模擬器狀態 (不寫入 state.result、不觸發 timeline)
  function simulateSingleCast(skillId = SIM_SKILLS[0]?.id) {
    const skill = SKILL_BY_ID[skillId]
    if (!skill) return null
    const { arcInfo, state: enemy } = useEnemySettings()
    const { state: charState } = useCharacter()
    const arcMult = Math.max(0, (arcInfo.value?.finalDmg ?? 100) / 100)
    const arcFinalPct = arcInfo.value?.finalDmg ?? 100
    currentArcMult = arcMult
    currentJobKey = charState.job || ''
    currentCharLevel = Number(charState.level) || 0
    currentEnemyLevel = Number(enemy?.level) || 0
    const att = cpAttStats?.value || {}
    const levelDiff = currentCharLevel - currentEnemyLevel
    const levelDiffPct = levelDiffFinalDmgPct(currentCharLevel, currentEnemyLevel)
    const levelDiffMult = clean(1 + levelDiffPct / 100)
    const elemMult = elemMultFor(skill, enemy)
    const elemResistPct = ENEMY_ELEM_RESIST_PCT[enemy?.elementalDmg] ?? 50
    const elemIgnorePct = ELEM_IGNORE_BY_JOB[currentJobKey] || 0
    const cpIgnoreDefPct = att.ignoreDef || 0
    const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
    let testDotCount = skill.burn ? 1 : 0
    if (state.running) {
      const existing = Object.keys(burnState).length
      const selfInState = !!burnState[skill.id]
      testDotCount = existing + (skill.burn && !selfInState ? 1 : 0)
    }
    const buffBonuses = useBattleBuffs().currentBonuses(currentJobKey, state.elapsedMs, { dotCountOverride: testDotCount })
    const buffDmgPct = buffBonuses.dmgPct || 0
    const buffIgnoreDefPct = buffBonuses.ignoreDefPct || 0
    const buffFinalDmgMult = buffBonuses.finalDmgMult || 1
    const dotSpecial = useBattleBuffs().dotSpecialFinalMult(currentJobKey, state.elapsedMs, { dotCountOverride: testDotCount })
    const ferventStacks = dotSpecial.stacks
    const ferventPerStack = dotSpecial.perStack
    const dotSpecialMult = dotSpecial.mult
    const dotEnemyMultVal = dotEnemyMult(enemy)
    const hs = hyperBagFor(skill.id)
    const lv = effSkillLevel(skill)
    const skillIgDef = skillIgnoreDefPct(skill, lv)
    const totalIgnoreDefPct = combinedIgnoreDefPct(
      cpIgnoreDefPct, vm.ignoreDefPct, buffIgnoreDefPct, hs.ignoreDefPct || 0, skillIgDef,
    )
    const enemyDef = Math.max(0, Number(enemy?.defense) || 0)
    const effectiveDef = mul(enemyDef, clean(1 - totalIgnoreDefPct / 100))
    const defMult = defMultFor(enemy, totalIgnoreDefPct)
    const skillFinalMult = clean(1 + vm.finalDmgPct / 100)
    const explosionsN = skillExplosionCount(skill)
    const explosionFdPct = skillExplosionFinalDmgPct(skill, testDotCount)
    const explosionMult = clean(1 + explosionFdPct / 100)
    const bmActive = !!(BURNING_MAGIC?.jobs?.includes(currentJobKey) && testDotCount >= 1)
    const bmFdPct = bmActive ? (BURNING_MAGIC.finalDmgPctWhenDotActive || 0) : 0
    const bmMult = clean(1 + bmFdPct / 100)
    const baseP = skillDamagePct(skill, lv)
    const pcts = { hit: baseP.hit, burn: baseP.burn }
    const mainDmgPct = add(buffDmgPct, hs.damagePct || 0)
    const dotDmgPct = add(buffDmgPct, hs.burnDamagePct || 0)
    const localRng = makeRng(state.seed ^ Date.now() ^ performance.now() | 0)
    const mainRebuilt = rebuildAtt(att, mainDmgPct)
    const dotRebuilt = rebuildAtt(att, dotDmgPct)
    const bossMinRaw = mainRebuilt.bossMinRaw
    const bossMaxRaw = mainRebuilt.bossMaxRaw
    const basicRaw   = dotRebuilt.basicRaw
    const perCastHits = (skill.hitsPerCast || 0) * explosionsN
    const totalHits = Math.max(0, add(perCastHits, hs.hitsPerCastBonus || 0))
    const mainHits = []
    for (let h = 0; h < totalHits; h++) {
      const bossBase = add(bossMinRaw, mul(localRng(), sub(bossMaxRaw, bossMinRaw)))
      const value = mul(bossBase, pcts.hit / 100, elemMult, arcMult,
                        skillFinalMult, buffFinalDmgMult, defMult, explosionMult, bmMult, levelDiffMult)
      mainHits.push(Math.max(1, floor(value)))
    }
    const bmDurMult = burningMagicDotDurationMult()
    const baseBurnSec = add(skill.burn?.durationSec || 0, hs.burnDurationBonusSec || 0)
    const burnDurationSec = clean(baseBurnSec * bmDurMult)
    const dotTickCount = floor(burnDurationSec / (skill.burn?.tickIntervalSec || 1)) || 0
    const dotBaseRaw = att.baseRaw || 0
    const dotValue = mul(dotBaseRaw, pcts.burn / 100, skillFinalMult, dotSpecialMult, dotEnemyMultVal, arcMult, DOT_COEFFICIENT)
    const dotHit = skill.burn ? Math.max(dotValue > 0 ? 1 : 0, floor(dotValue)) : 0
    const dotTicks = []
    for (let i = 0; i < dotTickCount; i++) {
      dotTicks.push({ time: (i + 1) * (skill.burn.tickIntervalSec * 1000), dmg: dotHit })
    }
    const mainSum = mainHits.reduce((s, x) => s + x, 0)
    const dotSum = dotTicks.reduce((s, x) => s + x.dmg, 0)

    return {
      skill,
      level: lv,
      mainHits,
      dotTicks,
      mainSum,
      dotSum,
      total: mainSum + dotSum,
      // ── 基礎面板 (CP 頁來源) ──
      base: {
        weaponConst: att.weaponConst,
        primaryStat: att.primaryStat,
        primaryVal: att.primaryVal,
        secondaryVal: att.secondaryVal,
        attVal: att.attVal,
        usesMatk: att.usesMatk,
        baseRaw: att.baseRaw,
        mastery: att.mastery,
      },
      // ── Damage% 桶 (主擊用,相加) ──
      damageBucket: {
        cpDmgPct: att.dmgPct || 0,
        cpBossDmg: att.bossDmg || 0,
        cpAbnormalMobDmg: att.abnormalMobDmg || 0,
        buffDmgPct,
        hyperDamagePct: hs.damagePct || 0,
        total: add(att.dmgPct || 0, att.bossDmg || 0, att.abnormalMobDmg || 0, buffDmgPct, hs.damagePct || 0),
      },
      // ── Final Damage (面板終傷, 獨立乘��) ──
      finalDmg: {
        pct: att.finalDmg || 0,
        mult: att.fm || 1,
      },
      // ── Crit (爆��區間) ──
      crit: {
        critDmg: att.critDmg || 0,
        mastery: att.mastery || 100,
        bossMinRaw,
        bossMaxRaw,
      },
      // ── 技能本體 ──
      skillInfo: {
        hitPct: pcts.hit,
        burnPct: pcts.burn,
        baseHitPct: baseP.hit,
        baseBurnPct: baseP.burn,
        hitsPerCast: skill.hitsPerCast || 0,
        totalHits,
        explosionsN,
        explosionFdPct,
        explosionMult,
        burnDurationSec,
        baseBurnDurationSec: skill.burn?.durationSec || 0,
        dotTickCount,
        tickInterval: skill.burn?.tickIntervalSec || 0,
      },
      // ── 超技能 ──
      hyper: {
        damagePct: hs.damagePct || 0,
        burnDamagePct: hs.burnDamagePct || 0,
        hitsPerCastBonus: hs.hitsPerCastBonus || 0,
        burnDurationBonusSec: hs.burnDurationBonusSec || 0,
        ignoreDefPct: hs.ignoreDefPct || 0,
        cooldownOwnPctRed: hs.cooldownOwnPctRed || 0,
      },
      // ── V 矩陣 ──
      vmatrix: {
        level: vm.level,
        maxLevel: vm.maxLevel,
        finalDmgPct: vm.finalDmgPct,
        ignoreDefPct: vm.ignoreDefPct,
        skillFinalMult,
      },
      // ── Buff (戰鬥增益) ──
      buff: {
        dmgPct: buffDmgPct,
        ignoreDefPct: buffIgnoreDefPct,
        finalDmgMult: buffFinalDmgMult,
        finalDmgPct: clean((buffFinalDmgMult - 1) * 100),
      },
      // ── 屬性 ──
      elem: {
        mult: elemMult,
        resistPct: elemResistPct,
        ignorePct: elemIgnorePct,
      },
      // ── ARC ──
      arc: {
        finalPct: arcFinalPct,
        mult: arcMult,
      },
      // ── 無視防禦 ──
      ignoreDef: {
        cp: cpIgnoreDefPct,
        vm: vm.ignoreDefPct,
        buff: buffIgnoreDefPct,
        hyper: hs.ignoreDefPct || 0,
        skill: skillIgDef,
        total: totalIgnoreDefPct,
        enemyDef,
        effectiveDef,
        defMult,
      },
      // ── Burning Magic ──
      burningMagic: {
        active: bmActive,
        fdPct: bmFdPct,
        mult: bmMult,
        durMult: bmDurMult,
      },
      // ── 等差終傷 ──
      levelDiffInfo: {
        charLevel: currentCharLevel,
        enemyLevel: currentEnemyLevel,
        diff: levelDiff,
        pct: levelDiffPct,
        mult: levelDiffMult,
      },
      // ── DoT 專用 ──
      dot: {
        baseRaw: dotBaseRaw,
        burnPct: pcts.burn,
        skillFinalMult,
        dotSpecialMult,
        ferventStacks,
        ferventPerStack,
        dotEnemyMult: dotEnemyMultVal,
        enemyType: enemy?.type || 'normal',
        enemyElemDmg: enemy?.elementalDmg || 'none',
        arcMult,
        coefficient: DOT_COEFFICIENT,
        dotDmgPct,
        hyperBurnDamagePct: hs.burnDamagePct || 0,
        buffDmgPct,
        dotHit,
        testDotCount,
      },
    }
  }

  const skills = computed(() => SIM_SKILLS)

  const sortedSkills = computed(() => {
    if (!state.result) return SIM_SKILLS
    return [...SIM_SKILLS].sort(
      (a, b) =>
        (state.result.perSkill[b.id]?.total || 0) -
        (state.result.perSkill[a.id]?.total || 0),
    )
  })

  return {
    state,
    skills,
    sortedSkills,
    setDuration,
    setSeed,
    setAttackSpeed,
    setSkillLevel,
    start,
    stop,
    reset,
    simulateSingleCast,
    skillById: (id) => SKILL_BY_ID[id] || null,
  }
}
