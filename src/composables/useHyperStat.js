// Hyper Stat 狀態 + 計算機 contribution

import { reactive, computed } from 'vue'
import {
  HYPER_STATS,
  HYPER_STATS_BY_ID,
  HYPER_STAT_COSTS,
  hyperPointsAtLevel,
  hyperCumulativeCost,
} from '../constants/hyperStat.js'
import { useCharacter } from './useCharacter.js'
import { charKey } from './useActiveCharacter.js'

const SECONDARY_MAP = { str: 'dex', dex: 'str', int: 'luk', luk: 'dex' }

const STORAGE_KEY = charKey('hyperStat.v1')

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

// 以所有 hyper stat id 作為 key 預先初始化
const initial = Object.fromEntries(HYPER_STATS.map((s) => [s.id, 0]))
const saved = load()
for (const s of HYPER_STATS) {
  const v = Number(saved[s.id])
  if (Number.isFinite(v) && v > 0) {
    initial[s.id] = Math.max(0, Math.min(s.maxLevel, Math.floor(v)))
  }
}
const state = reactive(initial)

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function costBetween(from, to) {
  let c = 0
  const lo = Math.min(from, to)
  const hi = Math.max(from, to)
  for (let i = lo; i < hi && i < HYPER_STAT_COSTS.length; i++) c += HYPER_STAT_COSTS[i]
  return c
}

export function useHyperStat() {
  const { state: charState } = useCharacter()

  const totalPoints = computed(() => hyperPointsAtLevel(charState.level || 0))
  const usedPoints = computed(() => {
    let sum = 0
    for (const s of HYPER_STATS) sum += hyperCumulativeCost(state[s.id] || 0)
    return sum
  })
  const remainingPoints = computed(() => totalPoints.value - usedPoints.value)

  function getLevel(id) { return state[id] || 0 }

  function canIncrement(id) {
    const stat = HYPER_STATS_BY_ID[id]
    if (!stat) return false
    const cur = state[id] || 0
    if (cur >= stat.maxLevel) return false
    const needed = HYPER_STAT_COSTS[cur] || 0
    return remainingPoints.value >= needed
  }
  function canDecrement(id) { return (state[id] || 0) > 0 }

  function increment(id) {
    if (!canIncrement(id)) return
    state[id] = (state[id] || 0) + 1
    persist()
  }
  function decrement(id) {
    if (!canDecrement(id)) return
    state[id] = Math.max(0, (state[id] || 0) - 1)
    persist()
  }
  function setLevel(id, level) {
    const stat = HYPER_STATS_BY_ID[id]
    if (!stat) return
    const target = Math.max(0, Math.min(stat.maxLevel, Math.floor(Number(level) || 0)))
    const cur = state[id] || 0
    if (target > cur) {
      // 檢查點數
      const need = costBetween(cur, target)
      if (need > remainingPoints.value) {
        // 只升到點數允許的最大等級
        let lv = cur
        while (lv < target) {
          const next = HYPER_STAT_COSTS[lv] || 0
          if (next > remainingPoints.value - (costBetween(cur, lv))) break
          lv++
        }
        state[id] = lv
      } else {
        state[id] = target
      }
    } else {
      state[id] = target
    }
    persist()
  }
  function resetAll() {
    for (const s of HYPER_STATS) state[s.id] = 0
    persist()
  }

  // 計算機 — 產生 contribution 列表
  const statContributions = computed(() => {
    const out = []
    for (const s of HYPER_STATS) {
      const lv = state[s.id] || 0
      if (!lv) continue
      const bag = s.valueAt(lv) || {}
      if (!Object.keys(bag).length) continue
      out.push({ stat: s, level: lv, stats: bag, fixed: !!s.fixed })
    }
    return out
  })

  function solveOptimal(ctx) {
    const { primaryStat, statComponents, mastery, weaponConst, usesMatk } = ctx

    const secondaryStat = SECONDARY_MAP[primaryStat] || 'dex'
    const relevantIds = [primaryStat, secondaryStat, 'critDmg', 'damage', 'bossDmg', 'attMatk']
      .filter((id, i, arr) => HYPER_STATS_BY_ID[id] && arr.indexOf(id) === i)

    const ignoreLv = state.ignoreDef || 0
    const ignoreUsed = hyperCumulativeCost(ignoreLv)
    const budget = totalPoints.value - ignoreUsed

    const attKey = usesMatk ? 'matk' : 'atk'

    // 讀取各屬性的原始分量（含當前 hyper stat 貢獻）
    const primaryComp = statComponents(primaryStat)
    const secondaryComp = statComponents(secondaryStat)
    const attComp = statComponents(attKey)
    const dmgComp = statComponents('dmgPct')
    const bossComp = statComponents('bossDmg')
    const critComp = statComponents('critDmg')
    const finalComp = statComponents('finalDmg')

    // 扣除當前 hyper stat 的貢獻，得到不含 hyper 的 base 分量
    const currentBag = {}
    for (const s of HYPER_STATS) {
      if (s.id === 'ignoreDef') continue
      const lv = state[s.id] || 0
      if (!lv) continue
      const v = s.valueAt(lv)
      for (const [k, val] of Object.entries(v)) currentBag[k] = (currentBag[k] || 0) + val
    }

    // 主副屬是 fixed → 從 fixedFlat 扣; ATT/MATK 是 normalFlat → 從 normalFlat 扣; % stat 從 pct 扣
    const pNormal = primaryComp.normalFlat
    const pFixed = primaryComp.fixedFlat - (currentBag[primaryStat] || 0)
    const pPct = primaryComp.pct

    const sNormal = secondaryComp.normalFlat
    const sFixed = secondaryComp.fixedFlat - (currentBag[secondaryStat] || 0)
    const sPct = secondaryComp.pct

    const attNormal = attComp.normalFlat - (currentBag[attKey] || 0)
    const attFixed = attComp.fixedFlat
    const attPct = attComp.pct

    const baseDmgPct = dmgComp.normalFlat + dmgComp.fixedFlat + dmgComp.pct - (currentBag.dmgPct || 0)
    const baseBossDmg = bossComp.normalFlat + bossComp.fixedFlat + bossComp.pct - (currentBag.bossDmg || 0)
    const baseCritDmg = critComp.normalFlat + critComp.fixedFlat + critComp.pct - (currentBag.critDmg || 0)
    const finalDmg = finalComp.normalFlat + finalComp.fixedFlat + finalComp.pct

    const fm = 1 + finalDmg / 100
    const masteryRatio = mastery / 100

    const maxLevels = relevantIds.map(id => HYPER_STATS_BY_ID[id].maxLevel)
    const costs = relevantIds.map(id => {
      const arr = [0]
      for (let lv = 1; lv <= HYPER_STATS_BY_ID[id].maxLevel; lv++) arr.push(hyperCumulativeCost(lv))
      return arr
    })

    const deltas = relevantIds.map(id => {
      const stat = HYPER_STATS_BY_ID[id]
      const arr = []
      for (let lv = 0; lv <= stat.maxLevel; lv++) {
        const bag = lv > 0 ? stat.valueAt(lv) : {}
        arr.push({
          p: bag[primaryStat] || 0,
          s: bag[secondaryStat] || 0,
          att: bag[attKey] || 0,
          dmg: bag.dmgPct || 0,
          boss: bag.bossDmg || 0,
          crit: bag.critDmg || 0,
        })
      }
      return arr
    })

    let bestAvg = -1
    let bestLevels = new Array(relevantIds.length).fill(0)

    function search(idx, usedPts, dP, dS, dAtt, dDmg, dBoss, dCrit) {
      if (idx === relevantIds.length) {
        // 主副屬: fixed → 直接加; ATT: normalFlat → 被 % 放大
        const pVal = Math.floor(pNormal * (1 + pPct / 100)) + pFixed + dP
        const sVal = Math.floor(sNormal * (1 + sPct / 100)) + sFixed + dS
        const attVal = Math.floor((attNormal + dAtt) * (1 + attPct / 100)) + attFixed
        const boss = (pVal * 4 + sVal) * (attVal / 100) * weaponConst * (1 + (baseDmgPct + dDmg + baseBossDmg + dBoss) / 100) * fm
        const cd = baseCritDmg + dCrit
        const bossMax = boss * (1.5 + cd / 100)
        const bossMin = boss * (1.2 + cd / 100) * masteryRatio
        const avg = (bossMax + bossMin) / 2
        if (avg > bestAvg) {
          bestAvg = avg
          for (let i = 0; i < relevantIds.length; i++) bestLevels[i] = currentSearch[i]
        }
        return
      }

      const remaining = budget - usedPts
      for (let lv = 0; lv <= maxLevels[idx]; lv++) {
        const c = costs[idx][lv]
        if (c > remaining) break
        const d = deltas[idx][lv]
        currentSearch[idx] = lv
        search(idx + 1, usedPts + c, dP + d.p, dS + d.s, dAtt + d.att, dDmg + d.dmg, dBoss + d.boss, dCrit + d.crit)
      }
    }

    const currentSearch = new Array(relevantIds.length).fill(0)
    search(0, 0, 0, 0, 0, 0, 0, 0)

    const alloc = {}
    for (let i = 0; i < relevantIds.length; i++) alloc[relevantIds[i]] = bestLevels[i]
    return alloc
  }

  function autoAllocate(ctx) {
    const alloc = solveOptimal(ctx)
    const ignoreLv = state.ignoreDef || 0
    for (const s of HYPER_STATS) {
      if (s.id === 'ignoreDef') continue
      state[s.id] = alloc[s.id] || 0
    }
    state.ignoreDef = ignoreLv
    persist()
  }

  return {
    state,
    HYPER_STATS,
    getLevel,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    setLevel,
    resetAll,
    autoAllocate,
    totalPoints,
    usedPoints,
    remainingPoints,
    statContributions,
  }
}
