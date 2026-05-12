// 附加潛能 (Bonus Potential) — 與潛能結構相同、池分離
// 第 2、3 行在 epic 以上會包含低一階選項,與潛能邏輯一致。
import { POTENTIAL_TIERS } from './potentials.js'

// 武器/副手 Lv100+ Rare (Bonus Potential) — MSU API (PartsType_WEAPON_SECONDARY / Lv100)
// 與 WEAPON_120 結構相同,Movement Speed/Jump +5 (120 版為 +6)、Critical Rate +3% (120 版為 +4%)
const WEAPON_100_RARE = [
  { label: 'Max HP: +100',           weight: 5.882353, stats: { hp: 100 } },
  { label: 'Max MP: +100',           weight: 5.882353, stats: { mp: 100 } },
  { label: 'Movement Speed: +5',     weight: 5.882353, stats: { moveSpeed: 5 } },
  { label: 'Jump: +5',               weight: 5.882353, stats: { jump: 5 } },
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
  { label: 'Critical Rate: +3%',     weight: 3.921569, stats: { critRate: 3 } },
  { label: 'Damage: +3%',            weight: 1.960784, stats: { dmgPct: 3 } },
  { label: 'All Stats: +5',          weight: 5.882353, stats: { allStat: 5 } },
]

// 武器/副手 Lv100+ Epic (Bonus Potential)
const WEAPON_100_EPIC = [
  { label: 'Max HP: +5%',            weight: 8.823529, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',            weight: 8.823529, stats: { mpPct: 5 } },
  { label: 'STR : +6%',              weight: 8.823529, stats: { strPct: 6 } },
  { label: 'DEX : +6%',              weight: 8.823529, stats: { dexPct: 6 } },
  { label: 'INT : +6%',              weight: 8.823529, stats: { intPct: 6 } },
  { label: 'LUK : +6%',              weight: 8.823529, stats: { lukPct: 6 } },
  { label: '3% chance to recover 47 HP when attacking.', weight: 8.823529 },
  { label: '3% chance to recover 47 MP when attacking.', weight: 8.823529 },
  { label: 'ATT: +6%',               weight: 5.882353, stats: { atkPct: 6 } },
  { label: 'Magic ATT: +6%',         weight: 5.882353, stats: { matkPct: 6 } },
  { label: 'All Stats: +3%',         weight: 5.882353, stats: { allStatPct: 3 } },
  { label: 'DEF Ignored: +3%',       weight: 5.882353, stats: { ignoreDef: 3 } },
  { label: 'Critical Rate: +6%',     weight: 2.941176, stats: { critRate: 6 } },
  { label: 'Damage: +6%',            weight: 2.941176, stats: { dmgPct: 6 } },
]

// 武器/副手 Lv100+ Unique (Bonus Potential)
const WEAPON_100_UNIQUE = [
  { label: 'Max HP: +7%',            weight: 6.976745, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',            weight: 6.976745, stats: { mpPct: 7 } },
  { label: 'STR : +9%',              weight: 6.976745, stats: { strPct: 9 } },
  { label: 'DEX : +9%',              weight: 6.976745, stats: { dexPct: 9 } },
  { label: 'INT : +9%',              weight: 6.976745, stats: { intPct: 9 } },
  { label: 'LUK : +9%',              weight: 6.976745, stats: { lukPct: 9 } },
  { label: '15% chance to recover 85 HP when attacking.', weight: 6.976745 },
  { label: '15% chance to recover 85 MP when attacking.', weight: 6.976745 },
  { label: 'ATT: +9%',               weight: 4.651163, stats: { atkPct: 9 } },
  { label: 'Magic ATT: +9%',         weight: 4.651163, stats: { matkPct: 9 } },
  { label: 'Critical Rate: +9%',     weight: 4.651163, stats: { critRate: 9 } },
  { label: 'All Stats: +6%',         weight: 4.651163, stats: { allStatPct: 6 } },
  { label: 'STR per 10 Character Levels: +1', weight: 4.651163, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1', weight: 4.651163, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1', weight: 4.651163, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1', weight: 4.651163, stats: { lukPerLv10: 1 } },
  { label: 'Damage: +9%',            weight: 2.325581, stats: { dmgPct: 9 } },
  { label: 'DEF Ignored: +4%',       weight: 2.325581, stats: { ignoreDef: 4 } },
  { label: 'Boss Damage: +12%',      weight: 2.325581, stats: { bossDmg: 12 } },
]

// 武器/副手 Lv100+ Legendary (Bonus Potential)
const WEAPON_100_LEGENDARY = [
  { label: 'Max HP: +10%',           weight: 7.317073, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',           weight: 7.317073, stats: { mpPct: 10 } },
  { label: 'STR : +12%',             weight: 7.317073, stats: { strPct: 12 } },
  { label: 'DEX : +12%',             weight: 7.317073, stats: { dexPct: 12 } },
  { label: 'INT : +12%',             weight: 7.317073, stats: { intPct: 12 } },
  { label: 'LUK : +12%',             weight: 7.317073, stats: { lukPct: 12 } },
  { label: 'ATT: +12%',              weight: 4.878049, stats: { atkPct: 12 } },
  { label: 'Magic ATT: +12%',        weight: 4.878049, stats: { matkPct: 12 } },
  { label: 'Critical Rate: +12%',    weight: 4.878049, stats: { critRate: 12 } },
  { label: 'Critical Damage: +1%',   weight: 4.878049, stats: { critDmg: 1 } },
  { label: 'All Stats: +9%',         weight: 4.878049, stats: { allStatPct: 9 } },
  { label: 'STR per 10 Character Levels: +2', weight: 4.878049, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2', weight: 4.878049, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2', weight: 4.878049, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2', weight: 4.878049, stats: { lukPerLv10: 2 } },
  { label: 'Damage: +12%',           weight: 2.439024, stats: { dmgPct: 12 } },
  { label: 'ATT per 10 Character Levels: +1', weight: 2.439024, stats: { atkPerLv10: 1 } },
  { label: 'M. ATT per 10 Character Levels: +1', weight: 2.439024, stats: { matkPerLv10: 1 } },
  { label: 'DEF Ignored: +5%',       weight: 2.439024, stats: { ignoreDef: 5 } },
  { label: 'Boss Damage: +18%',      weight: 2.439024, stats: { bossDmg: 18 } },
]

// 徽章 Lv100+ Unique (Bonus Potential) — 比武器少 Boss Damage
const EMBLEM_100_UNIQUE = [
  { label: 'Max HP: +7%',                                weight: 7.142857, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',                                weight: 7.142857, stats: { mpPct: 7 } },
  { label: 'STR : +9%',                                  weight: 7.142857, stats: { strPct: 9 } },
  { label: 'DEX : +9%',                                  weight: 7.142857, stats: { dexPct: 9 } },
  { label: 'INT : +9%',                                  weight: 7.142857, stats: { intPct: 9 } },
  { label: 'LUK : +9%',                                  weight: 7.142857, stats: { lukPct: 9 } },
  { label: '15% chance to recover 85 HP when attacking.', weight: 7.142857 },
  { label: '15% chance to recover 85 MP when attacking.', weight: 7.142857 },
  { label: 'ATT: +9%',                                   weight: 4.761905, stats: { atkPct: 9 } },
  { label: 'Magic ATT: +9%',                             weight: 4.761905, stats: { matkPct: 9 } },
  { label: 'Critical Rate: +9%',                         weight: 4.761905, stats: { critRate: 9 } },
  { label: 'All Stats: +6%',                             weight: 4.761905, stats: { allStatPct: 6 } },
  { label: 'STR per 10 Character Levels: +1',            weight: 4.761905, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',            weight: 4.761905, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',            weight: 4.761905, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',            weight: 4.761905, stats: { lukPerLv10: 1 } },
  { label: 'Damage: +9%',                                weight: 2.380952, stats: { dmgPct: 9 } },
  { label: 'DEF Ignored: +4%',                           weight: 2.380952, stats: { ignoreDef: 4 } },
]

// 徽章 Lv100+ Legendary (Bonus Potential) — 比武器少 Boss Damage
const EMBLEM_100_LEGENDARY = [
  { label: 'Max HP: +10%',                               weight: 7.894737, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                               weight: 7.894737, stats: { mpPct: 10 } },
  { label: 'STR : +12%',                                 weight: 7.894737, stats: { strPct: 12 } },
  { label: 'DEX : +12%',                                 weight: 7.894737, stats: { dexPct: 12 } },
  { label: 'INT : +12%',                                 weight: 7.894737, stats: { intPct: 12 } },
  { label: 'LUK : +12%',                                 weight: 7.894737, stats: { lukPct: 12 } },
  { label: 'ATT: +12%',                                  weight: 5.263158, stats: { atkPct: 12 } },
  { label: 'Magic ATT: +12%',                            weight: 5.263158, stats: { matkPct: 12 } },
  { label: 'Critical Rate: +12%',                        weight: 5.263158, stats: { critRate: 12 } },
  { label: 'All Stats: +9%',                             weight: 5.263158, stats: { allStatPct: 9 } },
  { label: 'STR per 10 Character Levels: +2',            weight: 5.263158, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',            weight: 5.263158, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',            weight: 5.263158, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',            weight: 5.263158, stats: { lukPerLv10: 2 } },
  { label: 'Damage: +12%',                               weight: 2.631579, stats: { dmgPct: 12 } },
  { label: 'DEF Ignored: +5%',                           weight: 2.631579, stats: { ignoreDef: 5 } },
]

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

// 武器 Lv120 Rare line 2/3 額外降級池
//   來源:MSU API CubeType_BONUS_POTENTIAL / GradeType_RARE / WEAPON / Lv120,line 2 與 line 3 共用
//   Line 1 只吃 WEAPON_120_RARE;Line 2/3 才會出現這些「半階」值
//   Lv200 武器走 Lv120 fallback → 同樣套用
const WEAPON_120_RARE_LINE23_EXTRA = [
  { label: 'STR : +6',           weight: 7.262164, stats: { str: 6 } },
  { label: 'DEX : +6',           weight: 7.262164, stats: { dex: 6 } },
  { label: 'INT : +6',           weight: 7.262164, stats: { int: 6 } },
  { label: 'LUK : +6',           weight: 7.262164, stats: { luk: 6 } },
  { label: 'Max HP: +60',        weight: 10.893247, stats: { hp: 60 } },
  { label: 'Max MP: +60',        weight: 10.893247, stats: { mp: 60 } },
  { label: 'Movement Speed: +4', weight: 10.893247, stats: { moveSpeed: 4 } },
  { label: 'Jump: +4',           weight: 10.893247, stats: { jump: 4 } },
  { label: 'DEF: +60',           weight: 10.893247, stats: { def: 60 } },
  { label: 'ATT: +6',            weight: 7.262164, stats: { atk: 6 } },
  { label: 'Magic ATT: +6',      weight: 7.262164, stats: { matk: 6 } },
]

// 戒指 Lv100+ Rare
const RING_100_RARE = [
  { label: 'STR : +10',          weight: 6.382979, stats: { str: 10 } },
  { label: 'DEX : +10',          weight: 6.382979, stats: { dex: 10 } },
  { label: 'INT : +10',          weight: 6.382979, stats: { int: 10 } },
  { label: 'LUK : +10',          weight: 6.382979, stats: { luk: 10 } },
  { label: 'Max HP: +100',       weight: 6.382979, stats: { hp: 100 } },
  { label: 'Max MP: +100',       weight: 6.382979, stats: { mp: 100 } },
  { label: 'Movement Speed: +5', weight: 6.382979, stats: { moveSpeed: 5 } },
  { label: 'Jump: +5',           weight: 6.382979, stats: { jump: 5 } },
  { label: 'ATT: +10',           weight: 4.255319, stats: { atk: 10 } },
  { label: 'Magic ATT: +10',     weight: 4.255319, stats: { matk: 10 } },
  { label: 'DEF: +100',          weight: 6.382979, stats: { def: 100 } },
  { label: 'STR : +2%',          weight: 4.255319, stats: { strPct: 2 } },
  { label: 'DEX : +2%',          weight: 4.255319, stats: { dexPct: 2 } },
  { label: 'INT : +2%',          weight: 4.255319, stats: { intPct: 2 } },
  { label: 'LUK : +2%',          weight: 4.255319, stats: { lukPct: 2 } },
  { label: 'Max HP: +2%',        weight: 4.255319, stats: { hpPct: 2 } },
  { label: 'Max MP: +2%',        weight: 4.255319, stats: { mpPct: 2 } },
  { label: 'DEF: +2%',           weight: 4.255319, stats: { defPct: 2 } },
  { label: 'All Stats: +3',      weight: 4.255319, stats: { allStat: 3 } },
]

// 戒指 Lv100+ Epic
const RING_100_EPIC = [
  { label: 'STR : +14',          weight: 6.000000, stats: { str: 14 } },
  { label: 'DEX : +14',          weight: 6.000000, stats: { dex: 14 } },
  { label: 'INT : +14',          weight: 6.000000, stats: { int: 14 } },
  { label: 'LUK : +14',          weight: 6.000000, stats: { luk: 14 } },
  { label: 'Max HP: +150',       weight: 6.000000, stats: { hp: 150 } },
  { label: 'Max MP: +150',       weight: 6.000000, stats: { mp: 150 } },
  { label: 'Movement Speed: +6', weight: 6.000000, stats: { moveSpeed: 6 } },
  { label: 'Jump: +6',           weight: 6.000000, stats: { jump: 6 } },
  { label: 'ATT: +11',           weight: 4.000000, stats: { atk: 11 } },
  { label: 'Magic ATT: +11',     weight: 4.000000, stats: { matk: 11 } },
  { label: 'DEF: +120',          weight: 6.000000, stats: { def: 120 } },
  { label: 'STR : +4%',          weight: 4.000000, stats: { strPct: 4 } },
  { label: 'DEX : +4%',          weight: 4.000000, stats: { dexPct: 4 } },
  { label: 'INT : +4%',          weight: 4.000000, stats: { intPct: 4 } },
  { label: 'LUK : +4%',          weight: 4.000000, stats: { lukPct: 4 } },
  { label: 'Max HP: +5%',        weight: 6.000000, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',        weight: 6.000000, stats: { mpPct: 5 } },
  { label: 'DEF: +4%',           weight: 6.000000, stats: { defPct: 4 } },
  { label: 'All Stats: +2%',     weight: 4.000000, stats: { allStatPct: 2 } },
]

// 戒指 Lv100+ Unique
const RING_100_UNIQUE = [
  { label: 'STR : +16',                          weight: 6.122449, stats: { str: 16 } },
  { label: 'DEX : +16',                          weight: 6.122449, stats: { dex: 16 } },
  { label: 'INT : +16',                          weight: 6.122449, stats: { int: 16 } },
  { label: 'LUK : +16',                          weight: 6.122449, stats: { luk: 16 } },
  { label: 'Max HP: +200',                       weight: 6.122449, stats: { hp: 200 } },
  { label: 'Max MP: +200',                       weight: 6.122449, stats: { mp: 200 } },
  { label: 'ATT: +12',                           weight: 4.081633, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',                     weight: 4.081633, stats: { matk: 12 } },
  { label: 'STR : +5%',                          weight: 4.081633, stats: { strPct: 5 } },
  { label: 'DEX : +5%',                          weight: 4.081633, stats: { dexPct: 5 } },
  { label: 'INT : +5%',                          weight: 4.081633, stats: { intPct: 5 } },
  { label: 'LUK : +5%',                          weight: 4.081633, stats: { lukPct: 5 } },
  { label: 'Max HP: +7%',                        weight: 6.122449, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',                        weight: 6.122449, stats: { mpPct: 7 } },
  { label: 'All Stats: +4%',                     weight: 4.081633, stats: { allStatPct: 4 } },
  { label: 'STR per 10 Character Levels: +1',    weight: 4.081633, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',    weight: 4.081633, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',    weight: 4.081633, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',    weight: 4.081633, stats: { lukPerLv10: 1 } },
  { label: 'HP Recovery Items and Skills: +20%', weight: 6.122449 },
]

// 戒指 Lv100+ Legendary
const RING_100_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.769231, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.769231, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.769231, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.769231, stats: { luk: 18 } },
  { label: 'Max HP: +250',                       weight: 5.769231, stats: { hp: 250 } },
  { label: 'Max MP: +250',                       weight: 5.769231, stats: { mp: 250 } },
  { label: 'ATT: +14',                           weight: 3.846154, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.846154, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.846154, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.846154, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.846154, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.846154, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.769231, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.769231, stats: { mpPct: 10 } },
  { label: 'All Stats: +5%',                     weight: 3.846154, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.846154, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.846154, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.846154, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.846154, stats: { lukPerLv10: 2 } },
  { label: 'Skill MP Cost: -10%',                weight: 5.769231 },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.769231 },
]

// 戒指 Lv110+ Rare — 與 Lv100 相同
const RING_110_RARE = [
  { label: 'STR : +10',          weight: 6.382979, stats: { str: 10 } },
  { label: 'DEX : +10',          weight: 6.382979, stats: { dex: 10 } },
  { label: 'INT : +10',          weight: 6.382979, stats: { int: 10 } },
  { label: 'LUK : +10',          weight: 6.382979, stats: { luk: 10 } },
  { label: 'Max HP: +100',       weight: 6.382979, stats: { hp: 100 } },
  { label: 'Max MP: +100',       weight: 6.382979, stats: { mp: 100 } },
  { label: 'Movement Speed: +5', weight: 6.382979, stats: { moveSpeed: 5 } },
  { label: 'Jump: +5',           weight: 6.382979, stats: { jump: 5 } },
  { label: 'ATT: +10',           weight: 4.255319, stats: { atk: 10 } },
  { label: 'Magic ATT: +10',     weight: 4.255319, stats: { matk: 10 } },
  { label: 'DEF: +100',          weight: 6.382979, stats: { def: 100 } },
  { label: 'STR : +2%',          weight: 4.255319, stats: { strPct: 2 } },
  { label: 'DEX : +2%',          weight: 4.255319, stats: { dexPct: 2 } },
  { label: 'INT : +2%',          weight: 4.255319, stats: { intPct: 2 } },
  { label: 'LUK : +2%',          weight: 4.255319, stats: { lukPct: 2 } },
  { label: 'Max HP: +2%',        weight: 4.255319, stats: { hpPct: 2 } },
  { label: 'Max MP: +2%',        weight: 4.255319, stats: { mpPct: 2 } },
  { label: 'DEF: +2%',           weight: 4.255319, stats: { defPct: 2 } },
  { label: 'All Stats: +3',      weight: 4.255319, stats: { allStat: 3 } },
]

// 戒指 Lv110+ Epic — Max HP/MP +165 (Lv100 為 +150,Lv120 為 +180)
const RING_110_EPIC = [
  { label: 'STR : +14',          weight: 6.000000, stats: { str: 14 } },
  { label: 'DEX : +14',          weight: 6.000000, stats: { dex: 14 } },
  { label: 'INT : +14',          weight: 6.000000, stats: { int: 14 } },
  { label: 'LUK : +14',          weight: 6.000000, stats: { luk: 14 } },
  { label: 'Max HP: +165',       weight: 6.000000, stats: { hp: 165 } },
  { label: 'Max MP: +165',       weight: 6.000000, stats: { mp: 165 } },
  { label: 'Movement Speed: +6', weight: 6.000000, stats: { moveSpeed: 6 } },
  { label: 'Jump: +6',           weight: 6.000000, stats: { jump: 6 } },
  { label: 'ATT: +11',           weight: 4.000000, stats: { atk: 11 } },
  { label: 'Magic ATT: +11',     weight: 4.000000, stats: { matk: 11 } },
  { label: 'DEF: +120',          weight: 6.000000, stats: { def: 120 } },
  { label: 'STR : +4%',          weight: 4.000000, stats: { strPct: 4 } },
  { label: 'DEX : +4%',          weight: 4.000000, stats: { dexPct: 4 } },
  { label: 'INT : +4%',          weight: 4.000000, stats: { intPct: 4 } },
  { label: 'LUK : +4%',          weight: 4.000000, stats: { lukPct: 4 } },
  { label: 'Max HP: +5%',        weight: 6.000000, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',        weight: 6.000000, stats: { mpPct: 5 } },
  { label: 'DEF: +4%',           weight: 6.000000, stats: { defPct: 4 } },
  { label: 'All Stats: +2%',     weight: 4.000000, stats: { allStatPct: 2 } },
]

// 戒指 Lv110+ Unique — Max HP/MP +220 (Lv100 為 +200,Lv120 為 +240)
const RING_110_UNIQUE = [
  { label: 'STR : +16',                          weight: 6.122449, stats: { str: 16 } },
  { label: 'DEX : +16',                          weight: 6.122449, stats: { dex: 16 } },
  { label: 'INT : +16',                          weight: 6.122449, stats: { int: 16 } },
  { label: 'LUK : +16',                          weight: 6.122449, stats: { luk: 16 } },
  { label: 'Max HP: +220',                       weight: 6.122449, stats: { hp: 220 } },
  { label: 'Max MP: +220',                       weight: 6.122449, stats: { mp: 220 } },
  { label: 'ATT: +12',                           weight: 4.081633, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',                     weight: 4.081633, stats: { matk: 12 } },
  { label: 'STR : +5%',                          weight: 4.081633, stats: { strPct: 5 } },
  { label: 'DEX : +5%',                          weight: 4.081633, stats: { dexPct: 5 } },
  { label: 'INT : +5%',                          weight: 4.081633, stats: { intPct: 5 } },
  { label: 'LUK : +5%',                          weight: 4.081633, stats: { lukPct: 5 } },
  { label: 'Max HP: +7%',                        weight: 6.122449, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',                        weight: 6.122449, stats: { mpPct: 7 } },
  { label: 'All Stats: +4%',                     weight: 4.081633, stats: { allStatPct: 4 } },
  { label: 'STR per 10 Character Levels: +1',    weight: 4.081633, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',    weight: 4.081633, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',    weight: 4.081633, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',    weight: 4.081633, stats: { lukPerLv10: 1 } },
  { label: 'HP Recovery Items and Skills: +20%', weight: 6.122449 },
]

// 戒指 Lv110+ Legendary — Max HP/MP +275 (Lv100 為 +250,Lv120 為 +300)
const RING_110_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.769231, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.769231, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.769231, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.769231, stats: { luk: 18 } },
  { label: 'Max HP: +275',                       weight: 5.769231, stats: { hp: 275 } },
  { label: 'Max MP: +275',                       weight: 5.769231, stats: { mp: 275 } },
  { label: 'ATT: +14',                           weight: 3.846154, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.846154, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.846154, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.846154, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.846154, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.846154, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.769231, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.769231, stats: { mpPct: 10 } },
  { label: 'All Stats: +5%',                     weight: 3.846154, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.846154, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.846154, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.846154, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.846154, stats: { lukPerLv10: 2 } },
  { label: 'Skill MP Cost: -10%',                weight: 5.769231 },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.769231 },
]

// 戒指 Lv120+ Rare (Bonus Potential)
const RING_120_RARE = [
  { label: 'STR : +10',          weight: 6.382979, stats: { str: 10 } },
  { label: 'DEX : +10',          weight: 6.382979, stats: { dex: 10 } },
  { label: 'INT : +10',          weight: 6.382979, stats: { int: 10 } },
  { label: 'LUK : +10',          weight: 6.382979, stats: { luk: 10 } },
  { label: 'Max HP: +100',       weight: 6.382979, stats: { hp: 100 } },
  { label: 'Max MP: +100',       weight: 6.382979, stats: { mp: 100 } },
  { label: 'Movement Speed: +6', weight: 6.382979, stats: { moveSpeed: 6 } },
  { label: 'Jump: +6',           weight: 6.382979, stats: { jump: 6 } },
  { label: 'ATT: +10',           weight: 4.255319, stats: { atk: 10 } },
  { label: 'Magic ATT: +10',     weight: 4.255319, stats: { matk: 10 } },
  { label: 'DEF: +100',          weight: 6.382979, stats: { def: 100 } },
  { label: 'STR : +2%',          weight: 4.255319, stats: { strPct: 2 } },
  { label: 'DEX : +2%',          weight: 4.255319, stats: { dexPct: 2 } },
  { label: 'INT : +2%',          weight: 4.255319, stats: { intPct: 2 } },
  { label: 'LUK : +2%',          weight: 4.255319, stats: { lukPct: 2 } },
  { label: 'Max HP: +2%',        weight: 4.255319, stats: { hpPct: 2 } },
  { label: 'Max MP: +2%',        weight: 4.255319, stats: { mpPct: 2 } },
  { label: 'DEF: +2%',           weight: 4.255319, stats: { defPct: 2 } },
  { label: 'All Stats: +3',      weight: 4.255319, stats: { allStat: 3 } },
]

// 戒指 Lv120+ Epic
const RING_120_EPIC = [
  { label: 'STR : +14',          weight: 6.000000, stats: { str: 14 } },
  { label: 'DEX : +14',          weight: 6.000000, stats: { dex: 14 } },
  { label: 'INT : +14',          weight: 6.000000, stats: { int: 14 } },
  { label: 'LUK : +14',          weight: 6.000000, stats: { luk: 14 } },
  { label: 'Max HP: +180',       weight: 6.000000, stats: { hp: 180 } },
  { label: 'Max MP: +180',       weight: 6.000000, stats: { mp: 180 } },
  { label: 'Movement Speed: +8', weight: 6.000000, stats: { moveSpeed: 8 } },
  { label: 'Jump: +8',           weight: 6.000000, stats: { jump: 8 } },
  { label: 'ATT: +11',           weight: 4.000000, stats: { atk: 11 } },
  { label: 'Magic ATT: +11',     weight: 4.000000, stats: { matk: 11 } },
  { label: 'DEF: +120',          weight: 6.000000, stats: { def: 120 } },
  { label: 'STR : +4%',          weight: 4.000000, stats: { strPct: 4 } },
  { label: 'DEX : +4%',          weight: 4.000000, stats: { dexPct: 4 } },
  { label: 'INT : +4%',          weight: 4.000000, stats: { intPct: 4 } },
  { label: 'LUK : +4%',          weight: 4.000000, stats: { lukPct: 4 } },
  { label: 'Max HP: +5%',        weight: 6.000000, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',        weight: 6.000000, stats: { mpPct: 5 } },
  { label: 'DEF: +4%',           weight: 6.000000, stats: { defPct: 4 } },
  { label: 'All Stats: +2%',     weight: 4.000000, stats: { allStatPct: 2 } },
]

// 戒指 Lv120+ Unique
const RING_120_UNIQUE = [
  { label: 'STR : +16',                          weight: 6.122449, stats: { str: 16 } },
  { label: 'DEX : +16',                          weight: 6.122449, stats: { dex: 16 } },
  { label: 'INT : +16',                          weight: 6.122449, stats: { int: 16 } },
  { label: 'LUK : +16',                          weight: 6.122449, stats: { luk: 16 } },
  { label: 'Max HP: +240',                       weight: 6.122449, stats: { hp: 240 } },
  { label: 'Max MP: +240',                       weight: 6.122449, stats: { mp: 240 } },
  { label: 'ATT: +12',                           weight: 4.081633, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',                     weight: 4.081633, stats: { matk: 12 } },
  { label: 'STR : +5%',                          weight: 4.081633, stats: { strPct: 5 } },
  { label: 'DEX : +5%',                          weight: 4.081633, stats: { dexPct: 5 } },
  { label: 'INT : +5%',                          weight: 4.081633, stats: { intPct: 5 } },
  { label: 'LUK : +5%',                          weight: 4.081633, stats: { lukPct: 5 } },
  { label: 'Max HP: +7%',                        weight: 6.122449, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',                        weight: 6.122449, stats: { mpPct: 7 } },
  { label: 'All Stats: +4%',                     weight: 4.081633, stats: { allStatPct: 4 } },
  { label: 'STR per 10 Character Levels: +1',    weight: 4.081633, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',    weight: 4.081633, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',    weight: 4.081633, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',    weight: 4.081633, stats: { lukPerLv10: 1 } },
  { label: 'HP Recovery Items and Skills: +20%', weight: 6.122449 },
]

// 戒指 Lv120+ Legendary
const RING_120_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.769231, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.769231, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.769231, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.769231, stats: { luk: 18 } },
  { label: 'Max HP: +300',                       weight: 5.769231, stats: { hp: 300 } },
  { label: 'Max MP: +300',                       weight: 5.769231, stats: { mp: 300 } },
  { label: 'ATT: +14',                           weight: 3.846154, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.846154, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.846154, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.846154, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.846154, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.846154, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.769231, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.769231, stats: { mpPct: 10 } },
  { label: 'All Stats: +5%',                     weight: 3.846154, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.846154, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.846154, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.846154, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.846154, stats: { lukPerLv10: 2 } },
  { label: 'Skill MP Cost: -10%',                weight: 5.769231 },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.769231 },
]

// 腰帶 Lv120+ Rare — 與戒指 Lv120+ 相同
const BELT_120_RARE = [
  { label: 'STR : +10',          weight: 6.382979, stats: { str: 10 } },
  { label: 'DEX : +10',          weight: 6.382979, stats: { dex: 10 } },
  { label: 'INT : +10',          weight: 6.382979, stats: { int: 10 } },
  { label: 'LUK : +10',          weight: 6.382979, stats: { luk: 10 } },
  { label: 'Max HP: +100',       weight: 6.382979, stats: { hp: 100 } },
  { label: 'Max MP: +100',       weight: 6.382979, stats: { mp: 100 } },
  { label: 'Movement Speed: +6', weight: 6.382979, stats: { moveSpeed: 6 } },
  { label: 'Jump: +6',           weight: 6.382979, stats: { jump: 6 } },
  { label: 'ATT: +10',           weight: 4.255319, stats: { atk: 10 } },
  { label: 'Magic ATT: +10',     weight: 4.255319, stats: { matk: 10 } },
  { label: 'DEF: +100',          weight: 6.382979, stats: { def: 100 } },
  { label: 'STR : +2%',          weight: 4.255319, stats: { strPct: 2 } },
  { label: 'DEX : +2%',          weight: 4.255319, stats: { dexPct: 2 } },
  { label: 'INT : +2%',          weight: 4.255319, stats: { intPct: 2 } },
  { label: 'LUK : +2%',          weight: 4.255319, stats: { lukPct: 2 } },
  { label: 'Max HP: +2%',        weight: 4.255319, stats: { hpPct: 2 } },
  { label: 'Max MP: +2%',        weight: 4.255319, stats: { mpPct: 2 } },
  { label: 'DEF: +2%',           weight: 4.255319, stats: { defPct: 2 } },
  { label: 'All Stats: +3',      weight: 4.255319, stats: { allStat: 3 } },
]

// 腰帶 Lv120+ Epic — 與戒指 Lv120+ 相同
const BELT_120_EPIC = [
  { label: 'STR : +14',          weight: 6.000000, stats: { str: 14 } },
  { label: 'DEX : +14',          weight: 6.000000, stats: { dex: 14 } },
  { label: 'INT : +14',          weight: 6.000000, stats: { int: 14 } },
  { label: 'LUK : +14',          weight: 6.000000, stats: { luk: 14 } },
  { label: 'Max HP: +180',       weight: 6.000000, stats: { hp: 180 } },
  { label: 'Max MP: +180',       weight: 6.000000, stats: { mp: 180 } },
  { label: 'Movement Speed: +8', weight: 6.000000, stats: { moveSpeed: 8 } },
  { label: 'Jump: +8',           weight: 6.000000, stats: { jump: 8 } },
  { label: 'ATT: +11',           weight: 4.000000, stats: { atk: 11 } },
  { label: 'Magic ATT: +11',     weight: 4.000000, stats: { matk: 11 } },
  { label: 'DEF: +120',          weight: 6.000000, stats: { def: 120 } },
  { label: 'STR : +4%',          weight: 4.000000, stats: { strPct: 4 } },
  { label: 'DEX : +4%',          weight: 4.000000, stats: { dexPct: 4 } },
  { label: 'INT : +4%',          weight: 4.000000, stats: { intPct: 4 } },
  { label: 'LUK : +4%',          weight: 4.000000, stats: { lukPct: 4 } },
  { label: 'Max HP: +5%',        weight: 6.000000, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',        weight: 6.000000, stats: { mpPct: 5 } },
  { label: 'DEF: +4%',           weight: 6.000000, stats: { defPct: 4 } },
  { label: 'All Stats: +2%',     weight: 4.000000, stats: { allStatPct: 2 } },
]

// 腰帶 Lv120+ Unique — 與戒指 Lv120+ 相同
const BELT_120_UNIQUE = [
  { label: 'STR : +16',                          weight: 6.122449, stats: { str: 16 } },
  { label: 'DEX : +16',                          weight: 6.122449, stats: { dex: 16 } },
  { label: 'INT : +16',                          weight: 6.122449, stats: { int: 16 } },
  { label: 'LUK : +16',                          weight: 6.122449, stats: { luk: 16 } },
  { label: 'Max HP: +240',                       weight: 6.122449, stats: { hp: 240 } },
  { label: 'Max MP: +240',                       weight: 6.122449, stats: { mp: 240 } },
  { label: 'ATT: +12',                           weight: 4.081633, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',                     weight: 4.081633, stats: { matk: 12 } },
  { label: 'STR : +5%',                          weight: 4.081633, stats: { strPct: 5 } },
  { label: 'DEX : +5%',                          weight: 4.081633, stats: { dexPct: 5 } },
  { label: 'INT : +5%',                          weight: 4.081633, stats: { intPct: 5 } },
  { label: 'LUK : +5%',                          weight: 4.081633, stats: { lukPct: 5 } },
  { label: 'Max HP: +7%',                        weight: 6.122449, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',                        weight: 6.122449, stats: { mpPct: 7 } },
  { label: 'All Stats: +4%',                     weight: 4.081633, stats: { allStatPct: 4 } },
  { label: 'STR per 10 Character Levels: +1',    weight: 4.081633, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',    weight: 4.081633, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',    weight: 4.081633, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',    weight: 4.081633, stats: { lukPerLv10: 1 } },
  { label: 'HP Recovery Items and Skills: +20%', weight: 6.122449 },
]

// 腰帶 Lv120+ Legendary — 與戒指略有不同 (新增 Critical Damage 選項,無 Skill MP Cost)
const BELT_120_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.882353, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.882353, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.882353, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.882353, stats: { luk: 18 } },
  { label: 'Max HP: +300',                       weight: 5.882353, stats: { hp: 300 } },
  { label: 'Max MP: +300',                       weight: 5.882353, stats: { mp: 300 } },
  { label: 'ATT: +14',                           weight: 3.921569, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.921569, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.921569, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.921569, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.921569, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.921569, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.882353, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.882353, stats: { mpPct: 10 } },
  { label: 'Critical Damage: +1%',               weight: 3.921569, stats: { critDmg: 1 } },
  { label: 'All Stats: +5%',                     weight: 3.921569, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.921569, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.921569, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.921569, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.921569, stats: { lukPerLv10: 2 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.882353 },
]

// 帽子 (Hat) Lv120+ Legendary (Bonus Potential) — 比上衣/下身多「Skill Cooldown -1 sec」
// RARE / EPIC / UNIQUE 與上衣同池,僅 LEGENDARY 獨立
const HAT_120_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.555556, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.555556, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.555556, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.555556, stats: { luk: 18 } },
  { label: 'Max HP: +300',                       weight: 5.555556, stats: { hp: 300 } },
  { label: 'Max MP: +300',                       weight: 5.555556, stats: { mp: 300 } },
  { label: 'ATT: +14',                           weight: 3.703704, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.703704, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.703704, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.703704, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.703704, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.703704, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.555556, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.555556, stats: { mpPct: 10 } },
  { label: 'Critical Damage: +1%',               weight: 3.703704, stats: { critDmg: 1 } },
  { label: 'All Stats: +5%',                     weight: 3.703704, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.703704, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.703704, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.703704, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.703704, stats: { lukPerLv10: 2 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.555556 },
  { label: 'Skill Cooldown: -1 sec (-5% for under 10 sec, minimum cooldown of 5 sec)', weight: 5.555556, stats: { cooldownReductionSec: -1 } },
]

// 手套 (Glove) Lv120+ Legendary (Bonus Potential)
// RARE / EPIC / UNIQUE 與戒指 Lv120 相同 → 共用;LEGENDARY 手套帶 Critical Damage +1%
const GLOVE_120_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.660377, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.660377, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.660377, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.660377, stats: { luk: 18 } },
  { label: 'Max HP: +300',                       weight: 5.660377, stats: { hp: 300 } },
  { label: 'Max MP: +300',                       weight: 5.660377, stats: { mp: 300 } },
  { label: 'ATT: +14',                           weight: 3.773585, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.773585, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.773585, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.773585, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.773585, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.773585, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.660377, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.660377, stats: { mpPct: 10 } },
  { label: 'Critical Damage: +3%',               weight: 3.773585, stats: { critDmg: 3 } },
  { label: 'Critical Damage: +1%',               weight: 3.773585, stats: { critDmg: 1 } },
  { label: 'All Stats: +5%',                     weight: 3.773585, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.773585, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.773585, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.773585, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.773585, stats: { lukPerLv10: 2 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.660377 },
]

// 上衣 (Top) Lv120+ Rare (Bonus Potential) — 來源 MSU 官方 probability API
//   GET /maplestoryn/api/msn/probability?cubeType=CubeType_BONUS_POTENTIAL
//     &partsType=PartsType_TOP&equipLevel=120&gradeType=<tier>
const TOP_120_RARE = [
  { label: 'STR : +10',          weight: 6.382979, stats: { str: 10 } },
  { label: 'DEX : +10',          weight: 6.382979, stats: { dex: 10 } },
  { label: 'INT : +10',          weight: 6.382979, stats: { int: 10 } },
  { label: 'LUK : +10',          weight: 6.382979, stats: { luk: 10 } },
  { label: 'Max HP: +100',       weight: 6.382979, stats: { hp: 100 } },
  { label: 'Max MP: +100',       weight: 6.382979, stats: { mp: 100 } },
  { label: 'Movement Speed: +6', weight: 6.382979, stats: { moveSpeed: 6 } },
  { label: 'Jump: +6',           weight: 6.382979, stats: { jump: 6 } },
  { label: 'ATT: +10',           weight: 4.255319, stats: { atk: 10 } },
  { label: 'Magic ATT: +10',     weight: 4.255319, stats: { matk: 10 } },
  { label: 'DEF: +100',          weight: 6.382979, stats: { def: 100 } },
  { label: 'STR : +2%',          weight: 4.255319, stats: { strPct: 2 } },
  { label: 'DEX : +2%',          weight: 4.255319, stats: { dexPct: 2 } },
  { label: 'INT : +2%',          weight: 4.255319, stats: { intPct: 2 } },
  { label: 'LUK : +2%',          weight: 4.255319, stats: { lukPct: 2 } },
  { label: 'Max HP: +2%',        weight: 4.255319, stats: { hpPct: 2 } },
  { label: 'Max MP: +2%',        weight: 4.255319, stats: { mpPct: 2 } },
  { label: 'DEF: +2%',           weight: 4.255319, stats: { defPct: 2 } },
  { label: 'All Stats: +3',      weight: 4.255319, stats: { allStat: 3 } },
]

// 上衣 Lv120+ Epic (Bonus Potential)
const TOP_120_EPIC = [
  { label: 'STR : +14',          weight: 6.000000, stats: { str: 14 } },
  { label: 'DEX : +14',          weight: 6.000000, stats: { dex: 14 } },
  { label: 'INT : +14',          weight: 6.000000, stats: { int: 14 } },
  { label: 'LUK : +14',          weight: 6.000000, stats: { luk: 14 } },
  { label: 'Max HP: +180',       weight: 6.000000, stats: { hp: 180 } },
  { label: 'Max MP: +180',       weight: 6.000000, stats: { mp: 180 } },
  { label: 'Movement Speed: +8', weight: 6.000000, stats: { moveSpeed: 8 } },
  { label: 'Jump: +8',           weight: 6.000000, stats: { jump: 8 } },
  { label: 'ATT: +11',           weight: 4.000000, stats: { atk: 11 } },
  { label: 'Magic ATT: +11',     weight: 4.000000, stats: { matk: 11 } },
  { label: 'DEF: +120',          weight: 6.000000, stats: { def: 120 } },
  { label: 'STR : +4%',          weight: 4.000000, stats: { strPct: 4 } },
  { label: 'DEX : +4%',          weight: 4.000000, stats: { dexPct: 4 } },
  { label: 'INT : +4%',          weight: 4.000000, stats: { intPct: 4 } },
  { label: 'LUK : +4%',          weight: 4.000000, stats: { lukPct: 4 } },
  { label: 'Max HP: +5%',        weight: 6.000000, stats: { hpPct: 5 } },
  { label: 'Max MP: +5%',        weight: 6.000000, stats: { mpPct: 5 } },
  { label: 'DEF: +4%',           weight: 6.000000, stats: { defPct: 4 } },
  { label: 'All Stats: +2%',     weight: 4.000000, stats: { allStatPct: 2 } },
]

// 上衣 Lv120+ Unique (Bonus Potential)
const TOP_120_UNIQUE = [
  { label: 'STR : +16',                          weight: 6.122449, stats: { str: 16 } },
  { label: 'DEX : +16',                          weight: 6.122449, stats: { dex: 16 } },
  { label: 'INT : +16',                          weight: 6.122449, stats: { int: 16 } },
  { label: 'LUK : +16',                          weight: 6.122449, stats: { luk: 16 } },
  { label: 'Max HP: +240',                       weight: 6.122449, stats: { hp: 240 } },
  { label: 'Max MP: +240',                       weight: 6.122449, stats: { mp: 240 } },
  { label: 'ATT: +12',                           weight: 4.081633, stats: { atk: 12 } },
  { label: 'Magic ATT: +12',                     weight: 4.081633, stats: { matk: 12 } },
  { label: 'STR : +5%',                          weight: 4.081633, stats: { strPct: 5 } },
  { label: 'DEX : +5%',                          weight: 4.081633, stats: { dexPct: 5 } },
  { label: 'INT : +5%',                          weight: 4.081633, stats: { intPct: 5 } },
  { label: 'LUK : +5%',                          weight: 4.081633, stats: { lukPct: 5 } },
  { label: 'Max HP: +7%',                        weight: 6.122449, stats: { hpPct: 7 } },
  { label: 'Max MP: +7%',                        weight: 6.122449, stats: { mpPct: 7 } },
  { label: 'All Stats: +4%',                     weight: 4.081633, stats: { allStatPct: 4 } },
  { label: 'STR per 10 Character Levels: +1',    weight: 4.081633, stats: { strPerLv10: 1 } },
  { label: 'DEX per 10 Character Levels: +1',    weight: 4.081633, stats: { dexPerLv10: 1 } },
  { label: 'INT per 10 Character Levels: +1',    weight: 4.081633, stats: { intPerLv10: 1 } },
  { label: 'LUK per 10 Character Levels: +1',    weight: 4.081633, stats: { lukPerLv10: 1 } },
  { label: 'HP Recovery Items and Skills: +20%', weight: 6.122449 },
]

// 上衣 Lv120+ Legendary (Bonus Potential)
const TOP_120_LEGENDARY = [
  { label: 'STR : +18',                          weight: 5.882353, stats: { str: 18 } },
  { label: 'DEX : +18',                          weight: 5.882353, stats: { dex: 18 } },
  { label: 'INT : +18',                          weight: 5.882353, stats: { int: 18 } },
  { label: 'LUK : +18',                          weight: 5.882353, stats: { luk: 18 } },
  { label: 'Max HP: +300',                       weight: 5.882353, stats: { hp: 300 } },
  { label: 'Max MP: +300',                       weight: 5.882353, stats: { mp: 300 } },
  { label: 'ATT: +14',                           weight: 3.921569, stats: { atk: 14 } },
  { label: 'Magic ATT: +14',                     weight: 3.921569, stats: { matk: 14 } },
  { label: 'STR : +7%',                          weight: 3.921569, stats: { strPct: 7 } },
  { label: 'DEX : +7%',                          weight: 3.921569, stats: { dexPct: 7 } },
  { label: 'INT : +7%',                          weight: 3.921569, stats: { intPct: 7 } },
  { label: 'LUK : +7%',                          weight: 3.921569, stats: { lukPct: 7 } },
  { label: 'Max HP: +10%',                       weight: 5.882353, stats: { hpPct: 10 } },
  { label: 'Max MP: +10%',                       weight: 5.882353, stats: { mpPct: 10 } },
  { label: 'Critical Damage: +1%',               weight: 3.921569, stats: { critDmg: 1 } },
  { label: 'All Stats: +5%',                     weight: 3.921569, stats: { allStatPct: 5 } },
  { label: 'STR per 10 Character Levels: +2',    weight: 3.921569, stats: { strPerLv10: 2 } },
  { label: 'DEX per 10 Character Levels: +2',    weight: 3.921569, stats: { dexPerLv10: 2 } },
  { label: 'INT per 10 Character Levels: +2',    weight: 3.921569, stats: { intPerLv10: 2 } },
  { label: 'LUK per 10 Character Levels: +2',    weight: 3.921569, stats: { lukPerLv10: 2 } },
  { label: 'HP Recovery Items and Skills: +30%', weight: 5.882353 },
]

export const BONUS_POTENTIAL_POOLS = {
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
      // line 2/3 額外降級選項 — Rare 沒有「下一階」可疊,改用此特殊池(MSU API line 2 規則)
      rareLine23Extra: WEAPON_120_RARE_LINE23_EXTRA,
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
  // Pendant Lv120+ 附加潛能與戒指 Lv120 完全相同
  pendant: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: RING_120_LEGENDARY,
    },
  },
  // 臉部裝飾 Lv110+ 附加潛能與戒指 Lv110 完全相同 (MSU API 驗證)
  face: {
    110: {
      rare:      RING_110_RARE,
      epic:      RING_110_EPIC,
      unique:    RING_110_UNIQUE,
      legendary: RING_110_LEGENDARY,
    },
  },
  // 鞋子 / 肩飾 / 披風 Lv120+ 附加潛能 — 全部 RARE/EPIC/UNIQUE 與戒指 Lv120 同池,LEGENDARY 與手套同池 (帶 Critical Damage)
  shoes: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: GLOVE_120_LEGENDARY,
    },
  },
  shoulder: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: GLOVE_120_LEGENDARY,
    },
  },
  cape: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: GLOVE_120_LEGENDARY,
    },
  },
  // 手套 Lv120+ 附加潛能 — RARE/EPIC/UNIQUE 與戒指 Lv120 同池,LEGENDARY 為手套專用 (帶 Critical Damage)
  glove: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: GLOVE_120_LEGENDARY,
    },
  },
  // 徽章 Lv100+ 附加潛能 — RARE/EPIC 與武器同池,UNIQUE/LEGENDARY 為徽章專用 (無 Boss Damage)
  emblem: {
    100: {
      rare:      WEAPON_100_RARE,
      epic:      WEAPON_100_EPIC,
      unique:    EMBLEM_100_UNIQUE,
      legendary: EMBLEM_100_LEGENDARY,
    },
  },
  // 眼飾 Lv120+ 附加潛能與戒指 Lv120 完全相同 (MSU API 驗證)
  eye: {
    120: {
      rare:      RING_120_RARE,
      epic:      RING_120_EPIC,
      unique:    RING_120_UNIQUE,
      legendary: RING_120_LEGENDARY,
    },
  },
  // 耳環 Lv100/110/120+ 附加潛能與戒指完全相同 (MSU API 驗證)
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
  // 上衣 Lv120+ (四階完整)
  top: {
    120: {
      rare:      TOP_120_RARE,
      epic:      TOP_120_EPIC,
      unique:    TOP_120_UNIQUE,
      legendary: TOP_120_LEGENDARY,
    },
  },
  // 下身 Lv120+ 附加潛能與上衣 Lv120 完全相同 → 共用資料
  bottom: {
    120: {
      rare:      TOP_120_RARE,
      epic:      TOP_120_EPIC,
      unique:    TOP_120_UNIQUE,
      legendary: TOP_120_LEGENDARY,
    },
  },
  // 帽子 Lv120+ 附加潛能 — RARE/EPIC/UNIQUE 與上衣同,LEGENDARY 獨立 (多 Skill Cooldown)
  hat: {
    120: {
      rare:      TOP_120_RARE,
      epic:      TOP_120_EPIC,
      unique:    TOP_120_UNIQUE,
      legendary: HAT_120_LEGENDARY,
    },
  },
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
  if (lineIndex === 0) return base
  // line 2/3:
  //   - tier > rare:疊加「下一階」主池
  //   - tier === rare:無下一階可疊,但 MSU API 在 Rare 的 line 2/3 會多出一組「半階」降級值
  //                    若該分類在該等級有定義 rareLine23Extra,套用之
  if (tierIdx === 0) {
    const extra = pool.rareLine23Extra || []
    return [...base, ...extra]
  }
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
