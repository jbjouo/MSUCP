// 活動 EVENT 加成 — Alliance Boost Buff(新版)
//
// 每個效果為獨立技能(skillId 80003189~80003198),各自配點 0~5 級。
// 只收錄 CP / 傷害計算需要的效果 + Buff Duration;不收:Max HP/MP、Normal Enemy Damage、
//   Arcane Power、Bonus EXP
//
// 設計慣例:
//   - 每個效果 emit 一筆 contribution(ignoreDef 單一來源,不被 combineIgnorePct 誤拆)
//   - allStat 直接展開為 str/dex/int/luk 4 鍵,走一般非 fixed 路徑(吃 %)
//
// id          — 唯一 id
// labelKey    — i18n 鍵
// maxLevel    — 5
// valueAt(lv) — 等級 lv 的 stat bag

export const EVENT_MAX_LEVEL = 5

export const EVENT_SKILLS = [
  {
    id: 'att',
    labelKey: 'event.skills.att',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ atk: 5 * lv, matk: 5 * lv }),
  },
  {
    id: 'bossDmg',
    labelKey: 'event.skills.bossDmg',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ bossDmg: 5 * lv }),
  },
  {
    id: 'ignoreDef',
    labelKey: 'event.skills.ignoreDef',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ ignoreDef: 5 * lv }),
  },
  {
    id: 'allStat',
    labelKey: 'event.skills.allStat',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ str: 10 * lv, dex: 10 * lv, int: 10 * lv, luk: 10 * lv }),
  },
  {
    id: 'critRate',
    labelKey: 'event.skills.critRate',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ critRate: 5 * lv }),
  },  {
    id: 'buffDuration',
    labelKey: 'event.skills.buffDuration',
    maxLevel: EVENT_MAX_LEVEL,
    valueAt: (lv) => ({ buffDuration: 5 * lv }),
  },
]

export const EVENT_SKILLS_BY_ID = Object.fromEntries(
  EVENT_SKILLS.map((s) => [s.id, s]),
)
