// Night Walker — 0 轉技能

const NIGHT_WALKER_0TH_SKILLS = [
  {
    id: 'elemental_expert_nw',
    name: 'Elemental Expert',
    jobs: ['nightwalker'],
    advancement: 0,
    kind: 'passive',
    stats: { atkPct: 10, matkPct: 10 },
    cp: { role: 'passive' },
  },
]

export const NIGHT_WALKER_0TH_SIM_SKILLS = []
export const NIGHT_WALKER_0TH_PASSIVE_SKILLS = NIGHT_WALKER_0TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const NIGHT_WALKER_0TH_LINK_SKILLS = []
