import { reactive, computed, watch } from 'vue'
import { VMATRIX_SKILLS, VMATRIX_MAX_LEVEL, passiveValueAt, skillAvailableForJob } from '../constants/vmatrix.js'
import { useCharacter } from './useCharacter.js'

const STORAGE_KEY = 'msucp.vmatrix.v1'

function defaultLevels() {
  const map = {}
  for (const s of VMATRIX_SKILLS) map[s.id] = 0
  return map
}

function clamp(n) {
  return Math.max(0, Math.min(VMATRIX_MAX_LEVEL, Math.floor(Number(n) || 0)))
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const levels = defaultLevels()
      for (const s of VMATRIX_SKILLS) {
        levels[s.id] = clamp(parsed?.levels?.[s.id])
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

export function useVMatrix() {
  const { state: charState, currentJob } = useCharacter()

  function setLevel(id, lv) {
    if (!(id in state.levels)) return
    state.levels[id] = clamp(lv)
  }
  function reset() {
    for (const s of VMATRIX_SKILLS) state.levels[s.id] = 0
  }

  // 依目前職業可見的技能 (含通用 + 該職業專屬)
  const visibleSkills = computed(() => {
    const jobKey = charState.job
    const branchKey = currentJob.value?.branch || charState.branch
    return VMATRIX_SKILLS.filter((s) => skillAvailableForJob(s, jobKey, branchKey))
  })

  // CP 計算機用 — 僅 passive 技能會貢獻 + 必須通過職業限制
  const statContributions = computed(() => {
    const jobKey = charState.job
    const branchKey = currentJob.value?.branch || charState.branch
    const out = []
    for (const s of VMATRIX_SKILLS) {
      if (!s.passive) continue
      if (!skillAvailableForJob(s, jobKey, branchKey)) continue
      const lv = state.levels[s.id] || 0
      if (lv <= 0) continue
      const v = passiveValueAt(s, lv)
      if (v <= 0) continue
      let stats = null
      if (s.passive.type === 'allStat') stats = { allStat: v }
      else if (s.passive.type === 'attMatk') stats = { atk: v, matk: v }
      else if (s.passive.type === 'stat' && s.passive.statKey) stats = { [s.passive.statKey]: v }
      if (!stats) continue
      out.push({
        id: s.id,
        nameKey: s.nameKey,
        level: lv,
        fixed: !!s.passive.fixed,
        stats,
      })
    }
    return out
  })

  return {
    state,
    setLevel,
    reset,
    visibleSkills,
    statContributions,
    MAX_LEVEL: VMATRIX_MAX_LEVEL,
  }
}
