// 使用者可設定的星力上限 — 24 / 25 星裝備稀少,UI 與計算一律封頂 23
export const STAR_SETTABLE_CAP = 23

// 根據裝備等級決定星力上限 (架構規範)
//   Lv 100-109 → 8
//   Lv 110-119 → 10
//   Lv 120-129 → 15
//   Lv 130-139 → 20
//   Lv 140+    → 25 (實際 UI 仍受 STAR_SETTABLE_CAP 封頂)
export function maxStarsForLevel(level) {
  const lv = Number(level) || 0
  if (lv < 100) return 0
  if (lv < 110) return 8
  if (lv < 120) return 10
  if (lv < 130) return 15
  if (lv < 140) return 20
  return 25
}

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
//   'weapon' 武器 / 副手
//   'glove'  手套 (歸為防具但有 1-15 特殊 ATT 加成)
//   'armor'  防具 (帽/衣/褲/鞋/全身)       — 16★+ 主&副屬
//   'other'  飾品 / 披風 / 腰帶 / 戒指 / 墜飾… — 16★+ 全屬性
const ARMOR_TYPES = new Set(['hat', 'top', 'bottom', 'shoes', 'overall'])
function categoryOf(item) {
  const t = item.type
  if (t === 'weapon' || t === 'secondary') return 'weapon'
  if (t === 'glove') return 'glove'
  if (ARMOR_TYPES.has(t)) return 'armor'
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
  // 1~15 星:每星主&副屬加成 (各部位通用;全職業裝備於 computeStarStats 改套全屬)
  mainSubByStar: [
    { from: 1, to: 5,  delta: 2 },
    { from: 6, to: 15, delta: 3 },
  ],
  // 16 星起 — 每「顆」星皆加 (非一次性)。封頂到 23。
  //   實際加成 = 規則 × (min(stars, rangeTo) - 15)
  //   防具 (hat/top/bottom/shoes/glove) → +主&副
  //   飾品 / 披風 / 腰帶 / 戒指 / 墜飾 / 肩膀... (other) → +全屬
  //   武器 → +全屬
  perStarFrom16: {
    rangeTo: 23,
    weapon: { allStat: 11 },
    armor:  { mainSub: 11 },
    glove:  { mainSub: 11 },
    other:  { allStat: 11 },
  },
  attByStar: {
    weapon: { 16: 8, 17: 9, 18: 9, 19: 10, 20: 11, 21: 12, 22: 13, 23: 31 },
    armor:  { 16: 9, 17: 10, 18: 11, 19: 12, 20: 13, 21: 14, 22: 16, 23: 18 },
    glove:  { 16: 9, 17: 10, 18: 11, 19: 12, 20: 13, 21: 14, 22: 16, 23: 18 },
    other:  { 16: 9, 17: 10, 18: 11, 19: 12, 20: 13, 21: 14, 22: 16, 23: 18 },
  },
}

// ---- Lv160 表 ----
// 來源:使用者提供之 160 等星力增幅對照表
//   - 1-5★:主&副 +2
//   - 6-15★:主&副 +3
//   - 16★ 起:武器/裝備 全含 +13 全屬;手套 全含 +13 主&副
//   - 手套在 5/7/9/11/13/14/15★ 各額外 +1 ATT/MATK
//   - 武器 23★ 特例 +32 ATT
//   - 裝備有 23/24/25★ ATT&MATK 特例
//   - 手套 23★ 特例 +19 ATT&MATK
const TABLE_160 = {
  mainSubByStar: [
    { from: 1, to: 5,  delta: 2 },
    { from: 6, to: 15, delta: 3 },
  ],
  perStarFrom16: {
    // 16★ 起的全屬 / 主&副屬加成 — rangeTo 僅涵蓋「規則」範圍 (16-22),23★+ 為特例
    weapon: { allStat: 13, rangeTo: 22 },
    armor:  { mainSub: 13, rangeTo: 22 }, // 防具 16+ 主&副
    glove:  { mainSub: 13, rangeTo: 22 },
    other:  { allStat: 13, rangeTo: 22 }, // 飾品 / 披風... 16+ 全屬
  },
  attByStar: {
    weapon: {
      16: 9, 17: 9, 18: 10, 19: 11, 20: 12, 21: 13, 22: 14,
      23: 32,
    },
    armor: {
      16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 17,
      23: 19, 24: 21, 25: 23,
    },
    glove: {
      5: 1, 7: 1, 9: 1, 11: 1, 13: 1, 14: 1, 15: 1,
      16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 17,
      23: 19,
    },
    other: {
      16: 10, 17: 11, 18: 12, 19: 13, 20: 14, 21: 15, 22: 17,
      23: 19, 24: 21, 25: 23,
    },
  },
}

// ---- Lv100 表 ----
// 使用者提供:
//   1-5★ 每星 +2 全屬性
//   6★ 以上 每星 +3 全屬性 (持續到裝備自身的 maxStars)
// 單一裝備實際能達到的最大星數由 item.maxStars 控制。
const TABLE_100 = {
  mainSubByStar: [
    { from: 1, to: 5,  delta: 2, target: 'allStat' },
    { from: 6, to: 25, delta: 3, target: 'allStat' },
  ],
}

// ---- Lv130 表 ----
// 使用者提供:
//   1-5★   +2 主&副 (全職裝備 → 全屬)
//   6-15★  +3 主&副 (全職裝備 → 全屬)
//   16-20★ 每星 +7 屬性 (other / armor / glove 遵循 perStarFrom16 規則)
//   16-20★ ATT/MATK 累加:16:+7, 17:+8, 18:+9, 19:+10, 20:+11
const TABLE_130 = {
  mainSubByStar: [
    { from: 1, to:  5, delta: 2 },
    { from: 6, to: 15, delta: 3 },
  ],
  perStarFrom16: {
    weapon: { allStat: 7, rangeTo: 20 },
    armor:  { mainSub: 7, rangeTo: 20 },
    glove:  { mainSub: 7, rangeTo: 20 },
    other:  { allStat: 7, rangeTo: 20 },
  },
  attByStar: {
    weapon: { 16: 7, 17: 8, 18: 9, 19: 10, 20: 11 },
    armor:  { 16: 7, 17: 8, 18: 9, 19: 10, 20: 11 },
    glove:  { 16: 7, 17: 8, 18: 9, 19: 10, 20: 11 },
    other:  { 16: 7, 17: 8, 18: 9, 19: 10, 20: 11 },
  },
}

// ---- Lv140 表 ----
// 使用者提供的對照表:
//   1-5★   +2 主&副屬
//   6-15★  +3 主&副屬
//   16★起  +9 全屬 (武器) / +9 屬性 (裝備) / +9 主&副屬 (手套)  — 每星累加
//   16★ ATT:武器/裝備/手套 皆 +8
//   裝備/手套 16-22★ ATT&MATK:8, 9, 10, 11, 12, 13, 15
//   裝備/手套 23★ 特例 +17 ATT&MATK
//   武器 17★ 以上目前標示「未完成」,暫僅提供 16★ 資料
const TABLE_140 = {
  mainSubByStar: [
    { from: 1, to: 5,  delta: 2 },
    { from: 6, to: 15, delta: 3 },
  ],
  perStarFrom16: {
    weapon: { allStat: 9, rangeTo: 16 }, // 17+ 未完成
    armor:  { mainSub: 9, rangeTo: 22 },
    glove:  { mainSub: 9, rangeTo: 22 },
    other:  { allStat: 9, rangeTo: 22 },
  },
  attByStar: {
    weapon: { 16: 8 }, // 17-23 未完成
    armor:  { 16: 8, 17: 9, 18: 10, 19: 11, 20: 12, 21: 13, 22: 15, 23: 17 },
    glove:  { 16: 8, 17: 9, 18: 10, 19: 11, 20: 12, 21: 13, 22: 15, 23: 17 },
    other:  { 16: 8, 17: 9, 18: 10, 19: 11, 20: 12, 21: 13, 22: 15, 23: 17 },
  },
}

const TABLES = {
  100: TABLE_100,
  130: TABLE_130,
  140: TABLE_140,
  150: TABLE_150,
  160: TABLE_160,
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
  // 1) 1~N 星 — 規則:
  //      全職業裝備 (item.classes.length >= 2) → 全屬加成
  //      單職業裝備 (class-specific,含武器) → 僅主&副屬
  //    tier.target === 'allStat' 可強制所有類別套用全屬 (向下相容 Lv100 表)
  const multiClass = (item.classes?.length || 0) >= 2
  for (const tier of (table.mainSubByStar || [])) {
    const n = Math.max(0, Math.min(stars, tier.to) - tier.from + 1)
    if (n <= 0) continue
    if (tier.target === 'allStat' || multiClass) {
      for (const k of ['str', 'dex', 'int', 'luk']) bonus[k] += n * tier.delta
    } else {
      bonus[main] += n * tier.delta
      bonus[sub]  += n * tier.delta
    }
  }

  // 2) 16 星起每顆星加 (16-rangeTo 範圍內,每升一星累加)
  //    rangeTo 可以是 rule 頂層統一設定,也可以由每個 cat 單獨覆寫
  //    全職裝備 (multiClass) 將把 mainSub 型規則改為 allStat (例:Chaos Vellum's Helm)
  if (stars >= 16) {
    const rule = table.perStarFrom16
    if (rule) {
      const def = rule[cat]
      if (def) {
        const rangeTo = def.rangeTo ?? rule.rangeTo ?? 23
        const top = Math.min(stars, rangeTo)
        const n = Math.max(0, top - 15)  // 16→1, 17→2, ...
        if (def.allStat) {
          for (const k of ['str', 'dex', 'int', 'luk']) bonus[k] += def.allStat * n
        }
        if (def.mainSub) {
          if (multiClass) {
            for (const k of ['str', 'dex', 'int', 'luk']) bonus[k] += def.mainSub * n
          } else {
            bonus[main] += def.mainSub * n
            bonus[sub]  += def.mainSub * n
          }
        }
      }
    }
  }

  // 3) 各星專用 ATT 加成 — 涵蓋所有星數 (手套 1-15 的特殊星數也在此表中)
  const attTable = table.attByStar?.[cat] || {}
  for (let s = 1; s <= stars; s++) {
    const v = attTable[s] || 0
    if (!v) continue
    if (cat === 'weapon') {
      if (baseAtk > 0)  bonus.atk  += v
      if (baseMatk > 0) bonus.matk += v
    } else if (cat === 'glove') {
      // 手套為主&副的物件,ATT 加成同時給 ATT 與 MATK
      bonus.atk  += v
      bonus.matk += v
    } else {
      // 其他部位:ATT 與 MATK 同加
      bonus.atk  += v
      bonus.matk += v
    }
  }

  return bonus
}
