// NFT 圖鑑 (Collection) 狀態 — 每項屬性 0..MAX_COLLECTION_LEVEL
// 外加:圖鑑套裝數 → 每套 +5 全屬性

import { reactive, computed } from 'vue'
import {
  COLLECTION_STATS,
  MAX_COLLECTION_LEVEL,
  COLLECTION_SET_BONUS,
  COLLECTION_SET_MAX,
  collectionValueAt,
  collectionSetBonus,
} from '../constants/collection.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('collection.v1')

// 狀態形式 (v2):{ levels: { statKey: lv }, setCount: n }
// 向後相容 v1:直接 { statKey: lv } 的平鋪結構
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { levels: {}, setCount: 0 }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return { levels: {}, setCount: 0 }
    if ('levels' in parsed || 'setCount' in parsed) {
      return {
        levels: { ...(parsed.levels || {}) },
        setCount: Math.max(0, Math.min(COLLECTION_SET_MAX, Math.floor(Number(parsed.setCount) || 0))),
      }
    }
    // v1 flat:全部當成 levels
    return { levels: { ...parsed }, setCount: 0 }
  } catch { return { levels: {}, setCount: 0 } }
}

const loaded = load()
// 單一模組級 state — 給 CollectionPanel 與 CP 計算機共享
const state = reactive({
  levels: { ...loaded.levels },
  setCount: loaded.setCount,
})

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({
    levels: state.levels,
    setCount: state.setCount,
  })) } catch { /* ignore */ }
}

function clampLevel(v) {
  const n = Math.floor(Number(v) || 0)
  return Math.max(0, Math.min(MAX_COLLECTION_LEVEL, n))
}
function clampSetCount(v) {
  const n = Math.floor(Number(v) || 0)
  return Math.max(0, Math.min(COLLECTION_SET_MAX, n))
}

export function useCollection() {
  function setLevel(key, level) {
    state.levels[key] = clampLevel(level)
    persist()
  }
  function increment(key, delta = 1) {
    setLevel(key, (state.levels[key] || 0) + delta)
  }
  function getLevel(key) { return state.levels[key] || 0 }

  function setSetCount(n) {
    state.setCount = clampSetCount(n)
    persist()
  }
  function bumpSetCount(delta) {
    setSetCount((state.setCount || 0) + delta)
  }

  function resetAll() {
    for (const k of Object.keys(state.levels)) delete state.levels[k]
    state.setCount = 0
    persist()
  }

  // 給計算機用 — 每項屬性的加總
  const statContributions = computed(() => {
    const out = []
    for (const stat of COLLECTION_STATS) {
      const lv = state.levels[stat.key] || 0
      if (!lv) continue
      const value = collectionValueAt(stat, lv)
      if (!value) continue
      out.push({ stat, level: lv, value })
    }
    return out
  })

  // 套裝效果 — 每套 +5 全屬性
  const setBonusTotal = computed(() => collectionSetBonus(state.setCount || 0))

  return {
    state,
    setLevel,
    increment,
    getLevel,
    setSetCount,
    bumpSetCount,
    resetAll,
    statContributions,
    setBonusTotal,
    COLLECTION_STATS,
    MAX_COLLECTION_LEVEL,
    COLLECTION_SET_BONUS,
    COLLECTION_SET_MAX,
  }
}
