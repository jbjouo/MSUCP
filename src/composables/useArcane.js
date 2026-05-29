import { reactive, computed, watch } from 'vue'
import {
  ARCANE_SYMBOLS,
  ARCANE_MAX_LEVEL,
  arcForLevel,
  mainStatForLevel,
} from '../constants/arcaneSymbols.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('arcane.v1')

function defaultLevels() {
  const map = {}
  for (const s of ARCANE_SYMBOLS) map[s.id] = 0
  return map
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const levels = defaultLevels()
      for (const s of ARCANE_SYMBOLS) {
        const lv = Number(parsed?.levels?.[s.id] ?? 0)
        levels[s.id] = Math.max(0, Math.min(ARCANE_MAX_LEVEL, Math.floor(lv)))
      }
      return { levels }
    }
  } catch { /* fall through */ }
  return { levels: defaultLevels() }
}

const state = reactive(loadState())

watch(state, (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}, { deep: true })

export function useArcane() {
  const totalArc = computed(() => {
    let sum = 0
    for (const s of ARCANE_SYMBOLS) sum += arcForLevel(state.levels[s.id])
    return sum
  })
  const totalMainStat = computed(() => {
    let sum = 0
    for (const s of ARCANE_SYMBOLS) sum += mainStatForLevel(state.levels[s.id])
    return sum
  })
  // 每個符文的貢獻 (供 CP tooltip 分列顯示)
  const contributions = computed(() =>
    ARCANE_SYMBOLS.map((s) => ({
      id: s.id,
      nameKey: s.nameKey,
      level: state.levels[s.id] || 0,
      arc: arcForLevel(state.levels[s.id]),
      mainStat: mainStatForLevel(state.levels[s.id]),
    })),
  )
  function setLevel(id, lv) {
    if (!(id in state.levels)) return
    const n = Math.max(0, Math.min(ARCANE_MAX_LEVEL, Math.floor(Number(lv) || 0)))
    state.levels[id] = n
  }
  function bump(id, delta) {
    setLevel(id, (state.levels[id] || 0) + delta)
  }
  function maxOut(id) { setLevel(id, ARCANE_MAX_LEVEL) }
  function zero(id)   { setLevel(id, 0) }
  function reset() {
    for (const s of ARCANE_SYMBOLS) state.levels[s.id] = 0
  }
  return {
    state,
    totalArc,
    totalMainStat,
    contributions,
    setLevel,
    bump,
    maxOut,
    zero,
    reset,
    MAX_LEVEL: ARCANE_MAX_LEVEL,
  }
}
