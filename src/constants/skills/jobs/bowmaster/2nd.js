// Bowmaster — 2 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/bowmaster/Skill_${skillId}.png`)

export const BOWMASTER_2ND_SKILLS = [
  {
    id: 'bm_bow_acceleration',
    name: 'Bow Acceleration',
    imageUrl: ICON(3100002),
    jobs: ['bowmaster'],
    advancement: 2,
    kind: 'passive',
    stats: { dex: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_physical_training',
    name: 'Physical Training',
    imageUrl: ICON(3100006),
    jobs: ['bowmaster'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 30, dex: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_soul_arrow_bow',
    name: 'Soul Arrow: Bow',
    imageUrl: ICON(3100011),
    jobs: ['bowmaster'],
    advancement: 2,
    kind: 'passive',
    stats: { atk: 30 },
    cp: { role: 'passive' },
  },
]

export const BOWMASTER_2ND_SIM_SKILLS     = BOWMASTER_2ND_SKILLS.filter((s) => s.sim)
export const BOWMASTER_2ND_PASSIVE_SKILLS = BOWMASTER_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BOWMASTER_2ND_BUFFS          = BOWMASTER_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BOWMASTER_2ND_BATTLE_BUFFS   = BOWMASTER_2ND_SKILLS.filter((s) => s.battle)
export const BOWMASTER_2ND_VMATRIX_SKILLS = BOWMASTER_2ND_SKILLS.filter((s) => s.vmatrix)
