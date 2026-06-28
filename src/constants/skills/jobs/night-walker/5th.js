// Night Walker — 5 轉技能

import { ASSET } from '../../_shared/helpers.js'

const NIGHT_WALKER_5TH_SKILLS = [
  {
    id: 'nw_last_resort',
    name: 'Last Resort',
    nameKey: 'vmatrix.skills.nw_last_resort',
    imageUrl: ASSET('skills/night-walker/Skill_400041032.png'),
    jobs: ['nightwalker'],
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill', passive: { type: 'stat', statKey: 'atk', per: 1 } },
  },
]

export const NIGHT_WALKER_5TH_SIM_SKILLS = NIGHT_WALKER_5TH_SKILLS.filter((s) => s.sim)
export const NIGHT_WALKER_5TH_PASSIVE_SKILLS = NIGHT_WALKER_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const NIGHT_WALKER_5TH_BUFFS = NIGHT_WALKER_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const NIGHT_WALKER_5TH_BATTLE_BUFFS = NIGHT_WALKER_5TH_SKILLS.filter((s) => s.battle)
export const NIGHT_WALKER_5TH_VMATRIX_SKILLS = NIGHT_WALKER_5TH_SKILLS.filter((s) => s.vmatrix)
