import { reactive, computed } from 'vue'
import { SIM_SKILLS, simSkillsForJob, mechanicsForJob } from '../constants/battleSim.js'
import {
  skillDamagePct,
  skillVmatrixBonus,
  skillIgnoreDefPct,
  skillExplosionFinalDmgPct,
  skillExplosionCount,
  skillFinalAttackPcts,
  skillIgnitePcts,
} from '../constants/skills/_shared/helpers.js'
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

// ─── simContext — 每場模擬的內部狀態,start() 時整組重建 ────────────────────
// 不進 reactive:rAF 熱路徑高頻讀寫,只在 syncNextCastAt / refreshDerived
// 匯出快照到 state 供 UI 讀取。
function createSimContext() {
  return {
    rng: null,             // mulberry32 — start() 以 state.seed 建立
    startedAt: 0,          // performance.now() 起點
    lastRefreshMs: 0,      // refreshDerived 節流 — 衍生統計每秒才算一次
    // 當前模擬使用的技能子集 — start() 時依角色職業快照
    //   排程 / DoT tick / cast lock 一律以此為準;SKILL_BY_ID 仍為全職業索引 (僅查表用)
    activeSkills: SIM_SKILLS,
    // scheduler 下次可施放時間 (含動畫鎖) { [skillId]: ms }
    nextCastAt: {},
    // 「遊戲 CD 結束時間」— 與 sim.nextCastAt 分開記錄,避免動畫鎖汙染 UI CD 顯示
    //   - 施放後:sim.cooldownEndAt[id] = tCast + effCdMs (純遊戲 CD,不含 animDelay)
    //   - 被其他技能 reset:sim.cooldownEndAt[target] = tCast (立即 ready)
    cooldownEndAt: {},
    // DoT 狀態 { [skillId]: { nextTickAt, expireAt, intervalMs, dmg } }
    burnState: {},
    // 場地技能持續時間 { [skillId]: { expireAt } } (例:Poison Mist)
    fieldState: {},
    // 最近一次施放時間 — 供 waitForSkillCast / cloudDetonate 等跨技能排程規則使用
    //   { [skillId]: tCast (ms) };無 entry 表示本場戰鬥未曾施放
    lastCastAt: {},
    // 最近一次 cloudDetonate 引爆時間 — 供「雲是否已消耗」判斷
    //   { [sourceSkillId]: tLastDetonate }
    //   場上是否仍有雲:sim.lastCastAt[src] != null && sim.cloudDetonatedAt[src] < sim.lastCastAt[src]
    cloudDetonatedAt: {},
    // Ignite 火牆清單 — 每次 proc 生成一面獨立火牆,互不干擾
    //   [{ sourceSkillId, spawnAt, nextTickAt, expireAt, tickIntervalMs, tickPct, hitsPerTick }]
    igniteWalls: [],
    // 延遲命中的火球 — 施放時 schedule,tick 到期才觸發傷害 / useCount / Final Attack / Ignite
    //   [{ skillId, fireAt, orbIndex, fd, attacksPerOrb }]
    pendingOrbHits: [],
    // 延後上狀態的 DoT — 延遲火球型「第一顆命中」才註冊 burnState (因果:先命中 → 上狀態 → 增傷)
    //   [{ skillId, at }];tick 於 processOrbHits 之後處理 (同 frame 第一顆不吃自身 DoT 增傷)
    pendingBurnStarts: [],
    // Poison Region (mechanics.poisonRegion;例:Creeping Toxin) — 毒池區域狀態
    //   { cfg, psi, expireAt, lastVisibleAt, pools: [{ side, spawnAt, armedAt }] }
    //   null = 尚未施放;引爆 / 補毒邏輯見 poisonRegionOnDetonator
    poisonRegion: null,
    // aura 抑制截止時間 { [auraSkillId]: ms } — 變身/連擊技能期間指定 aura 停止攻擊
    //   (例:Elemental Fury 期間 Ifrit 不攻擊;由 sim.suppressAuraIds 寫入)
    auraSuppressedUntil: {},
  }
}
let sim = createSimContext()

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
      // 逐擊傷害紀錄 (debug) — 僅 sim.hitLog 旗標技能記錄 (例:DoT Punisher);
      //   entry: { dmg, t, orb?, fd?, hit?, dot? },上限 HIT_LOG_CAP 筆後停止記錄
      ...(s.sim?.hitLog ? { hitLog: [] } : {}),
    }
  }
  return out
}

// 逐擊紀錄上限 — 超過即停止記錄 (避免長時間模擬撐爆記憶體;DP 約 141 hit / 25s → 可涵蓋 ~11 分鐘)
const HIT_LOG_CAP = 4000

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
    // Poison Region 除錯統計 — 爆炸總數 / 吃 0.4s 連鎖衰減的次數
    poisonRegion: { explosions: 0, decayed: 0 },
  }
}

// mulberry32 — 32-bit 種子、品質遠優於 Numerical Recipes LCG。
// 原本用的 LCG (a=1664525,c=1013904223,m=2^32) 在固定 seed + 固定 stride 下有明顯 bias
// (例:seed=42 + Flame Sweep 每 cast ~18 次 rng 的採樣節奏,proc roll 平均落在 0.7+,觀察 proc 率 ≈ 20-40%)。
// mulberry32 通過所有常見 PRNG 檢測 (BigCrush 除外,對遊戲模擬足夠)。
function makeRng(seed) {
  let a = seed >>> 0 || 1
  return function () {
    a = (a + 0x6D2B79F5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let onTickCallback = null
let onStopCallback = null

const state = reactive({
  durationSec: 180,
  result: null,
  // 預設 seed 用當下時間戳 — 避免固定 seed 造成的 stride bias 樣本
  // 要重現特定一段戰鬥時,用 setSeed(n) 手動設回;同一個 seed 下結果完全可重現
  seed: (Date.now() >>> 0) || 1,
  running: false,
  fastForwarding: false,                     // 加速模式 — 虛擬時鐘同步推進到結束 (rAF 停用)
  elapsedMs: 0,
  attackSpeed: 8,                            // 7 或 8 (依 skill.castDelayBySpeed 查表)
  skillLevels: defaultSkillLevels(),         // { [skillId]: level }
  disabledSkills: new Set(),                 // 被停用的技能 id (含 sim skill + battle buff)
  // 給 UI 使用的「下次可施放時間」reactive 快照 — tick() 結束時同步一次
  //   remainingMs = max(0, sim.nextCastAt[id] - elapsedMs)
  //   讀源是模組級 sim.nextCastAt,避免每 frame 寫進 reactive 影響效能
  nextCastAt: {},
  // CD 面板專用 — 只反映「遊戲 CD」(不含 scheduler 的動畫鎖 / cast lock)
  //   Mist Eruption 重置 Flame Haze CD 後,flame_haze 這裡會回到 tCast (remaining=0),
  //   即使 scheduler sim.nextCastAt 還被 Mist Eruption 的動畫鎖延後 720ms
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

// setSeed() 手動設定過 seed → start() 保留 (可重現模式);否則每場自動換新
let seedCustom = false

// 同步 sim.nextCastAt / sim.cooldownEndAt → state,供 UI CD 面板讀取
function syncNextCastAt() {
  const out1 = {}
  for (const k of Object.keys(sim.nextCastAt)) out1[k] = sim.nextCastAt[k]
  state.nextCastAt = out1
  const out2 = {}
  for (const k of Object.keys(sim.cooldownEndAt)) out2[k] = sim.cooldownEndAt[k]
  state.cooldownEndAt = out2
}

// Poison Nova 毒雲衰減公式:t<grace → 0(不可引爆) / t≥grace → max(0, initial − floor((t−grace)/decay))
//   讀 skill.sim.clouds 設定 (initialCount / detonateGraceMs / decayIntervalMs)
//   若 sim.cloudDetonatedAt[src] >= sim.lastCastAt[src] → 雲已被引爆消耗,返回 0
function cloudCountOf(sourceSkillId, tNow) {
  const src = SKILL_BY_ID[sourceSkillId]
  const cfg = src?.sim?.clouds
  if (!cfg) return 0
  const lastCast = sim.lastCastAt[sourceSkillId]
  if (lastCast == null || lastCast === -Infinity) return 0
  const lastDetonate = sim.cloudDetonatedAt[sourceSkillId]
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
  const lastCast = sim.lastCastAt[sourceSkillId]
  if (lastCast == null || lastCast === -Infinity) return false
  const lastDetonate = sim.cloudDetonatedAt[sourceSkillId]
  if (lastDetonate != null && lastDetonate >= lastCast) return false
  return true
}

// sim.burnState 異動後立刻同步到 useDotTracker
// — 同一 tick 內後續的 emitCast / 冷卻檢查 / Fervent Drain 疊層都能讀到當下數字
function syncDotCount() {
  useDotTracker().setActiveDotCount(Object.keys(sim.burnState).length)
}
let currentArcMult = 1   // 每一 tick 重新取得
let currentJobKey = ''   // 當前玩家職業 (用於屬性無視查表)

// 當前職業的戰鬥模擬機制設定 (jobs/<job>/mechanics.js)
//   無設定的職業回空物件 — 所有機制管線 (Final Attack / Ignite / DoT 被動) 自動跳過
function currentMechanics() {
  return mechanicsForJob(currentJobKey) || {}
}

// 戰鬥 buff 主屬 flat 加成 — 每 tick 快取一次 (rebuildAtt / dotTickDmg 熱路徑用)
let currentBuffStatFlat = 0

// statBoost 'mapleWarriorEnhance' 型 (例:Maple World Goddess's Blessing):
//   提升% = floor(楓葉祝福% × 增幅%/100)   — 例 16% × 390% = 62.4 → 62%
//   主屬 flat = floor(AP × 提升%/100)      — 與楓葉祝福同規則 (AP = CP baseStats 基礎主屬)
//   楓葉祝福 (CP buff maple_warrior) 未開啟時無可增幅對象 → 0
function computeBuffStatFlat(att) {
  let boosts
  try { boosts = useBattleBuffs().activeStatBoosts(currentJobKey, state.elapsedMs) } catch { return 0 }
  if (!boosts.length) return 0
  let flat = 0
  for (const b of boosts) {
    if (b.type !== 'mapleWarriorEnhance') continue
    let mwOn = false
    let coOn = false
    try {
      const toggles = useCpToggles()
      mwOn = toggles.isBuffActive('maple_warrior')
      coOn = toggles.isBuffActive('combat_orders')
    } catch {}
    if (!mwOn) continue
    // 楓葉祝福:Lv30 = 15%,Combat Orders +1 級 → 16%
    const mwPct = 15 + (coOn ? 1 : 0)
    const boostPct = Math.floor((mwPct * b.pct) / 100)
    const primaryKey = att?.primaryStat
    const ap = primaryKey && cpBaseStats ? Number(cpBaseStats.value?.[primaryKey]) || 0 : 0
    flat += Math.floor((ap * boostPct) / 100)
  }
  return flat
}

// buff 主屬 flat 反映到 baseRaw:baseRaw × (4×(主屬+flat)+副屬) / (4×主屬+副屬)
//   主擊 (rebuildAtt) 與 DoT (dotTickDmg) 皆吃 — DoT 依快照規則,施放當下生效中才帶入
function adjustedBaseRaw(att) {
  const baseRaw = att?.baseRaw || 0
  const flat = currentBuffStatFlat
  if (!flat || !baseRaw) return baseRaw
  const p = Number(att?.primaryVal) || 0
  const s = Number(att?.secondaryVal) || 0
  const denom = 4 * p + s
  if (denom <= 0) return baseRaw
  return mul(baseRaw, clean((4 * (p + flat) + s) / denom))
}

// V 技能核心 (vmatrix.kind === 'skill') 未配點 (面板等級 0) = 未習得 — 不排程
//   boost core (kind 'boost') 不受此限:技能本體由轉職習得,VM 0 只是沒有強化
function vSkillLearned(s) {
  if (s?.vmatrix?.kind !== 'skill') return true
  return vmatrixLevelOf(s.id) > 0
}

// requiresBuffStacks 施放門檻 — buff 層數達標才能施放
//   { buffId, min, orMax } → 層數 ≥ min(min, buff 上限);orMax 讓「滿層」也算達標
//   (例:Elemental Fury 需 Fervent Drain ≥5 層或滿層 — 未來層數上限變動時判定仍成立)
function buffStacksGateOk(skill) {
  const req = skill.sim?.requiresBuffStacks
  if (!req) return true
  try {
    const { stacks, maxStacks } = useBattleBuffs().stackCountOf(req.buffId)
    const threshold = req.orMax ? Math.min(req.min, maxStacks || req.min) : req.min
    return stacks >= threshold
  } catch {
    return true
  }
}
let currentCharLevel = 0  // 角色等級 (等差終傷查表用)
let currentEnemyLevel = 0 // 怪物等級 (等差終傷查表用)
let cpAttStats = null    // useCpDamage().attStatsInfo (lazy init)
let cpStatTotal = null   // useCpDamage().statTotal (lazy init) — 讀 buffDuration%
let cpBaseStats = null   // useCpDamage().baseStats (lazy init) — AP 基礎主屬 (statBoost 型 buff 用)

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
  const baseRaw = adjustedBaseRaw(att)
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
  const bossBase = add(bossMinRaw, mul(sim.rng(), range))
  const pct = pctOverride != null ? pctOverride : skillPctOf(skill).hit
  const bmMult = dotPassiveFinalDmgMult()
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

// DoT 被動 (mechanics.dotPassive;例:火毒 Burning Magic Lv10)
//   場上 DoT 計數 ≥ 1 時 主擊終傷 +N% (與其他終傷相乘)
//   DoT 計數讀 useDotTracker (與 Mist Eruption 爆炸終傷、Fervent Drain 疊層同源)
//   無 dotPassive 設定的職業回 1;DoT tick 不吃 (遵循「DoT 不吃通用終傷」規則)
function dotPassiveFinalDmgMult() {
  const cfg = currentMechanics().dotPassive
  if (!cfg) return 1
  let dotCount = 0
  try { dotCount = useDotTracker().state.activeDotCount } catch {}
  if (dotCount < 1) return 1
  const pct = Number(cfg.finalDmgPctWhenDotActive) || 0
  return clean(1 + pct / 100)
}

// DoT 被動 — DoT 持續時間倍率 (Burning Magic Lv10 = ×2);套用順序:(base + hyper flat) × mult
//   無 dotPassive 設定的職業回 1
function dotPassiveDotDurationMult() {
  const cfg = currentMechanics().dotPassive
  if (!cfg) return 1
  const m = Number(cfg.dotDurationMult)
  return Number.isFinite(m) && m > 0 ? m : 1
}

// Ignite 型火牆管線 (mechanics.ignite) — 指定屬性技能施放時機率生成火牆
//   觸發條件:skill.element === cfg.triggerElement 且不在 cfg.excludeSourceIds 內
//   火牆技能本身是 passive,不會 emitCast,所以不會自我觸發
//   每次觸發生成一面獨立火牆 → 之後由 processIgniteWalls tick
function maybeProcIgnite(skill, tCast, res) {
  if (!skill) return
  const cfg = currentMechanics().ignite
  if (!cfg) return
  if (state.disabledSkills.has(cfg.skillId)) return
  if (cfg.excludeSourceIds?.includes(skill.id)) return
  if (skill.element !== cfg.triggerElement) return
  const ignite = SKILL_BY_ID[cfg.skillId]
  if (!ignite) return
  const lvl = effSkillLevel(ignite)
  if (lvl <= 0) return
  const info = skillIgnitePcts(ignite, lvl)
  if (!info || info.procRate <= 0 || info.damage <= 0) return

  const procProb = clean(Math.min(1, Math.max(0, info.procRate / 100)))
  const roll = sim.rng()
  const success = roll < procProb
  const ip = res.igniteProcs[skill.id] || { rolls: 0, procs: 0, dmg: 0 }
  ip.rolls += 1
  if (success) {
    ip.procs += 1
    sim.igniteWalls.push({
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
      `${success ? 'PROC' : 'miss'} (walls=${sim.igniteWalls.length})`
    )
  }
}

// Ignite 火牆 tick 處理:每次 tick 走主擊 pipeline,useCount +=1, attackCount +=hitsPerTick
function processIgniteWalls(elapsed, enemy, att) {
  if (sim.igniteWalls.length === 0) return false
  const cfg = currentMechanics().ignite
  const ignite = cfg ? SKILL_BY_ID[cfg.skillId] : null
  if (!ignite) return false
  const res = state.result
  const mStats = res.perSkill[ignite.id]
  if (!mStats) return false
  const elem = elemMultFor(ignite, enemy)
  let changed = false
  for (const wall of sim.igniteWalls) {
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
  sim.igniteWalls = sim.igniteWalls.filter((w) => w.nextTickAt <= w.expireAt)
  return changed
}

// ─── Poison Region 管線 (mechanics.poisonRegion;例:Creeping Toxin) ─────────
// 量化模型:根目錄 POISON_REGION_SPEC.md。事件驅動實作:
//   - 施放 → initPoisonRegion 建立區域 (判定網格相位 ψ = tCast + castAnim)
//   - 火屬主動攻擊的每個「命中時點」→ poisonRegionOnDetonator 檢查引爆
//   - 補毒時刻在爆炸當下直接算出 (死區後的第一個全域判定),不需逐 tick 推進

// 召喚物實際持續時間 (ms) — totem.durationSec × (1 + 召喚獸持續時間%/100)
//   時長加成來源走 CP statTotal('summonDuration') (例:聯盟槍神 +4~12%)
//   注意:只影響「持續多久」,不影響 recastIntervalSec 補放週期 —
//   多出的時長是補放尋找空檔的緩衝 (寧可晚放,不打斷循環)
function totemDurationMs(skill) {
  const baseSec = Number(skill?.totem?.durationSec) || 0
  if (baseSec <= 0) return 0
  const pct = cpStatTotal ? Number(cpStatTotal('summonDuration')) || 0 : 0
  return baseSec * (1 + pct / 100) * 1000
}

// 施放毒池技能 — 建立/重置區域狀態
function initPoisonRegion(skill, tCast) {
  const cfg = currentMechanics().poisonRegion
  if (!cfg || skill.id !== cfg.skillId) return
  const psi = tCast + cfg.castAnimSec * 1000
  const J = cfg.judgeIntervalSec * 1000
  const pools = []
  const n = Math.max(1, cfg.poolCount || 2)
  for (let i = 0; i < n; i++) {
    // L1/R1 於第 1 次判定 (ψ) 生成;L2/R2 於第 2 次判定 (ψ+J) …依序向外推
    const side = i % 2 === 0 ? 'L' : 'R'
    const ring = Math.floor(i / 2)
    const spawnAt = psi + ring * J
    // gridOffset — 每爆一輪累積 ±drift/2 的網格相位偏移 (見 poisonRegionOnDetonator)
    pools.push({ side, spawnAt, armedAt: spawnAt + cfg.armDelaySec * 1000, gridOffset: 0 })
  }
  sim.poisonRegion = {
    cfg,
    psi,
    // 圖騰有效時長含召喚時長加成 (summonDuration%)
    expireAt: tCast + (totemDurationMs(skill) || 60000),
    pools,
    lastVisibleAt: -Infinity,
  }
}

// 引爆判定 — 在每個火屬主動攻擊的命中時點呼叫 (一般技能=施放瞬間;延遲火球=每顆 orb fireAt)
//   規格不變式:
//   - 一個生成週期只爆一次 (爆炸後 spawn/armed 立即推進到下一輪,期間事件自然略過)
//   - 補毒 = 死區後的第一個全域判定 ψ + k×J;respawn_gap 是輸出不是常數
//   - 左右池死區 ±drift/2 → 累積出 41ms/cycle 的週期差 (不可鎖同相)
//   - 0.4s 連鎖衰減:依 visible (tHit + triggerLag) 排序,與前一爆間隔 ≤0.4s → ×0.40
function poisonRegionOnDetonator(detSkill, tHit, enemy, att) {
  const region = sim.poisonRegion
  if (!region) return
  const cfg = region.cfg
  if (!detSkill || detSkill.id === cfg.skillId) return
  if (detSkill.element !== cfg.detonator.triggerElement) return
  if (detSkill.sim?.role !== 'attack') return
  const src = SKILL_BY_ID[cfg.skillId]
  const det = src?.detonation
  if (!src || !det) return
  if (state.disabledSkills.has(cfg.skillId)) return
  const stats = state.result?.perSkill[cfg.skillId]
  if (!stats) return

  const elem = elemMultFor(src, enemy)
  const lv = effSkillLevel(src)
  const delta = Math.max(0, lv - (src.baseLevel || 0))
  const detPct = (det.damage?.base || 0) + delta * (det.damage?.perLevel || 0)
  if (detPct <= 0) return
  const J = cfg.judgeIntervalSec * 1000
  const halfDriftMs = ((cfg.sideDriftSecPerCycle || 0) * 1000) / 2
  const dbg = state.result.poisonRegion

  for (const pool of region.pools) {
    if (!Number.isFinite(pool.armedAt) || tHit < pool.armedAt) continue
    // 引爆:0.4s 連鎖衰減以 visible 時點與前一爆比較 (同一命中引爆兩池 → 第二池必衰減)
    const visible = tHit + cfg.triggerLagSec * 1000
    const decayed = visible - region.lastVisibleAt <= cfg.chainDecay.windowSec * 1000
    const decayMult = decayed ? cfg.chainDecay.multiplier : 1
    region.lastVisibleAt = visible
    for (let h = 0; h < (det.hitsPerCast || 0); h++) {
      emitHit(stats, mainHitDmg(src, elem, enemy, att, detPct) * decayMult)
    }
    stats.useCount += 1
    if (dbg) {
      dbg.explosions += 1
      if (decayed) dbg.decayed += 1
    }
    // 41ms/cycle 左右週期差 — 以「每輪累積 ±drift/2 網格相位偏移」實作 (R 池週期較短、領先):
    //   規格 §6 實測:前幾輪同幀爆炸 → 相對偏移累積跨過一個引爆間隔後永久分岔,
    //   之後極少再同幀 (~14/128 次衰減)。若把偏移做在死區上,補毒 snap 回全域網格會
    //   吃掉偏移 → 左右鎖同相、約半數爆炸吃衰減 → 低估傷害 (規格 §6 最壞情境 70%)。
    //   驗證:drift=0 時等效滿傷 89.6 (=規格最壞值);drift=41ms 時 119.4 (規格實測 119.7)。
    pool.gridOffset += pool.side === 'L' ? halfDriftMs : -halfDriftMs
    // 補毒:死區後的第一個判定 (該池的相位 = ψ + gridOffset);超過圖騰時限則此池結束
    const free = tHit + cfg.deadTimeSec * 1000
    const poolPsi = region.psi + pool.gridOffset
    const k = Math.ceil((free - poolPsi) / J)
    const respawn = poolPsi + k * J
    if (respawn >= region.expireAt) {
      pool.spawnAt = Infinity
      pool.armedAt = Infinity
      continue
    }
    pool.spawnAt = respawn
    pool.armedAt = respawn + cfg.armDelaySec * 1000
  }
}

// Final Attack 管線 (mechanics.finalAttack;例:Meteor Shower) — proc 判定
//   觸發來源:僅「主動施放」的主擊技能 (hitsPerCast > 0 且 sim.role === 'attack')
//     → 排除 'passive' (Final Attack 技能自身,避免自串)
//     → 排除 'derived' (Poison Mist 等衍生命中不觸發)
//     → 排除 'aura'   (Inferno Aura / Ifrit 固定間隔自動觸發的場地/召喚命中不觸發)
//   每次施放固定 1 次 roll(爆炸型如 Mist Eruption 也只算 1 次,不依爆炸數倍增)
function finalAttackTriggerRolls(skill, faSkill) {
  if (!skill || !faSkill) return 0
  if (skill.id === faSkill.id) return 0
  const role = skill.sim?.role
  if (role === 'passive' || role === 'derived' || role === 'aura') return 0
  if (!skill.hitsPerCast) return 0
  return 1
}

// Final Attack — 執行 N 次 proc roll,成功則以 Final Attack 技能主擊管線追加 1 擊
//   emitCast 施放時用(一般技能 1 次、爆炸型 N 次);延遲火球時每顆獨立呼叫(rolls=1)
function rollFinalAttackTriggers(sourceSkill, rolls, tCast, enemy, att) {
  if (rolls <= 0) return
  const faCfg = currentMechanics().finalAttack
  const meteor = faCfg ? SKILL_BY_ID[faCfg.skillId] : null
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
    const roll = sim.rng()
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
  return mul(adjustedBaseRaw(att), pct / 100, skillFinalMult, specialMult, enemyMult, currentArcMult, DOT_COEFFICIENT)
}

// 統一累加單次擊中 — 主擊與 DoT tick 都會流經此函式,
// 因此 total / attackCount / maxHit / minHit 皆涵蓋 DoT。
// meta (選填) — 有 hitLog 的技能會連同 meta 寫入逐擊紀錄 ({ t, orb, fd, hit, dot })
function emitHit(stats, dmg, meta) {
  const d = Math.max(1, Math.floor(dmg))
  stats.total += d
  stats.attackCount += 1
  if (d > stats.maxHit) stats.maxHit = d
  if (stats.minHit === 0 || d < stats.minHit) stats.minHit = d
  if (stats.hitLog && stats.hitLog.length < HIT_LOG_CAP) {
    stats.hitLog.push({ dmg: d, ...meta })
  }
}

function emitCast(skill, tCast, elemMult, enemy, att) {
  const res = state.result
  res.events.push({ time: tCast, skillId: skill.id, type: 'cast' })
  // 記錄最近一次施放時間 — 供 waitForSkillCast / cloudDetonate 等跨技能規則使用
  sim.lastCastAt[skill.id] = tCast
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
      const srcLast = sim.lastCastAt[srcId]
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
  //   依然保留:timeline cast 事件 / rollTriggers / burn 登記 / onHitSpawn / onHitResetCooldown / sim.fieldState
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
  // channel (變身連擊,例:Elemental Fury):施放瞬間不打傷害,攻擊 tick 全走 pendingOrbHits
  const hasChannel = !!skill.sim?.channel
  const hasDelayedOrbs = hasUniformDelayedOrbs || hasCascadingOrbs || hasChannel
  // 爆炸型技能(Mist Eruption):每次爆炸視為一次使用 (useCount += 爆炸數)
  //   一般技能 skillExplosionCount 回傳 1,等同 +1
  //   延遲火球型 (DoT Punisher) 在 processOrbHits per-orb 累加,施放瞬間不加
  const explosionsN = skillExplosionCount(skill)
  if (!hasDelayedOrbs) stats.useCount += explosionsN
  // 實戰 buff: 本次施放先 roll,命中則增加 1 層,後續傷害用新層數計算
  // 若 proc 成功且 buff 標記 appliesDebuff → 連鎖觸發 linkCycle/triggerOn='debuffApplied'(例:Thief's Cunning)
  // linkCycle 屬被動型 buff,不寫進 timeline(僅透過 buff 圖示呈現)
  useBattleBuffs().rollTriggers(sim.rng, currentJobKey, tCast, skill.id)
  const hs = hyperBagFor(skill.id)
  // 爆炸型:總擊數 = 固定爆炸數 × 每爆擊數 (與 DoT 層數無關)
  const baseHits = (skill.hitsPerCast || 0) * explosionsN
  const hits = Math.max(0, baseHits + (hs.hitsPerCastBonus || 0))
  // 延遲火球型的「第一次命中」時點 — 供 burn 延後上狀態使用 (因果:先命中 → 上狀態)
  let firstDelayedHitAt = null
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
      firstDelayedHitAt = t
      while (orbIndex < maxTotal) {
        const toSpawn = Math.min(currentGenCount, maxTotal - orbIndex)
        for (let g = 0; g < toSpawn; g++) {
          const fd = (orbIndex === 0) ? 1 : subFd
          sim.pendingOrbHits.push({
            skillId: skill.id,
            fireAt: t,
            orbIndex,
            fd,
            attacksPerOrb: perOrb,
            rollBuffTriggers: !!orbs.rollBuffTriggers,
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
        // orbs.rollBuffTriggers — 每顆 orb 命中時各 roll 1 次攻擊觸發型 buff (例:Arcane Aim)
        // FD 全額歸「最早命中」的那顆 — 「第 1 顆」指命中順序,非生成順序;
        //   若綁生成順序,隨機時點晚命中時會吃到前面火球疊起來的 buff 增幅
        //   (例:Arcane Aim 疊滿 +40% Damage),全額 FD × 滿層 buff → maxHit 偏高
        const [minMs, maxMs] = orbs.hitDelayRange
        const span = Math.max(0, maxMs - minMs)
        const delays = []
        let firstIdx = 0
        for (let o = 0; o < totalOrbs; o++) {
          const d = minMs + sim.rng() * span
          delays.push(d)
          if (d < delays[firstIdx]) firstIdx = o
        }
        if (totalOrbs > 0) firstDelayedHitAt = tCast + delays[firstIdx]
        for (let o = 0; o < totalOrbs; o++) {
          const fd = (o === firstIdx) ? 1 : subFd
          sim.pendingOrbHits.push({
            skillId: skill.id,
            fireAt: tCast + delays[o],
            orbIndex: o,
            fd,
            attacksPerOrb: perOrb,
            rollBuffTriggers: !!orbs.rollBuffTriggers,
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
  } else if (hasChannel) {
    // 變身連擊 (例:Elemental Fury):變身 delay 後,以固定頻率排入攻擊 tick
    //   每 tick = hitsPerCast 擊,走 processOrbHits (per-tick 觸發 FA / Ignite / 毒池引爆)
    const ch = skill.sim.channel
    const stacks = ch.assumedFerventStacks || 0
    const attackSec = (ch.baseAttackSec || 0) + (ch.perFerventSec || 0) * stacks
    const perSec = ch.attacksPerSec || 1
    const tickCount = Math.max(0, Math.round(attackSec * perSec))
    const intervalMs = 1000 / perSec
    const startAt = tCast + (ch.transformDelaySec || 0) * 1000
    firstDelayedHitAt = startAt
    for (let i = 0; i < tickCount; i++) {
      sim.pendingOrbHits.push({
        skillId: skill.id,
        fireAt: startAt + i * intervalMs,
        orbIndex: i,
        fd: 1,
        attacksPerOrb: skill.hitsPerCast || 0,
        // channel 觸發規則 (實測):Final Attack 僅施放當下 roll (見下方);
        // Ignite / 毒池引爆 每 tick 照常 (25 次機會)
        skipFinalAttack: true,
      })
    }
    // Meteor Shower — 僅「使用當下」roll 1 次 (攻擊 tick 不再各自 roll)
    const chFaCfg = currentMechanics().finalAttack
    const chFaSkill = chFaCfg ? SKILL_BY_ID[chFaCfg.skillId] : null
    rollFinalAttackTriggers(skill, finalAttackTriggerRolls(skill, chFaSkill), tCast, enemy, att)
    // 技能期間 (變身 + 攻擊) 抑制指定 aura (例:Ifrit 停止攻擊)
    const windowEnd = startAt + attackSec * 1000
    for (const auraId of skill.sim.suppressAuraIds || []) {
      sim.auraSuppressedUntil[auraId] = Math.max(sim.auraSuppressedUntil[auraId] || 0, windowEnd)
    }
  } else {
    for (let h = 0; h < hits; h++) {
      // mainHitDmg 已在 bossMin~bossMax 區間隨機取樣 (含爆擊 / 熟練度),不再疊加 variance
      emitHit(stats, mainHitDmg(skill, elemMult, enemy, att), { t: tCast, hit: h + 1 })
    }
  }
  // 週期爆炸 (sim.pulses;例:Poison Chain) — 中毒目標每 intervalMs 爆炸一次,共 count 次
  //   爆炸傷害% = detonation.damage + stackBonus × 疊層 (第 k 爆疊層 = min(maxStacks, k−1);首爆無加成)
  //   兩者皆依 V 等級縮放 (delta 允許負值,與 skillDamagePct 一致)
  //   對單模型:每次爆炸 +1 層毒;全場爆炸上限 (17) 對單打不到 → 不排額外終爆
  //   爆炸走 pendingOrbHits:不觸發 Final Attack、不計 useCount;
  //   Ignite / 毒池引爆為火屬 element-gated,毒屬爆炸自然跳過
  const pulses = skill.sim?.pulses
  if (pulses && skill.detonation?.damage) {
    const det = skill.detonation
    const lvDelta = effSkillLevel(skill) - (skill.baseLevel || 0)
    const detPct = (det.damage.base || 0) + lvDelta * (det.damage.perLevel || 0)
    const stackPct = (pulses.stackBonus?.base || 0) + lvDelta * (pulses.stackBonus?.perLevel || 0)
    const perPulse = Math.max(0, det.hitsPerCast || 0)
    const maxStacks = pulses.maxStacks || 0
    for (let k = 1; k <= (pulses.count || 0); k++) {
      const stacks = Math.min(maxStacks, k - 1)
      sim.pendingOrbHits.push({
        skillId: skill.id,
        fireAt: tCast + k * pulses.intervalMs,
        orbIndex: k - 1,
        fd: 1,
        attacksPerOrb: perPulse,
        pct: Math.max(0, detPct + stackPct * stacks),
        skipFinalAttack: true,
        skipUseCount: true,
      })
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
        sim.cloudDetonatedAt[cd.sourceSkillId] = tCast
      }
    }
  }
  // Mist Eruption 等技能命中時重置指定技能 CD (例:→ Flame Haze)
  //   scheduler 下一次可施放 = 本施放的動畫完成後 (避免施放重疊) — 由下面的 cast lock 統一處理
  //   UI CD 面板讀 sim.cooldownEndAt → 立即設為 tCast,反映「遊戲 CD 已清零」
  const onHitResetCooldown = skill.sim?.onHitResetCooldown
  if (Array.isArray(onHitResetCooldown) && onHitResetCooldown.length) {
    for (const targetId of onHitResetCooldown) {
      sim.nextCastAt[targetId] = tCast + Math.floor(sim.rng() * 40)
      sim.cooldownEndAt[targetId] = tCast
    }
  }
  // 場地技能 — 記錄到 sim.fieldState 供 requiresField 檢查(例:Poison Mist)
  if (skill.fieldDurationSec) {
    sim.fieldState[skill.id] = { expireAt: tCast + skill.fieldDurationSec * 1000 }
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
    // 因果順序:先命中 → 上狀態 (DoT) → BM / Fervent 增傷才生效
    //   延遲火球型 (DoT Punisher / Megiddo Flame):DoT 由火球命中賦予 → 延後到第一顆命中才註冊;
    //     同 frame 內 processOrbHits 先處理命中、再處理 pendingBurnStarts,
    //     故第一顆命中本身不吃自身 DoT 觸發的增傷 (與遊戲實測一致)
    //   一般技能:主擊已在本函式前段 emit(早於此處註冊),同批主擊亦不吃自身 DoT 增傷
    if (firstDelayedHitAt != null) {
      sim.pendingBurnStarts.push({ skillId: skill.id, at: firstDelayedHitAt })
    } else {
      applyBurn(skill, tCast, enemy, att)
    }
  }

  // [DEBUG] 首次施放 snapshot — 目標技能由 mechanics.firstCastDebugSkillId 指定 (例:Megiddo Flame)
  if (skill.id === currentMechanics().firstCastDebugSkillId && !res.megiddoFirstCast) {
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

    const bs = sim.burnState[skill.id]
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

  // Final Attack 被動追打 — 一般技能於施放瞬間 roll;延遲火球型於每顆 orb 的 fireAt roll
  //   來源只要有 hitsPerCast 就會 roll;僅排除 Final Attack 技能自身 (type='passive')
  //   成功則以 Final Attack 技能自身的傷害管線(含其屬性 / VM / buff / defMult)追加 1 擊
  //   註:cloudDetonate 的「額外雲引爆」不另外觸發追打(只 emitHit 到 sourceSkill),
  //       但引爆技能本身的主 hit 仍照常 roll 一次。
  if (!hasDelayedOrbs) {
    const faCfg = currentMechanics().finalAttack
    const faSkill = faCfg ? SKILL_BY_ID[faCfg.skillId] : null
    rollFinalAttackTriggers(skill, finalAttackTriggerRolls(skill, faSkill), tCast, enemy, att)
    // Ignite 型火牆 — 指定屬性技能施放時機率生成 (mechanics.ignite)
    maybeProcIgnite(skill, tCast, res)
    // Poison Region 引爆 — 一般火屬攻擊的命中時點=施放瞬間 (延遲火球型於 processOrbHits per-orb)
    poisonRegionOnDetonator(skill, tCast, enemy, att)
  }

  // Poison Region — 施放毒池技能本身:建立/重置區域 (與引爆判定無關,毒屬不觸發引爆)
  initPoisonRegion(skill, tCast)

  // 施放型 buff 顯示鏡像 (battle.source === 'skillCast') — buff 欄位顯示持續倒數
  //   有 totem 的技能以圖騰有效時長為準 (含 summonDuration% 召喚加成)
  if (skill.battle?.source === 'skillCast') {
    const durOverride = skill.totem ? totemDurationMs(skill) : undefined
    useBattleBuffs().activateFromSkillCast(skill.id, tCast, durOverride)
  }
}

// DoT 上狀態 (burnState 註冊) — tAt = 狀態生效時點 (一般技能 = tCast;延遲火球型 = 第一顆命中)
//   傷害快照與時長計算都以「呼叫當下」的面板為準
function applyBurn(skill, tAt, enemy, att) {
  const hs = hyperBagFor(skill.id)
  // DoT 實際時長 = (base + hyper flat) × DoT 被動倍率 (例:Burning Magic ×2)
  //   fixedDuration (例:Creeping Toxin 毒池=圖騰時長) — 場地屬性,不吃 DoT 時長加成;
  //   durationFromTotem — 時長改由圖騰有效時長決定 (含 summonDuration% 召喚加成)
  const fixedDur = !!skill.burn.fixedDuration
  let baseDurationSec = skill.burn.durationSec + (fixedDur ? 0 : (hs.burnDurationBonusSec || 0))
  if (skill.burn.durationFromTotem && skill.totem) {
    baseDurationSec = totemDurationMs(skill) / 1000
  }
  const burnDurationSec = fixedDur ? baseDurationSec : baseDurationSec * dotPassiveDotDurationMult()
  const burnMs = burnDurationSec * 1000
  const ivMs = skill.burn.tickIntervalSec * 1000
  const cur = sim.burnState[skill.id]
  if (cur && tAt < cur.expireAt) {
    // 續接(DoT 尚未結束前再次觸發):只延長 expireAt,傷害快照不動
    cur.expireAt = tAt + burnMs
  } else {
    // 新 DoT — 含「舊 DoT 已過期但同 tick 尚未被 processBurnTicks 清掉」的邊界:
    //   以當下面板重新快照 (例:Creeping Toxin 60s 圖騰到期後補放)
    // 新 DoT 開始 — 以「當下」面板快照傷害,後續 tick 一律沿用此值
    //   即使 Fervent Drain 層數 / VM 等級 / buff 變動,也不會影響這段 DoT 的傷害
    //   結束後若再觸發,新的一段 DoT 才會重新以當下面板計算
    const snapshotDmg = dotTickDmg(skill, enemy, att)
    sim.burnState[skill.id] = {
      nextTickAt: tAt + ivMs,
      expireAt: tAt + burnMs,
      intervalMs: ivMs,
      dmg: snapshotDmg,
    }
    syncDotCount()
  }
}

// 延後上狀態處理 — 每 tick 於 processOrbHits 之後執行:
//   到期的 pendingBurnStarts 以其命中時點註冊 burnState (同 frame 第一顆命中不吃自身 DoT 增傷)
function processPendingBurnStarts(elapsed, enemy, att) {
  if (!sim.pendingBurnStarts.length) return false
  const remaining = []
  let changed = false
  for (const p of sim.pendingBurnStarts) {
    if (p.at > elapsed) {
      remaining.push(p)
      continue
    }
    const skill = SKILL_BY_ID[p.skillId]
    if (skill?.burn) applyBurn(skill, p.at, enemy, att)
    changed = true
  }
  sim.pendingBurnStarts = remaining
  return changed
}

function processBurnTicks(elapsed, enemy, att) {
  let changed = false
  for (const skill of sim.activeSkills) {
    if (!skill.burn) continue
    const bs = sim.burnState[skill.id]
    if (!bs) continue
    const capped = Math.min(elapsed, bs.expireAt)
    const stats = state.result.perSkill[skill.id]
    // 傷害快照 — 建立 DoT 時即寫入 bs.dmg;續接 / 面板變動一律沿用
    // (舊狀態理論上都會有 dmg,這裡 fallback 以當下面板計算,避免極端情況回 NaN)
    const dotDmg = bs.dmg != null ? bs.dmg : dotTickDmg(skill, enemy, att)
    while (bs.nextTickAt <= capped) {
      // DoT:不爆擊、固定值;流經 emitHit 累加 total / attackCount / maxHit / minHit
      // 時間軸不再顯示 DoT tick(噪音太多),只在 stats 中累積
      emitHit(stats, dotDmg, { t: bs.nextTickAt, dot: true })
      bs.nextTickAt += bs.intervalMs
      changed = true
    }
    if (elapsed >= bs.expireAt) {
      delete sim.burnState[skill.id]
      syncDotCount()
    }
  }
  return changed
}

// 延遲火球處理 — 每 tick 檢查 sim.pendingOrbHits,到期的 orb 觸發傷害 / useCount / MS / Ignite
// 每顆火球獨立:attacksPerOrb 次 mainHitDmg × fd,useCount +1,Meteor Shower 1 次 roll,
// Ignite 1 次 roll (走 maybeProcIgnite)。
function processOrbHits(elapsed, enemy, att) {
  if (!sim.pendingOrbHits.length) return false
  const res = state.result
  let changed = false
  const remaining = []
  // 同一 frame 多顆到期時依命中時間處理 — 讓 per-orb buff 疊層 (rollBuffTriggers) 與命中順序一致
  const due = sim.pendingOrbHits.filter((p) => p.fireAt <= elapsed).sort((a, b) => a.fireAt - b.fireAt)
  for (const p of sim.pendingOrbHits) {
    if (p.fireAt > elapsed) remaining.push(p)
  }
  for (const p of due) {
    const skill = SKILL_BY_ID[p.skillId]
    if (!skill) { changed = true; continue }
    const stats = res.perSkill[skill.id]
    if (!stats) { changed = true; continue }
    const elemMult = elemMultFor(skill, enemy)
    // p.pct — 覆寫傷害%(pulses 週期爆炸走 detonation.damage,而非技能主傷);未設 → 主傷
    for (let h = 0; h < p.attacksPerOrb; h++) {
      emitHit(stats, mainHitDmg(skill, elemMult, enemy, att, p.pct) * p.fd, {
        t: p.fireAt,
        orb: p.orbIndex + 1,
        fd: p.fd,
        hit: h + 1,
      })
    }
    // pulses 爆炸不計 useCount(useCount = 施放次數;爆炸為附屬傷害流)
    if (!p.skipUseCount) stats.useCount += 1
    // 每顆 orb 獨立觸發 Final Attack 1 次 + Ignite 1 次 + Poison Region 引爆判定
    //   channel tick (skipFinalAttack) 例外:FA 僅施放當下 roll 過,tick 不再 roll
    if (!p.skipFinalAttack) rollFinalAttackTriggers(skill, 1, p.fireAt, enemy, att)
    // orbs.rollBuffTriggers — 每顆 orb 命中時 roll 攻擊觸發型 buff (例:DoT Punisher 火球 → Arcane Aim 疊層)
    if (p.rollBuffTriggers) useBattleBuffs().rollTriggers(sim.rng, currentJobKey, p.fireAt, p.skillId)
    maybeProcIgnite(skill, p.fireAt, res)
    poisonRegionOnDetonator(skill, p.fireAt, enemy, att)
    changed = true
  }
  sim.pendingOrbHits = remaining
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

// rAF 驅動 — 每 frame 以真實時鐘換算 elapsed 後推進;加速模式 (fastForward) 期間停用
function tick() {
  rafId = null
  if (!state.running || !state.result) return
  if (state.fastForwarding) return

  const now = performance.now()
  const totalMs = state.durationSec * 1000
  const elapsed = Math.min(now - sim.startedAt, totalMs)
  const finished = advanceTo(elapsed)
  if (!finished && state.running) rafId = requestAnimationFrame(tick)
}

// 推進模擬到指定虛擬時間 — 引擎唯一入口,所有邏輯只依賴 elapsed (與真實時鐘無關)
//   回傳 true = 已達總時長並完成自然結束處理
function advanceTo(elapsed) {
  const totalMs = state.durationSec * 1000
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
    // 屬性總值 getter — statScaledFinalDmg 型 buff 開啟當下快照用 (例:Benediction INT)
    //   含 CP 面板總值 + 戰鬥 buff 主屬 flat (MWGB 生效中時一併計入)
    getStatTotal: (key) => {
      const base = cpStatTotal ? cpStatTotal(key) : 0
      const a = cpAttStats?.value
      const flat = a && a.primaryStat === key ? computeBuffStatFlat(a) : 0
      return base + flat
    },
  })

  // buff 主屬 flat (statBoost 型,例:MWGB) — autoTick 後快取一次,供本 tick 所有傷害計算
  currentBuffStatFlat = computeBuffStatFlat(att)

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
  //   - 主動型:依自身 animDelay 鎖定其他所有主動技能的 sim.nextCastAt (≥ tCast + animDelay)
  //   - Aura 型:僅更新自身 (+ intervalSec),不鎖定其他技能、也不受鎖影響
  //   - Derived 型:永不直接排程 (靠 onHitSpawn)
  let safety = 500
  while (safety-- > 0) {
    let pick = null
    let pickTime = Infinity
    let pickPriority = -Infinity
    for (const s of sim.activeSkills) {
      const role = s.sim?.role
      if (role === 'derived' || role === 'passive') continue
      if (state.disabledSkills.has(s.id)) continue
      // recastReplaces 型:首次照常排程 (開場);之後只透過「頂替填充技槽」施放 (見 pick 後的替換檢查)
      //   recastReplacesFirstCast — 連首次施放也只走頂替 (例:Elemental Fury 等 Fervent 疊滿才放)
      if (s.sim?.recastReplaces && (sim.lastCastAt[s.id] != null || s.sim.recastReplacesFirstCast)) continue
      // requiresSkillEnabled — 前置技能被面板停用時,本技能一併不排程 (例:Elemental Fury 需 Ifrit)
      if (s.sim?.requiresSkillEnabled && state.disabledSkills.has(s.sim.requiresSkillEnabled)) continue
      // V 技能核心未配點 = 未習得
      if (!vSkillLearned(s)) continue
      const t = sim.nextCastAt[s.id]
      if (t == null || t > elapsed) continue
      const pri = s.sim?.priority || 0
      if (t < pickTime || (t === pickTime && pri > pickPriority)) {
        pick = s
        pickTime = t
        pickPriority = pri
      }
    }
    if (!pick) break
    let skill = pick
    // recastReplaces 替換檢查 — 到期的替換型技能 (例:Creeping Toxin 每 60s 補圖騰)
    //   只在「本槽原本要施放的是其指定填充技」時頂替該槽施放,避免打斷連技;
    //   被頂替的填充技 nextCastAt 不動 → 會被本次 cast lock 推後,緊接著補回
    for (const s of sim.activeSkills) {
      const rep = s.sim?.recastReplaces
      if (!rep || rep !== skill.id) continue
      if (state.disabledSkills.has(s.id)) continue
      // recastReplacesFirstCast 型連首次都走頂替;一般型首次走正常排程
      if (sim.lastCastAt[s.id] == null && !s.sim?.recastReplacesFirstCast) continue
      // 前置技能停用 / V 核心未配點 / buff 層數門檻未達 → 本槽不頂替 (照常施放填充技,之後再試)
      if (s.sim?.requiresSkillEnabled && state.disabledSkills.has(s.sim.requiresSkillEnabled)) continue
      if (!vSkillLearned(s)) continue
      if (!buffStacksGateOk(s)) continue
      const due = sim.nextCastAt[s.id]
      if (due == null || due > elapsed) continue
      // 靜默視窗檢查:插入後只允許推遲填充技本身 — 替換技能的動畫期間內,
      //   任何其他主動技能都不得有排定施放 (寧可晚放,絕不影響現有循環)。
      //   aura / derived / passive 不受 cast lock 影響,不需檢查。
      const repAnim = s.sim?.castDelayBySpeed?.[state.attackSpeed] ?? 1000
      const lockEnd = pickTime + repAnim
      let disturbs = false
      for (const other of sim.activeSkills) {
        if (other === s || other.id === rep) continue
        const otherRole = other.sim?.role
        if (otherRole === 'aura' || otherRole === 'derived' || otherRole === 'passive') continue
        if (state.disabledSkills.has(other.id)) continue
        const ot = sim.nextCastAt[other.id]
        if (ot != null && ot < lockEnd) {
          disturbs = true
          break
        }
      }
      if (disturbs) continue
      skill = s
      break
    }
    // aura 抑制 — 變身/連擊技能期間指定 aura 停止攻擊 (例:Elemental Fury 期間 Ifrit)
    //   抑制中的 aura tick 推遲到抑制結束後
    if (skill.sim?.aura) {
      const supUntil = sim.auraSuppressedUntil[skill.id] || 0
      if (pickTime < supUntil) {
        sim.nextCastAt[skill.id] = supUntil + Math.floor(sim.rng() * 40)
        continue
      }
    }
    // requiresBuffStacks — buff 層數門檻未達 → 推後 200ms 再試 (一般排程路徑;頂替路徑在替換檢查內把關)
    if (!buffStacksGateOk(skill)) {
      sim.nextCastAt[skill.id] = elapsed + 200
      continue
    }
    // 前置條件 requiresField — 不滿足就推後 200ms,回圈再選下一個
    const requiresField = skill.sim?.requiresField
    if (requiresField) {
      const fs = sim.fieldState[requiresField]
      if (!fs || elapsed >= fs.expireAt) {
        sim.nextCastAt[skill.id] = elapsed + 200
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
      const targetCdEnd = sim.cooldownEndAt[targetId] ?? 0
      const targetCdRem = targetCdEnd - elapsed  // >0 表示還在 CD 中
      const targetLastCast = sim.lastCastAt[targetId]
      const hasTargetCast = targetLastCast != null && Number.isFinite(targetLastCast)
      if (!hasTargetCast || targetCdRem <= cdBelowMs) {
        // 目標尚未施放 或 CD 即將歸零 — 等待其施放完成後再評估
        sim.nextCastAt[skill.id] = elapsed + 100
        continue
      }
      if (hasTargetCast && elapsed < targetLastCast + delayMs) {
        // 目標剛施放 — 推到 lastCast + delay
        sim.nextCastAt[skill.id] = targetLastCast + delayMs
        continue
      }
    }
    // 施放時點 = 本槽時間 (pickTime)。一般路徑 = 該技能自己的 nextCastAt;
    // recastReplaces 頂替時 = 被頂替填充技的槽時間 (替換技能自己的 due 已是過去式)
    const tCast = pickTime
    emitCast(skill, tCast, elemMultFor(skill, enemy), enemy, att)
    changed = true

    // Aura:固定間隔觸發,不鎖其他技能
    const auraSim = skill.sim?.aura
    if (auraSim) {
      const intervalMs = Math.max(50, (auraSim.intervalSec || 3) * 1000)
      sim.nextCastAt[skill.id] = tCast + intervalMs
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
    // recastIntervalSec — 召喚/場地型技能的實際再施放週期 (例:Creeping Toxin 以圖騰 60s 為週期)
    //   UI CD 面板 (cooldownEndAt) 仍顯示真實遊戲 CD,不受此值影響
    const recastMs = (skill.sim?.recastIntervalSec || 0) * 1000
    const nextDelta = Math.max(animDelay, effCdMs, recastMs)
    sim.nextCastAt[skill.id] = tCast + nextDelta + Math.floor(sim.rng() * 40)
    // 遊戲 CD 結束時間 — 僅 effCdMs (不含 animDelay),給 UI CD 面板
    sim.cooldownEndAt[skill.id] = tCast + effCdMs

    // 鎖定其他主動技能至 tCast + animDelay (aura / derived 不受影響)
    //   sim.cooldownEndAt 不受 cast lock 影響 — CD 面板應反映真實遊戲 CD
    const lockUntil = tCast + animDelay
    for (const other of sim.activeSkills) {
      if (other === skill) continue
      const otherRole = other.sim?.role
      if (otherRole === 'aura' || otherRole === 'derived' || otherRole === 'passive') continue
      const cur = sim.nextCastAt[other.id]
      if (cur != null && cur < lockUntil) sim.nextCastAt[other.id] = lockUntil
    }
    // 雲守衛:如果本次 animEnd 落在 grace end 前 0~200ms 內,
    //   本次允許施放,但把「所有非引爆的主動技能」(含剛施放的自己)推到 graceEnd 之後 —
    //   讓出 Mist Eruption 的引爆時點(否則 CD 短 / 無 CD 的技能會在 animEnd 後又被 pick)
    //   僅對非 cloudDetonate 技能的 cast 生效
    if (!skill.sim?.cloudDetonate) {
      for (const srcId of Object.keys(sim.lastCastAt)) {
        if (!hasActiveCloudsOf(srcId)) continue
        const srcSkill = SKILL_BY_ID[srcId]
        const pnCloudsCfg = srcSkill?.sim?.clouds
        if (!pnCloudsCfg) continue
        const graceEnd = sim.lastCastAt[srcId] + (pnCloudsCfg.detonateGraceMs || 0)
        const timeUntilGrace = graceEnd - lockUntil
        if (timeUntilGrace > 0 && timeUntilGrace < 200) {
          const holdUntil = graceEnd + Math.floor(sim.rng() * 40)
          for (const other of sim.activeSkills) {
            if (other.sim?.cloudDetonate) continue  // 引爆技能保留其 waitForSkillCast 排程
            const otherRole = other.sim?.role
            if (otherRole === 'aura' || otherRole === 'derived' || otherRole === 'passive') continue
            const cur = sim.nextCastAt[other.id]
            if (cur != null && cur < holdUntil) sim.nextCastAt[other.id] = holdUntil
          }
          break
        }
      }
    }
  }
  if (processOrbHits(elapsed, enemy, att)) changed = true
  // 火球命中之後才上狀態 (因果:先命中 → 上狀態 → 增傷) — 順序不可對調
  if (processPendingBurnStarts(elapsed, enemy, att)) changed = true
  if (processBurnTicks(elapsed, enemy, att)) changed = true
  if (processIgniteWalls(elapsed, enemy, att)) changed = true

  // 更新 DoT 數量追蹤:sim.burnState 剩下未過期的 key 數量 = 當前目標身上生效中的 DoT 數
  useDotTracker().setActiveDotCount(Object.keys(sim.burnState).length)

  if (changed) state.result.events.sort((a, b) => a.time - b.time)

  // 每 tick 同步 sim.nextCastAt → state,供 CD 面板讀取最新冷卻狀態
  if (changed) syncNextCastAt()

  // 衍生統計節流:每秒才重算一次(或自然結束時最後一次)
  if (elapsed - sim.lastRefreshMs >= 1000 || elapsed >= totalMs) {
    refreshDerived()
    sim.lastRefreshMs = elapsed
    if (onTickCallback) onTickCallback(elapsed, state.result)
  }

  if (elapsed >= totalMs) {
    // 自然結束 — 與手動 Stop 行為一致 (清實戰 buff / DoT 追蹤)
    state.running = false
    if (onStopCallback) onStopCallback(state.result)
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
    return true
  }
  return false
}

export function useBattleSim() {
  if (!cpAttStats) {
    const cp = useCpDamage()
    cpAttStats = cp.attStatsInfo
    cpStatTotal = cp.statTotal
    cpBaseStats = cp.baseStats
  }

  function setDuration(n) {
    if (state.running) return
    const v = Math.max(1, Math.min(3600, Math.floor(Number(n) || 0)))
    state.durationSec = v
  }
  function setSeed(n) {
    state.seed = Math.floor(Number(n) || 0)
    // 手動設定 seed = 要求可重現 → start() 不再自動換新
    seedCustom = true
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
    // 每場自動換新 seed — 否則頁面載入後每次「開始測量」都重播同一亂數序列
    //   (機率型觸發如法師傳授會看起來「每次都同時點必中」);setSeed 手動設定過則保留
    if (!seedCustom) {
      state.seed = ((Date.now() ^ Math.floor(performance.now() * 1000)) >>> 0) || 1
    }
    // 每場模擬整組重建內部狀態 (simContext)
    sim = createSimContext()
    // 依當前角色職業快照本場模擬的技能子集 — 職業無 sim 資料時為空 (不排程)
    sim.activeSkills = simSkillsForJob(useCharacter().state.job)
    sim.rng = makeRng(state.seed)
    state.result = emptyResult(state.durationSec)
    state.elapsedMs = 0
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
    // 開場排程:
    //   derived 型(例 Poison Mist)→ 完全不排程,靠 onHitSpawn 觸發
    //   aura 型(開關持續技)→ 首次觸發在 firstHitWindowSec 內隨機,不進 priority cascade
    //   一般型                → 依 priority 遞減累加 animDelay,避免同 tick 齊發
    const schedulable = sim.activeSkills.filter((s) => s.sim?.role !== 'derived' && s.sim?.role !== 'passive' && !state.disabledSkills.has(s.id))
    const auraSkills = schedulable.filter((s) => s.sim?.aura)
    const normalSkills = schedulable.filter((s) => !s.sim?.aura)
    const ordered = [...normalSkills].sort((a, b) => (b.sim?.priority || 0) - (a.sim?.priority || 0))
    let cursor = 0
    for (const skill of ordered) {
      const anim = skill.sim?.castDelayBySpeed?.[state.attackSpeed] ?? 1000
      // recastReplacesFirstCast 型 (例:Elemental Fury):開場不佔 cascade 槽位 —
      //   due 即刻,但實際施放要等 buff 層數門檻達標 + 頂替 Flame Sweep 槽
      if (skill.sim?.recastReplaces && skill.sim?.recastReplacesFirstCast) {
        sim.nextCastAt[skill.id] = Math.floor(sim.rng() * 40)
        continue
      }
      cursor += anim
      // recastReplaces 型 (例:Creeping Toxin):戰鬥開始即施放 (t≈0);
      //   cursor 照常累加 — 其後技能的開場槽位不變,cast lock 會與其動畫銜接
      sim.nextCastAt[skill.id] = (skill.sim?.recastReplaces ? 0 : cursor) + Math.floor(sim.rng() * 40)
    }
    for (const skill of auraSkills) {
      const auraCfg = skill.sim.aura
      const [minSec, maxSec] = auraCfg.firstHitWindowSec || [0, auraCfg.intervalSec || 3]
      const minMs = Math.max(0, minSec) * 1000
      const maxMs = Math.max(minMs, maxSec * 1000)
      sim.nextCastAt[skill.id] = minMs + Math.floor(sim.rng() * Math.max(1, maxMs - minMs))
    }
    syncNextCastAt()
    sim.startedAt = performance.now()
    state.running = true
    rafId = requestAnimationFrame(tick)
  }
  function stop() {
    state.running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    refreshDerived()
    if (onStopCallback) onStopCallback(state.result)
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
  }
  // 加速 — 以虛擬時鐘從當前 elapsed 同步推進到總時長 (壓縮到 1 秒內完成)
  //   步長 = rAF 粒度 (1000/60ms) → 排程 / 命中 / DoT 處理順序與即時模式等價
  //   每 CHUNK 步讓出一次 event loop:進度條照常更新、停止按鈕仍可中斷
  async function fastForward() {
    if (!state.running || state.fastForwarding) return
    state.fastForwarding = true
    if (rafId) { cancelAnimationFrame(rafId); rafId = null }
    const totalMs = state.durationSec * 1000
    const STEP = 1000 / 60
    const CHUNK = 2000
    let t = state.elapsedMs
    try {
      while (state.running && t < totalMs) {
        for (let i = 0; i < CHUNK && state.running && t < totalMs; i++) {
          t = Math.min(t + STEP, totalMs)
          if (advanceTo(t)) break
        }
        if (state.running && t < totalMs) await new Promise((r) => setTimeout(r))
      }
    } finally {
      state.fastForwarding = false
    }
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
  function simulateSingleCast(skillId = simSkillsForJob(useCharacter().state.job)[0]?.id) {
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
    // buff 主屬 flat 同步 (模擬進行中 MWGB 生效時,test cast 也反映加成)
    currentBuffStatFlat = computeBuffStatFlat(att)
    const levelDiff = currentCharLevel - currentEnemyLevel
    const levelDiffPct = levelDiffFinalDmgPct(currentCharLevel, currentEnemyLevel)
    const levelDiffMult = clean(1 + levelDiffPct / 100)
    const elemMult = elemMultFor(skill, enemy)
    const elemResistPct = ENEMY_ELEM_RESIST_PCT[enemy?.elementalDmg] ?? 50
    const elemIgnorePct = ELEM_IGNORE_BY_JOB[currentJobKey] || 0
    const cpIgnoreDefPct = att.ignoreDef || 0
    const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
    // 因果順序:第一下命中前自身 DoT 尚未上狀態 → 不 +1 自身
    //   非模擬中 = 乾淨目標 (0,BM / Fervent 不生效);模擬中 = 只算場上現存 DoT
    let testDotCount = 0
    if (state.running) {
      testDotCount = Object.keys(sim.burnState).length
    }
    const buffBonuses = useBattleBuffs().currentBonuses(currentJobKey, state.elapsedMs, { dotCountOverride: testDotCount, collectSources: true })
    const buffDmgPct = buffBonuses.dmgPct || 0
    const buffIgnoreDefPct = buffBonuses.ignoreDefPct || 0
    const buffFinalDmgMult = buffBonuses.finalDmgMult || 1
    const buffFinalDmgSources = buffBonuses.finalDmgSources || []
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
    const dotPassiveCfg = currentMechanics().dotPassive
    const bmActive = !!(dotPassiveCfg && testDotCount >= 1)
    const bmFdPct = bmActive ? (dotPassiveCfg.finalDmgPctWhenDotActive || 0) : 0
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
    const fixedDur = !!skill.burn?.fixedDuration
    const bmDurMult = fixedDur ? 1 : dotPassiveDotDurationMult()
    const baseBurnSec = fixedDur
      ? (skill.burn?.durationSec || 0)
      : add(skill.burn?.durationSec || 0, hs.burnDurationBonusSec || 0)
    const burnDurationSec = clean(baseBurnSec * bmDurMult)
    const dotTickCount = floor(burnDurationSec / (skill.burn?.tickIntervalSec || 1)) || 0
    const dotBaseRaw = adjustedBaseRaw(att)
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
        // 戰鬥 buff 主屬 flat (statBoost 型,例:MWGB) — 僅模擬進行中且 buff 生效時 > 0
        buffStatFlat: currentBuffStatFlat,
        baseRawAdjusted: adjustedBaseRaw(att),
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
        // 終傷乘區逐項來源 — [{ id, nameKey, pct, stacks? }],各項 ×(1+pct/100) 相乘 = finalDmgMult
        finalDmgSources: buffFinalDmgSources,
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
      // ── 主擊實際乘區連乘 (每個數字乘起來 = 單 hit 傷害;上下限來自爆擊區間 × 熟練度) ──
      //   下限 = bossMinRaw (1.2+爆傷, ×熟練度) / 上限 = bossMaxRaw (1.5+爆傷)
      //   bossBase 組成 (rebuildAtt):baseRaw × (1 + Damage%桶/100) × fm → bossRaw → × 爆擊係數
      mainChain: {
        baseRawAdjusted: adjustedBaseRaw(att),
        mainDmgBucketPct: add(att.dmgPct || 0, att.bossDmg || 0, att.abnormalMobDmg || 0, mainDmgPct),
        fm: att.fm || 1,
        bossRaw: mainRebuilt.bossRaw,
        critDmg: att.critDmg || 0,
        mastery: att.mastery || 100,
        critMinFactor: clean(1.2 + (att.critDmg || 0) / 100),
        critMaxFactor: clean(1.5 + (att.critDmg || 0) / 100),
        bossMinRaw,
        bossMaxRaw,
        hitPct: pcts.hit,
        elemMult,
        arcMult,
        skillFinalMult,
        buffFinalDmgMult,
        defMult,
        explosionMult,
        bmMult,
        levelDiffMult,
        minHit: Math.max(1, floor(mul(bossMinRaw, pcts.hit / 100, elemMult, arcMult,
          skillFinalMult, buffFinalDmgMult, defMult, explosionMult, bmMult, levelDiffMult))),
        maxHit: Math.max(1, floor(mul(bossMaxRaw, pcts.hit / 100, elemMult, arcMult,
          skillFinalMult, buffFinalDmgMult, defMult, explosionMult, bmMult, levelDiffMult))),
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

  // 依當前角色職業反應式過濾 — 切職業時 UI 技能清單即時更新
  const skills = computed(() => simSkillsForJob(useCharacter().state.job))

  const sortedSkills = computed(() => {
    const list = skills.value
    if (!state.result) return list
    return [...list].sort(
      (a, b) =>
        (state.result.perSkill[b.id]?.total || 0) -
        (state.result.perSkill[a.id]?.total || 0),
    )
  })

  function toggleSkill(id) {
    if (state.disabledSkills.has(id)) state.disabledSkills.delete(id)
    else state.disabledSkills.add(id)
  }

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
    fastForward,
    simulateSingleCast,
    toggleSkill,
    skillById: (id) => SKILL_BY_ID[id] || null,
    setCallbacks(onTick, onStop) {
      onTickCallback = onTick || null
      onStopCallback = onStop || null
    },
  }
}
