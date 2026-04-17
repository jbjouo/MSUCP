// 附加潛能 (Bonus Potential) — 與潛能結構相同、池分離
// 第 2、3 行在 epic 以上會包含低一階選項,與潛能邏輯一致。
import { POTENTIAL_TIERS } from './potentials.js'

// 武器 Lv120+ Rare
const WEAPON_120_RARE = [
  { label: 'Max HP: +100',           weight: 5.882353, stats: { hp: 100 } },
  { label: 'Max MP: +100',           weight: 5.882353, stats: { mp: 100 } },
  { label: 'Movement Speed: +6',     weight: 5.882353, stats: { moveSpeed: 6 } },
  { label: 'Jump: +6',               weight: 5.882353, stats: { jump: 6 } },
  { label: 'DEF: +100',              weight: 5.882353, stats: { def: 100 } },
  { label: 'STR : +12',              weight: 5.882353, stats: { str: 12 } },
  { label: 'DEX : +12',              weight: 5.882353, stats: { dex: 12 } },
  { label: 'INT : +12',              weight: 5.882353, stats: { int: 12 } },
  { label: 'LUK : +12',              weight: 5.882353, stats: { luk: 12 } },
  { label: 'ATT: +12',               weight: 3.921569, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',         weight: 3.921569, stats: { matk: 12 } },
  { label: 'Max HP: +2%',            weight: 3.921569, stats: { hpPct: 2 } },
  { label: 'Max MP: +2%',            weight: 3.921569, stats: { mpPct: 2 } },
  { label: 'STR : +3%',              weight: 3.921569, stats: { strPct: 3 } },
  { label: 'DEX : +3%',              weight: 3.921569, stats: { dexPct: 3 } },
  { label: 'INT : +3%',              weight: 3.921569, stats: { intPct: 3 } },
  { label: 'LUK : +3%',              weight: 3.921569, stats: { lukPct: 3 } },
  { label: 'ATT: +3%',               weight: 1.960784, stats: { atkPct: 3 } },
  { label: 'Magic ATT: +3%',         weight: 1.960784, stats: { matkPct: 3 } },
  { label: 'Critical Rate: +4%',     weight: 3.921569, stats: { critRate: 4 } },
  { label: 'Damage: +3%',            weight: 1.960784, stats: { dmgPct: 3 } },
  { label: 'All Stats: +5',          weight: 5.882353, stats: { allStat: 5 } },
]

// 武器 Lv120+ Epic
const WEAPON_120_EPIC = [
  { label: 'Max HP: +5%',            weight: 8.823529, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',            weight: 8.823529, stats: { mpPct: 5 } },
  { label: 'ATT: +6%',               weight: 5.882353, stats: { atkPct: 6 } },
  { label: 'Magic ATT: +6%',         weight: 5.882353, stats: { matkPct: 6 } },
  { label: 'Critical Rate: +6%',     weight: 2.941176, stats: { critRate: 6 } },
  { label: 'STR : +6%',              weight: 8.823529, stats: { strPct: 6 } },
  { label: 'DEX : +6%',              weight: 8.823529, stats: { dexPct: 6 } },
  { label: 'INT : +6%',              weight: 8.823529, stats: { intPct: 6 } },
  { label: 'LUK : +6%',              weight: 8.823529, stats: { lukPct: 6 } },
  { label: 'Damage: +6%',            weight: 2.941176, stats: { dmgPct: 6 } },
  { label: 'All Stats: +3%',         weight: 5.882353, stats: { allStatPct: 3 } },
  { label: '3% chance to recover 53 HP when attacking.', weight: 8.823529 },
  { label: '3% chance to recover 53 MP when attacking.', weight: 8.823529 },
  { label: 'DEF Ignored: +3%',       weight: 5.882353, stats: { ignoreDef: 3 } },
]

// 武器 Lv120+ Unique
const WEAPON_120_UNIQUE = [
  { label: 'Max HP: +7%',            weight: 6.976745, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',            weight: 6.976745, stats: { mpPct: 7 } },
  { label: 'ATT: +9%',               weight: 4.651163, stats: { atkPct: 9 } },
  { label: 'Magic ATT: +9%',         weight: 4.651163, stats: { matkPct: 9 } },
  { label: 'Critical Rate: +9%',     weight: 4.651163, stats: { critRate: 9 } },
  { label: 'STR : +9%',              weight: 6.976745, stats: { strPct: 9 } },
  { label: 'DEX : +9%',              weight: 6.976745, stats: { dexPct: 9 } },
  { label: 'INT : +9%',              weight: 6.976745, stats: { intPct: 9 } },
  { label: 'LUK : +9%',              weight: 6.976745, stats: { lukPct: 9 } },
  { label: 'Damage: +9%',            weight: 2.325581, stats: { dmgPct: 9 } },
  { label: 'All Stats: +6%',         weight: 4.651163, stats: { allStatPct: 6 } },
  { label: 'STR per 10 Character Levels: +1', weight: 4.651163, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1', weight: 4.651163, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1', weight: 4.651163, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1', weight: 4.651163, stats: { lukPerLv10: 1 } },
  { label: '15% chance to recover 95 HP when attacking.', weight: 6.976745 },
  { label: '15% chance to recover 95 MP when attacking.', weight: 6.976745 },
  { label: 'DEF Ignored: +4%',       weight: 2.325581, stats: { ignoreDef: 4 } },
  { label: 'Boss Damage: +12%',      weight: 2.325581, stats: { bossDmg: 12 } },
]

// 武器 Lv120+ Legendary
const WEAPON_120_LEGENDARY = [
  { label: 'Max HP: +10%',           weight: 7.692308, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',           weight: 7.692308, stats: { mpPct: 10 } },
  { label: 'ATT: +12%',              weight: 5.128205, stats: { atkPct: 12 } },
  { label: 'Magic ATT: +12%',        weight: 5.128205, stats: { matkPct: 12 } },
  { label: 'Critical Rate: +12%',    weight: 5.128205, stats: { critRate: 12 } },
  { label: 'STR : +12%',             weight: 7.692308, stats: { strPct: 12 } },
  { label: 'DEX : +12%',             weight: 7.692308, stats: { dexPct: 12 } },
  { label: 'INT : +12%',             weight: 7.692308, stats: { intPct: 12 } },
  { label: 'LUK : +12%',             weight: 7.692308, stats: { lukPct: 12 } },
  { label: 'Damage: +12%',           weight: 2.564103, stats: { dmgPct: 12 } },
  { label: 'All Stats: +9%',         weight: 5.128205, stats: { allStatPct: 9 } },
  { label: 'STR per 10 Character Levels: +2', weight: 5.128205, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2', weight: 5.128205, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2', weight: 5.128205, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2', weight: 5.128205, stats: { lukPerLv10: 2 } },
  { label: 'ATT per 10 Character Levels: +1',   weight: 2.564103, stats: { atkPerLv10: 1 } },
  { label: 'M. ATT per 10 Character Levels: +1', weight: 2.564103, stats: { matkPerLv10: 1 } },
  { label: 'DEF Ignored: +5%',       weight: 2.564103, stats: { ignoreDef: 5 } },
  { label: 'Boss Damage: +18%',      weight: 2.564103, stats: { bossDmg: 18 } },
]

export const BONUS_POTENTIAL_POOLS = {
  weapon: {
    120: {
      rare:      WEAPON_120_RARE,
      epic:      WEAPON_120_EPIC,
      unique:    WEAPON_120_UNIQUE,
      legendary: WEAPON_120_LEGENDARY,
    },
  },
}

function categoryOf(item) {
  if (!item) return null
  if (item.type === 'weapon') return 'weapon'
  if (item.type === 'secondary') return 'weapon'
  if (item.type === 'glove') return 'glove'
  return 'armor'
}

function getLevelBucket(category, level) {
  const buckets = Object.keys(BONUS_POTENTIAL_POOLS[category] || {})
    .map(Number)
    .sort((a, b) => b - a)
  for (const b of buckets) if (level >= b) return b
  return null
}

export function getBonusPotentialOptionsForLine(item, tier, lineIndex) {
  const cat = categoryOf(item)
  if (!cat) return []
  const bucket = getLevelBucket(cat, item.level || 0)
  if (bucket == null) return []
  const pool = BONUS_POTENTIAL_POOLS[cat]?.[bucket] || {}
  const tierIdx = POTENTIAL_TIERS.indexOf(tier)
  if (tierIdx === -1) return []
  const base = pool[tier] || []
  if (lineIndex === 0 || tierIdx === 0) return base
  const lower = POTENTIAL_TIERS[tierIdx - 1]
  const lowerList = pool[lower] || []
  return [...base, ...lowerList]
}

export function findBonusPotentialOptionForLine(item, tier, lineIndex, label) {
  if (!label) return null
  const list = getBonusPotentialOptionsForLine(item, tier, lineIndex)
  return list.find((o) => o.label === label) || null
}

export function itemHasBonusPotentialPool(item) {
  const cat = categoryOf(item)
  if (!cat) return false
  const bucket = getLevelBucket(cat, item.level || 0)
  if (bucket == null) return false
  const pool = BONUS_POTENTIAL_POOLS[cat]?.[bucket] || {}
  return POTENTIAL_TIERS.some((t) => (pool[t] || []).length > 0)
}
