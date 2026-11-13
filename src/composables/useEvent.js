// 活動 EVENT 子系統 — Alliance Boost Buff 單一階段 0~5
//
// statContributions 提供 { skill, level, stats } 給 useCpDamage / CpCalculatorPage 收斂
// (level = 目前階段)。舊版(5 技能各自等級)資料載入時一律歸 0。

import { reactive, computed } from 'vue'
import { EVENT_SKILLS, EVENT_MAX_STAGE, EVENT_STAGE_POINTS } from '../constants/event.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('event.v1')

function clampStage(v) {
  return Math.max(0, Math.min(EVENT_MAX_STAGE, Math.floor(Number(v) || 0)))
}

function load() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    return { stage: clampStage(parsed?.stage) }
  } catch { return { stage: 0 } }
}

const state = reactive(load())

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ stage: state.stage })) } catch { /* ignore */ }
}

export function useEvent() {
  function setStage(st) {
    state.stage = clampStage(st)
    persist()
  }
  function increment() { setStage(state.stage + 1) }
  function decrement() { setStage(state.stage - 1) }
  function resetAll() { setStage(0) }

  // 一個 entry / 一個效果;階段 0 時無輸出
  const statContributions = computed(() => {
    const st = state.stage
    if (!st) return []
    return EVENT_SKILLS.map((s) => ({ skill: s, level: st, stats: s.valueAt(st) || {} }))
  })

  return {
    state,
    EVENT_SKILLS,
    EVENT_MAX_STAGE,
    EVENT_STAGE_POINTS,
    setStage,
    increment,
    decrement,
    resetAll,
    statContributions,
  }
}
