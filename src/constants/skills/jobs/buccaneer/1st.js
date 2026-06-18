// Buccaneer — 1 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'buccaneer')

export const BUCCANEER_1ST_SKILLS = [
  {
    id: 'shadow_heart',
    name: 'Shadow Heart',
    imageUrl: ICON('Shadow_Heart'),
    jobs: ['buccaneer'],
    advancement: 1,
    kind: 'passive',
    stats: { critRate: 20, critDmg: 5 },
    cp: { role: 'passive' },
  },
]

export const BUCCANEER_1ST_SIM_SKILLS     = BUCCANEER_1ST_SKILLS.filter((s) => s.sim)
export const BUCCANEER_1ST_PASSIVE_SKILLS = BUCCANEER_1ST_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BUCCANEER_1ST_BUFFS          = BUCCANEER_1ST_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BUCCANEER_1ST_BATTLE_BUFFS   = BUCCANEER_1ST_SKILLS.filter((s) => s.battle)
