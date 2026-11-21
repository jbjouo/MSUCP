// 活動 EVENT 加成 — Alliance Boost Buff(新版)
//
// 10 個效果為獨立技能(skillId 80003189~80003198),各自 Stage 0~5,共用 Boost Points 配點(總計 280)。
// 每升一階另付該階點數(Stage 1~5 = 4 / 6 / 15 / 30 / 50),升滿一項共 105 點。
//
// 設計慣例:
//   - 每個效果 emit 一筆 contribution(ignoreDef 單一來源,不被 combineIgnorePct 誤拆)
//   - allStat 直接展開為 str/dex/int/luk 4 鍵,走一般非 fixed 路徑(吃 %)
//   - arc(Arcane Power)不進 breakdown,由 useEvent.arcBonus 併入 ENEMY SETTINGS 的玩家 ARC
//
// id          — 唯一 id
// labelKey    — i18n 鍵
// maxLevel    — 5
// valueAt(lv) — 等級 lv 的 stat bag

export const EVENT_MAX_LEVEL = 5
export const EVENT_TOTAL_POINTS = 280
// 每階單獨花費 (index 0 = Stage 1)
export const EVENT_STAGE_STEP_COST = [4, 6, 15, 30, 50]
// index = stage;值 = 到達該 stage 的累計點數 → [0, 4, 10, 25, 55, 105]
export const EVENT_STAGE_COST = EVENT_STAGE_STEP_COST.reduce(
  (acc, c) => [...acc, acc[acc.length - 1] + c], [0],
)

// 不進 CP breakdown 的 key(另行處理)
export const EVENT_NON_BREAKDOWN_KEYS = new Set(['arc'])

const skill = (id, valueAt) => ({
  id,
  labelKey: `event.skills.${id}`,
  maxLevel: EVENT_MAX_LEVEL,
  valueAt,
})

export const EVENT_SKILLS = [
  skill('att', (lv) => ({ atk: 5 * lv, matk: 5 * lv })),
  skill('bossDmg', (lv) => ({ bossDmg: 5 * lv })),
  skill('ignoreDef', (lv) => ({ ignoreDef: 5 * lv })),
  skill('allStat', (lv) => ({ str: 10 * lv, dex: 10 * lv, int: 10 * lv, luk: 10 * lv })),
  skill('hpMp', (lv) => ({ hp: 500 * lv, mp: 500 * lv })),
  skill('buffDuration', (lv) => ({ buffDuration: 5 * lv })),
  skill('critRate', (lv) => ({ critRate: 5 * lv })),
  skill('normalMobDmg', (lv) => ({ normalMobDmg: 5 * lv })),
  skill('arc', (lv) => ({ arc: 5 * lv })),
  skill('bonusExp', (lv) => ({ bonusExp: 2.5 * lv })),
]

export const EVENT_SKILLS_BY_ID = Object.fromEntries(
  EVENT_SKILLS.map((s) => [s.id, s]),
)
