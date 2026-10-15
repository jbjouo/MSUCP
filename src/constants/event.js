// 活動 EVENT 加成
//
// 5 個獨立技能,各 0-10 等。每等的數值由 valueAt(lv) 直接回傳
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
// maxLevel    — 10
// valueAt(lv) — { statKey: value, ... }

export const EVENT_MAX_LEVEL = 10

export const EVENT_SKILLS = [
  {
    id: 'normalMobDmg',
    labelKey: 'event.skills.normalMobDmg',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ normalMobDmg: lv }),
  },
  {
    id: 'ignoreDef',
    labelKey: 'event.skills.ignoreDef',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ ignoreDef: lv }),
  },
  {
    id: 'att',
    labelKey: 'event.skills.att',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ atk: lv, matk: lv }),
  },
  {
    id: 'allStat',
    labelKey: 'event.skills.allStat',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({
      str: lv * 2,
      dex: lv * 2,
      int: lv * 2,
      luk: lv * 2,
    }),
  },
  {
    id: 'bonusExp',
    labelKey: 'event.skills.bonusExp',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ bonusExp: lv }),
  },
]

export const EVENT_SKILLS_BY_ID = Object.fromEntries(
  EVENT_SKILLS.map((s) => [s.id, s]),
)
