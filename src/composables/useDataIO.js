// 全站資料 (localStorage) 匯出 / 匯入 — 供跨裝置開發或重置使用

// 所有會被匯出 / 匯入的 localStorage key
export const DATA_KEYS = [
  'msucp.equipment.v3',            // 裝備 + 背包
  'msucp.character.v1',            // 角色等級 / 職業
  'msucp.collection.v1',           // NFT 圖鑑
  'msucp.legion.v1',               // 戰地成員 tier
  'msucp.puzzle.v1',               // 拼圖屬性
  'msucp.hyperStat.v1',            // Hyper Stat 配點
  'msucp.arcane.v1',               // 秘法符文 ARC
  'msucp.pet.v1',                  // 寵物系統
  'msucp.innerPotential.v1',       // 內潛 (3 排)
  'msucp.vmatrix.v1',              // V 矩陣 (通用 V 技能等級)
  'msucp.linkSkills.applied.v3',   // 已連結的 link skill
  'msucp.cpBuffs.v1',              // Buff 開關
  'msucp.cpSkills.v1',             // Skill 開關
  'msucp.cpTitles.v1',             // Title 開關
  'msucp.cpCompare.v1',            // CP 比較欄快照
]

export const EXPORT_VERSION = 1

// 收集 localStorage 的所有資料 → JSON 字串
export function exportData() {
  const data = {}
  for (const key of DATA_KEYS) {
    const raw = localStorage.getItem(key)
    if (raw == null) continue
    try { data[key] = JSON.parse(raw) } catch { data[key] = raw }
  }
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    data,
  }
}

// 把 payload (JSON) 寫回 localStorage,並整頁 reload 讓 composable 重新讀取
export function importData(payload, { reload = true } = {}) {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload')
  const data = payload.data || payload // 允許直接丟 { key: value } 或包裝形式
  if (!data || typeof data !== 'object') throw new Error('No data in payload')
  // 清除可能造成衝突的舊 key,再寫入
  for (const key of DATA_KEYS) localStorage.removeItem(key)
  for (const [key, value] of Object.entries(data)) {
    if (!DATA_KEYS.includes(key)) continue
    try {
      const str = typeof value === 'string' ? value : JSON.stringify(value)
      localStorage.setItem(key, str)
    } catch {
      /* 單筆失敗就跳過 */
    }
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

// 從 public/ 下的 seed 檔讀取 (給「載入測試資料」用)
export async function loadSeedFile(url = '/seed/test-data.json') {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Seed fetch failed: ${res.status}`)
  return res.json()
}
