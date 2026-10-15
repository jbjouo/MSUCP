// Bowmaster — 1 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/bowmaster/Skill_${skillId}.png`)

export const BOWMASTER_1ST_SKILLS = [
  {
    id: 'bm_critical_shot',
    name: 'Critical Shot',
    imageUrl: ICON(3000001),
    jobs: ['bowmaster'],
    advancement: 1,
    kind: 'passive',
    stats: { critRate: 40 },
    cp: { role: 'passive' },
  },
]

export const BOWMASTER_1ST_SIM_SKILLS     = BOWMASTER_1ST_SKILLS.filter((s) => s.sim)
export const BOWMASTER_1ST_PASSIVE_SKILLS = BOWMASTER_1ST_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BOWMASTER_1ST_BUFFS          = BOWMASTER_1ST_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BOWMASTER_1ST_BATTLE_BUFFS   = BOWMASTER_1ST_SKILLS.filter((s) => s.battle)
