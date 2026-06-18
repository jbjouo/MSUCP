// Buccaneer — 2 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'buccaneer')

export const BUCCANEER_2ND_SKILLS = [
  {
    id: 'physical_training_buccaneer',
    name: 'Physical Training',
    imageUrl: ICON('Physical_Training'),
    jobs: ['buccaneer'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 30, dex: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'dark_clarity',
    name: 'Dark Clarity',
    imageUrl: ICON('Dark_Clarity'),
    jobs: ['buccaneer'],
    advancement: 2,
    kind: 'passive',
    stats: { atk: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'agile_knuckles',
    name: 'Agile Knuckles',
    imageUrl: ICON('Agile_Knuckles'),
    jobs: ['buccaneer'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 20 },
    cp: { role: 'passive' },
  },
]

export const BUCCANEER_2ND_SIM_SKILLS     = BUCCANEER_2ND_SKILLS.filter((s) => s.sim)
export const BUCCANEER_2ND_PASSIVE_SKILLS = BUCCANEER_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BUCCANEER_2ND_BUFFS          = BUCCANEER_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BUCCANEER_2ND_BATTLE_BUFFS   = BUCCANEER_2ND_SKILLS.filter((s) => s.battle)
export const BUCCANEER_2ND_VMATRIX_SKILLS = BUCCANEER_2ND_SKILLS.filter((s) => s.vmatrix)
