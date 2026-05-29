// 活動 EVENT 子系統 — 5 個技能各 0-5 等
//
// 與 useHyperStat 同形,但無點數限制 — 每個技能各自升降。
// statContributions 提供 { skill, level, stats } 給 useCpDamage 收斂。

import { reactive, computed } from 'vue'
import { EVENT_SKILLS, EVENT_SKILLS_BY_ID } from '../constants/event.js'
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

const initial = Object.fromEntries(EVENT_SKILLS.map((s) => [s.id, 0]))
const saved = load()
for (const s of EVENT_SKILLS) {
  const v = Number(saved[s.id])
  if (Number.isFinite(v) && v > 0) {
    initial[s.id] = Math.max(0, Math.min(s.maxLevel, Math.floor(v)))
  }
}
const state = reactive(initial)

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

export function useEvent() {
  function getLevel(id) { return state[id] || 0 }

  function canIncrement(id) {
    const s = EVENT_SKILLS_BY_ID[id]
    if (!s) return false
    return (state[id] || 0) < s.maxLevel
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
    state[id] = Math.max(0, Math.min(s.maxLevel, Math.floor(Number(level) || 0)))
    persist()
  }
  function resetAll() {
    for (const s of EVENT_SKILLS) state[s.id] = 0
    persist()
  }

  // 一個 entry / 一個技能;空等級的技能不出現在輸出
  const statContributions = computed(() => {
    const out = []
    for (const s of EVENT_SKILLS) {
      const lv = state[s.id] || 0
      if (!lv) continue
      const bag = s.valueAt(lv) || {}
      if (!Object.keys(bag).length) continue
      out.push({ skill: s, level: lv, stats: bag })
    }
    return out
  })

  return {
    state,
    EVENT_SKILLS,
    getLevel,
    canIncrement,
    canDecrement,
    increment,
    decrement,
    setLevel,
    resetAll,
    statContributions,
  }
}
