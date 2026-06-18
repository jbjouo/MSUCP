// Buccaneer — 4 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'buccaneer')

export const BUCCANEER_4TH_SKILLS = [
  {
    id: 'typhoon_crush',
    name: 'Typhoon Crush',
    imageUrl: ICON('Typhoon_Crush'),
    jobs: ['buccaneer'],
    advancement: 4,
    kind: 'passive',
    stats: { ignoreDef: 40, finalDmg: 10, atk: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'crossbones',
    name: 'Crossbones',
    nameKey: 'skill.crossbones.name',
    imageUrl: ICON('Crossbones'),
    jobs: ['buccaneer'],
    advancement: 4,
    kind: 'passive',
    stats: { finalDmg: 13 },
    cp: { role: 'passive' },
  },
]

export const BUCCANEER_4TH_SIM_SKILLS     = BUCCANEER_4TH_SKILLS.filter((s) => s.sim)
export const BUCCANEER_4TH_PASSIVE_SKILLS = BUCCANEER_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BUCCANEER_4TH_BUFFS          = BUCCANEER_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BUCCANEER_4TH_BATTLE_BUFFS   = BUCCANEER_4TH_SKILLS.filter((s) => s.battle)
export const BUCCANEER_4TH_VMATRIX_SKILLS = BUCCANEER_4TH_SKILLS.filter((s) => s.vmatrix)
