// 職業分支 — 新楓之谷 N 冒險家線為主 (後續可擴充)
// primary: 主屬性 key (對應 equipment.stats.str/dex/int/luk)

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
      { key: 'hero',        primary: 'str' },
      { key: 'paladin',     primary: 'str' },
      { key: 'darkKnight',  primary: 'str' },
    ],
  },
  {
    key: 'magician',
    jobs: [
      { key: 'archmageFP',  primary: 'int' },
      { key: 'archmageIL',  primary: 'int' },
      { key: 'bishop',      primary: 'int' },
    ],
  },
  {
    key: 'bowman',
    jobs: [
      { key: 'bowmaster',   primary: 'dex' },
      { key: 'marksman',    primary: 'dex' },
    ],
  },
  {
    key: 'thief',
    jobs: [
      { key: 'nightlord',   primary: 'luk' },
      { key: 'shadower',    primary: 'luk' },
    ],
  },
  {
    key: 'pirate',
    jobs: [
      { key: 'buccaneer',   primary: 'str' },
      { key: 'corsair',     primary: 'dex' },
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

export const LEVEL_MIN = 1
export const LEVEL_MAX = 300
