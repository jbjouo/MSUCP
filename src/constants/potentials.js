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

// 武器/副手 Lv100+ Rare — 源自 MSU API (PartsType_WEAPON_SECONDARY / Lv100)
// 與 WEAPON_120 結構相同,僅 Max HP/MP 由 +120 改為 +100、HP/MP 回復量較低
const WEAPON_100_RARE = [
  { label: 'STR : +12',              weight: 6.122449, stats: { str: 12 } },
  { label: 'DEX : +12',              weight: 6.122449, stats: { dex: 12 } },
  { label: 'INT : +12',              weight: 6.122449, stats: { int: 12 } },
  { label: 'LUK : +12',              weight: 6.122449, stats: { luk: 12 } },
  { label: 'Max HP: +100',           weight: 6.122449, stats: { hp: 100 } },
  { label: 'Max MP: +100',           weight: 6.122449, stats: { mp: 100 } },
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
  { label: '20% chance to recover 200 HP when attacking.',      weight: 2.040816 },
  { label: '20% chance to recover 100 MP when attacking.',      weight: 2.040816 },
  { label: '20% chance to apply Lv. 6 Poison when attacking.',  weight: 2.040816 },
  { label: '10% chance to apply Lv. 2 Stun on hit.',            weight: 2.040816 },
  { label: '20% chance to apply Lv. 2 Slow when attacking.',    weight: 2.040816 },
  { label: '20% chance to apply Lv. 3 Blind when attacking.',   weight: 2.040816 },
  { label: '10% chance to apply Lv. 2 Freeze when attacking.',  weight: 2.040816 },
  { label: '10% chance to apply Lv. 2 Seal when attacking.',    weight: 2.040816 },
  { label: 'DEF Ignored: +15%',      weight: 2.040816, stats: { ignoreDef: 15 } },
]

// 武器/副手 Lv100+ Epic
const WEAPON_100_EPIC = [
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
  { label: '20% chance to recover 300 HP when attacking.', weight: 4.347826 },
  { label: '20% chance to recover 165 MP when attacking.', weight: 4.347826 },
  { label: 'DEF Ignored: +15%',      weight:  4.347826, stats: { ignoreDef: 15 } },
]

// 武器/副手 Lv100+ Unique
const WEAPON_100_UNIQUE = [
  { label: 'STR : +9%',                                         weight: 9.803922, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                         weight: 9.803922, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                         weight: 9.803922, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                         weight: 9.803922, stats: { lukPct: 9 } },
  { label: 'ATT: +9%',                                          weight: 5.882353, stats: { atkPct: 9 } },
  { label: 'Magic ATT: +9%',                                    weight: 5.882353, stats: { matkPct: 9 } },
  { label: 'Critical Rate: +9%',                                weight: 7.843137, stats: { critRate: 9 } },
  { label: 'Damage: +9%',                                       weight: 5.882353, stats: { dmgPct: 9 } },
  { label: 'All Stats: +6%',                                    weight: 7.843137, stats: { allStatPct: 6 } },
  { label: 'DEF Ignored: +30%',                                 weight: 5.882353, stats: { ignoreDef: 30 } },
  { label: '5% chance to ignore 20% damage when attacked.',     weight: 7.843137 },
  { label: '5% chance to ignore 40% damage when attacked.',     weight: 7.843137 },
  { label: 'Boss Damage: +30%',                                 weight: 5.882353, stats: { bossDmg: 30 } },
]

// 武器/副手 Lv100+ Legendary
const WEAPON_100_LEGENDARY = [
  { label: 'STR : +12%',                                        weight: 8.888889, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                        weight: 8.888889, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                        weight: 8.888889, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                        weight: 8.888889, stats: { lukPct: 12 } },
  { label: 'ATT: +12%',                                         weight: 4.444444, stats: { atkPct: 12 } },
  { label: 'Magic ATT: +12%',                                   weight: 4.444444, stats: { matkPct: 12 } },
  { label: 'Critical Rate: +12%',                               weight: 4.444444, stats: { critRate: 12 } },
  { label: 'Damage: +12%',                                      weight: 4.444444, stats: { dmgPct: 12 } },
  { label: 'All Stats: +9%',                                    weight: 6.666667, stats: { allStatPct: 9 } },
  { label: 'ATT per 10 Character Levels: +1',                   weight: 4.444444, stats: { atkPerLv10: 1 } },
  { label: 'M. ATT per 10 Character Levels: +1',                weight: 4.444444, stats: { matkPerLv10: 1 } },
  { label: 'DEF Ignored: +35%',                                 weight: 4.444444, stats: { ignoreDef: 35 } },
  { label: 'DEF Ignored: +40%',                                 weight: 4.444444, stats: { ignoreDef: 40 } },
  { label: '10% chance to ignore 20% damage when attacked.',    weight: 6.666667 },
  { label: '10% chance to ignore 40% damage when attacked.',    weight: 6.666667 },
  { label: 'Boss Damage: +35%',                                 weight: 4.444444, stats: { bossDmg: 35 } },
  { label: 'Boss Damage: +40%',                                 weight: 4.444444, stats: { bossDmg: 40 } },
]

// 徽章 Lv100+ Unique — 比武器少 Boss Damage / 受擊免傷條件效果,weight 亦不同
const EMBLEM_100_UNIQUE = [
  { label: 'STR : +9%',          weight: 12.500000, stats: { strPct: 9 } },
  { label: 'DEX : +9%',          weight: 12.500000, stats: { dexPct: 9 } },
  { label: 'INT : +9%',          weight: 12.500000, stats: { intPct: 9 } },
  { label: 'LUK : +9%',          weight: 12.500000, stats: { lukPct: 9 } },
  { label: 'ATT: +9%',           weight:  7.500000, stats: { atkPct: 9 } },
  { label: 'Magic ATT: +9%',     weight:  7.500000, stats: { matkPct: 9 } },
  { label: 'Critical Rate: +9%', weight: 10.000000, stats: { critRate: 9 } },
  { label: 'Damage: +9%',        weight:  7.500000, stats: { dmgPct: 9 } },
  { label: 'All Stats: +6%',     weight: 10.000000, stats: { allStatPct: 6 } },
  { label: 'DEF Ignored: +30%',  weight:  7.500000, stats: { ignoreDef: 30 } },
]

// 徽章 Lv100+ Legendary — 比武器少 Boss Damage / 受擊免傷條件效果
const EMBLEM_100_LEGENDARY = [
  { label: 'STR : +12%',                       weight: 11.428571, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                       weight: 11.428571, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                       weight: 11.428571, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                       weight: 11.428571, stats: { lukPct: 12 } },
  { label: 'ATT: +12%',                        weight:  5.714286, stats: { atkPct: 12 } },
  { label: 'Magic ATT: +12%',                  weight:  5.714286, stats: { matkPct: 12 } },
  { label: 'Critical Rate: +12%',              weight:  5.714286, stats: { critRate: 12 } },
  { label: 'Damage: +12%',                     weight:  5.714286, stats: { dmgPct: 12 } },
  { label: 'All Stats: +9%',                   weight:  8.571429, stats: { allStatPct: 9 } },
  { label: 'ATT per 10 Character Levels: +1',  weight:  5.714286, stats: { atkPerLv10: 1 } },
  { label: 'M. ATT per 10 Character Levels: +1', weight: 5.714286, stats: { matkPerLv10: 1 } },
  { label: 'DEF Ignored: +35%',                weight:  5.714286, stats: { ignoreDef: 35 } },
  { label: 'DEF Ignored: +40%',                weight:  5.714286, stats: { ignoreDef: 40 } },
]

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

// 戒指 Lv100+ Rare — 與 Lv120+ 相同
const RING_100_RARE = [
  { label: 'STR : +12',     weight: 7.5, stats: { str: 12 } },
  { label: 'DEX : +12',     weight: 7.5, stats: { dex: 12 } },
  { label: 'INT : +12',     weight: 7.5, stats: { int: 12 } },
  { label: 'LUK : +12',     weight: 7.5, stats: { luk: 12 } },
  { label: 'Max HP: +100',  weight: 7.5, stats: { hp: 100 } },
  { label: 'Max MP: +100',  weight: 7.5, stats: { mp: 100 } },
  { label: 'DEF: +100',     weight: 5.0, stats: { def: 100 } },
  { label: 'STR : +3%',     weight: 7.5, stats: { strPct: 3 } },
  { label: 'DEX : +3%',     weight: 7.5, stats: { dexPct: 3 } },
  { label: 'INT : +3%',     weight: 7.5, stats: { intPct: 3 } },
  { label: 'LUK : +3%',     weight: 7.5, stats: { lukPct: 3 } },
  { label: 'Max HP: +3%',   weight: 5.0, stats: { hpPct: 3 } },
  { label: 'Max MP: +3%',   weight: 5.0, stats: { mpPct: 3 } },
  { label: 'DEF: +3%',      weight: 5.0, stats: { defPct: 3 } },
  { label: 'All Stats: +5', weight: 5.0, stats: { allStat: 5 } },
]

// 戒指 Lv100+ Epic — 與 Lv120+ 相同
const RING_100_EPIC = [
  { label: 'STR : +6%',      weight: 14.285715, stats: { strPct: 6 } },
  { label: 'DEX : +6%',      weight: 14.285715, stats: { dexPct: 6 } },
  { label: 'INT : +6%',      weight: 14.285715, stats: { intPct: 6 } },
  { label: 'LUK : +6%',      weight: 14.285715, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',    weight: 14.285715, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',    weight: 14.285715, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',       weight:  8.571429, stats: { defPct: 6 } },
  { label: 'All Stats: +3%', weight:  5.714286, stats: { allStatPct: 3 } },
]

// 戒指 Lv100+ Unique — 與 Lv120+ 相同
const RING_100_UNIQUE = [
  { label: 'STR : +9%',                          weight: 12.500000, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                          weight: 12.500000, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                          weight: 12.500000, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                          weight: 12.500000, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                        weight: 15.000001, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                        weight: 15.000001, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                     weight: 10.000000, stats: { allStatPct: 6 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 10.000000 },
]

// 戒指 Lv100+ Legendary — Skill MP Cost 值與 Lv120+ 不同 (-10% / -20%)
const RING_100_LEGENDARY = [
  { label: 'STR : +12%',          weight: 12.121212, stats: { strPct: 12 } },
  { label: 'DEX : +12%',          weight: 12.121212, stats: { dexPct: 12 } },
  { label: 'INT : +12%',          weight: 12.121212, stats: { intPct: 12 } },
  { label: 'LUK : +12%',          weight: 12.121212, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',        weight: 12.121212, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',        weight: 12.121212, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',      weight:  9.090909, stats: { allStatPct: 9 } },
  { label: 'Skill MP Cost: -10%', weight:  9.090909 },
  { label: 'Skill MP Cost: -20%', weight:  9.090909 },
]

// 戒指 Lv110+ Rare — HP/MP/DEF 值為 +110 (與 Lv100/120 的 +100 不同)
const RING_110_RARE = [
  { label: 'STR : +12',     weight: 7.5, stats: { str: 12 } },
  { label: 'DEX : +12',     weight: 7.5, stats: { dex: 12 } },
  { label: 'INT : +12',     weight: 7.5, stats: { int: 12 } },
  { label: 'LUK : +12',     weight: 7.5, stats: { luk: 12 } },
  { label: 'Max HP: +110',  weight: 7.5, stats: { hp: 110 } },
  { label: 'Max MP: +110',  weight: 7.5, stats: { mp: 110 } },
  { label: 'DEF: +110',     weight: 5.0, stats: { def: 110 } },
  { label: 'STR : +3%',     weight: 7.5, stats: { strPct: 3 } },
  { label: 'DEX : +3%',     weight: 7.5, stats: { dexPct: 3 } },
  { label: 'INT : +3%',     weight: 7.5, stats: { intPct: 3 } },
  { label: 'LUK : +3%',     weight: 7.5, stats: { lukPct: 3 } },
  { label: 'Max HP: +3%',   weight: 5.0, stats: { hpPct: 3 } },
  { label: 'Max MP: +3%',   weight: 5.0, stats: { mpPct: 3 } },
  { label: 'DEF: +3%',      weight: 5.0, stats: { defPct: 3 } },
  { label: 'All Stats: +5', weight: 5.0, stats: { allStat: 5 } },
]

// 戒指 Lv110+ Epic — 與 Lv100/120 相同
const RING_110_EPIC = [
  { label: 'STR : +6%',      weight: 14.285715, stats: { strPct: 6 } },
  { label: 'DEX : +6%',      weight: 14.285715, stats: { dexPct: 6 } },
  { label: 'INT : +6%',      weight: 14.285715, stats: { intPct: 6 } },
  { label: 'LUK : +6%',      weight: 14.285715, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',    weight: 14.285715, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',    weight: 14.285715, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',       weight:  8.571429, stats: { defPct: 6 } },
  { label: 'All Stats: +3%', weight:  5.714286, stats: { allStatPct: 3 } },
]

// 戒指 Lv110+ Unique — 與 Lv100/120 相同
const RING_110_UNIQUE = [
  { label: 'STR : +9%',                          weight: 12.500000, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                          weight: 12.500000, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                          weight: 12.500000, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                          weight: 12.500000, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                        weight: 15.000001, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                        weight: 15.000001, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                     weight: 10.000000, stats: { allStatPct: 6 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 10.000000 },
]

// 戒指 Lv110+ Legendary — Skill MP Cost 與 Lv120 相同 (-15% / -30%)
const RING_110_LEGENDARY = [
  { label: 'STR : +12%',          weight: 12.121212, stats: { strPct: 12 } },
  { label: 'DEX : +12%',          weight: 12.121212, stats: { dexPct: 12 } },
  { label: 'INT : +12%',          weight: 12.121212, stats: { intPct: 12 } },
  { label: 'LUK : +12%',          weight: 12.121212, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',        weight: 12.121212, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',        weight: 12.121212, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',      weight:  9.090909, stats: { allStatPct: 9 } },
  { label: 'Skill MP Cost: -15%', weight:  9.090909 },
  { label: 'Skill MP Cost: -30%', weight:  9.090909 },
]

// 戒指 Lv120+ Rare
const RING_120_RARE = [
  { label: 'STR : +12',     weight: 7.5, stats: { str: 12 } },
  { label: 'DEX : +12',     weight: 7.5, stats: { dex: 12 } },
  { label: 'INT : +12',     weight: 7.5, stats: { int: 12 } },
  { label: 'LUK : +12',     weight: 7.5, stats: { luk: 12 } },
  { label: 'Max HP: +120',  weight: 7.5, stats: { hp: 120 } },
  { label: 'Max MP: +120',  weight: 7.5, stats: { mp: 120 } },
  { label: 'DEF: +120',     weight: 5.0, stats: { def: 120 } },
  { label: 'STR : +3%',     weight: 7.5, stats: { strPct: 3 } },
  { label: 'DEX : +3%',     weight: 7.5, stats: { dexPct: 3 } },
  { label: 'INT : +3%',     weight: 7.5, stats: { intPct: 3 } },
  { label: 'LUK : +3%',     weight: 7.5, stats: { lukPct: 3 } },
  { label: 'Max HP: +3%',   weight: 5.0, stats: { hpPct: 3 } },
  { label: 'Max MP: +3%',   weight: 5.0, stats: { mpPct: 3 } },
  { label: 'DEF: +3%',      weight: 5.0, stats: { defPct: 3 } },
  { label: 'All Stats: +5', weight: 5.0, stats: { allStat: 5 } },
]

// 戒指 Lv120+ Epic
const RING_120_EPIC = [
  { label: 'STR : +6%',      weight: 14.285715, stats: { strPct: 6 } },
  { label: 'DEX : +6%',      weight: 14.285715, stats: { dexPct: 6 } },
  { label: 'INT : +6%',      weight: 14.285715, stats: { intPct: 6 } },
  { label: 'LUK : +6%',      weight: 14.285715, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',    weight: 14.285715, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',    weight: 14.285715, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',       weight:  8.571429, stats: { defPct: 6 } },
  { label: 'All Stats: +3%', weight:  5.714286, stats: { allStatPct: 3 } },
]

// 戒指 Lv120+ Unique
const RING_120_UNIQUE = [
  { label: 'STR : +9%',                          weight: 12.500000, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                          weight: 12.500000, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                          weight: 12.500000, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                          weight: 12.500000, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                        weight: 15.000001, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                        weight: 15.000001, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                     weight: 10.000000, stats: { allStatPct: 6 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 10.000000 },
]

// 戒指 Lv120+ Legendary
const RING_120_LEGENDARY = [
  { label: 'STR : +12%',          weight: 12.121212, stats: { strPct: 12 } },
  { label: 'DEX : +12%',          weight: 12.121212, stats: { dexPct: 12 } },
  { label: 'INT : +12%',          weight: 12.121212, stats: { intPct: 12 } },
  { label: 'LUK : +12%',          weight: 12.121212, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',        weight: 12.121212, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',        weight: 12.121212, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',      weight:  9.090909, stats: { allStatPct: 9 } },
  { label: 'Skill MP Cost: -15%', weight:  9.090909 },
  { label: 'Skill MP Cost: -30%', weight:  9.090909 },
]

// 腰帶 Lv120+ Rare — 與戒指 Lv120+ 相同
const BELT_120_RARE = [
  { label: 'STR : +12',     weight: 7.5, stats: { str: 12 } },
  { label: 'DEX : +12',     weight: 7.5, stats: { dex: 12 } },
  { label: 'INT : +12',     weight: 7.5, stats: { int: 12 } },
  { label: 'LUK : +12',     weight: 7.5, stats: { luk: 12 } },
  { label: 'Max HP: +120',  weight: 7.5, stats: { hp: 120 } },
  { label: 'Max MP: +120',  weight: 7.5, stats: { mp: 120 } },
  { label: 'DEF: +120',     weight: 5.0, stats: { def: 120 } },
  { label: 'STR : +3%',     weight: 7.5, stats: { strPct: 3 } },
  { label: 'DEX : +3%',     weight: 7.5, stats: { dexPct: 3 } },
  { label: 'INT : +3%',     weight: 7.5, stats: { intPct: 3 } },
  { label: 'LUK : +3%',     weight: 7.5, stats: { lukPct: 3 } },
  { label: 'Max HP: +3%',   weight: 5.0, stats: { hpPct: 3 } },
  { label: 'Max MP: +3%',   weight: 5.0, stats: { mpPct: 3 } },
  { label: 'DEF: +3%',      weight: 5.0, stats: { defPct: 3 } },
  { label: 'All Stats: +5', weight: 5.0, stats: { allStat: 5 } },
]

// 腰帶 Lv120+ Epic
const BELT_120_EPIC = [
  { label: 'STR : +6%',      weight: 14.285715, stats: { strPct: 6 } },
  { label: 'DEX : +6%',      weight: 14.285715, stats: { dexPct: 6 } },
  { label: 'INT : +6%',      weight: 14.285715, stats: { intPct: 6 } },
  { label: 'LUK : +6%',      weight: 14.285715, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',    weight: 14.285715, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',    weight: 14.285715, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',       weight:  8.571429, stats: { defPct: 6 } },
  { label: 'All Stats: +3%', weight:  5.714286, stats: { allStatPct: 3 } },
]

// 腰帶 Lv120+ Unique — 比戒指多「受擊減傷」條件效果
const BELT_120_UNIQUE = [
  { label: 'STR : +9%',                                weight: 10.416666, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                weight: 10.416666, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                weight: 10.416666, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                weight: 10.416666, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                              weight: 12.500000, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                              weight: 12.500000, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                           weight:  8.333334, stats: { allStatPct: 6 } },
  { label: '5% chance to ignore 20% damage when attacked.', weight: 8.333334 },
  { label: '5% chance to ignore 40% damage when attacked.', weight: 8.333334 },
  { label: 'HP Recovery Items and Skills: +30%',       weight:  8.333334 },
]

// 腰帶 Lv120+ Legendary — 條件效果改為 10% 機率
const BELT_120_LEGENDARY = [
  { label: 'STR : +12%',                                weight: 12.121212, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                weight: 12.121212, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                weight: 12.121212, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                weight: 12.121212, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',                              weight: 12.121212, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',                              weight: 12.121212, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',                            weight:  9.090909, stats: { allStatPct: 9 } },
  { label: '10% chance to ignore 20% damage when attacked.', weight: 9.090909 },
  { label: '10% chance to ignore 40% damage when attacked.', weight: 9.090909 },
]

// 上衣 (Top) Lv120+ — 來源 MSU 官方 probability API
//   GET /maplestoryn/api/msn/probability?cubeType=CubeType_BLACK
//     &partsType=PartsType_TOP&equipLevel=120&gradeType=<tier>
//   取 probabilityInfos[0] (第 1 行) 為該階級的新選項
const TOP_120_RARE = [
  { label: 'STR : +12',     weight: 7.5, stats: { str: 12 } },
  { label: 'DEX : +12',     weight: 7.5, stats: { dex: 12 } },
  { label: 'INT : +12',     weight: 7.5, stats: { int: 12 } },
  { label: 'LUK : +12',     weight: 7.5, stats: { luk: 12 } },
  { label: 'Max HP: +120',  weight: 7.5, stats: { hp: 120 } },
  { label: 'Max MP: +120',  weight: 7.5, stats: { mp: 120 } },
  { label: 'DEF: +120',     weight: 5.0, stats: { def: 120 } },
  { label: 'STR : +3%',     weight: 7.5, stats: { strPct: 3 } },
  { label: 'DEX : +3%',     weight: 7.5, stats: { dexPct: 3 } },
  { label: 'INT : +3%',     weight: 7.5, stats: { intPct: 3 } },
  { label: 'LUK : +3%',     weight: 7.5, stats: { lukPct: 3 } },
  { label: 'Max HP: +3%',   weight: 5.0, stats: { hpPct: 3 } },
  { label: 'Max MP: +3%',   weight: 5.0, stats: { mpPct: 3 } },
  { label: 'DEF: +3%',      weight: 5.0, stats: { defPct: 3 } },
  { label: 'All Stats: +5', weight: 5.0, stats: { allStat: 5 } },
]

// 上衣 Lv120+ Epic
const TOP_120_EPIC = [
  { label: 'STR : +6%',                      weight: 13.157895, stats: { strPct: 6 } },
  { label: 'DEX : +6%',                      weight: 13.157895, stats: { dexPct: 6 } },
  { label: 'INT : +6%',                      weight: 13.157895, stats: { intPct: 6 } },
  { label: 'LUK : +6%',                      weight: 13.157895, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',                    weight: 13.157895, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',                    weight: 13.157895, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',                       weight:  7.894736, stats: { defPct: 6 } },
  { label: 'All Stats: +3%',                 weight:  5.263158, stats: { allStatPct: 3 } },
  { label: 'Invincible for +1 more sec. when hit', weight: 7.894736 },
]

// 上衣 Lv120+ Unique
const TOP_120_UNIQUE = [
  { label: 'STR : +9%',                                         weight: 8.064516, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                         weight: 8.064516, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                         weight: 8.064516, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                         weight: 8.064516, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                                       weight: 9.677419, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                                       weight: 9.677419, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                                    weight: 6.451612, stats: { allStatPct: 6 } },
  { label: '5% chance to ignore 20% damage when attacked.',     weight: 6.451612 },
  { label: '5% chance to ignore 40% damage when attacked.',     weight: 6.451612 },
  { label: 'Invincible for +2 more sec. when hit',              weight: 6.451612 },
  { label: '2% chance to become invincible for 7 seconds when attacked.', weight: 6.451612 },
  { label: '30% chance to reflect 50% damage.',                 weight: 6.451612 },
  { label: '30% chance to reflect 70% damage.',                 weight: 3.225806 },
  { label: 'HP Recovery Items and Skills: +30%',                weight: 6.451612 },
]

// 下身 (Bottom) Lv120+ — 來源 MSU 官方 probability API (BLACK / BOTTOM / Lv120)
// RARE 與上衣相同 → 共用 TOP_120_RARE
const BOTTOM_120_EPIC = [
  { label: 'STR : +6%',      weight: 14.285715, stats: { strPct: 6 } },
  { label: 'DEX : +6%',      weight: 14.285715, stats: { dexPct: 6 } },
  { label: 'INT : +6%',      weight: 14.285715, stats: { intPct: 6 } },
  { label: 'LUK : +6%',      weight: 14.285715, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',    weight: 14.285715, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',    weight: 14.285715, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',       weight:  8.571429, stats: { defPct: 6 } },
  { label: 'All Stats: +3%', weight:  5.714286, stats: { allStatPct: 3 } },
]

const BOTTOM_120_UNIQUE = [
  { label: 'STR : +9%',                                         weight:  9.615385, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                         weight:  9.615385, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                         weight:  9.615385, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                         weight:  9.615385, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                                       weight: 11.538462, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                                       weight: 11.538462, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                                    weight:  7.692308, stats: { allStatPct: 6 } },
  { label: '5% chance to ignore 20% damage when attacked.',     weight:  7.692308 },
  { label: '5% chance to ignore 40% damage when attacked.',     weight:  7.692308 },
  { label: 'HP Recovery Items and Skills: +30%',                weight:  7.692308 },
  { label: 'Enables the <Decent Hyper Body> skill',             weight:  7.692308 },
]

const BOTTOM_120_LEGENDARY = [
  { label: 'STR : +12%',                                        weight: 12.121212, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                        weight: 12.121212, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                        weight: 12.121212, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                        weight: 12.121212, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',                                      weight: 12.121212, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',                                      weight: 12.121212, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',                                    weight:  9.090909, stats: { allStatPct: 9 } },
  { label: '10% chance to ignore 20% damage when attacked.',    weight:  9.090909 },
  { label: '10% chance to ignore 40% damage when attacked.',    weight:  9.090909 },
]

// 鞋子 (Shoes) Lv120+ — BLACK / SHOES / Lv120
// RARE 帶 Movement Speed/Jump;UNIQUE 帶 Decent Haste;LEGENDARY 帶 Decent Combat Orders
const SHOES_120_RARE = [
  { label: 'STR : +12',              weight: 6.818182, stats: { str: 12 } },
  { label: 'DEX : +12',              weight: 6.818182, stats: { dex: 12 } },
  { label: 'INT : +12',              weight: 6.818182, stats: { int: 12 } },
  { label: 'LUK : +12',              weight: 6.818182, stats: { luk: 12 } },
  { label: 'Max HP: +120',           weight: 6.818182, stats: { hp: 120 } },
  { label: 'Max MP: +120',           weight: 6.818182, stats: { mp: 120 } },
  { label: 'STR : +3%',              weight: 6.818182, stats: { strPct: 3 } },
  { label: 'DEX : +3%',              weight: 6.818182, stats: { dexPct: 3 } },
  { label: 'INT : +3%',              weight: 6.818182, stats: { intPct: 3 } },
  { label: 'LUK : +3%',              weight: 6.818182, stats: { lukPct: 3 } },
  { label: 'Movement Speed: +8',     weight: 4.545455, stats: { moveSpeed: 8 } },
  { label: 'Jump: +8',               weight: 4.545455, stats: { jump: 8 } },
  { label: 'DEF: +120',              weight: 4.545455, stats: { def: 120 } },
  { label: 'Max HP: +3%',            weight: 4.545455, stats: { hpPct: 3 } },
  { label: 'Max MP: +3%',            weight: 4.545455, stats: { mpPct: 3 } },
  { label: 'DEF: +3%',               weight: 4.545455, stats: { defPct: 3 } },
  { label: 'All Stats: +5',          weight: 4.545455, stats: { allStat: 5 } },
]

const SHOES_120_UNIQUE = [
  { label: 'STR : +9%',                                         weight:  9.615385, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                         weight:  9.615385, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                         weight:  9.615385, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                         weight:  9.615385, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                                       weight: 11.538462, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                                       weight: 11.538462, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                                    weight:  7.692308, stats: { allStatPct: 6 } },
  { label: '5% chance to ignore 20% damage when attacked.',     weight:  7.692308 },
  { label: '5% chance to ignore 40% damage when attacked.',     weight:  7.692308 },
  { label: 'HP Recovery Items and Skills: +30%',                weight:  7.692308 },
  { label: 'Enables the <Decent Haste> skill',                  weight:  7.692308 },
]

const SHOES_120_LEGENDARY = [
  { label: 'STR : +12%',                                        weight: 11.111111, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                        weight: 11.111111, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                        weight: 11.111111, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                        weight: 11.111111, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',                                      weight: 11.111111, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',                                      weight: 11.111111, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',                                    weight:  8.333333, stats: { allStatPct: 9 } },
  { label: '10% chance to ignore 20% damage when attacked.',    weight:  8.333333 },
  { label: '10% chance to ignore 40% damage when attacked.',    weight:  8.333333 },
  { label: 'Enables the <Decent Combat Orders> skill',          weight:  8.333333 },
]

// 手套 (Glove) Lv120+ — BLACK / GLOVES / Lv120 (MSU API)
// RARE 與戒指相同;EPIC 帶 HP/MP 回復;UNIQUE 有 Decent Sharp Eyes、damage reduction;LEGENDARY 有 Critical Damage +8%、Decent Speed Infusion
const GLOVE_120_EPIC = [
  { label: 'STR : +6%',      weight: 12.195122, stats: { strPct: 6 } },
  { label: 'DEX : +6%',      weight: 12.195122, stats: { dexPct: 6 } },
  { label: 'INT : +6%',      weight: 12.195122, stats: { intPct: 6 } },
  { label: 'LUK : +6%',      weight: 12.195122, stats: { lukPct: 6 } },
  { label: 'Max HP: +6%',    weight: 12.195122, stats: { hpPct: 6 } },
  { label: 'Max MP: +6%',    weight: 12.195122, stats: { mpPct: 6 } },
  { label: 'DEF: +6%',       weight:  7.317073, stats: { defPct: 6 } },
  { label: 'All Stats: +3%', weight:  4.878049, stats: { allStatPct: 3 } },
  { label: '15% chance to recover 95 HP when attacking.', weight: 7.317073 },
  { label: '15% chance to recover 95 MP when attacking.', weight: 7.317073 },
]

const GLOVE_120_UNIQUE = [
  { label: 'STR : +9%',                                         weight:  8.928571, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                         weight:  8.928571, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                         weight:  8.928571, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                         weight:  8.928571, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                                       weight: 10.714286, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                                       weight: 10.714286, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                                    weight:  7.142857, stats: { allStatPct: 6 } },
  { label: 'STR per 10 Character Levels: +1',                   weight:  1.785714, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',                   weight:  1.785714, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',                   weight:  1.785714, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',                   weight:  1.785714, stats: { lukPerLv10: 1 } },
  { label: '5% chance to ignore 20% damage when attacked.',     weight:  7.142857 },
  { label: '5% chance to ignore 40% damage when attacked.',     weight:  7.142857 },
  { label: 'HP Recovery Items and Skills: +30%',                weight:  7.142857 },
  { label: 'Enables the <Decent Sharp Eyes> skill',             weight:  7.142857 },
]

const GLOVE_120_LEGENDARY = [
  { label: 'STR : +12%',                                        weight: 10.000000, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                        weight: 10.000000, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                        weight: 10.000000, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                        weight: 10.000000, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',                                      weight: 10.000000, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',                                      weight: 10.000000, stats: { mpPct: 12 } },
  { label: 'Critical Damage: +8%',                              weight: 10.000000, stats: { critDmg: 8 } },
  { label: 'All Stats: +9%',                                    weight:  7.500000, stats: { allStatPct: 9 } },
  { label: '10% chance to ignore 20% damage when attacked.',    weight:  7.500000 },
  { label: '10% chance to ignore 40% damage when attacked.',    weight:  7.500000 },
  { label: 'Enables the <Decent Speed Infusion> skill',         weight:  7.500000 },
]

// 帽子 (Hat) Lv120+ — BLACK / HAT / Lv120
// RARE 與上衣同池 → 共用 TOP_120_RARE
// EPIC 與下身同池 → 共用 BOTTOM_120_EPIC
const HAT_120_UNIQUE = [
  { label: 'STR : +9%',                                         weight:  9.615385, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                         weight:  9.615385, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                         weight:  9.615385, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                         weight:  9.615385, stats: { lukPct: 9 } },
  { label: 'Max HP: +9%',                                       weight: 11.538462, stats: { hpPct: 9 } },
  { label: 'Max MP: +9%',                                       weight: 11.538462, stats: { mpPct: 9 } },
  { label: 'All Stats: +6%',                                    weight:  7.692308, stats: { allStatPct: 6 } },
  { label: '5% chance to ignore 20% damage when attacked.',     weight:  7.692308 },
  { label: '5% chance to ignore 40% damage when attacked.',     weight:  7.692308 },
  { label: 'HP Recovery Items and Skills: +30%',                weight:  7.692308 },
  { label: 'Enables the <Decent Mystic Door> skill',            weight:  7.692308 },
]

const HAT_120_LEGENDARY = [
  { label: 'STR : +12%',                                        weight:  9.756097, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                        weight:  9.756097, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                        weight:  9.756097, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                        weight:  9.756097, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',                                      weight:  9.756097, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',                                      weight:  9.756097, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',                                    weight:  7.317073, stats: { allStatPct: 9 } },
  { label: '10% chance to ignore 20% damage when attacked.',    weight:  7.317073 },
  { label: '10% chance to ignore 40% damage when attacked.',    weight:  7.317073 },
  { label: 'Skill Cooldown: -1 sec (-5% for under 10 sec, minimum cooldown of 5 sec)', weight: 7.317073, stats: { cooldownReductionSec: -1 } },
  { label: 'Skill Cooldown: -2 sec. (-10% for under 10 sec., minimum cooldown of 5 sec.)', weight: 4.878048, stats: { cooldownReductionSec: -2 } },
  { label: 'Enables the <Decent Advanced Blessing> skill',      weight:  7.317073 },
]

// 上衣 Lv120+ Legendary
const TOP_120_LEGENDARY = [
  { label: 'STR : +12%',                                        weight: 10.256411, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                        weight: 10.256411, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                        weight: 10.256411, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                        weight: 10.256411, stats: { lukPct: 12 } },
  { label: 'Max HP: +12%',                                      weight: 10.256411, stats: { hpPct: 12 } },
  { label: 'Max MP: +12%',                                      weight: 10.256411, stats: { mpPct: 12 } },
  { label: 'All Stats: +9%',                                    weight:  7.692308, stats: { allStatPct: 9 } },
  { label: '10% chance to ignore 20% damage when attacked.',    weight:  7.692308 },
  { label: '10% chance to ignore 40% damage when attacked.',    weight:  7.692308 },
  { label: 'Invincible for +3 more sec. when hit',              weight:  7.692308 },
  { label: '4% chance to become invincible for 7 seconds when attacked.', weight: 7.692308 },
]

export const POTENTIAL_POOLS = {
  weapon: {
    100: {
      rare:      WEAPON_100_RARE,
      epic:      WEAPON_100_EPIC,
      unique:    WEAPON_100_UNIQUE,
      legendary: WEAPON_100_LEGENDARY,
    },
    120: {
      rare:      WEAPON_120_RARE,
      epic:      WEAPON_120_EPIC,
      unique:    WEAPON_120_UNIQUE,
      legendary: WEAPON_120_LEGENDARY,
    },
  },
  ring: {
    100: {
      rare:      RING_100_RARE,
      epic:      RING_100_EPIC,
      unique:    RING_100_UNIQUE,
      legendary: RING_100_LEGENDARY,
    },
    110: {
      rare:      RING_110_RARE,
      epic:      RING_110_EPIC,
      unique:    RING_110_UNIQUE,
      legendary: RING_110_LEGENDARY,
    },
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: RING_120_LEGENDARY,
    },
  },
  belt: {
    120: {
      rare:      BELT_120_RARE,
      epic:      BELT_120_EPIC,
      unique:    BELT_120_UNIQUE,
      legendary: BELT_120_LEGENDARY,
    },
  },
  // Pendant Lv120+ 潛能池與戒指 Lv120 完全相同 → 共用資料
  pendant: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: RING_120_LEGENDARY,
    },
  },
  // 臉部裝飾 Lv110+ 潛能池與戒指 Lv110 完全相同 → 共用資料 (MSU API 驗證)
  face: {
    110: {
      rare:      RING_110_RARE,
      epic:      RING_110_EPIC,
      unique:    RING_110_UNIQUE,
      legendary: RING_110_LEGENDARY,
    },
  },
  // 鞋子 Lv120+ — RARE / UNIQUE / LEGENDARY 為鞋子專用;EPIC 與戒指同池
  shoes: {
    120: {
      rare:      SHOES_120_RARE,
      epic:      RING_120_EPIC,
      unique:    SHOES_120_UNIQUE,
      legendary: SHOES_120_LEGENDARY,
    },
  },
  // 肩飾 Lv120+ — RARE/EPIC 與戒指同池;UNIQUE 與腰帶同池 (帶 damage-ignore);LEGENDARY 與下身同池
  shoulder: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    BELT_120_UNIQUE,
      legendary: BOTTOM_120_LEGENDARY,
    },
  },
  // 披風 Lv120+ — 同肩飾
  cape: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    BELT_120_UNIQUE,
      legendary: BOTTOM_120_LEGENDARY,
    },
  },
  // 手套 Lv120+ — RARE 與戒指同池;EPIC / UNIQUE / LEGENDARY 為手套專用 (HP/MP 回復 / Decent Skill / Critical Damage +8%)
  glove: {
    120: {
      rare:      RING_120_RARE,
      epic:      GLOVE_120_EPIC,
      unique:    GLOVE_120_UNIQUE,
      legendary: GLOVE_120_LEGENDARY,
    },
  },
  // 徽章 Lv100+ — RARE/EPIC 與武器同池,UNIQUE/LEGENDARY 為徽章專用 (無 Boss Damage / 受擊免傷)
  emblem: {
    100: {
      rare:      WEAPON_100_RARE,
      epic:      WEAPON_100_EPIC,
      unique:    EMBLEM_100_UNIQUE,
      legendary: EMBLEM_100_LEGENDARY,
    },
  },
  // 眼飾 Lv120+ 潛能池與戒指 Lv120 完全相同 → 共用 (MSU API 驗證)
  eye: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: RING_120_LEGENDARY,
    },
  },
  // 耳環 Lv100/110/120+ 潛能池與戒指完全相同 → 共用資料 (MSU API 驗證)
  earring: {
    100: {
      rare:      RING_100_RARE,
      epic:      RING_100_EPIC,
      unique:    RING_100_UNIQUE,
      legendary: RING_100_LEGENDARY,
    },
    110: {
      rare:      RING_110_RARE,
      epic:      RING_110_EPIC,
      unique:    RING_110_UNIQUE,
      legendary: RING_110_LEGENDARY,
    },
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: RING_120_LEGENDARY,
    },
  },
  // 上衣 Lv120+ — 四階完整 (來自 MSU 官方 probability API,Black Cube / TOP / Lv120)
  top: {
    120: {
      rare:      TOP_120_RARE,
      epic:      TOP_120_EPIC,
      unique:    TOP_120_UNIQUE,
      legendary: TOP_120_LEGENDARY,
    },
  },
  // 下身 Lv120+ — 四階完整 (BLACK / BOTTOM / Lv120);Rare 與上衣同池
  bottom: {
    120: {
      rare:      TOP_120_RARE,
      epic:      BOTTOM_120_EPIC,
      unique:    BOTTOM_120_UNIQUE,
      legendary: BOTTOM_120_LEGENDARY,
    },
  },
  // 帽子 Lv120+ — 四階完整 (BLACK / HAT / Lv120);Rare 與上衣同池,Epic 與下身同池
  hat: {
    120: {
      rare:      TOP_120_RARE,
      epic:      BOTTOM_120_EPIC,
      unique:    HAT_120_UNIQUE,
      legendary: HAT_120_LEGENDARY,
    },
  },
  // armor / glove / accessory 之後填入
}

function categoryOf(item) {
  if (!item) return null
  if (item.type === 'weapon') return 'weapon'
  if (item.type === 'secondary') return 'weapon'
  if (item.type === 'glove') return 'glove'
  if (item.type === 'ring') return 'ring'
  if (item.type === 'belt') return 'belt'
  if (item.type === 'pendant') return 'pendant'
  if (item.type === 'face') return 'face'
  if (item.type === 'eye') return 'eye'
  if (item.type === 'earring') return 'earring'
  if (item.type === 'emblem') return 'emblem'
  if (item.type === 'shoes') return 'shoes'
  if (item.type === 'shoulder') return 'shoulder'
  if (item.type === 'cape') return 'cape'
  if (item.type === 'top' || item.type === 'overall') return 'top'
  if (item.type === 'bottom') return 'bottom'
  if (item.type === 'hat') return 'hat'
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
