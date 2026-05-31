// 職業分支 — 新楓之谷 N 冒險家線為主 (後續可擴充)
// 欄位:
//   primary   : 主屬性 key (對應 equipment.stats.str/dex/int/luk)
//   linkSkill : 該職業原生擁有的連結技能 id (對應 data/linkSkills.js)

export const JOB_BRANCHES = [
  {
    key: 'beginner',
    jobs: [
      { key: 'beginner', primary: 'str' },
    ],
  },
  {
    key: 'warrior',
    jobs: [
      { key: 'hero',        primary: 'str', linkSkill: 'invincible_belief' },
      { key: 'paladin',     primary: 'str', linkSkill: 'invincible_belief' },
      { key: 'darkKnight',  primary: 'str', linkSkill: 'invincible_belief' },
    ],
  },
  {
    key: 'magician',
    jobs: [
      { key: 'archmageFP',  primary: 'int', linkSkill: 'empirical_knowledge' },
      { key: 'archmageIL',  primary: 'int', linkSkill: 'empirical_knowledge' },
      { key: 'bishop',      primary: 'int', linkSkill: 'empirical_knowledge' },
    ],
  },
  {
    key: 'bowman',
    jobs: [
      { key: 'bowmaster',   primary: 'dex', linkSkill: 'adventurers_curiosity' },
      { key: 'marksman',    primary: 'dex', linkSkill: 'adventurers_curiosity' },
      { key: 'pathfinder',  primary: 'dex', linkSkill: 'adventurers_curiosity' },
    ],
  },
  {
    key: 'thief',
    jobs: [
      { key: 'nightlord',   primary: 'luk', linkSkill: 'thiefs_cunning' },
      { key: 'shadower',    primary: 'luk', linkSkill: 'thiefs_cunning' },
      { key: 'dualblade',   primary: 'luk', linkSkill: 'thiefs_cunning' },
    ],
  },
  {
    key: 'pirate',
    jobs: [
      { key: 'buccaneer',   primary: 'str', linkSkill: 'pirate_blessing' },
      { key: 'corsair',     primary: 'dex', linkSkill: 'pirate_blessing' },
      { key: 'cannoneer',   primary: 'str', linkSkill: 'pirate_blessing' },
    ],
  },
  {
    key: 'cygnus',
    jobs: [
      { key: 'dawnwarrior',    primary: 'str', linkSkill: 'cygnus_blessing' },
      { key: 'blazewizard',    primary: 'int', linkSkill: 'cygnus_blessing' },
      { key: 'windarcher',     primary: 'dex', linkSkill: 'cygnus_blessing' },
      { key: 'nightwalker',    primary: 'luk', linkSkill: 'cygnus_blessing' },
      { key: 'thunderbreaker', primary: 'str', linkSkill: 'cygnus_blessing' },
    ],
  },
  {
    key: 'mihile',
    jobs: [
      { key: 'mihile',     primary: 'str', linkSkill: 'knights_watch' },
    ],
  },
  {
    key: 'heroes',
    jobs: [
      { key: 'aran',       primary: 'str', linkSkill: 'combo_kill_blessing' },
      { key: 'evan',       primary: 'int', linkSkill: 'rune_persistence' },
      { key: 'mercedes',   primary: 'dex', linkSkill: 'elven_blessing' },
      { key: 'phantom',    primary: 'luk', linkSkill: 'phantom_instinct' },
      { key: 'luminous',   primary: 'int', linkSkill: 'light_wash' },
      { key: 'shade',      primary: 'str', linkSkill: 'close_call' },
    ],
  },
  {
    key: 'flora',
    jobs: [
      { key: 'ark', primary: 'str', linkSkill: 'solus' },
    ],
  },
]

export const JOB_BRANCH_KEYS = JOB_BRANCHES.map((b) => b.key)

export const JOBS_BY_BRANCH = Object.fromEntries(
  JOB_BRANCHES.map((b) => [b.key, b.jobs]),
)

export function findJob(branchKey, jobKey) {
  const branch = JOB_BRANCHES.find((b) => b.key === branchKey)
  if (!branch) return null
  return branch.jobs.find((j) => j.key === jobKey) || null
}

export function findBranchByJob(jobKey) {
  for (const branch of JOB_BRANCHES) {
    if (branch.jobs.some((j) => j.key === jobKey)) return branch.key
  }
  return null
}

export const LEVEL_MIN = 1
export const LEVEL_MAX = 300
