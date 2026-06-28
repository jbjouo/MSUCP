// Night Walker — 4 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'night-walker')

export const NIGHT_WALKER_4TH_SKILLS = [
  {
    id: 'throwing_expert',
    name: 'Throwing Expert',
    imageUrl: ICON('Throwing_Expert'),
    jobs: ['nightwalker'],
    advancement: 4,
    kind: 'passive',
    stats: { atk: 30, critDmg: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'dark_blessing',
    name: 'Dark Blessing',
    imageUrl: ICON('Dark_Blessing'),
    jobs: ['nightwalker'],
    advancement: 4,
    kind: 'passive',
    stats: { atk: 30, ignoreDef: 15, finalDmg: 8 },
    cp: { role: 'passive' },
  },
]

export const NIGHT_WALKER_4TH_SIM_SKILLS     = NIGHT_WALKER_4TH_SKILLS.filter((s) => s.sim)
export const NIGHT_WALKER_4TH_PASSIVE_SKILLS = NIGHT_WALKER_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const NIGHT_WALKER_4TH_BUFFS          = NIGHT_WALKER_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const NIGHT_WALKER_4TH_BATTLE_BUFFS   = NIGHT_WALKER_4TH_SKILLS.filter((s) => s.battle)
export const NIGHT_WALKER_4TH_VMATRIX_SKILLS = NIGHT_WALKER_4TH_SKILLS.filter((s) => s.vmatrix)
