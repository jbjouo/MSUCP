import { reactive, computed } from 'vue'
import { SIM_SKILLS } from '../constants/battleSim.js'
import { skillDamagePct, skillVmatrixBonus } from '../constants/skills/archmageFP.js'
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

const SKILL_BY_ID = Object.fromEntries(SIM_SKILLS.map((s) => [s.id, s]))

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
  durationSec: 181,
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
let currentArcMult = 1   // 每一 tick 重新取得
let currentJobKey = ''   // 當前玩家職業 (用於屬性無視查表)
let cpAttStats = null    // useCpDamage().attStatsInfo (lazy init)

// 針對單一技能計算屬性減傷係數:
//   1 − 怪物屬性耐性% × (1 − 無視屬性耐性%/100) / 100
// 若技能無屬性 (skill.element 為空),則一律回 1。
function elemMultFor(skill, enemy) {
  if (!skill.element) return 1
  const resist = ENEMY_ELEM_RESIST_PCT[enemy?.elementalDmg] ?? 50
  const ignore = ELEM_IGNORE_BY_JOB[currentJobKey] || 0
  return Math.max(0, 1 - (resist * (1 - ignore / 100)) / 100)
}


// 取得技能當前等級的倍率
function skillPctOf(skill) {
  const lv = state.skillLevels[skill.id] || skill.baseLevel
  return skillDamagePct(skill, lv)
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
  let survival = 1
  for (const v of values) {
    const x = Math.max(0, Math.min(100, Number(v) || 0))
    survival *= (1 - x / 100)
  }
  return 100 * (1 - survival)
}

function defMultFor(enemy, totalIgnorePct) {
  const enemyDef = Math.max(0, Number(enemy?.defense) || 0)
  const effective = enemyDef * (1 - totalIgnorePct / 100)
  return Math.max(0, 1 - effective / 100)
}

// 以 buff 修正後的 Damage% 重算 boss / basic (buff 之 Damage 是與 CP 的 Damage% 相加,不是獨立乘區)
function rebuildAtt(att, buffDmgPct) {
  const baseRaw = att?.baseRaw || 0
  const fm = att?.fm || 1
  const totalDmg = (att?.dmgPct || 0) + (buffDmgPct || 0)
  const bossDmg = att?.bossDmg || 0
  const critDmg = att?.critDmg || 0
  const mastery = att?.mastery || 100
  const basicRaw = baseRaw * (1 + totalDmg / 100) * fm
  const bossRaw  = baseRaw * (1 + (totalDmg + bossDmg) / 100) * fm
  const bossMaxRaw = bossRaw * (1.5 + critDmg / 100)
  const bossMinRaw = bossRaw * (1.2 + critDmg / 100) * (mastery / 100)
  return { basicRaw, bossRaw, bossMinRaw, bossMaxRaw }
}

// 單次「主擊」傷害(隨機 bossMin~bossMax 區間取樣;buff Damage% 併入 CP Damage% 後重算 boss)
function mainHitDmg(skill, elemMult, enemy, att) {
  const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
  const skillFinalMult = 1 + vm.finalDmgPct / 100
  const buffBonuses = useBattleBuffs().currentBonuses(currentJobKey, state.elapsedMs)
  const { bossMinRaw, bossMaxRaw } = rebuildAtt(att, buffBonuses.dmgPct)
  const totalIgnore = combinedIgnoreDefPct(att?.ignoreDef || 0, vm.ignoreDefPct, buffBonuses.ignoreDefPct)
  const defMult = defMultFor(enemy, totalIgnore)

  const range = Math.max(0, bossMaxRaw - bossMinRaw)
  const bossBase = bossMinRaw + rng() * range
  const pct = skillPctOf(skill).hit
  return bossBase * (pct / 100) * elemMult * currentArcMult
       * skillFinalMult * buffBonuses.finalDmgMult * defMult
}

// 單次 DoT tick(固定值,不吃爆擊 / 不吃 B 傷 / 無視防禦;buff Damage% 併入 basic 後重算)
function dotTickDmg(skill, elemMult, att) {
  const vm = skillVmatrixBonus(skill, vmatrixLevelOf(skill.id))
  const skillFinalMult = 1 + vm.finalDmgPct / 100
  const buffBonuses = useBattleBuffs().currentBonuses(currentJobKey, state.elapsedMs)
  const { basicRaw } = rebuildAtt(att, buffBonuses.dmgPct)
  const pct = skillPctOf(skill).burn
  return basicRaw * (pct / 100) * elemMult * currentArcMult
       * skillFinalMult * buffBonuses.finalDmgMult
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
  stats.useCount += 1
  // 實戰 buff: 本次施放先 roll,命中則增加 1 層,後續傷害用新層數計算
  useBattleBuffs().rollTriggers(rng, currentJobKey, tCast)
  for (let h = 0; h < skill.hitsPerCast; h++) {
    // mainHitDmg 本身已在 bossMin~bossMax 區間隨機取樣 + 合併 VM bonus / 防禦計算
    const factor = 1 + (rng() * 2 - 1) * skill.variance
    emitHit(stats, mainHitDmg(skill, elemMult, enemy, att) * factor)
  }
  if (skill.burn) {
    const burnMs = skill.burn.durationSec * 1000
    const ivMs = skill.burn.tickIntervalSec * 1000
    const cur = burnState[skill.id]
    if (cur) {
      cur.expireAt = tCast + burnMs
    } else {
      burnState[skill.id] = {
        nextTickAt: tCast + ivMs,
        expireAt: tCast + burnMs,
        intervalMs: ivMs,
      }
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
    const dotDmg = dotTickDmg(skill, elemMultFor(skill, enemy), att)
    while (bs.nextTickAt <= capped) {
      // DoT:不爆擊、固定值,不加 variance;同樣流經 emitHit 累加 total / attackCount / maxHit / minHit
      emitHit(stats, dotDmg)
      state.result.events.push({ time: bs.nextTickAt, skillId: skill.id, type: 'dot' })
      bs.nextTickAt += bs.intervalMs
      changed = true
    }
    if (elapsed >= bs.expireAt) delete burnState[skill.id]
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

  let changed = false
  for (const skill of SIM_SKILLS) {
    while (nextCastAt[skill.id] <= elapsed) {
      const tCast = nextCastAt[skill.id]
      emitCast(skill, tCast, elemMultFor(skill, enemy), enemy, att)
      const animDelay = skill.castDelayBySpeed?.[state.attackSpeed] ?? 1000
      // 技能若有 cooldown,下次施放受冷卻限制 (取 max(animDelay, 有效冷卻))
      const baseCd = Number(skill.cooldown) || 0
      const effCdMs = baseCd > 0
        ? computeEffectiveCooldown(baseCd, {
            skillPriorityRedSec: skill.cooldownPriorityRedSec || 0,
            skillOwnPctRed: skill.cooldownOwnPctRed || 0,
            externalPctRed: att?.cooldownReductionPct || 0,
            hatFlatRedSec: att?.cooldownReductionSec || 0,
            externalPctUsesBaseAsFlat: !!skill.cooldownExternalPctUsesBaseAsFlat,
          }) * 1000
        : 0
      const nextDelta = Math.max(animDelay, effCdMs)
      nextCastAt[skill.id] = tCast + nextDelta + Math.floor(rng() * 40)
      changed = true
    }
  }
  if (processBurnTicks(elapsed, enemy, att)) changed = true

  // 更新 DoT 數量追蹤:burnState 剩下未過期的 key 數量 = 當前目標身上生效中的 DoT 數
  useDotTracker().setActiveDotCount(Object.keys(burnState).length)

  if (changed) state.result.events.sort((a, b) => a.time - b.time)
  refreshDerived()

  if (elapsed >= totalMs) {
    state.running = false
    return
  }
  rafId = requestAnimationFrame(tick)
}

export function useBattleSim() {
  if (!cpAttStats) {
    const cp = useCpDamage()
    cpAttStats = cp.attStatsInfo
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
    useBattleBuffs().reset()
    useDotTracker().setActiveDotCount(0)
    for (const skill of SIM_SKILLS) {
      const delay = skill.castDelayBySpeed?.[state.attackSpeed] ?? 1000
      // 首次施放延後一個完整施放週期,避免開始瞬間就觸發 buff
      nextCastAt[skill.id] = delay + Math.floor(rng() * 80)
    }
    startedAt = performance.now()
    state.running = true
    rafId = requestAnimationFrame(tick)
  }
  function stop() {
    state.running = false
    if (rafId) cancelAnimationFrame(rafId)
    rafId = null
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
    // 測試用 DoT 數 = 此次施放後會生效的 DoT 數(此技能有 burn 就算 1)
    const testDotCount = skill.burn ? 1 : 0
    const buffBonuses = useBattleBuffs().currentBonuses(currentJobKey, state.elapsedMs, { dotCountOverride: testDotCount })
    const buffDmgPct = buffBonuses.dmgPct || 0
    const buffIgnoreDefPct = buffBonuses.ignoreDefPct || 0
    const buffFinalDmgMult = buffBonuses.finalDmgMult || 1
    const totalIgnoreDefPct = combinedIgnoreDefPct(cpIgnoreDefPct, vm.ignoreDefPct, buffIgnoreDefPct)
    const enemyDef = Math.max(0, Number(enemy?.defense) || 0)
    const effectiveDef = enemyDef * (1 - totalIgnoreDefPct / 100)
    const defMult = defMultFor(enemy, totalIgnoreDefPct)
    const skillFinalMult = 1 + vm.finalDmgPct / 100

    const lv = state.skillLevels[skill.id] || skill.baseLevel
    const pcts = skillDamagePct(skill, lv)
    const localRng = makeRng(state.seed ^ Date.now() ^ performance.now() | 0)

    // 以 buff Damage% + CP Damage% 的相加版本重算 basic / bossMin / bossMax
    const rebuilt = rebuildAtt(att, buffDmgPct)
    const bossMinRaw = rebuilt.bossMinRaw
    const bossMaxRaw = rebuilt.bossMaxRaw
    const basicRaw   = rebuilt.basicRaw

    // 主擊 — 每擊在 bossMin~bossMax 間隨機取樣
    const mainHits = []
    for (let h = 0; h < skill.hitsPerCast; h++) {
      const bossBase = bossMinRaw + localRng() * (bossMaxRaw - bossMinRaw)
      const variance = 1 + (localRng() * 2 - 1) * skill.variance
      const value = bossBase * (pcts.hit / 100) * elemMult * arcMult
                  * skillFinalMult * buffFinalDmgMult * defMult * variance
      mainHits.push(Math.max(1, Math.floor(value)))
    }

    // DoT — 固定值,不吃爆擊 / 不吃 BossDmg / 無視防禦
    const dotTickCount = Math.floor(skill.burn?.durationSec / (skill.burn?.tickIntervalSec || 1)) || 0
    const dotValue = basicRaw * (pcts.burn / 100) * elemMult * arcMult * skillFinalMult * buffFinalDmgMult
    const dotHit = Math.max(1, Math.floor(dotValue))
    const dotTicks = []
    for (let i = 0; i < dotTickCount; i++) {
      dotTicks.push({ time: (i + 1) * (skill.burn.tickIntervalSec * 1000), dmg: dotHit })
    }

    const mainSum = mainHits.reduce((s, x) => s + x, 0)
    const dotSum = dotTicks.reduce((s, x) => s + x.dmg, 0)

    const pct = (n) => `${n.toFixed(2)}%`
    const mul = (n) => n.toFixed(4)

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
        mainPct: pcts.hit,
        dotPct: pcts.burn,
        elemMult,
        elemResistPct,
        elemIgnorePct,
        arcMult,
        arcFinalPct,
        buffDmgPct,
        buffIgnoreDefPct,
        buffFinalDmgMult,
        buffFinalDmgPct: (buffFinalDmgMult - 1) * 100,
        testDotCount,
        totalDmgPct: (att.dmgPct || 0) + buffDmgPct,
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
      },
      mainHits,
      dotTicks,
      mainSum,
      dotSum,
      total: mainSum + dotSum,
      // 公式字串 (顯示用)
      formulas: {
        vmatrix:
          `V 矩陣 Lv ${vm.level}/${vm.maxLevel} → 技能終傷 +${vm.finalDmgPct}% (×${mul(skillFinalMult)})` +
          (vm.ignoreDefPct > 0 ? `,額外無視防禦 +${vm.ignoreDefPct}% (Lv40+ 門檻,僅此技能)` : ''),
        buff:
          `法師傳授 (Buff) → Damage +${buffDmgPct}% (與角色 Damage ${(att.dmgPct || 0).toFixed(2)}% 相加) · 無視防禦 +${buffIgnoreDefPct}%`,
        rebuild:
          `重算:basic = baseRaw × (1 + (CP Damage ${(att.dmgPct || 0).toFixed(2)}% + Buff ${buffDmgPct}%)/100) × fm(${mul(att.fm || 1)}) = ${basicRaw.toFixed(0)}\n` +
          `       boss = baseRaw × (1 + (CP+Buff+BossDmg ${((att.dmgPct || 0) + buffDmgPct + (att.bossDmg || 0)).toFixed(2)}%)/100) × fm ⇒ bossMin=${bossMinRaw.toFixed(0)} / bossMax=${bossMaxRaw.toFixed(0)}`,
        main:
          `主擊 = bossMin~bossMax 隨機 × (${pcts.hit}% ÷ 100) × 屬性(${mul(elemMult)}) × ARC終傷(${mul(arcMult)}) × VM終傷(${mul(skillFinalMult)}) × Buff終傷(${mul(buffFinalDmgMult)}) × 防禦(${mul(defMult)}) × variance(±${pct(skill.variance * 100)})`,
        defense:
          `無視防禦合併 = 1 − (1 − CP${cpIgnoreDefPct.toFixed(2)}%/100)(1 − VM${vm.ignoreDefPct}%/100)(1 − Buff${buffIgnoreDefPct}%/100) = ${totalIgnoreDefPct.toFixed(2)}%\n` +
          `有效防禦 = 怪物DEF(${enemyDef}) × (1 − 合併無視/100) = ${effectiveDef.toFixed(2)}  ⇒  defMult = max(0, 1 − 有效防禦/100) = ${mul(defMult)}`,
        dot:
          `DoT = basic(${basicRaw.toLocaleString?.('en-US') ?? 0}) × (${pcts.burn}% ÷ 100) × 屬性(${mul(elemMult)}) × ARC終傷(${mul(arcMult)}) × VM終傷(${mul(skillFinalMult)}) × Buff終傷(${mul(buffFinalDmgMult)})` +
          `  ← 不吃爆擊、不吃 BossDmg、無視防禦`,
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
