// Bishop — 3 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'bishop')

export const BISHOP_3RD_SKILLS = [
  {
    id: 'arcane_overdrive_bishop',
    name: 'Arcane Overdrive',
    imageUrl: ICON('Arcane_Overdrive'),
    jobs: ['bishop'],
    advancement: 3,
    kind: 'passive',
    stats: { critRate: 30, critDmg: 13 },
    cp: { role: 'passive' },
  },
]

export const BISHOP_3RD_SIM_SKILLS     = BISHOP_3RD_SKILLS.filter((s) => s.sim)
export const BISHOP_3RD_PASSIVE_SKILLS = BISHOP_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BISHOP_3RD_BUFFS          = BISHOP_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BISHOP_3RD_BATTLE_BUFFS   = BISHOP_3RD_SKILLS.filter((s) => s.battle)
export const BISHOP_3RD_VMATRIX_SKILLS = BISHOP_3RD_SKILLS.filter((s) => s.vmatrix)
