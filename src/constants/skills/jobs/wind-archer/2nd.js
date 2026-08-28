// Wind Archer — 2 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/wind-archer/Skill_${skillId}.png`)

export const WIND_ARCHER_2ND_SKILLS = [
  {
    id: 'wa_physical_training',
    name: 'Physical Training',
    imageUrl: ICON(13100026),
    jobs: ['windarcher'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 30, dex: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_bow_mastery',
    name: 'Bow Mastery',
    imageUrl: ICON(13100025),
    jobs: ['windarcher'],
    advancement: 2,
    kind: 'passive',
    stats: { finalDmg: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_bow_acceleration',
    name: 'Bow Acceleration',
    imageUrl: ICON(13100023),
    jobs: ['windarcher'],
    advancement: 2,
    kind: 'passive',
    stats: { dex: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_sylvan_aid',
    name: 'Sylvan Aid',
    imageUrl: ICON(13100028),
    jobs: ['windarcher'],
    advancement: 2,
    kind: 'passive',
    stats: { atk: 20, critRate: 10 },
    cp: { role: 'passive' },
  },
]

export const WIND_ARCHER_2ND_SIM_SKILLS     = WIND_ARCHER_2ND_SKILLS.filter((s) => s.sim)
export const WIND_ARCHER_2ND_PASSIVE_SKILLS = WIND_ARCHER_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const WIND_ARCHER_2ND_BUFFS          = WIND_ARCHER_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const WIND_ARCHER_2ND_BATTLE_BUFFS   = WIND_ARCHER_2ND_SKILLS.filter((s) => s.battle)
export const WIND_ARCHER_2ND_VMATRIX_SKILLS = WIND_ARCHER_2ND_SKILLS.filter((s) => s.vmatrix)
