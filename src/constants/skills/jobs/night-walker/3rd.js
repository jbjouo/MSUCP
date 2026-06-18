// Night Walker — 3 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'night-walker')

export const NIGHT_WALKER_3RD_SKILLS = [
  {
    id: 'alchemic_adrenaline',
    name: 'Alchemic Adrenaline',
    imageUrl: ICON('Alchemic_Adrenaline'),
    jobs: ['nightwalker'],
    advancement: 3,
    kind: 'passive',
    stats: { critDmg: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'spirit_projection',
    name: 'Spirit Projection',
    imageUrl: ICON('Spirit_Projection'),
    jobs: ['nightwalker'],
    advancement: 3,
    kind: 'passive',
    stats: { atk: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'shadow_momentum',
    name: 'Shadow Momentum',
    imageUrl: ICON('Shadow_Momentum'),
    jobs: ['nightwalker'],
    advancement: 3,
    kind: 'passive',
    stats: { finalDmg: 20 },
    cp: { role: 'passive' },
  },
]

export const NIGHT_WALKER_3RD_SIM_SKILLS     = NIGHT_WALKER_3RD_SKILLS.filter((s) => s.sim)
export const NIGHT_WALKER_3RD_PASSIVE_SKILLS = NIGHT_WALKER_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const NIGHT_WALKER_3RD_BUFFS          = NIGHT_WALKER_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const NIGHT_WALKER_3RD_BATTLE_BUFFS   = NIGHT_WALKER_3RD_SKILLS.filter((s) => s.battle)
export const NIGHT_WALKER_3RD_VMATRIX_SKILLS = NIGHT_WALKER_3RD_SKILLS.filter((s) => s.vmatrix)
