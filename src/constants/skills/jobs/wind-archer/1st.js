// Wind Archer — 1 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/wind-archer/Skill_${skillId}.png`)

export const WIND_ARCHER_1ST_SKILLS = [
  {
    id: 'wa_whispers_of_the_wind',
    name: 'Whispers of the Wind',
    imageUrl: ICON(13000023),
    jobs: ['windarcher'],
    advancement: 1,
    kind: 'passive',
    stats: { atk: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_storm_elemental',
    name: 'Storm Elemental',
    icon: ICON(13001022),
    imageUrl: ICON(13001022),
    jobs: ['windarcher'],
    advancement: 1,
    kind: 'buff',
    stats: { dmgPct: 10 },
    cp: { role: 'buff' },
  },
]

export const WIND_ARCHER_1ST_SIM_SKILLS     = WIND_ARCHER_1ST_SKILLS.filter((s) => s.sim)
export const WIND_ARCHER_1ST_PASSIVE_SKILLS = WIND_ARCHER_1ST_SKILLS.filter((s) => s.cp?.role === 'passive')
export const WIND_ARCHER_1ST_BUFFS          = WIND_ARCHER_1ST_SKILLS.filter((s) => s.cp?.role === 'buff')
export const WIND_ARCHER_1ST_BATTLE_BUFFS   = WIND_ARCHER_1ST_SKILLS.filter((s) => s.battle)
