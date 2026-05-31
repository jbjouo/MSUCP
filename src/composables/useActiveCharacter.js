// 多角色系統 — 管理角色名單 / 當前角色 / 切換 / CRUD。
//
// 設計:
//   - 所有「per-character」的 localStorage key 改用 prefix `msucp.char.<id>.<suffix>`。
//     原本的 STORAGE_KEY 改寫成 charKey('equipment.v3') 之類。
//   - 全域 key(不分角色):
//       msucp.characters.v1   角色名單 [{ id, name, createdAt }]
//       msucp.activeCharId.v1 當前 active 角色 id
//       msucp.enemy.v1        ENEMY SETTINGS(戰鬥模擬全域)
//       msucp.locale          語言
//   - 切換角色 → window.location.reload()(沿用 useDataIO 的 importData 模式),
//     避免重寫每個 composable 的 reactive 重載邏輯。
//
// 重要:此模組必須在任何 per-char composable 載入「之前」完成 migration。
// 所以 main.js 必須在 import App 之前 `import './composables/useActiveCharacter.js'`。

import { reactive } from 'vue'

// 全域 keys
const ROSTER_KEY = 'msucp.characters.v1'
const ACTIVE_KEY = 'msucp.activeCharId.v1'

// 既有(legacy)key:無前綴時即此清單,將被搬到 msucp.char.<defaultId>.<suffix>
// suffix 即「拿掉開頭 msucp.」後的字串,如 equipment.v3 / character.v1 ...
export const PER_CHAR_SUFFIXES = [
  'equipment.v3',
  'character.v1',
  'collection.v1',
  'legion.v1',
  'puzzle.v1',
  'hyperStat.v1',
  'arcane.v1',
  'pet.v1',
  'innerPotential.v1',
  'vmatrix.v1',
  'linkSkills.applied.v3',
  'cpBuffs.v1',
  'cpSkills.v1',
  'cpTitles.v1',
  'cpCompare.v1',
  'hyperSkills.v1',
  'event.v1',
]

function genId() {
  return 'c' + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw)
  } catch { return fallback }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* ignore */ }
}

// 把一個 per-char suffix 組合成完整 key
export function charKey(suffix, charId) {
  const id = charId || getActiveId()
  return `msucp.char.${id}.${suffix}`
}

function getActiveId() {
  return roster.activeId
}

// ── Migration ────────────────────────────────────────
// 若 roster 不存在 → 建立預設角色 default,搬移所有 legacy key
function migrateIfNeeded() {
  const existing = readJSON(ROSTER_KEY, null)
  if (existing && Array.isArray(existing) && existing.length > 0) return // 已遷移

  const defaultId = 'default'
  const list = [{ id: defaultId, name: '角色 1', createdAt: new Date().toISOString() }]
  writeJSON(ROSTER_KEY, list)
  writeJSON(ACTIVE_KEY, defaultId)

  // 搬移 legacy keys
  for (const suffix of PER_CHAR_SUFFIXES) {
    const legacyKey = `msucp.${suffix}`
    const newKey = `msucp.char.${defaultId}.${suffix}`
    const raw = localStorage.getItem(legacyKey)
    if (raw != null) {
      try {
        localStorage.setItem(newKey, raw)
        localStorage.removeItem(legacyKey)
      } catch { /* ignore */ }
    }
  }
}

// ── 初始化 reactive state ─────────────────────────────
migrateIfNeeded()

function loadRoster() {
  const arr = readJSON(ROSTER_KEY, [])
  if (!Array.isArray(arr) || arr.length === 0) {
    return [{ id: 'default', name: '角色 1', createdAt: new Date().toISOString() }]
  }
  return arr.map((c) => ({
    id: String(c.id),
    name: String(c.name || ''),
    createdAt: String(c.createdAt || ''),
  }))
}

function loadActiveId(list) {
  const stored = readJSON(ACTIVE_KEY, null)
  if (stored && list.find((c) => c.id === stored)) return stored
  return list[0]?.id || 'default'
}

const initialList = loadRoster()
const initialActive = loadActiveId(initialList)

const roster = reactive({
  list: initialList,
  activeId: initialActive,
})

// 確保 roster + active 持久化
writeJSON(ROSTER_KEY, roster.list)
writeJSON(ACTIVE_KEY, roster.activeId)

function persistRoster() { writeJSON(ROSTER_KEY, roster.list) }
function persistActive() { writeJSON(ACTIVE_KEY, roster.activeId) }

// ── CRUD ──────────────────────────────────────────────
function createCharacter(name) {
  const id = genId()
  const trimmed = String(name || '').trim() || `角色 ${roster.list.length + 1}`
  roster.list.push({ id, name: trimmed, createdAt: new Date().toISOString() })
  persistRoster()
  return id
}

function renameCharacter(id, name) {
  const c = roster.list.find((x) => x.id === id)
  if (!c) return
  c.name = String(name || '').trim() || c.name
  persistRoster()
}

function deleteCharacter(id) {
  if (roster.list.length <= 1) return false // 至少保留一個
  const idx = roster.list.findIndex((c) => c.id === id)
  if (idx === -1) return false
  roster.list.splice(idx, 1)
  // 移除該角色全部 storage
  const prefix = `msucp.char.${id}.`
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) keysToRemove.push(k)
  }
  for (const k of keysToRemove) localStorage.removeItem(k)
  // 如果刪到的是 active → 切到第一個
  if (roster.activeId === id) {
    roster.activeId = roster.list[0].id
    persistActive()
  }
  persistRoster()
  return true
}

function cloneCharacter(id) {
  const src = roster.list.find((c) => c.id === id)
  if (!src) return null
  const newId = genId()
  const newName = `${src.name} (副本)`
  roster.list.push({ id: newId, name: newName, createdAt: new Date().toISOString() })
  persistRoster()
  // 複製全部 storage
  const srcPrefix = `msucp.char.${id}.`
  const dstPrefix = `msucp.char.${newId}.`
  const pairs = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(srcPrefix)) pairs.push([k, k.replace(srcPrefix, dstPrefix)])
  }
  for (const [from, to] of pairs) {
    try { localStorage.setItem(to, localStorage.getItem(from)) } catch { /* ignore */ }
  }
  return newId
}

function selectCharacter(id) {
  if (id === roster.activeId) return
  if (!roster.list.find((c) => c.id === id)) return
  roster.activeId = id
  persistActive()
  window.location.reload()
}

// 給比較頁 / 管理頁用:讀某角色的 per-char value(不需切到那角色)
export function readForCharacter(charId, suffix) {
  const raw = localStorage.getItem(`msucp.char.${charId}.${suffix}`)
  if (raw == null) return null
  try { return JSON.parse(raw) } catch { return null }
}

export function useActiveCharacter() {
  return {
    roster,
    createCharacter,
    renameCharacter,
    deleteCharacter,
    cloneCharacter,
    selectCharacter,
  }
}
