// 活動 EVENT 加成 — Alliance Boost Buff(新版)
//
// 單一階段 0~5(依 Boost Points 解鎖),每階所有效果一起提升。
// 只收錄 CP / 傷害計算需要的效果 + Buff Duration;不收:Max HP/MP、Normal Enemy Damage、
//   Arcane Power、Bonus EXP
//
// 設計慣例:
//   - 每個效果 emit 一筆 contribution(ignoreDef 單一來源,不被 combineIgnorePct 誤拆)
//   - allStat 直接展開為 str/dex/int/luk 4 鍵,走一般非 fixed 路徑(吃 %)
//
// id          — 唯一 id
// labelKey    — i18n 鍵
// valueAt(st) — 階段 st 的 stat bag

export const EVENT_MAX_STAGE = 5

// 各階段所需 Boost Points(僅顯示用)
export const EVENT_STAGE_POINTS = [0, 4, 6, 15, 30, 50]

export const EVENT_SKILLS = [
  {
    id: 'att',
    labelKey: 'event.skills.att',
    valueAt: (st) => ({ atk: 5 * st, matk: 5 * st }),
  },
  {
    id: 'bossDmg',
    labelKey: 'event.skills.bossDmg',
    valueAt: (st) => ({ bossDmg: 5 * st }),
  },
  {
    id: 'ignoreDef',
    labelKey: 'event.skills.ignoreDef',
    valueAt: (st) => ({ ignoreDef: 5 * st }),
  },
  {
    id: 'allStat',
    labelKey: 'event.skills.allStat',
    valueAt: (st) => ({ str: 10 * st, dex: 10 * st, int: 10 * st, luk: 10 * st }),
  },
  {
    id: 'critRate',
    labelKey: 'event.skills.critRate',
    valueAt: (st) => ({ critRate: 5 * st }),
  },  {
    id: 'buffDuration',
    labelKey: 'event.skills.buffDuration',
    valueAt: (st) => ({ buffDuration: 5 * st }),
  },
]
