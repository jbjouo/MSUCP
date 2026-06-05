import { reactive, watch } from 'vue'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('blessingSkills.v1')

const BLESSING_SKILLS = [
  { id: 'blessing_of_the_fairy', maxLevel: 20 },
  { id: 'empress_blessing', maxLevel: 30 },
]

function defaultState() {
  return { blessing_of_the_fairy: 0, empress_blessing: 0 }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    const parsed = JSON.parse(raw)
    const out = defaultState()
    for (const s of BLESSING_SKILLS) {
      out[s.id] = Math.max(0, Math.min(s.maxLevel, Math.floor(Number(parsed?.[s.id]) || 0)))
    }
    return out
  } catch { return defaultState() }
}

const state = reactive(loadState())

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

watch(state, persist, { deep: true })

function setLevel(id, val) {
  const skill = BLESSING_SKILLS.find((s) => s.id === id)
  if (!skill) return
  state[id] = Math.max(0, Math.min(skill.maxLevel, Math.floor(Number(val) || 0)))
}

function blessingAtk(id) {
  return state[id] || 0
}

export function useBlessingSkills() {
  return {
    state,
    setLevel,
    blessingAtk,
    BLESSING_SKILLS,
  }
}
