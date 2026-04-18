// NFT 圖鑑 (Collection) 狀態 — 每項屬性 0..MAX_COLLECTION_LEVEL
//
// 共享 state + 加總 contribution 給 CP 計算機使用。

import { reactive, computed } from 'vue'
import {
  COLLECTION_STATS,
  MAX_COLLECTION_LEVEL,
  collectionValueAt,
} from '../constants/collection.js'

const STORAGE_KEY = 'msucp.collection.v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

// 每個屬性一個 level (未設 = 0)
const state = reactive({})
Object.assign(state, load())

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function clampLevel(v) {
  const n = Math.floor(Number(v) || 0)
  return Math.max(0, Math.min(MAX_COLLECTION_LEVEL, n))
}

export function useCollection() {
  function setLevel(key, level) {
    state[key] = clampLevel(level)
    persist()
  }
  function increment(key, delta = 1) {
    setLevel(key, (state[key] || 0) + delta)
  }
  function getLevel(key) { return state[key] || 0 }
  function resetAll() {
    for (const k of Object.keys(state)) delete state[k]
    persist()
  }

  // 給計算機用:每項加總
  const statContributions = computed(() => {
    const out = []
    for (const stat of COLLECTION_STATS) {
      const lv = state[stat.key] || 0
      if (!lv) continue
      const value = collectionValueAt(stat, lv)
      if (!value) continue
      out.push({ stat, level: lv, value })
    }
    return out
  })

  return {
    state,
    setLevel,
    increment,
    getLevel,
    resetAll,
    statContributions,
    COLLECTION_STATS,
    MAX_COLLECTION_LEVEL,
  }
}
