// 聯盟拼圖屬性 狀態 — 每項獨立 level 0..maxLevel

import { reactive, computed } from 'vue'
import { PUZZLE_ENTRIES, PUZZLE_ENTRIES_BY_ID } from '../constants/puzzle.js'

const STORAGE_KEY = 'msucp.puzzle.v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

// 預先以所有 entry id 為 key 建立 state,確保 reactive 能立即追蹤新值
const initial = Object.fromEntries(PUZZLE_ENTRIES.map((e) => [e.id, 0]))
const saved = load()
for (const e of PUZZLE_ENTRIES) {
  const v = Number(saved[e.id])
  if (Number.isFinite(v) && v > 0) {
    initial[e.id] = Math.max(0, Math.min(e.maxLevel, Math.floor(v)))
  }
}
const state = reactive(initial)

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function clamp(entry, v) {
  const n = Math.floor(Number(v) || 0)
  return Math.max(0, Math.min(entry?.maxLevel || 0, n))
}

export function usePuzzle() {
  function setLevel(id, level) {
    const entry = PUZZLE_ENTRIES_BY_ID[id]
    state[id] = clamp(entry, level)
    persist()
  }
  function getLevel(id) { return state[id] || 0 }
  function increment(id, delta = 1) { setLevel(id, (state[id] || 0) + delta) }
  function resetAll() {
    for (const k of Object.keys(state)) delete state[k]
    persist()
  }

  // 計算機用 — 每項一筆 contribution
  //   { entry, level, stats: { key: totalValue } }
  const statContributions = computed(() => {
    const out = []
    for (const entry of PUZZLE_ENTRIES) {
      const lv = state[entry.id] || 0
      if (!lv) continue
      const bag = {}
      for (const [k, v] of Object.entries(entry.stats)) {
        bag[k] = Math.round(v * lv * 100) / 100
      }
      out.push({ entry, level: lv, stats: bag })
    }
    return out
  })

  return {
    state,
    setLevel,
    getLevel,
    increment,
    resetAll,
    statContributions,
    PUZZLE_ENTRIES,
  }
}
