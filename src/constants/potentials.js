// 潛能系統 — 資料驅動
//
// 池結構:POTENTIAL_POOLS[category][levelBucket][tier] = [option, ...]
//   category  : weapon / armor / glove / accessory ... (之後擴充)
//   levelBucket: 以最低 LV 作為 bucket key,getLevelBucket() 取對應最大不超過 item.level 的 bucket
//   tier      : rare | epic | unique | legendary
//
// option 結構:
//   { label, weight, stats? }
//     label:  顯示字串
//     weight: 抽中機率 %
//     stats?: 可計算的結構化加成 (供 CP 計算),若為狀態效果等無法數值化的選項可省略

export const POTENTIAL_TIERS = ['rare', 'epic', 'unique', 'legendary']

// 武器 Lv120+ Rare
const WEAPON_120_RARE = [
  { label: 'STR : +12',              weight: 6.122449, stats: { str: 12 } },
  { label: 'DEX : +12',              weight: 6.122449, stats: { dex: 12 } },
  { label: 'INT : +12',              weight: 6.122449, stats: { int: 12 } },
  { label: 'LUK : +12',              weight: 6.122449, stats: { luk: 12 } },
  { label: 'Max HP: +120',           weight: 6.122449, stats: { hp: 120 } },
  { label: 'Max MP: +120',           weight: 6.122449, stats: { mp: 120 } },
  { label: 'ATT: +12',               weight: 4.081633, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',         weight: 4.081633, stats: { matk: 12 } },
  { label: 'STR : +3%',              weight: 6.122449, stats: { strPct: 3 } },
  { label: 'DEX : +3%',              weight: 6.122449, stats: { dexPct: 3 } },
  { label: 'INT : +3%',              weight: 6.122449, stats: { intPct: 3 } },
  { label: 'LUK : +3%',              weight: 6.122449, stats: { lukPct: 3 } },
  { label: 'ATT: +3%',               weight: 2.040816, stats: { atkPct: 3 } },
  { label: 'Magic ATT: +3%',         weight: 2.040816, stats: { matkPct: 3 } },
  { label: 'Critical Rate: +4%',     weight: 2.040816, stats: { critRate: 4 } },
  { label: 'Damage: +3%',            weight: 2.040816, stats: { dmgPct: 3 } },
  { label: 'All Stats: +5',          weight: 4.081633, stats: { allStat: 5 } },
  { label: '20% chance to recover 240 HP when attacking.',      weight: 2.040816 },
  { label: '20% chance to recover 120 MP when attacking.',      weight: 2.040816 },
  { label: '20% chance to apply Lv. 6 Poison when attacking.',  weight: 2.040816 },
  { label: '10% chance to apply Lv. 2 Stun on hit.',            weight: 2.040816 },
  { label: '20% chance to apply Lv. 2 Slow when attacking.',    weight: 2.040816 },
  { label: '20% chance to apply Lv. 3 Blind when attacking.',   weight: 2.040816 },
  { label: '10% chance to apply Lv. 2 Freeze when attacking.',  weight: 2.040816 },
  { label: '10% chance to apply Lv. 2 Seal when attacking.',    weight: 2.040816 },
  { label: 'DEF Ignored: +15%',      weight: 2.040816, stats: { ignoreDef: 15 } },
]

// 武器 Lv120+ Legendary
const WEAPON_120_LEGENDARY = [
  { label: 'STR : +12%',                       weight: 10.256411, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                       weight: 10.256411, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                       weight: 10.256411, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                       weight: 10.256411, stats: { lukPct: 12 } },
  { label: 'ATT: +12%',                        weight:  5.128205, stats: { atkPct: 12 } },
  { label: 'Magic ATT: +12%',                  weight:  5.128205, stats: { matkPct: 12 } },
  { label: 'Critical Rate: +12%',              weight:  5.128205, stats: { critRate: 12 } },
  { label: 'Damage: +12%',                     weight:  5.128205, stats: { dmgPct: 12 } },
  { label: 'All Stats: +9%',                   weight:  7.692308, stats: { allStatPct: 9 } },
  { label: 'ATT per 10 Character Levels: +1',  weight:  5.128205, stats: { atkPerLv10: 1 } },
  { label: 'M. ATT per 10 Character Levels: +1', weight: 5.128205, stats: { matkPerLv10: 1 } },
  { label: 'DEF Ignored: +35%',                weight:  5.128205, stats: { ignoreDef: 35 } },
  { label: 'DEF Ignored: +40%',                weight:  5.128205, stats: { ignoreDef: 40 } },
  { label: 'Boss Damage: +35%',                weight:  5.128205, stats: { bossDmg: 35 } },
  { label: 'Boss Damage: +40%',                weight:  5.128205, stats: { bossDmg: 40 } },
]

// 武器 Lv120+ Unique
const WEAPON_120_UNIQUE = [
  { label: 'STR : +9%',          weight: 11.627908, stats: { strPct: 9 } },
  { label: 'DEX : +9%',          weight: 11.627908, stats: { dexPct: 9 } },
  { label: 'INT : +9%',          weight: 11.627908, stats: { intPct: 9 } },
  { label: 'LUK : +9%',          weight: 11.627908, stats: { lukPct: 9 } },
  { label: 'ATT: +9%',           weight:  6.976745, stats: { atkPct: 9 } },
  { label: 'Magic ATT: +9%',     weight:  6.976745, stats: { matkPct: 9 } },
  { label: 'Critical Rate: +9%', weight:  9.302325, stats: { critRate: 9 } },
  { label: 'Damage: +9%',        weight:  6.976745, stats: { dmgPct: 9 } },
  { label: 'All Stats: +6%',     weight:  9.302325, stats: { allStatPct: 6 } },
  { label: 'DEF Ignored: +30%',  weight:  6.976745, stats: { ignoreDef: 30 } },
  { label: 'Boss Damage: +30%',  weight:  6.976745, stats: { bossDmg: 30 } },
]

// 武器 Lv120+ Epic
const WEAPON_120_EPIC = [
  { label: 'STR : +6%',              weight: 10.869565, stats: { strPct: 6 } },
  { label: 'DEX : +6%',              weight: 10.869565, stats: { dexPct: 6 } },
  { label: 'INT : +6%',              weight: 10.869565, stats: { intPct: 6 } },
  { label: 'LUK : +6%',              weight: 10.869565, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',            weight: 10.869565, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',            weight: 10.869565, stats: { mpPct: 6 } },
  { label: 'ATT: +6%',               weight:  4.347826, stats: { atkPct: 6 } },
  { label: 'Magic ATT: +6%',         weight:  4.347826, stats: { matkPct: 6 } },
  { label: 'Critical Rate: +8%',     weight:  4.347826, stats: { critRate: 8 } },
  { label: 'Damage: +6%',            weight:  4.347826, stats: { dmgPct: 6 } },
  { label: 'All Stats: +3%',         weight:  4.347826, stats: { allStatPct: 3 } },
  { label: '20% chance to recover 360 HP when attacking.', weight: 4.347826 },
  { label: '20% chance to recover 180 MP when attacking.', weight: 4.347826 },
  { label: 'DEF Ignored: +15%',      weight:  4.347826, stats: { ignoreDef: 15 } },
]

export const POTENTIAL_POOLS = {
  weapon: {
    120: {
      rare:      WEAPON_120_RARE,
      epic:      WEAPON_120_EPIC,
      unique:    WEAPON_120_UNIQUE,
      legendary: WEAPON_120_LEGENDARY,
    },
  },
  // armor / glove / accessory 之後填入
}

function categoryOf(item) {
  if (!item) return null
  if (item.type === 'weapon') return 'weapon'
  if (item.type === 'secondary') return 'weapon'
  if (item.type === 'glove') return 'glove'
  // 其餘裝備歸一般 armor (之後再細分)
  return 'armor'
}

function getLevelBucket(category, level) {
  const buckets = Object.keys(POTENTIAL_POOLS[category] || {})
    .map(Number)
    .sort((a, b) => b - a)
  for (const b of buckets) if (level >= b) return b
  return null
}

// 取得 (item, tier) 第一行可用的選項;保留供外部單純查池用
export function getPotentialOptions(item, tier) {
  const cat = categoryOf(item)
  if (!cat) return []
  const bucket = getLevelBucket(cat, item.level || 0)
  if (bucket == null) return []
  return POTENTIAL_POOLS[cat]?.[bucket]?.[tier] || []
}

// 行索引相關:rare 三行都是 rare 池;epic / unique / legendary 的第 2、3 行會包含低一階池
export function getPotentialOptionsForLine(item, tier, lineIndex) {
  const cat = categoryOf(item)
  if (!cat) return []
  const bucket = getLevelBucket(cat, item.level || 0)
  if (bucket == null) return []
  const pool = POTENTIAL_POOLS[cat]?.[bucket] || {}
  const tierIdx = POTENTIAL_TIERS.indexOf(tier)
  if (tierIdx === -1) return []
  const base = pool[tier] || []
  if (lineIndex === 0 || tierIdx === 0) return base
  // 第 2、3 行 (索引 1、2) 且階級 ≥ epic:併入低一階
  const lower = POTENTIAL_TIERS[tierIdx - 1]
  const lowerList = pool[lower] || []
  return [...base, ...lowerList]
}

// 是否該裝備有任何可用階級 (不論哪個 tier)
export function itemHasPotentialPool(item) {
  const cat = categoryOf(item)
  if (!cat) return false
  const bucket = getLevelBucket(cat, item.level || 0)
  if (bucket == null) return false
  const pool = POTENTIAL_POOLS[cat]?.[bucket] || {}
  return POTENTIAL_TIERS.some((t) => (pool[t] || []).length > 0)
}

// 依 label 還原 option — 預設搜尋整個 tier 池 (忽略 line index)
//   若需要行敏感的驗證,請用 findPotentialOptionForLine
export function findPotentialOption(item, tier, label) {
  if (!label) return null
  const list = getPotentialOptions(item, tier)
  return list.find((o) => o.label === label) || null
}

export function findPotentialOptionForLine(item, tier, lineIndex, label) {
  if (!label) return null
  const list = getPotentialOptionsForLine(item, tier, lineIndex)
  return list.find((o) => o.label === label) || null
}
