import { reactive, computed } from 'vue'
import { charKey } from './useActiveCharacter.js'
import { COSMETIC_ATTRS, COSMETIC_ATTRS_BY_SLOT } from '../constants/cosmetic.js'

// 時裝期限屬性 — 已抽選完成的數值,依部位存
//   state.attrs: { [slot]: number | null }
// statContributions 給 useCpDamage 收斂。

const STORAGE_KEY = charKey('cosmetic.v1')

function emptyAttrs() {
  return Object.fromEntries(COSMETIC_ATTRS.map((a) => [a.slot, null]))
}

// 只接受該部位 tiers 內的值,其餘一律 null
function sanitizeAttr(slot, raw) {
  const def = COSMETIC_ATTRS_BY_SLOT[slot]
  const v = Number(raw)
  return def && def.tiers.includes(v) ? v : null
}

function loadState() {
  const attrs = emptyAttrs()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    for (const slot of Object.keys(attrs)) {
      attrs[slot] = sanitizeAttr(slot, parsed?.attrs?.[slot])
    }
  } catch {
    /* ignore — 回傳空設定 */
  }
  return { attrs }
}

const state = reactive(loadState())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ attrs: state.attrs }))
  } catch {
    /* ignore quota / access errors */
  }
}

function setAttr(slot, value) {
  if (!(slot in state.attrs)) return
  state.attrs[slot] = sanitizeAttr(slot, value)
  persist()
}

// → [{ slot, labelKey, value, stats: { [statKey]: value } }]
const statContributions = computed(() => {
  const out = []
  for (const def of COSMETIC_ATTRS) {
    const value = state.attrs[def.slot]
    if (!value) continue
    out.push({
      slot: def.slot,
      labelKey: def.labelKey,
      value,
      stats: Object.fromEntries(def.stats.map((k) => [k, value])),
    })
  }
  return out
})

export function useCosmetic() {
  return { state, setAttr, statContributions }
}
