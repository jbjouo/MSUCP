// Buccaneer — 3 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'buccaneer')

export const BUCCANEER_3RD_SKILLS = [
  {
    id: 'precision_strikes',
    name: 'Precision Strikes',
    imageUrl: ICON('Precision_Strikes'),
    jobs: ['buccaneer'],
    advancement: 3,
    kind: 'passive',
    stats: { atk: 30, critRate: 15, critDmg: 10 },
    cp: { role: 'passive' },
  },
]

export const BUCCANEER_3RD_SIM_SKILLS     = BUCCANEER_3RD_SKILLS.filter((s) => s.sim)
export const BUCCANEER_3RD_PASSIVE_SKILLS = BUCCANEER_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BUCCANEER_3RD_BUFFS          = BUCCANEER_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BUCCANEER_3RD_BATTLE_BUFFS   = BUCCANEER_3RD_SKILLS.filter((s) => s.battle)
export const BUCCANEER_3RD_VMATRIX_SKILLS = BUCCANEER_3RD_SKILLS.filter((s) => s.vmatrix)
