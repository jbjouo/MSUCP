// Bishop — 4 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'bishop')

export const BISHOP_4TH_SKILLS = [
  {
    id: 'buff_mastery_bishop',
    name: 'Buff Mastery',
    imageUrl: ICON('Buff_Mastery'),
    jobs: ['bishop'],
    advancement: 4,
    kind: 'passive',
    stats: { buffDuration: 50 },
    cp: { role: 'passive' },
  },
]

export const BISHOP_4TH_SIM_SKILLS     = BISHOP_4TH_SKILLS.filter((s) => s.sim)
export const BISHOP_4TH_PASSIVE_SKILLS = BISHOP_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BISHOP_4TH_BUFFS          = BISHOP_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BISHOP_4TH_BATTLE_BUFFS   = BISHOP_4TH_SKILLS.filter((s) => s.battle)
export const BISHOP_4TH_VMATRIX_SKILLS = BISHOP_4TH_SKILLS.filter((s) => s.vmatrix)
