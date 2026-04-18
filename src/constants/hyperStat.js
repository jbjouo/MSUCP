// Hyper Stat 極限屬性
//
// 參考:https://strategywiki.org/wiki/MapleStory/Hyper_Stats
// - 從 Lv140 解鎖,每升級獲得 floor((lv - 140) / 10 + 3) 點
//   (lv 140-149: 3/lv → lv 150-159: 4/lv → ... lv 250: 14/lv)
// - 每個 stat 的升級 cost 通用:[1,2,4,8,10,15,20,25,30,35,50,65,80,95,110]
// - Lv 1-10 合計 150 點、Lv 1-15 合計 550 點

export const HYPER_STAT_UNLOCK_LEVEL = 140
export const HYPER_STAT_COSTS = [1, 2, 4, 8, 10, 15, 20, 25, 30, 35, 50, 65, 80, 95, 110]

// 到達 charLevel 時累計獲得的點數
export function hyperPointsAtLevel(charLevel) {
  if (!charLevel || charLevel < HYPER_STAT_UNLOCK_LEVEL) return 0
  let total = 0
  for (let lv = HYPER_STAT_UNLOCK_LEVEL; lv <= charLevel; lv++) {
    total += Math.floor((lv - HYPER_STAT_UNLOCK_LEVEL) / 10) + 3
  }
  return total
}

// 升到 level 所需累計點數
export function hyperCumulativeCost(level) {
  let sum = 0
  for (let i = 0; i < level && i < HYPER_STAT_COSTS.length; i++) sum += HYPER_STAT_COSTS[i]
  return sum
}

// 定義
//   id          — 唯一 id
//   labelKey    — i18n 鍵
//   maxLevel    — 可到達的最大等級
//   fixed?      — true = 產生的 flat 屬性不吃 % 加成 (例:STR/DEX/INT/LUK)
//   valueAt(lv) — 回傳 stat bag { statKey: value } 表示該等級的最終值
export const HYPER_STATS = [
  { id: 'str',          labelKey: 'hyperStat.stats.str',          maxLevel: 15, fixed: true, valueAt: (lv) => ({ str: lv * 30 }) },
  { id: 'dex',          labelKey: 'hyperStat.stats.dex',          maxLevel: 15, fixed: true, valueAt: (lv) => ({ dex: lv * 30 }) },
  { id: 'int',          labelKey: 'hyperStat.stats.int',          maxLevel: 15, fixed: true, valueAt: (lv) => ({ int: lv * 30 }) },
  { id: 'luk',          labelKey: 'hyperStat.stats.luk',          maxLevel: 15, fixed: true, valueAt: (lv) => ({ luk: lv * 30 }) },
  { id: 'hp',           labelKey: 'hyperStat.stats.hp',           maxLevel: 15, valueAt: (lv) => ({ hpPct: lv * 2 }) },
  { id: 'mp',           labelKey: 'hyperStat.stats.mp',           maxLevel: 15, valueAt: (lv) => ({ mpPct: lv * 2 }) },
  // 非線性累計:+1%/lv L1-5、+2%/lv L6-15
  { id: 'critRate',     labelKey: 'hyperStat.stats.critRate',     maxLevel: 15, valueAt: (lv) => ({ critRate: [0,1,2,3,4,5,7,9,11,13,15,17,19,21,23,25][lv] || 0 }) },
  { id: 'critDmg',      labelKey: 'hyperStat.stats.critDmg',      maxLevel: 15, valueAt: (lv) => ({ critDmg: lv * 1 }) },
  { id: 'ignoreDef',    labelKey: 'hyperStat.stats.ignoreDef',    maxLevel: 15, valueAt: (lv) => ({ ignoreDef: lv * 3 }) },
  { id: 'damage',       labelKey: 'hyperStat.stats.damage',       maxLevel: 15, valueAt: (lv) => ({ dmgPct: lv * 3 }) },
  // 非線性累計:+3%/lv L1-5、+4%/lv L6-15
  { id: 'bossDmg',      labelKey: 'hyperStat.stats.bossDmg',      maxLevel: 15, valueAt: (lv) => ({ bossDmg: [0,3,6,9,12,15,19,23,27,31,35,39,43,47,51,55][lv] || 0 }) },
  { id: 'normalMobDmg', labelKey: 'hyperStat.stats.normalMobDmg', maxLevel: 15, valueAt: (lv) => ({ normalMobDmg: [0,3,6,9,12,15,19,23,27,31,35,39,43,47,51,55][lv] || 0 }) },
  // +1/lv L1-5、+2/lv L6-10,最大 Lv10
  { id: 'abnormalResist', labelKey: 'hyperStat.stats.abnormalResist', maxLevel: 10, valueAt: (lv) => ({ abnormalResist: [0,1,2,3,4,5,7,9,11,13,15][lv] || 0 }) },
  { id: 'attMatk',      labelKey: 'hyperStat.stats.attMatk',      maxLevel: 10, valueAt: (lv) => ({ atk: lv * 3, matk: lv * 3 }) },
  // +0.5%/lv L1-10、+1%/lv L11-15
  { id: 'bonusExp',     labelKey: 'hyperStat.stats.bonusExp',     maxLevel: 15, valueAt: (lv) => ({ bonusExp: [0,0.5,1,1.5,2,2.5,3,3.5,4,4.5,5,6,7,8,9,10][lv] || 0 }) },
]

export const HYPER_STATS_BY_ID = Object.fromEntries(HYPER_STATS.map((s) => [s.id, s]))
