import { reactive, computed } from 'vue'
import itemsData from '../data/items.json'
import {
  EQUIP_SLOTS,
  EQUIP_SLOTS_BY_KEY,
  EQUIP_ACCEPT_TYPES,
  slotsAcceptingType,
} from '../constants/equipmentSlots.js'
import { computeStarStats, STAR_SETTABLE_CAP, maxStarsForLevel } from '../constants/starForce.js'
import {
  POTENTIAL_TIERS,
  findPotentialOptionForLine,
  itemHasPotentialPool,
} from '../constants/potentials.js'
import {
  findBonusPotentialOptionForLine,
  itemHasBonusPotentialPool,
} from '../constants/bonusPotentials.js'

// 資料模型 v3:「entry」為使用者實例 (含 itemId + 強化狀態),與型錄 (items.json) 分離
//   state.entries:  { [uid]: { itemId, stars, bonusStats? } }
//   state.inventory: [uid, ...]                   在背包中的實例順序
//   state.equipped:  { [slotKey]: uid | null }    已裝備的實例

// Bonus Stats 支援欄位 (對應 tooltip / 計算機使用的 stats key)
export const BONUS_STATS_KEYS = [
  'str', 'dex', 'int', 'luk',
  'atk', 'matk',
  'bossDmg', 'dmgPct', 'allStatPct',
]

// 完全不可能有 Bonus Stats 的裝備類型
const NO_BONUS_TYPES = new Set(['ring', 'shoulder', 'secondary', 'emblem', 'badge'])
// 只有武器才有 Boss Damage / Damage
const WEAPON_ONLY_KEYS = new Set(['bossDmg', 'dmgPct'])

export function allowedBonusStatKeys(item) {
  if (!item || NO_BONUS_TYPES.has(item.type)) return []
  if (item.type === 'weapon') return [...BONUS_STATS_KEYS]
  return BONUS_STATS_KEYS.filter((k) => !WEAPON_ONLY_KEYS.has(k))
}

export function supportsBonusStats(item) {
  return allowedBonusStatKeys(item).length > 0
}
import { charKey } from './useActiveCharacter.js'
const STORAGE_KEY = charKey('equipment.v3')
const LEGACY_KEYS = ['msucp.equipment.v1', 'msucp.equipment.v2']

export const ITEMS_BY_ID = Object.fromEntries(
  itemsData.items.map((it) => [it.id, it]),
)
export const CATALOG = itemsData.items.filter((it) => EQUIP_ACCEPT_TYPES.has(it.type))

function newUid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `u_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`
}

function emptyEquipped() {
  return Object.fromEntries(EQUIP_SLOTS.map((s) => [s.key, null]))
}

function makeInitialState() {
  return { equipped: emptyEquipped(), inventory: [], entries: {} }
}

function clampStars(stars, item) {
  const s = Number(stars) || 0
  // 依等級的架構上限 (100→8、110→10、120→15、130→20、140+→25)
  const levelCap = maxStarsForLevel(item?.level || 0)
  // item.maxStars 若設定,取較嚴格者 (可手動降低);未設則用 levelCap
  const itemCap = Number.isFinite(item?.maxStars) ? item.maxStars : levelCap
  // 硬上限:UI 封頂 STAR_SETTABLE_CAP (23);24/25 不允許設
  const cap = Math.max(0, Math.min(itemCap, levelCap, STAR_SETTABLE_CAP))
  return Math.min(Math.max(0, Math.floor(s)), cap)
}

function sanitizePotential(raw, item = null) {
  return sanitizeTieredLines(raw, item, findPotentialOptionForLine)
}

function sanitizeBonusPotential(raw, item = null) {
  return sanitizeTieredLines(raw, item, findBonusPotentialOptionForLine)
}

function sanitizeTieredLines(raw, item, findFn) {
  if (!raw || typeof raw !== 'object') return null
  const tier = POTENTIAL_TIERS.includes(raw.tier) ? raw.tier : null
  if (!tier) return null
  const rawLines = Array.isArray(raw.lines) ? raw.lines : []
  const lines = [0, 1, 2].map((i) => {
    const l = rawLines[i]
    if (!l || typeof l !== 'string') return null
    if (item && !findFn(item, tier, i, l)) return null
    return l
  })
  return { tier, lines }
}

function sanitizeBonusStats(raw, item = null) {
  if (!raw || typeof raw !== 'object') return null
  const allowed = item ? new Set(allowedBonusStatKeys(item)) : null
  const out = {}
  let hasAny = false
  for (const k of BONUS_STATS_KEYS) {
    if (allowed && !allowed.has(k)) continue
    const v = Math.max(0, Math.floor(Number(raw[k]) || 0))
    if (v > 0) {
      out[k] = v
      hasAny = true
    }
  }
  return hasAny ? out : null
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      for (const k of LEGACY_KEYS) {
        if (localStorage.getItem(k)) localStorage.removeItem(k)
      }
      return makeInitialState()
    }
    const parsed = JSON.parse(raw)
    const base = makeInitialState()
    const equipped = { ...base.equipped }
    const entries = {}
    // 過濾 entries:itemId 必須存在於型錄
    for (const [uid, e] of Object.entries(parsed.entries || {})) {
      if (!e || typeof e !== 'object') continue
      const item = ITEMS_BY_ID[e.itemId]
      if (!item) continue
      const bs = sanitizeBonusStats(e.bonusStats, item)
      const pt = sanitizePotential(e.potential, item)
      const bp = sanitizeBonusPotential(e.bonusPotential, item)
      entries[uid] = {
        itemId: e.itemId,
        stars: clampStars(e.stars, item),
        ...(bs ? { bonusStats: bs } : {}),
        ...(pt ? { potential: pt } : {}),
        ...(bp ? { bonusPotential: bp } : {}),
      }
    }
    // inventory 與 equipped 都要參照到存在的 entry
    const inventory = Array.isArray(parsed.inventory)
      ? parsed.inventory.filter((uid) => entries[uid])
      : []
    for (const [key, uid] of Object.entries(parsed.equipped || {})) {
      if (!uid || !entries[uid]) continue
      if (key in equipped) {
        equipped[key] = uid
      } else {
        inventory.push(uid)
      }
    }
    return { equipped, inventory, entries }
  } catch {
    return makeInitialState()
  }
}

const state = reactive(loadState())

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      equipped: state.equipped,
      inventory: state.inventory,
      entries: state.entries,
    }))
  } catch {
    /* ignore quota / access errors */
  }
}

let persistRequested = false
export async function requestPersistentStorage() {
  if (persistRequested) return
  persistRequested = true
  try {
    if (navigator?.storage?.persist) {
      const already = await navigator.storage.persisted?.()
      if (!already) await navigator.storage.persist()
    }
  } catch {
    /* ignore */
  }
}

function getItem(id) {
  return id ? ITEMS_BY_ID[id] || null : null
}

function resolveEntry(uid) {
  if (!uid) return null
  const e = state.entries[uid]
  if (!e) return null
  const item = ITEMS_BY_ID[e.itemId]
  if (!item) return null
  return {
    uid,
    stars: e.stars,
    item,
    starStats: computeStarStats(item, e.stars),
    bonusStats: e.bonusStats || null,
    potential: e.potential || null,
    bonusPotential: e.bonusPotential || null,
  }
}

function resolveTargetSlot(item, preferredSlotKey = null) {
  const slots = slotsAcceptingType(item.type)
  if (slots.length === 0) return null
  if (preferredSlotKey) {
    const preferred = slots.find((s) => s.key === preferredSlotKey)
    if (preferred) return preferred
  }
  const empty = slots.find((s) => !state.equipped[s.key])
  return empty || slots[0]
}

function equipEntry(uid, targetSlotKey = null) {
  const entry = resolveEntry(uid)
  if (!entry) return false
  const slot = resolveTargetSlot(entry.item, targetSlotKey)
  if (!slot) return false
  // 目標槽有裝備 → 退回背包
  const previousUid = state.equipped[slot.key]
  if (previousUid && previousUid !== uid) state.inventory.push(previousUid)
  // 若 entry 原本在背包,把它拿走
  const idx = state.inventory.indexOf(uid)
  if (idx !== -1) state.inventory.splice(idx, 1)
  // 若 entry 原本在其他槽 (極少見),清空該槽
  for (const [key, u] of Object.entries(state.equipped)) {
    if (u === uid && key !== slot.key) state.equipped[key] = null
  }
  state.equipped[slot.key] = uid
  persist()
  return true
}

function unequipSlot(slotKey) {
  const uid = state.equipped[slotKey]
  if (!uid) return false
  state.equipped[slotKey] = null
  state.inventory.push(uid)
  persist()
  return true
}

function addToInventory(itemId, stars = 0) {
  const item = getItem(itemId)
  if (!item) return null
  const uid = newUid()
  state.entries[uid] = {
    itemId,
    stars: clampStars(stars, item),
  }
  state.inventory.push(uid)
  persist()
  return uid
}

function removeEntry(uid) {
  if (!state.entries[uid]) return false
  // 從任何位置移除
  const idx = state.inventory.indexOf(uid)
  if (idx !== -1) state.inventory.splice(idx, 1)
  for (const [key, u] of Object.entries(state.equipped)) {
    if (u === uid) state.equipped[key] = null
  }
  delete state.entries[uid]
  persist()
  return true
}

function setStars(uid, stars) {
  const entry = resolveEntry(uid)
  if (!entry) return false
  const next = clampStars(stars, entry.item)
  if (state.entries[uid].stars === next) return false
  state.entries[uid].stars = next
  persist()
  return true
}

function setBonusStats(uid, stats) {
  const e = state.entries[uid]
  if (!e) return false
  const item = ITEMS_BY_ID[e.itemId]
  if (!item || !supportsBonusStats(item)) {
    delete e.bonusStats
    persist()
    return true
  }
  const clean = sanitizeBonusStats(stats, item)
  if (clean) e.bonusStats = clean
  else delete e.bonusStats
  persist()
  return true
}

function setPotential(uid, data) {
  const e = state.entries[uid]
  if (!e) return false
  const item = ITEMS_BY_ID[e.itemId]
  if (!item || !itemHasPotentialPool(item)) {
    delete e.potential
    persist()
    return true
  }
  const clean = sanitizePotential(data, item)
  if (clean) e.potential = clean
  else delete e.potential
  persist()
  return true
}

function setBonusPotential(uid, data) {
  const e = state.entries[uid]
  if (!e) return false
  const item = ITEMS_BY_ID[e.itemId]
  if (!item || !itemHasBonusPotentialPool(item)) {
    delete e.bonusPotential
    persist()
    return true
  }
  const clean = sanitizeBonusPotential(data, item)
  if (clean) e.bonusPotential = clean
  else delete e.bonusPotential
  persist()
  return true
}

function resetAll() {
  const fresh = makeInitialState()
  Object.assign(state.equipped, fresh.equipped)
  state.inventory.splice(0, state.inventory.length)
  for (const k of Object.keys(state.entries)) delete state.entries[k]
  persist()
}

function importEntries(rawEntries, rawInventory) {
  let count = 0
  for (const oldUid of rawInventory) {
    const raw = rawEntries[oldUid]
    if (!raw) continue
    const item = getItem(raw.itemId)
    if (!item) continue

    const uid = newUid()
    const entry = {
      itemId: raw.itemId,
      stars: clampStars(raw.stars || 0, item),
    }

    if (raw.bonusStats) {
      const bs = sanitizeBonusStats(raw.bonusStats, item)
      if (bs) entry.bonusStats = bs
    }

    if (raw.potential) {
      const lines = (raw.potential.lines || []).map(l =>
        typeof l === 'string' ? l : l?.label || null
      )
      const tier = POTENTIAL_TIERS.includes(raw.potential.tier) ? raw.potential.tier : null
      if (tier) entry.potential = { tier, lines }
    }

    if (raw.bonusPotential) {
      const lines = (raw.bonusPotential.lines || []).map(l =>
        typeof l === 'string' ? l : l?.label || null
      )
      const tier = POTENTIAL_TIERS.includes(raw.bonusPotential.tier) ? raw.bonusPotential.tier : null
      if (tier) entry.bonusPotential = { tier, lines }
    }

    state.entries[uid] = entry
    state.inventory.push(uid)
    count++
  }
  if (count > 0) persist()
  return count
}

// 合計屬性 (基礎 + 星力加成 + Bonus Stats — 給計算機使用)
// % 類 (bossDmg/dmgPct/allStatPct) 也累加,供 CP 計算用
const totalStats = computed(() => {
  const sum = {
    str: 0, dex: 0, int: 0, luk: 0, hp: 0, mp: 0,
    atk: 0, matk: 0, def: 0,
    bossDmg: 0, dmgPct: 0, allStatPct: 0,
  }
  for (const slotKey of Object.keys(state.equipped)) {
    const entry = resolveEntry(state.equipped[slotKey])
    if (!entry) continue
    const base = entry.item.stats || {}
    const star = entry.starStats || {}
    const bonus = entry.bonusStats || {}
    for (const k of Object.keys(sum)) {
      sum[k] += (base[k] || 0) + (star[k] || 0) + (bonus[k] || 0)
    }
  }
  return sum
})

// 背包條目 — 隱藏尚無對應槽位的類型
const inventoryEntries = computed(() =>
  state.inventory
    .map((uid) => resolveEntry(uid))
    .filter((e) => e && EQUIP_ACCEPT_TYPES.has(e.item.type)),
)

export function useEquipment() {
  return {
    state,
    EQUIP_SLOTS,
    EQUIP_SLOTS_BY_KEY,
    CATALOG,
    getItem,
    resolveEntry,
    resolveTargetSlot,
    equipEntry,
    unequipSlot,
    addToInventory,
    removeEntry,
    setStars,
    setBonusStats,
    setPotential,
    setBonusPotential,
    resetAll,
    importEntries,
    totalStats,
    inventoryEntries,
  }
}
