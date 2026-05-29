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
    totalPoints,
    usedPoints,
    remainingPoints,
    statContributions,
  }
}
