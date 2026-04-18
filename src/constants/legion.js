// 聯盟戰地成員屬性
//
// 每位成員有 5 階 tier (1-5);tier 0 = 尚未放置/未貢獻。
//
// 欄位:
//   id             — 成員 id (通常同 job.key)
//   jobKey         — 對應 jobs.js 職業
//   effects[]      — 5 筆,依序為 tier 1..5
//     { tier, stats: {key:value}, fixed?: true, specialEffect?: true }
//   specialEffect? — 在 member 層級標記整個技能為特殊效果 (不進計算機統計)
//
// 重要規則:
//   STR/DEX/INT/LUK 的聯盟加成標記 fixed:true — 計算機不會套 % 乘算,
//   僅以「固定值」加到最終數值上。

export const LEGION_TIER_COUNT = 5
// tier 0 = 未放置,1-5 對應遊戲等級符號
export const LEGION_TIER_LABELS = ['-', 'B', 'A', 'S', 'SS', 'SSS']
const MAIN_STAT_TIER_VALUES = [10, 20, 40, 80, 100]

function mainStatTiers(key) {
  return MAIN_STAT_TIER_VALUES.map((v, i) => ({
    tier: i + 1,
    stats: { [key]: v },
    fixed: true, // 四大屬性 — 不吃 % 加成
  }))
}
function simpleTiers(key, values) {
  return values.map((v, i) => ({
    tier: i + 1,
    stats: { [key]: v },
  }))
}

export const LEGION_BRANCHES = [
  {
    key: 'warrior',
    members: [
      { id: 'hero',        jobKey: 'hero',        effects: mainStatTiers('str') },
      { id: 'paladin',     jobKey: 'paladin',     effects: mainStatTiers('str') },
      { id: 'darkKnight',  jobKey: 'darkKnight',  effects: simpleTiers('hpPct', [2, 3, 4, 5, 6]) },
      { id: 'aran',        jobKey: 'aran',        effects: simpleTiers('hpRecoveryOnHit', [2, 4, 6, 8, 10]), specialEffect: true },
      { id: 'dawnwarrior', jobKey: 'dawnwarrior', effects: simpleTiers('hp', [250, 500, 1000, 2000, 2500]) },
      { id: 'mihile',      jobKey: 'mihile',      effects: simpleTiers('hp', [250, 500, 1000, 2000, 2500]) },
    ],
  },
  {
    key: 'magician',
    members: [
      { id: 'archmageFP',  jobKey: 'archmageFP',  effects: simpleTiers('mpPct', [2, 3, 4, 5, 6]) },
      { id: 'archmageIL',  jobKey: 'archmageIL',  effects: mainStatTiers('int') },
      { id: 'bishop',      jobKey: 'bishop',      effects: mainStatTiers('int') },
      { id: 'evan',        jobKey: 'evan',        effects: simpleTiers('mpRecoveryOnHit', [2, 4, 6, 8, 10]), specialEffect: true },
      { id: 'luminous',    jobKey: 'luminous',    effects: mainStatTiers('int') },
      { id: 'blazewizard', jobKey: 'blazewizard', effects: mainStatTiers('int') },
    ],
  },
  {
    key: 'bowman',
    members: [
      { id: 'bowmaster',   jobKey: 'bowmaster',   effects: mainStatTiers('dex') },
      { id: 'marksman',    jobKey: 'marksman',    effects: simpleTiers('critRate', [1, 2, 3, 4, 5]) },
      { id: 'pathfinder',  jobKey: 'pathfinder',  effects: mainStatTiers('dex') },
      { id: 'mercedes',    jobKey: 'mercedes',    effects: simpleTiers('cooldownReduction', [-2, -3, -4, -5, -6]) },
      { id: 'windarcher',  jobKey: 'windarcher',  effects: mainStatTiers('dex') },
    ],
  },
  {
    key: 'thief',
    members: [
      { id: 'nightlord',   jobKey: 'nightlord',   effects: simpleTiers('critRate', [1, 2, 3, 4, 5]) },
      { id: 'shadower',    jobKey: 'shadower',    effects: mainStatTiers('luk') },
      { id: 'dualblade',   jobKey: 'dualblade',   effects: mainStatTiers('luk') },
      { id: 'phantom',     jobKey: 'phantom',     effects: mainStatTiers('luk') },
      { id: 'nightwalker', jobKey: 'nightwalker', effects: mainStatTiers('luk') },
    ],
  },
  {
    key: 'pirate',
    members: [
      { id: 'buccaneer',      jobKey: 'buccaneer',      effects: mainStatTiers('str') },
      { id: 'corsair',        jobKey: 'corsair',        effects: simpleTiers('summonDuration', [4, 6, 8, 10, 12]) },
      { id: 'cannoneer',      jobKey: 'cannoneer',      effects: mainStatTiers('str') },
      { id: 'shade',          jobKey: 'shade',          effects: simpleTiers('critDmg', [1, 2, 3, 5, 6]) },
      { id: 'thunderbreaker', jobKey: 'thunderbreaker', effects: mainStatTiers('str') },
    ],
  },
]

export const LEGION_MEMBERS = LEGION_BRANCHES.flatMap((b) => b.members)
export const LEGION_MEMBER_BY_ID = Object.fromEntries(LEGION_MEMBERS.map((m) => [m.id, m]))
