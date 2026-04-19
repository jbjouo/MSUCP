// NFT 圖鑑 (Collection Effect) 定義
//
// 每項屬性 0-25 等;等級 × 每級增量 = 目前加成。
// 大多數屬性為線性 (max / 25 = 每級增量);少數例外 (如 DEF Ignored / Critical Rate)
// 使用者回報為「不規則」,可透過 perLevel 陣列覆寫。

export const MAX_COLLECTION_LEVEL = 25

// 圖鑑套裝 — 每存到一個套裝給 +5 全屬性
export const COLLECTION_SET_BONUS = 5
export const COLLECTION_SET_MAX = 999
export function collectionSetBonus(count) {
  const n = Math.max(0, Math.min(COLLECTION_SET_MAX, Math.floor(Number(count) || 0)))
  return n * COLLECTION_SET_BONUS
}

// 不規則成長型 (DEF Ignored / Critical Rate) — 使用者提供的對照表:
//   Collection tier → 對應圖鑑等級 → 每級 %
//   1  (lv 1-2)   +1% per lv
//   2  (lv 3-4)   +2% per lv
//   3  (lv 5-6)   +1% per lv
//   4  (lv 7-8)   +2% per lv
//   5  (lv 9-10)  +1% per lv
//   6  (lv 11-12) +2% per lv
//   7  (lv 13-14) +1% per lv
//   8  (lv 15-16) +2% per lv
//   9  (lv 17-18) +1% per lv
//   10 (lv 19-20) +2% per lv
//   11 (lv 21-22) +1% per lv
//   12 (lv 23-25) +2% per lv  ← 最後一階 3 個等級
// 累加後 Lv25 = 38%,符合遊戲內最大值。
export const IRREGULAR_PCT_CURVE = (() => {
  const tiers = [
    [1, 2], [2, 2], [1, 2], [2, 2], [1, 2], [2, 2],
    [1, 2], [2, 2], [1, 2], [2, 2], [1, 2], [2, 3],
  ]
  const out = []
  let total = 0
  for (const [growth, count] of tiers) {
    for (let i = 0; i < count; i++) {
      total += growth
      out.push(total)
    }
  }
  return out // [1,2,4,6,7,8,10,12,13,14,16,18,19,20,22,24,25,26,28,30,31,32,34,36,38]
})()

// isPct: true → 顯示為百分比 (進入 PCT_KEYS 類 stat 累加)
// perLevel?: 長度 25 的陣列,覆寫線性計算 (未指定 → 線性 max / 25)
export const COLLECTION_STATS = [
  { key: 'str',            labelKey: 'collection.stats.str',            maxValue: 500,  isPct: false },
  { key: 'dex',            labelKey: 'collection.stats.dex',            maxValue: 500,  isPct: false },
  { key: 'int',            labelKey: 'collection.stats.int',            maxValue: 500,  isPct: false },
  { key: 'luk',            labelKey: 'collection.stats.luk',            maxValue: 500,  isPct: false },
  { key: 'hp',             labelKey: 'collection.stats.hp',             maxValue: 2000, isPct: false },
  { key: 'mp',             labelKey: 'collection.stats.mp',             maxValue: 2000, isPct: false },
  { key: 'hpPct',          labelKey: 'collection.stats.hpPct',          maxValue: 25,   isPct: true  },
  { key: 'mpPct',          labelKey: 'collection.stats.mpPct',          maxValue: 25,   isPct: true  },
  { key: 'atk',            labelKey: 'collection.stats.atk',            maxValue: 50,   isPct: false },
  { key: 'matk',           labelKey: 'collection.stats.matk',           maxValue: 50,   isPct: false },
  { key: 'dmgPct',         labelKey: 'collection.stats.dmgPct',         maxValue: 25,   isPct: true  },
  { key: 'bossDmg',        labelKey: 'collection.stats.bossDmg',        maxValue: 25,   isPct: true  },
  { key: 'abnormalResist', labelKey: 'collection.stats.abnormalResist', maxValue: 25,   isPct: false },
  { key: 'ignoreDef',      labelKey: 'collection.stats.ignoreDef',      maxValue: 38,   isPct: true, perLevel: IRREGULAR_PCT_CURVE },
  { key: 'critRate',       labelKey: 'collection.stats.critRate',       maxValue: 38,   isPct: true, perLevel: IRREGULAR_PCT_CURVE },
  { key: 'critDmg',        labelKey: 'collection.stats.critDmg',        maxValue: 25,   isPct: true  },
]

export const COLLECTION_STATS_BY_KEY = Object.fromEntries(
  COLLECTION_STATS.map((s) => [s.key, s]),
)

// 以線性規則計算某項屬性在 level 等的數值
export function collectionValueAt(stat, level) {
  if (!stat || !level) return 0
  const lv = Math.max(0, Math.min(MAX_COLLECTION_LEVEL, Math.floor(level)))
  if (Array.isArray(stat.perLevel) && stat.perLevel[lv - 1] != null) {
    return stat.perLevel[lv - 1]
  }
  const raw = (stat.maxValue / MAX_COLLECTION_LEVEL) * lv
  if (stat.isPct) return Math.round(raw * 100) / 100
  return Math.floor(raw)
}
