// Bowmaster — 3 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/bowmaster/Skill_${skillId}.png`)

export const BOWMASTER_3RD_SKILLS = [
  {
    id: 'bm_marksmanship',
    name: 'Marksmanship',
    imageUrl: ICON(3110014),
    jobs: ['bowmaster'],
    advancement: 3,
    kind: 'passive',
    stats: { ignoreDef: 25, atkPct: 25 },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_reckless_hunt_bow',
    name: 'Reckless Hunt: Bow',
    imageUrl: ICON(3110019),
    jobs: ['bowmaster'],
    advancement: 3,
    kind: 'passive',
    stats: { atk: 40, finalDmg: 30 },
    cp: { role: 'passive' },
  },
]

export const BOWMASTER_3RD_SIM_SKILLS     = BOWMASTER_3RD_SKILLS.filter((s) => s.sim)
export const BOWMASTER_3RD_PASSIVE_SKILLS = BOWMASTER_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BOWMASTER_3RD_BUFFS          = BOWMASTER_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BOWMASTER_3RD_BATTLE_BUFFS   = BOWMASTER_3RD_SKILLS.filter((s) => s.battle)
export const BOWMASTER_3RD_VMATRIX_SKILLS = BOWMASTER_3RD_SKILLS.filter((s) => s.vmatrix)
