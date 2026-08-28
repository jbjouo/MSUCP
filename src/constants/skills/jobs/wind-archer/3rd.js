// Wind Archer — 3 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/wind-archer/Skill_${skillId}.png`)

export const WIND_ARCHER_3RD_SKILLS = [
  {
    id: 'wa_eagle_eye',
    name: 'Eagle Eye',
    imageUrl: ICON(13110028),
    jobs: ['windarcher'],
    advancement: 3,
    kind: 'passive',
    stats: { atk: 20, critRate: 10 },
    cp: { role: 'passive' },
  },
]

export const WIND_ARCHER_3RD_SIM_SKILLS     = WIND_ARCHER_3RD_SKILLS.filter((s) => s.sim)
export const WIND_ARCHER_3RD_PASSIVE_SKILLS = WIND_ARCHER_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const WIND_ARCHER_3RD_BUFFS          = WIND_ARCHER_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const WIND_ARCHER_3RD_BATTLE_BUFFS   = WIND_ARCHER_3RD_SKILLS.filter((s) => s.battle)
export const WIND_ARCHER_3RD_VMATRIX_SKILLS = WIND_ARCHER_3RD_SKILLS.filter((s) => s.vmatrix)
