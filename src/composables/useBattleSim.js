import { reactive, computed } from 'vue'
import { SIM_SKILLS } from '../constants/battleSim.js'
import {
  skillDamagePct,
  skillVmatrixBonus,
  skillIgnoreDefPct,
  skillExplosionFinalDmgPct,
  skillExplosionCount,
} from '../constants/skills/archmageFP.js'
import {
  ENEMY_ELEM_RESIST_PCT,
  ELEM_IGNORE_BY_JOB,
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
  }
}

function makeRng(seed) {
  let s = seed >>> 0 || 1
  return function rng() {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const state = reactive({
  durationSec: 180,
  result: null,
  seed: 42,
  running: false,
  elapsedMs: 0,
  attackSpeed: 8,                            // 7 或 8 (依 skill.castDelayBySpeed 查表)
  skillLevels: defaultSkillLevels(),         // { [skillId]: level }
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
let rng = null
let nextCastAt = {}
let burnState = {}       // { [skillId]: { nextTickAt, expireAt, intervalMs } }
let fieldState = {}      // { [skillId]: { expireAt } } — 場地技能持續時間(例:Poison Mist)

// burnState 異動後立刻同步到 useDotTracker
// — 同一 tick 內後續的 emitCast / 冷卻檢查 / Fervent Drain 疊層都能讀到當下數字
function syncDotCount() {
  useDotTracker().setActiveDotCount(Object.keys(burnState).length)
}
let currentArcMult = 1   // 每一 tick 重新取得
let currentJobKey = ''   // 當前玩家職業 (用於屬性無視查表)
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


// 取得技能當前等級的原始倍率 (不含超技能 — 超技能的 damagePct / burnDamagePct
// 改「加算到 Damage%」在 rebuildAtt 時一起算,不乘進技能 % 本身)
function skillPctOf(skill) {
  const lv = state.skillLevels[skill.id] || skill.baseLevel
  return skillDamagePct(skill, lv)
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
  const critDmg = att?.critDmg || 0
  const mastery = att?.mastery || 100
  const basicRaw = mul(applyPct(baseRaw, totalDmg), fm)
  const bossRaw  = mul(applyPct(baseRaw, add(totalDmg, bossDmg)), fm)
  const bossMaxRaw = mul(bossRaw, clean(1.5 + critDmg / 100))
  const bossMinRaw = mul(bossRaw, clean(1.2 + critDmg / 100), mastery / 100)
  return { basicRaw, bossRaw, bossMinRaw, bossMaxRaw }
}

// 單次「主擊」傷害(隨機 bossMin~bossMax 區間取樣)
//   Damage% 桶 = CP Damage% + Buff Damage% + 超技能 damagePct
//   技能自帶 ignoreDef 與爆炸終傷(Mist Eruption 依 DoT 數)也併入
function mainHitDmg(skill, elemMult, enemy, att) {
  const lv = state.skillLevels[skill.id] || skill.baseLevel
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
  const pct = skillPctOf(skill).hit
  return mul(bossBase, pct / 100, elemMult, currentArcMult,
             skillFinalMult, buffBonuses.finalDmgMult, defMult, explosionMult)
}

// 單次 DoT tick — 新公式(與主擊完全獨立):
//   DoT = baseRaw × (DoT 技能倍率/100) × V矩陣終傷 × 特殊終傷 × 怪物類型乘區
//
//   baseRaw = 武器係數 × (4×主屬+副屬) × ATK(%後)/100  (att.baseRaw,已包含 ATK% 加成)
//   V矩陣終傷 = 1 + skill.vmatrix 每等累計 finalDmgPct/100
//   特殊終傷 = 目前僅火毒 Fervent Drain 疊層 (每層 +5%,同層相加後轉乘區)
//   怪物類型乘區 = dotEnemyMult(enemy) — 普通怪物 1,Boss 未減半 1.86,Boss 減半 1.41
//
//   ★ 不吃:面板終傷 (fm) / CP Damage% / Buff Damage% / 超技能 Damage%
//          / Boss Damage% / 屬性減傷 / ARC 終傷 / 怪物 DEF / 爆擊 / 熟練度 / variance
function dotTickDmg(skill, enemy, att) {
  const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
  const skillFinalMult = clean(1 + vm.finalDmgPct / 100)
  const { mult: specialMult } = useBattleBuffs().dotSpecialFinalMult(currentJobKey, state.elapsedMs)
  const pct = skillPctOf(skill).burn
  const enemyMult = dotEnemyMult(enemy)
  return mul(att?.baseRaw || 0, pct / 100, skillFinalMult, specialMult, enemyMult, DOT_COEFFICIENT)
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
  const stats = res.perSkill[skill.id]
  // 爆炸型技能(Mist Eruption):每次爆炸視為一次使用 (useCount += 爆炸數)
  //   一般技能 skillExplosionCount 回傳 1,等同 +1
  const explosionsN = skillExplosionCount(skill)
  stats.useCount += explosionsN
  // 實戰 buff: 本次施放先 roll,命中則增加 1 層,後續傷害用新層數計算
  // 若 proc 成功且 buff 標記 appliesDebuff → 連鎖觸發 linkCycle/triggerOn='debuffApplied'(例:Thief's Cunning)
  // linkCycle 屬被動型 buff,不寫進 timeline(僅透過 buff 圖示呈現)
  useBattleBuffs().rollTriggers(rng, currentJobKey, tCast)
  const hs = hyperBagFor(skill.id)
  // 爆炸型:總擊數 = 固定爆炸數 × 每爆擊數 (與 DoT 層數無關)
  const baseHits = (skill.hitsPerCast || 0) * explosionsN
  const hits = Math.max(0, baseHits + (hs.hitsPerCastBonus || 0))
  for (let h = 0; h < hits; h++) {
    // mainHitDmg 本身已在 bossMin~bossMax 區間隨機取樣 + 合併 VM bonus / 防禦計算
    const factor = 1 + (rng() * 2 - 1) * skill.variance
    emitHit(stats, mainHitDmg(skill, elemMult, enemy, att) * factor)
  }
  // Mist Eruption 等技能命中時重置指定技能 CD (例:→ Flame Haze)
  if (Array.isArray(skill.onHitResetCooldown) && skill.onHitResetCooldown.length) {
    const ownAnim = skill.castDelayBySpeed?.[state.attackSpeed] ?? 1000
    for (const targetId of skill.onHitResetCooldown) {
      // 下一次可施放 = 本施放的動畫完成後 (避免施放重疊)
      nextCastAt[targetId] = tCast + ownAnim + Math.floor(rng() * 40)
    }
  }
  // 場地技能 — 記錄到 fieldState 供 requiresField 檢查(例:Poison Mist)
  if (skill.fieldDurationSec) {
    fieldState[skill.id] = { expireAt: tCast + skill.fieldDurationSec * 1000 }
  }
  // 衍生技能 — 於同 tCast 一併施放(例:Flame Haze → Poison Mist)
  if (Array.isArray(skill.onHitSpawn) && skill.onHitSpawn.length) {
    for (const derivedId of skill.onHitSpawn) {
      const derived = SKILL_BY_ID[derivedId]
      if (derived) emitCast(derived, tCast, elemMultFor(derived, enemy), enemy, att)
    }
  }
  if (skill.burn) {
    const burnDurationSec = skill.burn.durationSec + (hs.burnDurationBonusSec || 0)
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
      // DoT:不爆擊、固定值,不加 variance;同樣流經 emitHit 累加 total / attackCount / maxHit / minHit
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
      if (s.type === 'derived') continue
      const t = nextCastAt[s.id]
      if (t == null || t > elapsed) continue
      const pri = s.priority || 0
      if (t < pickTime || (t === pickTime && pri > pickPriority)) {
        pick = s
        pickTime = t
        pickPriority = pri
      }
    }
    if (!pick) break
    const skill = pick
    // 前置條件 requiresField — 不滿足就推後 200ms,回圈再選下一個
    if (skill.requiresField) {
      const fs = fieldState[skill.requiresField]
      if (!fs || elapsed >= fs.expireAt) {
        nextCastAt[skill.id] = elapsed + 200
        continue
      }
    }
    const tCast = nextCastAt[skill.id]
    emitCast(skill, tCast, elemMultFor(skill, enemy), enemy, att)
    changed = true

    // Aura:固定間隔觸發,不鎖其他技能
    if (skill.aura) {
      const intervalMs = Math.max(50, (skill.aura.intervalSec || 3) * 1000)
      nextCastAt[skill.id] = tCast + intervalMs
      continue
    }

    const animDelay = skill.castDelayBySpeed?.[state.attackSpeed] ?? 1000
    const baseCd = Number(skill.cooldown) || 0
    const hsCd = hyperBagFor(skill.id)
    // 條件式優先減免(Mist Eruption 命中 ≥5 爆炸 -2s):爆炸數以施放當下 activeDotCount 判斷
    const activeDots = useDotTracker().state.activeDotCount
    const priorityThreshold = skill.cooldownPriorityThreshold || 0
    const priorityRed = (priorityThreshold > 0 && activeDots >= priorityThreshold)
      ? (skill.cooldownPriorityRedSec || 0)
      : (priorityThreshold === 0 ? (skill.cooldownPriorityRedSec || 0) : 0)
    const effCdMs = baseCd > 0
      ? computeEffectiveCooldown(baseCd, {
          skillPriorityRedSec: priorityRed,
          skillOwnPctRed: (skill.cooldownOwnPctRed || 0) + (hsCd.cooldownOwnPctRed || 0),
          externalPctRed: att?.cooldownReductionPct || 0,
          hatFlatRedSec: att?.cooldownReductionSec || 0,
          externalPctUsesBaseAsFlat: !!skill.cooldownExternalPctUsesBaseAsFlat,
        }) * 1000
      : 0
    const nextDelta = Math.max(animDelay, effCdMs)
    nextCastAt[skill.id] = tCast + nextDelta + Math.floor(rng() * 40)

    // 鎖定其他主動技能至 tCast + animDelay (aura / derived 不受影響)
    const lockUntil = tCast + animDelay
    for (const other of SIM_SKILLS) {
      if (other === skill) continue
      if (other.type === 'aura' || other.type === 'derived') continue
      const cur = nextCastAt[other.id]
      if (cur != null && cur < lockUntil) nextCastAt[other.id] = lockUntil
    }
  }
  if (processBurnTicks(elapsed, enemy, att)) changed = true

  // 更新 DoT 數量追蹤:burnState 剩下未過期的 key 數量 = 當前目標身上生效中的 DoT 數
  useDotTracker().setActiveDotCount(Object.keys(burnState).length)

  if (changed) state.result.events.sort((a, b) => a.time - b.time)
  refreshDerived()

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
    rng = makeRng(state.seed)
    nextCastAt = {}
    burnState = {}
    fieldState = {}
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
    // 開場排程:
    //   derived 型(例 Poison Mist)→ 完全不排程,靠 onHitSpawn 觸發
    //   aura 型(開關持續技)→ 首次觸發在 firstHitWindowSec 內隨機,不進 priority cascade
    //   一般型                → 依 priority 遞減累加 animDelay,避免同 tick 齊發
    const schedulable = SIM_SKILLS.filter((s) => s.type !== 'derived')
    const auraSkills = schedulable.filter((s) => s.aura)
    const normalSkills = schedulable.filter((s) => !s.aura)
    const ordered = [...normalSkills].sort((a, b) => (b.priority || 0) - (a.priority || 0))
    let cursor = 0
    for (const skill of ordered) {
      const anim = skill.castDelayBySpeed?.[state.attackSpeed] ?? 1000
      cursor += anim
      nextCastAt[skill.id] = cursor + Math.floor(rng() * 40)
    }
    for (const skill of auraSkills) {
      const [minSec, maxSec] = skill.aura.firstHitWindowSec || [0, skill.aura.intervalSec || 3]
      const minMs = Math.max(0, minSec) * 1000
      const maxMs = Math.max(minMs, maxSec * 1000)
      nextCastAt[skill.id] = minMs + Math.floor(rng() * Math.max(1, maxMs - minMs))
    }
    startedAt = performance.now()
    state.running = true
    rafId = requestAnimationFrame(tick)
  }
  function stop() {
    state.running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
    // 停止 = 結束戰鬥:實戰 buff 與 DoT 追蹤一併清空
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
  }
  function reset() {
    stop()
    state.result = null
    state.elapsedMs = 0
  }

  // 測試用 — 以當前設定跑一次技能施放,回傳每擊傷害明細與公式字串。
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
    const att = cpAttStats?.value || {}
    const elemMult = elemMultFor(skill, enemy)
    const elemResistPct = ENEMY_ELEM_RESIST_PCT[enemy?.elementalDmg] ?? 50
    const elemIgnorePct = ELEM_IGNORE_BY_JOB[currentJobKey] || 0
    const cpIgnoreDefPct = att.ignoreDef || 0
    const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
    // 測試用 DoT 數:
    //   sim 執行中 → 以當前實際 burnState 數為底(其他技能的 DoT 仍生效中),
    //                 若此技能自身沒在 burnState 內但有 burn,視為此次施放新增 1 個
    //   sim 非執行 → 僅此技能自身(有 burn = 1,否則 0)
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
    // DoT 專用的「特殊終傷」— 現階段僅火毒 Fervent Drain (每層 +5%)
    const dotSpecial = useBattleBuffs().dotSpecialFinalMult(currentJobKey, state.elapsedMs, { dotCountOverride: testDotCount })
    const ferventStacks = dotSpecial.stacks
    const ferventPerStack = dotSpecial.perStack
    const dotSpecialMult = dotSpecial.mult
    const dotEnemyMultVal = dotEnemyMult(enemy)
    // 超技能 bag — 主擊 / DoT / 命中數 / 時長 / 無視防禦 / 冷卻 都會用到
    const hs = hyperBagFor(skill.id)
    const lv = state.skillLevels[skill.id] || skill.baseLevel
    const skillIgDef = skillIgnoreDefPct(skill, lv)
    const totalIgnoreDefPct = combinedIgnoreDefPct(
      cpIgnoreDefPct, vm.ignoreDefPct, buffIgnoreDefPct, hs.ignoreDefPct || 0, skillIgDef,
    )
    const enemyDef = Math.max(0, Number(enemy?.defense) || 0)
    const effectiveDef = mul(enemyDef, clean(1 - totalIgnoreDefPct / 100))
    const defMult = defMultFor(enemy, totalIgnoreDefPct)
    const skillFinalMult = clean(1 + vm.finalDmgPct / 100)

    // 爆炸終傷 (Mist Eruption):依 DoT 層數查表(固定爆炸次數不影響終傷查表)
    const explosionsN = skillExplosionCount(skill)
    const explosionFdPct = skillExplosionFinalDmgPct(skill, testDotCount)
    const explosionMult = clean(1 + explosionFdPct / 100)

    // 超技能 damagePct / burnDamagePct 加進 Damage% 桶,不乘進技能 % 本身
    const baseP = skillDamagePct(skill, lv)
    const pcts = { hit: baseP.hit, burn: baseP.burn }
    const mainDmgPct = add(buffDmgPct, hs.damagePct || 0)
    const dotDmgPct = add(buffDmgPct, hs.burnDamagePct || 0)
    const localRng = makeRng(state.seed ^ Date.now() ^ performance.now() | 0)

    // 重算:主擊用 mainDmgPct、DoT 用 dotDmgPct (兩者 Damage% 桶不同)
    const mainRebuilt = rebuildAtt(att, mainDmgPct)
    const dotRebuilt = rebuildAtt(att, dotDmgPct)
    const bossMinRaw = mainRebuilt.bossMinRaw
    const bossMaxRaw = mainRebuilt.bossMaxRaw
    const basicRaw   = dotRebuilt.basicRaw

    // 主擊 — 每擊在 bossMin~bossMax 間隨機取樣;
    //   爆炸型:總擊數 = (hitsPerCast × 固定爆炸數) + 超技能 hitsPerCastBonus
    const perCastHits = (skill.hitsPerCast || 0) * explosionsN
    const totalHits = Math.max(0, add(perCastHits, hs.hitsPerCastBonus || 0))
    const mainHits = []
    for (let h = 0; h < totalHits; h++) {
      const bossBase = add(bossMinRaw, mul(localRng(), sub(bossMaxRaw, bossMinRaw)))
      const variance = clean(1 + (localRng() * 2 - 1) * skill.variance)
      const value = mul(bossBase, pcts.hit / 100, elemMult, arcMult,
                        skillFinalMult, buffFinalDmgMult, defMult, variance, explosionMult)
      mainHits.push(Math.max(1, floor(value)))
    }

    // DoT — 新公式:baseRaw × 技能DoT% × V矩陣終傷 × 特殊終傷(Fervent Drain) × 怪物類型乘區
    //   不吃:面板終傷 / CP&Buff&Hyper Damage% / Boss Damage% / 屬性減傷 / ARC / DEF
    //   時長 + 超技能 burnDurationBonusSec
    const burnDurationSec = add(skill.burn?.durationSec || 0, hs.burnDurationBonusSec || 0)
    const dotTickCount = floor(burnDurationSec / (skill.burn?.tickIntervalSec || 1)) || 0
    const dotBaseRaw = att.baseRaw || 0
    const dotValue = mul(dotBaseRaw, pcts.burn / 100, skillFinalMult, dotSpecialMult, dotEnemyMultVal, DOT_COEFFICIENT)
    const dotHit = skill.burn ? Math.max(dotValue > 0 ? 1 : 0, floor(dotValue)) : 0
    const dotTicks = []
    for (let i = 0; i < dotTickCount; i++) {
      dotTicks.push({ time: (i + 1) * (skill.burn.tickIntervalSec * 1000), dmg: dotHit })
    }

    const mainSum = mainHits.reduce((s, x) => s + x, 0)
    const dotSum = dotTicks.reduce((s, x) => s + x.dmg, 0)

    const pct = (n) => `${n.toFixed(2)}%`
    const fmtMul = (n) => n.toFixed(4)

    return {
      skill,
      level: lv,
      // 輸入值
      cpInputs: {
        basic: att.basic,
        basicRaw,
        bossMin: att.bossMin,
        bossMax: att.bossMax,
        bossMinRaw,
        bossMaxRaw,
        dmgPct: att.dmgPct,
        bossDmg: att.bossDmg,
        finalDmg: att.finalDmg,
        fm: att.fm,
        critDmg: att.critDmg,
        mastery: att.mastery,
        attVal: att.attVal,
        primaryStat: att.primaryStat,
        primaryVal: att.primaryVal,
        secondaryVal: att.secondaryVal,
        usesMatk: att.usesMatk,
      },
      // 乘區
      mults: {
        mainPct: pcts.hit,      // 技能主擊 %(超技能不再乘進這裡)
        dotPct: pcts.burn,      // 技能 DoT %(同上)
        baseMainPct: baseP.hit,
        baseDotPct: baseP.burn,
        hitsPerCast: totalHits,
        baseHitsPerCast: skill.hitsPerCast || 0,
        burnDurationSec,
        baseBurnDurationSec: skill.burn?.durationSec || 0,
        hyperDamagePct: hs.damagePct || 0,
        hyperBurnDamagePct: hs.burnDamagePct || 0,
        hyperHitsBonus: hs.hitsPerCastBonus || 0,
        hyperBurnDurationBonusSec: hs.burnDurationBonusSec || 0,
        hyperIgnoreDefPct: hs.ignoreDefPct || 0,
        hyperCdPctRed: hs.cooldownOwnPctRed || 0,
        skillIgnoreDefPct: skillIgDef,
        explosionsN,
        explosionFdPct,
        explosionMult,
        mainDmgPct,             // 主擊實際進桶 Damage%(CP+Buff+Hyper)
        dotDmgPct,              // DoT 實際進桶 Damage%
        elemMult,
        elemResistPct,
        elemIgnorePct,
        arcMult,
        arcFinalPct,
        buffDmgPct,
        buffIgnoreDefPct,
        buffFinalDmgMult,
        buffFinalDmgPct: clean((buffFinalDmgMult - 1) * 100),
        testDotCount,
        totalDmgPct: add(att.dmgPct || 0, buffDmgPct),
        rebuiltBasic: Math.round(basicRaw),
        rebuiltBossMin: Math.round(bossMinRaw),
        rebuiltBossMax: Math.round(bossMaxRaw),
        cpIgnoreDefPct,
        vmIgnoreDefPct: vm.ignoreDefPct,
        totalIgnoreDefPct,
        enemyDef,
        effectiveDef,
        defMult,
        vmLevel: vm.level,
        vmMaxLevel: vm.maxLevel,
        vmFinalDmgPct: vm.finalDmgPct,
        skillFinalMult,
        // DoT 專用輸出(供測試面板顯示)
        dotBaseRaw,
        dotSpecialMult,
        ferventStacks,
        ferventPerStack,
        dotEnemyMult: dotEnemyMultVal,
      },
      mainHits,
      dotTicks,
      mainSum,
      dotSum,
      total: mainSum + dotSum,
      // 公式字串 (顯示用)
      formulas: {
        vmatrix:
          `V 矩陣 Lv ${vm.level}/${vm.maxLevel} → 技能終傷 +${vm.finalDmgPct}% (×${fmtMul(skillFinalMult)})` +
          (vm.ignoreDefPct > 0 ? `,額外無視防禦 +${vm.ignoreDefPct}% (Lv40+ 門檻,僅此技能)` : ''),
        hyper:
          `超技能 → 主擊 Damage% +${hs.damagePct || 0}% (加算到 CP+Buff Damage 桶,不乘進技能 ${baseP.hit}%) · ` +
          `DoT Damage% +${hs.burnDamagePct || 0}% (同樣加算到 Damage 桶,不乘進 ${baseP.burn}%) · ` +
          `命中數 ${skill.hitsPerCast || 0}${(hs.hitsPerCastBonus || 0) > 0 ? `+${hs.hitsPerCastBonus}` : ''} → ${totalHits} · ` +
          `DoT 時長 ${skill.burn?.durationSec || 0}s${(hs.burnDurationBonusSec || 0) > 0 ? `+${hs.burnDurationBonusSec}` : ''} → ${burnDurationSec}s · ` +
          `無視防禦 +${hs.ignoreDefPct || 0}% · 冷卻 -${hs.cooldownOwnPctRed || 0}%`,
        buff:
          `法師傳授 (Buff) → Damage +${buffDmgPct}% (與角色 Damage ${(att.dmgPct || 0).toFixed(2)}% 相加) · 無視防禦 +${buffIgnoreDefPct}%`,
        rebuild:
          `重算 (主擊) :basic 不用,此路徑改走 boss — ` +
          `boss = baseRaw × (1 + (CP ${(att.dmgPct || 0).toFixed(2)}% + Buff ${buffDmgPct}% + Hyper ${hs.damagePct || 0}% + BossDmg ${(att.bossDmg || 0).toFixed(2)}%)/100) × fm(${fmtMul(att.fm || 1)}) ⇒ bossMin=${bossMinRaw.toFixed(0)} / bossMax=${bossMaxRaw.toFixed(0)}\n` +
          `重算 (DoT)  :DoT 改走新公式,不吃 Damage% / fm / BossDmg,直接用 baseRaw = ${Math.round(att.baseRaw || 0)}`,
        main:
          `主擊 = bossMin~bossMax 隨機 × (${pcts.hit}% ÷ 100) × 屬性(${fmtMul(elemMult)}) × ARC終傷(${fmtMul(arcMult)}) × VM終傷(${fmtMul(skillFinalMult)}) × Buff終傷(${fmtMul(buffFinalDmgMult)}) × 防禦(${fmtMul(defMult)}) × 爆炸終傷(${fmtMul(explosionMult)}) × variance(±${pct(skill.variance * 100)}) · 共 ${totalHits} 下`,
        explosion: skill.explosions
          ? `爆炸 = 固定 ${explosionsN} 次 × 每爆 ${skill.hitsPerCast} 擊 = 共 ${totalHits} 擊 · DoT 層數 ${testDotCount} → 終傷 +${explosionFdPct}% (×${fmtMul(explosionMult)})`
          : '',
        defense:
          `無視防禦合併 = 1 − (1 − CP${cpIgnoreDefPct.toFixed(2)}%/100)(1 − VM${vm.ignoreDefPct}%/100)(1 − Buff${buffIgnoreDefPct}%/100)(1 − Hyper${hs.ignoreDefPct || 0}%/100)(1 − 技能${skillIgDef}%/100) = ${totalIgnoreDefPct.toFixed(2)}%\n` +
          `有效防禦 = 怪物DEF(${enemyDef}) × (1 − 合併無視/100) = ${effectiveDef.toFixed(2)}  ⇒  defMult = max(0, 1 − 有效防禦/100) = ${fmtMul(defMult)}`,
        dot:
          `DoT = baseRaw(${Math.round(dotBaseRaw).toLocaleString?.('en-US') ?? 0}) × (${pcts.burn}% ÷ 100) × VM終傷(${fmtMul(skillFinalMult)}) × 特殊終傷(${fmtMul(dotSpecialMult)}; Fervent Drain ${ferventStacks}層×${ferventPerStack}%) × 怪物乘區(×${dotEnemyMultVal.toFixed(2)}; ${enemy?.type === 'boss' ? `Boss-${enemy?.elementalDmg}` : '一般怪物'}) × DoT係數(×${DOT_COEFFICIENT.toFixed(2)})\n` +
          `  baseRaw = 武器係數 × (4×主屬+副屬) × ATK(計算%後)/100 · 公式為一般怪物 未減半;Boss 未減半 ×1.86、Boss 減半 ×1.41\n` +
          `  ← 不吃面板終傷 / CP&Buff&Hyper Damage% / Boss Damage% / ARC / 防禦 / 爆擊 / 熟練度 / 屬性減傷`,
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
