import { reactive, computed, watch } from 'vue'
import {
  DEFAULT_ENEMY_SETTINGS,
  ENEMY_TYPES,
  ELEMENTAL_DMG_OPTIONS,
  arcRatioLookup,
} from '../constants/enemySettings.js'
import { useArcane } from './useArcane.js'

const STORAGE_KEY = 'msucp.enemy.v1'

function sanitize(raw) {
  const d = { ...DEFAULT_ENEMY_SETTINGS }
  if (!raw || typeof raw !== 'object') return d
  if (ENEMY_TYPES.includes(raw.type)) d.type = raw.type
  if (ELEMENTAL_DMG_OPTIONS.includes(raw.elementalDmg)) d.elementalDmg = raw.elementalDmg
  const lv = Number(raw.level)
  if (Number.isFinite(lv)) d.level = Math.max(1, Math.min(300, Math.floor(lv)))
  const def = Number(raw.defense)
  if (Number.isFinite(def)) d.defense = Math.max(0, Math.min(100000, Math.floor(def)))
  const arc = Number(raw.bossArc)
  if (Number.isFinite(arc)) d.bossArc = Math.max(0, Math.min(100000, Math.floor(arc)))
  return d
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return sanitize(JSON.parse(raw))
  } catch { /* ignore */ }
  return { ...DEFAULT_ENEMY_SETTINGS }
}

const state = reactive(loadState())

watch(state, (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}, { deep: true })

export function useEnemySettings() {
  const { totalArc } = useArcane()

  const arcInfo = computed(() => {
    const info = arcRatioLookup(totalArc.value, state.bossArc)
    return {
      playerArc: totalArc.value,
      bossArc: state.bossArc,
      ...info,
    }
  })

  function setType(v)         { if (ENEMY_TYPES.includes(v)) state.type = v }
  function setLevel(v)        { state.level = Math.max(1, Math.min(300, Math.floor(Number(v) || 0))) }
  function setDefense(v)      { state.defense = Math.max(0, Math.min(100000, Math.floor(Number(v) || 0))) }
  function setElementalDmg(v) { if (ELEMENTAL_DMG_OPTIONS.includes(v)) state.elementalDmg = v }
  function setBossArc(v)      { state.bossArc = Math.max(0, Math.min(100000, Math.floor(Number(v) || 0))) }

  return {
    state,
    arcInfo,
    setType,
    setLevel,
    setDefense,
    setElementalDmg,
    setBossArc,
  }
}
