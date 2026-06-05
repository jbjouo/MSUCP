// 全站資料 (localStorage) 匯出 / 匯入 — 供跨裝置開發或重置使用
//
// 新增 localStorage 持久化的 composable / 頁面時,請同步把 key 加入這份清單,
// 並在 CLAUDE.md 的 localStorage 表更新。
//
// 不匯出的項目:
//   - msucp.locale (UI 語言偏好,裝置獨立)
//   - useBattleSim / useBattleBuffs / useDotTracker — 戰鬥中暫時狀態 (不跨 session)

// Per-character keys 採用 prefix `msucp.char.<id>.<suffix>`(多角色系統)。
// 為了匯出/匯入「目前裝置上所有資料」,exportData 會掃 localStorage 抓所有
// `msucp.char.*` + 全域 keys(下方 GLOBAL_KEYS)。
//
// 注意:GLOBAL_KEYS 不含 per-character 資料,只列裝置 / 全域層級的設定。

export const GLOBAL_KEYS = [
  'msucp.characters.v1',           // 角色名單
  'msucp.activeCharId.v1',         // 當前 active 角色 id
  'msucp.enemy.v1',                // 戰鬥模擬 — 目標對象設定
]

// 舊版單一角色匯出格式相容用 — 仍接受這些 key,寫回時自動補上 default 前綴。
export const LEGACY_PER_CHAR_KEYS = [
  'msucp.equipment.v3',
  'msucp.character.v1',
  'msucp.collection.v1',
  'msucp.legion.v1',
  'msucp.puzzle.v1',
  'msucp.hyperStat.v1',
  'msucp.arcane.v1',
  'msucp.pet.v1',
  'msucp.innerPotential.v1',
  'msucp.vmatrix.v1',
  'msucp.blessingSkills.v1',
  'msucp.linkSkills.applied.v3',
  'msucp.cpBuffs.v1',
  'msucp.cpSkills.v1',
  'msucp.cpTitles.v1',
  'msucp.cpCompare.v1',
  'msucp.hyperSkills.v1',
  'msucp.event.v1',
]

// 為了向下相容既有外部引用,保留 DATA_KEYS 名稱:現指「所有會被匯出 / 匯入的全域 key」。
// per-char 資料由 exportData 動態掃描收集。
export const DATA_KEYS = GLOBAL_KEYS

// v1 → v2:導入戰鬥模擬 (msucp.enemy.v1) 、技能專屬 V 矩陣 (flame_sweep 併入 msucp.vmatrix.v1)。
//          兩者皆為既有 key 內的新值,無需資料遷移 — 用戶舊檔匯入後自動 sanitize 預設。
export const EXPORT_VERSION = 2

// 收集 localStorage 的所有資料(全域 + 所有 per-character) → JSON 字串
export function exportData() {
  const data = {}
  // 1. 全域 keys
  for (const key of GLOBAL_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw == null) continue
    try { data[key] = JSON.parse(raw) } catch { data[key] = raw }
  }
  // 2. 所有 per-character keys (msucp.char.<id>.*)
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (!k || !k.startsWith('msucp.char.')) continue
    const raw = localStorage.getItem(k)
    if (raw == null) continue
    try { data[k] = JSON.parse(raw) } catch { data[k] = raw }
  }
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

function isAcceptedKey(k) {
  if (GLOBAL_KEYS.includes(k)) return true
  if (k.startsWith('msucp.char.')) return true
  if (LEGACY_PER_CHAR_KEYS.includes(k)) return true
  return false
}

// 把 payload (JSON) 寫回 localStorage,並整頁 reload 讓 composable 重新讀取。
// 接受新格式(含 msucp.char.* + GLOBAL_KEYS)與舊格式(裸 msucp.equipment.v3 等)。
// 舊格式會被搬到 msucp.char.default.<suffix>。
export function importData(payload, { reload = true } = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  const data = payload.data || payload
  if (!data || typeof data !== 'object') throw new Error('No data in payload')

  // 清除既有衝突:全域 keys、所有 char.* keys、legacy keys
  for (const key of GLOBAL_KEYS) localStorage.removeItem(key)
  const charKeysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith('msucp.char.')) charKeysToRemove.push(k)
  }
  for (const k of charKeysToRemove) localStorage.removeItem(k)
  for (const k of LEGACY_PER_CHAR_KEYS) localStorage.removeItem(k)

  for (const [key, value] of Object.entries(data)) {
    if (!isAcceptedKey(key)) continue
    let writeKey = key
    if (LEGACY_PER_CHAR_KEYS.includes(key)) {
      // 舊格式 → 寫到 default 角色
      writeKey = `msucp.char.default.${key.replace(/^msucp\./, '')}`
    }
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(writeKey, str)
    } catch { /* skip */ }
  }
  if (reload) window.location.reload()
}

// 觸發下載 JSON
export function downloadJSON(obj, filename) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

// 從本地檔案讀 JSON
export function readFileAsJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try { resolve(JSON.parse(reader.result)) }
      catch (e) { reject(e) }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file, 'utf-8')
  })
}
