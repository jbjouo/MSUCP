import { reactive } from 'vue'
import { BATTLE_BUFFS } from '../constants/battleBuffs.js'
import { combinedLevelFor, bestLevelDataFor } from './useLinkSkills.js'
import { getLinkSkill } from '../data/linkSkills.js'
import { useDotTracker } from './useDotTracker.js'

function defaultStacks() {
  const out = {}
  for (const b of BATTLE_BUFFS) out[b.id] = { count: 0, expireAt: 0 }
  return out
}

const state = reactive({
  stacks: defaultStacks(),
})

function applicableForJob(buff, jobKey) {
  return !buff.jobs || !jobKey || buff.jobs.includes(jobKey)
}

// 依 buff 來源取得「當前等級的 stats 規則」
//   linkSkill → 依連結結果動態查;passive → 直接從 buff 定義讀
function currentLevelStats(buff, jobKey) {
  if (buff.source === 'linkSkill') {
    const skill = getLinkSkill(buff.id)
    if (!skill) return null
    const level = combinedLevelFor(buff.id, jobKey)
    if (level <= 0) return { level: 0, stats: null }
    const data = bestLevelDataFor(skill, level)
    return { level, stats: data?.stats || null }
  }
  if (buff.source === 'passive') {
    return {
      level: 1,
      stats: {
        maxStacks: buff.maxStacks || 0,
        duration: 0,
        damagePerStack: 0,
        ignoreDefPerStack: 0,
        finalDmgPerStack: buff.perStackFinalDmgPct || 0,
      },
    }
  }
  return null
}

// 取得單一 buff 當前層數
//   roll 型 (linkSkill / 其他有 state 的) → 存於 state.stacks[id].count
//   passive 型 (dotCount) → 計算 min(maxStacks, activeDotCount)
function stacksOf(buff, dotCountOverride) {
  if (buff.source === 'passive' && buff.passiveType === 'dotCount') {
    const count = dotCountOverride != null
      ? dotCountOverride
      : useDotTracker().state.activeDotCount
    return Math.min(buff.maxStacks || 0, Math.max(0, count))
  }
  return state.stacks[buff.id]?.count || 0
}

function syncExpire(nowMs) {
  if (!Number.isFinite(nowMs)) return
  for (const id of Object.keys(state.stacks)) {
    const s = state.stacks[id]
    if (s.count > 0 && nowMs >= s.expireAt) {
      s.count = 0
      s.expireAt = 0
    }
  }
}

export function useBattleBuffs() {
  function reset() {
    for (const id of Object.keys(state.stacks)) {
      state.stacks[id].count = 0
      state.stacks[id].expireAt = 0
    }
  }

  // 每次施放時呼叫 — 僅對 trigger-based (linkSkill 含 procRate) 生效
  function rollTriggers(rng, jobKey, nowMs) {
    syncExpire(nowMs)
    for (const buff of BATTLE_BUFFS) {
      if (!applicableForJob(buff, jobKey)) continue
      if (buff.source !== 'linkSkill') continue
      const info = currentLevelStats(buff, jobKey)
      if (!info?.stats) continue
      const { procRate = 0, maxStacks = 0, duration = 0 } = info.stats
      if (!procRate) continue
      const s = state.stacks[buff.id]
      if (s.count >= maxStacks) {
        if (rng() * 100 < procRate) s.expireAt = nowMs + duration * 1000
        continue
      }
      if (rng() * 100 < procRate) {
        s.count += 1
        s.expireAt = nowMs + duration * 1000
      }
    }
  }

  // 當前全部 buff 彙總:
  //   dmgPct / ignoreDefPct 同技能層線性相加,不同 buff 再累加
  //   finalDmgMult 同技能層「相加」成一個乘區,不同 buff 之間「互乘」
  //     (即:buff_A_mult × buff_B_mult × ...)
  function currentBonuses(jobKey, nowMs, { dotCountOverride } = {}) {
    syncExpire(nowMs)
    const total = { dmgPct: 0, ignoreDefPct: 0, finalDmgMult: 1 }
    for (const buff of BATTLE_BUFFS) {
      if (!applicableForJob(buff, jobKey)) continue
      const info = currentLevelStats(buff, jobKey)
      if (!info?.stats) continue
      const stacks = stacksOf(buff, dotCountOverride)
      if (stacks <= 0) continue
      total.dmgPct += stacks * (info.stats.damagePerStack || 0)
      total.ignoreDefPct += stacks * (info.stats.ignoreDefPerStack || 0)
      const fdPerStack = info.stats.finalDmgPerStack || 0
      if (fdPerStack > 0) {
        // 同技能層 → 相加 (例:5 層 × 5% = 25%);轉乘區 × (1 + 25/100)
        const selfMult = 1 + (stacks * fdPerStack) / 100
        total.finalDmgMult *= selfMult
      }
    }
    return total
  }

  function buffInfo(buff, jobKey, nowMs, { dotCountOverride } = {}) {
    const info = currentLevelStats(buff, jobKey)
    syncExpire(nowMs)
    const count = stacksOf(buff, dotCountOverride)
    const s = state.stacks[buff.id] || { count: 0, expireAt: 0 }
    return {
      level: info?.level || 0,
      stats: info?.stats || null,
      count,
      expireAt: s.expireAt,
      active: !!info?.stats,
    }
  }

  return {
    state,
    reset,
    rollTriggers,
    currentBonuses,
    buffInfo,
  }
}
