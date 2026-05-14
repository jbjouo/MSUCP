// 活動 EVENT 加成
//
// 5 個獨立技能,各 0-5 等。每等的數值由 valueAt(lv) 直接回傳
// 最終 stat bag。CP 計算與戰鬥模擬都會吃這些值。
//
// 設計慣例:
//   - 每個技能 emit 一筆 contribution(避免 ignoreDef 被 combineIgnorePct
//     誤拆,讓「同技能相加」成立)
//   - allStat 直接展開為 str/dex/int/luk 4 鍵,走一般非 fixed 路徑(吃 %)
//   - 全部數值非 fixed(可吃 %)
//
// id          — 唯一 id
// labelKey    — i18n 鍵
// maxLevel    — 5
// valueAt(lv) — { statKey: value, ... }

export const EVENT_MAX_LEVEL = 5

export const EVENT_SKILLS = [
  {
    id: 'att',
    labelKey: 'event.skills.att',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ atk: lv * 5, matk: lv * 5 }),
  },
  {
    id: 'bossDmg',
    labelKey: 'event.skills.bossDmg',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ bossDmg: lv * 5 }),
  },
  {
    id: 'ignoreDef',
    labelKey: 'event.skills.ignoreDef',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ ignoreDef: lv * 5 }),
  },
  {
    id: 'allStat',
    labelKey: 'event.skills.allStat',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({
      str: lv * 10,
      dex: lv * 10,
      int: lv * 10,
      luk: lv * 10,
    }),
  },
  {
    id: 'buffDuration',
    labelKey: 'event.skills.buffDuration',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ buffDuration: lv * 5 }),
  },
]

export const EVENT_SKILLS_BY_ID = Object.fromEntries(
  EVENT_SKILLS.map((s) => [s.id, s]),
)
