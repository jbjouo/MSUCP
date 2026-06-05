// Shadower — 3 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'shadower')

export const SHADOWER_3RD_SKILLS = [
  {
    id: 'grit',
    name: 'Grit',
    imageUrl: ICON('Grit'),
    jobs: ['shadower'],
    advancement: 3,
    kind: 'passive',
    stats: { atk: 25 },
    cp: { role: 'passive' },
  },
]

export const SHADOWER_3RD_SIM_SKILLS     = SHADOWER_3RD_SKILLS.filter((s) => s.sim)
export const SHADOWER_3RD_PASSIVE_SKILLS = SHADOWER_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const SHADOWER_3RD_BUFFS          = SHADOWER_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const SHADOWER_3RD_BATTLE_BUFFS   = SHADOWER_3RD_SKILLS.filter((s) => s.battle)
export const SHADOWER_3RD_VMATRIX_SKILLS = SHADOWER_3RD_SKILLS.filter((s) => s.vmatrix)
