// Night Walker — 2 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'night-walker')

export const NIGHT_WALKER_2ND_SKILLS = [
  {
    id: 'critical_throw',
    name: 'Critical Throw',
    imageUrl: ICON('Critical_Throw'),
    jobs: ['nightwalker'],
    advancement: 2,
    kind: 'passive',
    stats: { critRate: 35, critDmg: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'physical_training_nightwalker',
    name: 'Physical Training',
    imageUrl: ICON('Physical_Training'),
    jobs: ['nightwalker'],
    advancement: 2,
    kind: 'passive',
    stats: { luk: 60 },
    cp: { role: 'passive' },
  },
  {
    id: 'throwing_mastery',
    name: 'Throwing Mastery',
    imageUrl: ICON('Throwing_Mastery'),
    jobs: ['nightwalker'],
    advancement: 2,
    kind: 'passive',
    stats: { dmgPct: 30 },
    cp: { role: 'passive' },
  },
]

export const NIGHT_WALKER_2ND_SIM_SKILLS     = NIGHT_WALKER_2ND_SKILLS.filter((s) => s.sim)
export const NIGHT_WALKER_2ND_PASSIVE_SKILLS = NIGHT_WALKER_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const NIGHT_WALKER_2ND_BUFFS          = NIGHT_WALKER_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const NIGHT_WALKER_2ND_BATTLE_BUFFS   = NIGHT_WALKER_2ND_SKILLS.filter((s) => s.battle)
export const NIGHT_WALKER_2ND_VMATRIX_SKILLS = NIGHT_WALKER_2ND_SKILLS.filter((s) => s.vmatrix)
