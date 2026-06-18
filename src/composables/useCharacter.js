import { reactive, computed } from 'vue'
import {
  JOB_BRANCHES,
  JOBS_BY_BRANCH,
  findJob,
  LEVEL_MIN,
  LEVEL_MAX,
} from '../constants/jobs.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('character.v1')

function defaultState() {
  return {
    name: '',
    level: 1,
    branch: 'beginner',
    job: 'beginner',
    world: '',
    legionLevel: 0,
    notes: '',
  }
}

function clampLevel(n) {
  const v = Math.floor(Number(n) || 0)
  return Math.min(Math.max(LEVEL_MIN, v), LEVEL_MAX)
}

function sanitize(raw) {
  const base = defaultState()
  const out = { ...base, ...(raw || {}) }
  out.level = clampLevel(out.level)
  out.legionLevel = Math.max(0, Math.floor(Number(out.legionLevel) || 0))
  // 確認 branch + job 存在 (資料不相容時退回 beginner)
  const branchKeys = JOB_BRANCHES.map((b) => b.key)
  if (!branchKeys.includes(out.branch)) {
    out.branch = 'beginner'
    out.job = 'beginner'
  } else if (!findJob(out.branch, out.job)) {
    out.job = JOBS_BY_BRANCH[out.branch][0]?.key || 'beginner'
  }
  // 字串欄位強制字串
  out.name = String(out.name || '')
  out.world = String(out.world || '')
  out.notes = String(out.notes || '')
  return out
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return sanitize(JSON.parse(raw))
  } catch {
    return defaultState()
  }
}

const state = reactive(load())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
}

function setField(key, value) {
  if (!(key in state)) return
  if (key === 'level') {
    state.level = clampLevel(value)
  } else if (key === 'legionLevel') {
    state.legionLevel = Math.max(0, Math.floor(Number(value) || 0))
  } else if (key === 'branch') {
    state.branch = value
    // 切換大類 → 自動套第一個子職業
    const firstJob = JOBS_BY_BRANCH[value]?.[0]?.key
    state.job = firstJob || ''
  } else {
    state[key] = value
  }
  persist()
}

function reset() {
  Object.assign(state, defaultState())
  persist()
}

const currentJob = computed(() => findJob(state.branch, state.job))
const primaryStat = computed(() => currentJob.value?.primary || 'str')
const combatClass = computed(() => currentJob.value?.combatClass || 'warrior')

export function useCharacter() {
  return {
    state,
    setField,
    reset,
    currentJob,
    primaryStat,
    combatClass,
    LEVEL_MIN,
    LEVEL_MAX,
    JOB_BRANCHES,
    JOBS_BY_BRANCH,
  }
}
