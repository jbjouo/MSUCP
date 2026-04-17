// 使用者可設定的星力上限 — 24 / 25 星裝備稀少,UI 與計算一律封頂 23
export const STAR_SETTABLE_CAP = 23

// 星力增幅計算 — 資料驅動,方便之後擴充其他等級與部位
//
// 目前已實作:
//   Lv 150 等級級距 (包含以上) 的 [武器 / 裝備 / 手套]
//
// 擴充方式:在 TABLES 中新增對應 level 的資料 (例如 140, 130...),
// getLevelBucket 會自動選擇 <= level 的最大 bucket。

const ZERO = () => ({
  str: 0, dex: 0, int: 0, luk: 0,
  atk: 0, matk: 0, def: 0,
  hp: 0, mp: 0,
})

// 每職業主/副屬性
const JOB_MAIN_SUB = {
  warrior:  { main: 'str', sub: 'dex' },
  magician: { main: 'int', sub: 'luk' },
  bowman:   { main: 'dex', sub: 'str' },
  thief:    { main: 'luk', sub: 'dex' },
  pirate:   { main: 'str', sub: 'dex' },
}

export function jobMainSub(cls) {
  return JOB_MAIN_SUB[cls] || { main: 'str', sub: 'dex' }
}

// 部位歸類 — starForce 表格以此為主鍵
//   'weapon'  武器
//   'glove'   手套
//   'other'   一般裝備 (帽/衣/鞋/披/肩/腰帶/飾品…)
function categoryOf(item) {
  const t = item.type
  if (t === 'weapon' || t === 'secondary') return 'weapon'
  if (t === 'glove') return 'glove'
  return 'other'
}

// 武器前 15 星的每星 ATT 增幅 (依「當下攻擊值範圍」)
//   1-49 +1, 50-99 +2, 100-149 +3,每 50 攻範圍 +1
function perStarAttByAtk(atk) {
  if (atk <= 0) return 0
  return Math.floor(atk / 50) + 1
}

// 武器前 n 星累計 ATT 增幅 — 每一星以「前一星的當下攻擊力」判斷所屬區間
// 例:從 7→8 星時,使用 (base + 前 7 星累計加成) 作為查表依據
function accumulateWeaponAtt(baseAtk, stars) {
  if (baseAtk <= 0 || stars <= 0) return 0
  let cur = baseAtk
  for (let s = 1; s <= stars; s++) {
    cur += perStarAttByAtk(cur)
  }
  return cur - baseAtk
}

// ---- Lv150 表 ----
const TABLE_150 = {
  // 1~15 星:每星主&副屬加成 (各部位通用)
  mainSubByStar: [
    { from: 1, to: 5,  delta: 2 },
    { from: 6, to: 15, delta: 3 },
  ],
  // 16 星起 — 每「顆」星皆加 (非一次性)。封頂到 23。
  //   實際加成 = 規則 × (min(stars, rangeTo) - 15)
  perStarFrom16: {
    rangeTo: 23,
    weapon: { allStat: 11 },   // 全含 +11 全屬
    other:  { allStat: 11 },   // 全含 +11 屬性*
    glove:  { mainSub: 11 },   // 全含 +11 主&副屬
  },
  // 16 星起 — 各星提供的 ATT (武器另外加到 MATK)
  attByStar: {
    weapon: { 16: 8, 17: 9, 18: 9, 19: 10, 20: 11, 21: 12, 22: 13, 23: 31 },
    other:  { 16: 9, 17: 10, 18: 11, 19: 12, 20: 13, 21: 14, 22: 16, 23: 18 },
    glove:  { 16: 9, 17: 10, 18: 11, 19: 12, 20: 13, 21: 14, 22: 16, 23: 18 },
  },
  // 24 / 25 星使用者說不需處理,這裡留空
}

const TABLES = {
  150: TABLE_150,
}

function getLevelBucket(level) {
  const buckets = Object.keys(TABLES).map(Number).sort((a, b) => b - a)
  for (const b of buckets) if (level >= b) return b
  return null
}

// 主入口 — 依 item + stars 回傳「星力加成」物件
export function computeStarStats(item, stars) {
  const bonus = ZERO()
  if (!item || !stars || stars <= 0) return bonus

  const bucket = getLevelBucket(item.level || 0)
  const cat = categoryOf(item)
  const table = bucket != null ? TABLES[bucket] : null

  const baseAtk  = item.stats?.atk  || 0
  const baseMatk = item.stats?.matk || 0
  const { main, sub } = jobMainSub(item.classes?.[0])

  // 武器共通規則:前 15 星每星依「當下攻擊值範圍」累加 (逐星以當下 atk 查表)
  if (cat === 'weapon') {
    const up15 = Math.min(stars, 15)
    if (up15 > 0) {
      if (baseAtk > 0)  bonus.atk  += accumulateWeaponAtt(baseAtk,  up15)
      if (baseMatk > 0) bonus.matk += accumulateWeaponAtt(baseMatk, up15)
    }
  }

  if (!table) return bonus

  // --- 級距依賴的加成 ---
  // 1) 1~15 星 main/sub
  for (const tier of table.mainSubByStar) {
    const n = Math.max(0, Math.min(stars, tier.to) - tier.from + 1)
    if (n > 0) {
      bonus[main] += n * tier.delta
      bonus[sub]  += n * tier.delta
    }
  }

  // 2) 16 星起每顆星加 (16-rangeTo 範圍內,每升一星累加)
  if (stars >= 16) {
    const rule = table.perStarFrom16
    if (rule) {
      const top = Math.min(stars, rule.rangeTo || 23)
      const n = Math.max(0, top - 15)  // 16→1, 17→2, ..., 23→8
      const def = rule[cat]
      if (def?.allStat) {
        for (const k of ['str', 'dex', 'int', 'luk']) bonus[k] += def.allStat * n
      }
      if (def?.mainSub) {
        bonus[main] += def.mainSub * n
        bonus[sub]  += def.mainSub * n
      }
    }
  }

  // 3) 16 星以上 — 各星專用 ATT 加成
  const attTable = table.attByStar?.[cat] || {}
  const top = Math.min(stars, 23)
  for (let s = 16; s <= top; s++) {
    const v = attTable[s] || 0
    if (!v) continue
    if (cat === 'weapon') {
      if (baseAtk > 0)  bonus.atk  += v
      if (baseMatk > 0) bonus.matk += v
    } else {
      // 其他部位:沒有基礎攻擊,一律當作 +ATT 加成
      bonus.atk += v
    }
  }

  return bonus
}
