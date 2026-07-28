// 戰鬥模擬器 — 目標對象 (Enemy) 設定

export const ENEMY_TYPES = ['boss', 'normal']

// 首領對屬性傷害的反應 (Elemental Damage Taken)
// full: 100% (與一般怪物相同);half: 50% (首領通常如此);none: 0% (完全無效)
export const ELEMENTAL_DMG_OPTIONS = ['full', 'half', 'none']
// 怪物屬性耐性 % (對應 ELEMENTAL_DMG_OPTIONS)
// full → 0% 耐性 (全額吃);half → 50% 耐性 (減半);none → 100% 耐性 (不吃屬性傷害)
export const ENEMY_ELEM_RESIST_PCT = { full: 0, half: 50, none: 100 }

// 職業的「無視屬性耐性」% (會套到自身屬性技能上)
// 火毒 Element Amplification 大招被動 -10% (對火/毒屬性)
// 主教 Righteously Indignant hyper 被動 Elemental Resistance -10% (對聖屬)
export const ELEM_IGNORE_BY_JOB = {
  archmageFP: 10,
  archmageIL: 10,
  bishop: 10,
}

// ARC 比值對照表 (自身 ARC / 怪物 ARC)
// 每一區間 → 攻擊方「終傷」加成 (%) 與受擊方「被擊傷害」加成 (%)
export const ARC_RATIO_TABLE = [
  { min: 0,   max: 9,   finalDmg: 10,  damageTaken: 280 },
  { min: 10,  max: 29,  finalDmg: 30,  damageTaken: 240 },
  { min: 30,  max: 49,  finalDmg: 60,  damageTaken: 180 },
  { min: 50,  max: 69,  finalDmg: 70,  damageTaken: 160 },
  { min: 70,  max: 99,  finalDmg: 80,  damageTaken: 140 },
  { min: 100, max: 109, finalDmg: 100, damageTaken: 100 },
  { min: 110, max: 129, finalDmg: 110, damageTaken: 80  },
  { min: 130, max: 149, finalDmg: 130, damageTaken: 40  },
  { min: 150, max: Number.POSITIVE_INFINITY, finalDmg: 150, damageTaken: 0 },
]

// 回傳 { ratioPct, finalDmg, damageTaken } — 怪物 ARC=0 視為無 ARC 需求(比值 999)
export function arcRatioLookup(playerArc, bossArc) {
  const pa = Math.max(0, Math.floor(Number(playerArc) || 0))
  const ba = Math.max(0, Math.floor(Number(bossArc) || 0))
  const ratioPct = ba > 0
    ? Math.floor((pa / ba) * 100)
    : pa > 0 ? 999 : 0
  for (const row of ARC_RATIO_TABLE) {
    if (ratioPct >= row.min && ratioPct <= row.max) {
      return { ratioPct, finalDmg: row.finalDmg, damageTaken: row.damageTaken }
    }
  }
  // fallback (不該發生)
  return { ratioPct, finalDmg: 100, damageTaken: 100 }
}

export const DEFAULT_ENEMY_SETTINGS = {
  type: 'boss',
  level: 230,
  defense: 300,
  elementalDmg: 'half',
  bossArc: 1000,
}

// 等差 (角色等級 − 怪物等級) → 主擊終傷修正 %
//   ≥ +5    : 封頂 +20%
//    0 ~ +5 : +10% + diff × 2%   (每 +1 等差 +2%)
//    0 → -4 : 階梯 +10 / +5 / 0 / -5 / -10 (每降 1 等差 -5%)
//   -5 ~ -40: -10% − (|diff|-4) × 2.5%  (每降 1 等差 -2.5%)
//   ≤ -40   : 封底 -100% (×0,打不動)
// 僅套用於「主擊」— DoT 有另一套等差減傷機制,不適用本表。
export function levelDiffFinalDmgPct(charLevel, enemyLevel) {
  const cl = Math.floor(Number(charLevel) || 0)
  const el = Math.floor(Number(enemyLevel) || 0)
  const diff = cl - el
  if (diff >= 5) return 20
  if (diff >= 0) return 10 + diff * 2
  if (diff === -1) return 5
  if (diff === -2) return 0
  if (diff === -3) return -5
  if (diff === -4) return -10
  if (diff <= -40) return -100
  return -10 - (Math.abs(diff) - 4) * 2.5
}
