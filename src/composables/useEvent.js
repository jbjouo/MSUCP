// 活動 EVENT 子系統 — Alliance Boost Buff 10 個效果各自 Stage 0~5,共用 280 Boost Points
//
// 升到 Stage n 累計花費 EVENT_STAGE_COST[n];點數不足時不可升級。
// statContributions 提供 { skill, level, stats } 給 useCpDamage 收斂(排除 arc);
// arcBonus 供 useEnemySettings 併入玩家 ARC。

import { reactive, computed } from 'vue'
import {
  EVENT_SKILLS, EVENT_SKILLS_BY_ID, EVENT_TOTAL_POINTS, EVENT_STAGE_COST, EVENT_NON_BREAKDOWN_KEYS,
} from '../constants/event.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('event.v1')

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

const costOf = (lv) => EVENT_STAGE_COST[lv] || 0

// sanitize:依 EVENT_SKILLS 順序收下等級,超出總點數時往下調到放得下為止(舊版無點數限制)
const initial = Object.fromEntries(EVENT_SKILLS.map((s) => [s.id, 0]))
const saved = load()
let budget = EVENT_TOTAL_POINTS
for (const s of EVENT_SKILLS) {
  const v = Number(saved[s.id])
  if (!Number.isFinite(v) || v <= 0) continue
  let lv = Math.max(0, Math.min(s.maxLevel, Math.floor(v)))
  while (lv > 0 && costOf(lv) > budget) lv -= 1
  initial[s.id] = lv
  budget -= costOf(lv)
}
const state = reactive(initial)

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

const usedPoints = computed(() =>
  EVENT_SKILLS.reduce((sum, s) => sum + costOf(state[s.id] || 0), 0),
)
const remainingPoints = computed(() => EVENT_TOTAL_POINTS - usedPoints.value)

export function useEvent() {
  function getLevel(id) { return state[id] || 0 }

  // 升到下一 stage 需追加的點數
  function nextCost(id) {
    const lv = state[id] || 0
    const s = EVENT_SKILLS_BY_ID[id]
    if (!s || lv >= s.maxLevel) return null
    return costOf(lv + 1) - costOf(lv)
  }
  function canIncrement(id) {
    const c = nextCost(id)
    return c != null && c <= remainingPoints.value
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
    const s = EVENT_SKILLS_BY_ID[id]
    if (!s) return
    let lv = Math.max(0, Math.min(s.maxLevel, Math.floor(Number(level) || 0)))
    const others = usedPoints.value - costOf(state[id] || 0)
    while (lv > 0 && others + costOf(lv) > EVENT_TOTAL_POINTS) lv -= 1
    state[id] = lv
    persist()
  }
  function resetAll() {
    for (const s of EVENT_SKILLS) state[s.id] = 0
    persist()
  }

  // 一個 entry / 一個技能;空等級的技能、或只含非 breakdown key 的技能不出現在輸出
  const statContributions = computed(() => {
    const out = []
    for (const s of EVENT_SKILLS) {
      const lv = state[s.id] || 0
      if (!lv) continue
      const bag = {}
      for (const [k, v] of Object.entries(s.valueAt(lv) || {})) {
        if (!EVENT_NON_BREAKDOWN_KEYS.has(k)) bag[k] = v
      }
      if (!Object.keys(bag).length) continue
      out.push({ skill: s, level: lv, stats: bag })
    }
    return out
  })

  const arcBonus = computed(() => {
    const lv = state.arc || 0
    return lv ? EVENT_SKILLS_BY_ID.arc.valueAt(lv).arc : 0
  })

  return {
    state,
    EVENT_SKILLS,
    EVENT_TOTAL_POINTS,
    usedPoints,
    remainingPoints,
    getLevel,
    nextCost,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    setLevel,
    resetAll,
    statContributions,
    arcBonus,
  }
}
