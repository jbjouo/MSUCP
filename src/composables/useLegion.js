// 聯盟戰地成員狀態 — 每位成員的 tier (0-5)

import { reactive, computed } from 'vue'
import {
  LEGION_BRANCHES,
  LEGION_MEMBERS,
  LEGION_MEMBER_BY_ID,
  LEGION_TIER_COUNT,
  LEGION_TIER_LABELS,
} from '../constants/legion.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('legion.v1')

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch { return {} }
}

const state = reactive({})
Object.assign(state, load())

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch {}
}

function clampTier(v) {
  const n = Math.floor(Number(v) || 0)
  return Math.max(0, Math.min(LEGION_TIER_COUNT, n))
}

export function useLegion() {
  function setTier(id, tier) { state[id] = clampTier(tier); persist() }
  function getTier(id) { return state[id] || 0 }
  function resetAll() {
    for (const k of Object.keys(state)) delete state[k]
    persist()
  }

  // 給計算機用 — 列出每位已放置成員的貢獻
  //   { member, tier, stats, fixed, specialEffect }
  const statContributions = computed(() => {
    const out = []
    for (const m of LEGION_MEMBERS) {
      const tier = state[m.id] || 0
      if (!tier) continue
      const effect = m.effects[tier - 1]
      if (!effect) continue
      out.push({
        member: m,
        tier,
        stats: effect.stats || {},
        fixed: !!effect.fixed,
        specialEffect: !!m.specialEffect,
      })
    }
    return out
  })

  return {
    state,
    setTier,
    getTier,
    resetAll,
    statContributions,
    LEGION_BRANCHES,
    LEGION_MEMBERS,
    LEGION_MEMBER_BY_ID,
    LEGION_TIER_COUNT,
    LEGION_TIER_LABELS,
  }
}
