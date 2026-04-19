import { reactive, computed, watch } from 'vue'
import {
  INNER_POTENTIAL_LINES,
  getInnerPotentialOption,
  optionFields,
} from '../constants/innerPotential.js'

const STORAGE_KEY = 'msucp.innerPotential.v1'

function defaultLines() {
  return Array.from({ length: INNER_POTENTIAL_LINES }, () => ({ id: null, values: [] }))
}

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)) }

function sanitizeLine(raw) {
  const id = typeof raw?.id === 'string' && getInnerPotentialOption(raw.id) ? raw.id : null
  const opt = getInnerPotentialOption(id)
  const fields = optionFields(opt)
  if (!fields.length) return { id, values: [] }
  const rawVals = Array.isArray(raw?.values) ? raw.values : []
  const values = fields.map((fld, i) => {
    const n = Math.floor(Number(rawVals[i]) || 0)
    const max = Number.isFinite(fld.max) ? fld.max : 9999
    return clamp(n, 0, max)
  })
  return { id, values }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const lines = Array.from({ length: INNER_POTENTIAL_LINES }, (_, i) =>
        sanitizeLine(parsed?.lines?.[i]),
      )
      return { lines }
    }
  } catch { /* fall through */ }
  return { lines: defaultLines() }
}

const state = reactive(loadState())

watch(state, (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}, { deep: true })

export function useInnerPotential() {
  function setOption(index, id) {
    if (index < 0 || index >= INNER_POTENTIAL_LINES) return
    const opt = getInnerPotentialOption(id)
    const fields = optionFields(opt)
    state.lines[index] = { id: opt ? id : null, values: fields.map(() => 0) }
  }
  function setValue(index, fieldIdx, value) {
    if (index < 0 || index >= INNER_POTENTIAL_LINES) return
    const line = state.lines[index]
    const opt = getInnerPotentialOption(line?.id)
    const fields = optionFields(opt)
    if (!fields[fieldIdx]) return
    const max = Number.isFinite(fields[fieldIdx].max) ? fields[fieldIdx].max : 9999
    const n = clamp(Math.floor(Number(value) || 0), 0, max)
    if (!Array.isArray(line.values)) line.values = fields.map(() => 0)
    line.values[fieldIdx] = n
  }
  function clearLine(index) {
    if (index < 0 || index >= INNER_POTENTIAL_LINES) return
    state.lines[index] = { id: null, values: [] }
  }
  function reset() {
    state.lines = defaultLines()
  }

  // CP 計算機用 — 每一排展開為 { id, label, fixed, stats: { key: value } }
  // specialEffect 不貢獻
  const statContributions = computed(() => {
    const out = []
    state.lines.forEach((line, idx) => {
      if (!line?.id) return
      const opt = getInnerPotentialOption(line.id)
      if (!opt || opt.specialEffect) return
      const fields = optionFields(opt)
      const stats = {}
      fields.forEach((fld, i) => {
        const v = Number(line.values?.[i]) || 0
        if (!v) return
        // 同 stat key 多次 (例如 STR · DEX 不會撞到,但保險起見累加)
        stats[fld.statKey] = (stats[fld.statKey] || 0) + v
      })
      if (!Object.keys(stats).length) return
      out.push({
        id: opt.id,
        nameKey: opt.nameKey,
        line: idx + 1,
        fixed: !!opt.fixed,
        stats,
      })
    })
    return out
  })

  return {
    state,
    setOption,
    setValue,
    clearLine,
    reset,
    statContributions,
    LINES: INNER_POTENTIAL_LINES,
  }
}
