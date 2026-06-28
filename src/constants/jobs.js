// 職業系統三層架構:
//   classGroup  : 大類 (explorer / cygnus / resistance / heroes / ...)
//   combatClass : 職業分類 (warrior / magician / bowman / thief / pirate)
//   job (key)   : 具體職業 (archmageFP / shadower / nightwalker / ...)
//
// 裝備的 classes 欄位對應 combatClass,跨大類共用 (盜賊裝 = 冒險盜賊 + 夜行者)
//
// 其他欄位:
//   primary   : 主屬性 key (對應 equipment.stats.str/dex/int/luk)
//   linkSkill : 該職業原生擁有的連結技能 id (對應 data/linkSkills.js)

export const COMBAT_CLASSES = ['warrior', 'magician', 'bowman', 'thief', 'pirate']

export const JOB_BRANCHES = [
  {
    key: 'beginner',
    classGroup: 'explorer',
    jobs: [
      { key: 'beginner', primary: 'str', combatClass: 'warrior' },
    ],
  },
  {
    key: 'warrior',
    classGroup: 'explorer',
    jobs: [
      { key: 'hero',        primary: 'str', combatClass: 'warrior', linkSkill: 'invincible_belief' },
      { key: 'paladin',     primary: 'str', combatClass: 'warrior', linkSkill: 'invincible_belief' },
      { key: 'darkKnight',  primary: 'str', combatClass: 'warrior', linkSkill: 'invincible_belief' },
    ],
  },
  {
    key: 'magician',
    classGroup: 'explorer',
    jobs: [
      { key: 'archmageFP',  primary: 'int', combatClass: 'magician', linkSkill: 'empirical_knowledge' },
      { key: 'archmageIL',  primary: 'int', combatClass: 'magician', linkSkill: 'empirical_knowledge' },
      { key: 'bishop',      primary: 'int', combatClass: 'magician', linkSkill: 'empirical_knowledge' },
    ],
  },
  {
    key: 'bowman',
    classGroup: 'explorer',
    jobs: [
      { key: 'bowmaster',   primary: 'dex', combatClass: 'bowman', linkSkill: 'adventurers_curiosity', projectile: 'arrow' },
      { key: 'marksman',    primary: 'dex', combatClass: 'bowman', linkSkill: 'adventurers_curiosity', projectile: 'arrow' },
      { key: 'pathfinder',  primary: 'dex', combatClass: 'bowman', linkSkill: 'adventurers_curiosity', projectile: 'arrow' },
    ],
  },
  {
    key: 'thief',
    classGroup: 'explorer',
    jobs: [
      { key: 'nightlord',   primary: 'luk', combatClass: 'thief', linkSkill: 'thiefs_cunning', projectile: 'star' },
      { key: 'shadower',    primary: 'luk', combatClass: 'thief', linkSkill: 'thiefs_cunning' },
      { key: 'dualblade',   primary: 'luk', combatClass: 'thief', linkSkill: 'thiefs_cunning' },
    ],
  },
  {
    key: 'pirate',
    classGroup: 'explorer',
    jobs: [
      { key: 'buccaneer',   primary: 'str', combatClass: 'pirate', linkSkill: 'pirate_blessing' },
      { key: 'corsair',     primary: 'dex', combatClass: 'pirate', linkSkill: 'pirate_blessing', projectile: 'bullet' },
      { key: 'cannoneer',   primary: 'str', combatClass: 'pirate', linkSkill: 'pirate_blessing' },
    ],
  },
  {
    key: 'cygnus',
    classGroup: 'cygnus',
    jobs: [
      { key: 'dawnwarrior',    primary: 'str', combatClass: 'warrior', linkSkill: 'cygnus_blessing' },
      { key: 'blazewizard',    primary: 'int', combatClass: 'magician', linkSkill: 'cygnus_blessing' },
      { key: 'windarcher',     primary: 'dex', combatClass: 'bowman', linkSkill: 'cygnus_blessing', projectile: 'arrow' },
      { key: 'nightwalker',    primary: 'luk', combatClass: 'thief', linkSkill: 'cygnus_blessing', projectile: 'star' },
      { key: 'thunderbreaker', primary: 'str', combatClass: 'pirate', linkSkill: 'cygnus_blessing' },
    ],
  },
  {
    key: 'mihile',
    classGroup: 'cygnus',
    jobs: [
      { key: 'mihile',     primary: 'str', combatClass: 'warrior', linkSkill: 'knights_watch' },
    ],
  },
  {
    key: 'heroes',
    classGroup: 'heroes',
    jobs: [
      { key: 'aran',       primary: 'str', combatClass: 'warrior', linkSkill: 'combo_kill_blessing' },
      { key: 'evan',       primary: 'int', combatClass: 'magician', linkSkill: 'rune_persistence' },
      { key: 'mercedes',   primary: 'dex', combatClass: 'bowman', linkSkill: 'elven_blessing' },
      { key: 'phantom',    primary: 'luk', combatClass: 'thief', linkSkill: 'phantom_instinct' },
      { key: 'luminous',   primary: 'int', combatClass: 'magician', linkSkill: 'light_wash' },
      { key: 'shade',      primary: 'str', combatClass: 'pirate', linkSkill: 'close_call' },
    ],
  },
  {
    key: 'flora',
    classGroup: 'flora',
    jobs: [
      { key: 'adele', primary: 'str', combatClass: 'warrior', linkSkill: 'noble_fire' },
      { key: 'ark', primary: 'str', combatClass: 'pirate', linkSkill: 'solus' },
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

export function combatClassOf(jobKey) {
  for (const branch of JOB_BRANCHES) {
    const job = branch.jobs.find((j) => j.key === jobKey)
    if (job) return job.combatClass || null
  }
  return null
}

export function projectileTypeOf(jobKey) {
  for (const branch of JOB_BRANCHES) {
    const job = branch.jobs.find((j) => j.key === jobKey)
    if (job) return job.projectile || null
  }
  return null
}

export const LEVEL_MIN = 1
export const LEVEL_MAX = 300
