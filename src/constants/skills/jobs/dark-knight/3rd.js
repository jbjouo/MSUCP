// Dark Knight — 3 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/dark-knight/Skill_${skillId}.png`)

export const DARK_KNIGHT_3RD_SKILLS = [
  {
    id: 'dk_lord_of_darkness',
    name: 'Lord of Darkness',
    imageUrl: ICON(1310009),
    jobs: ['darkKnight'],
    advancement: 3,
    kind: 'passive',
    stats: { critRate: 30, critDmg: 8 },
    cp: { role: 'passive' },
  },
  {
    id: 'dk_cross_surge_passive',
    name: 'Cross Surge',
    imageUrl: ICON(1311015),
    jobs: ['darkKnight'],
    advancement: 3,
    kind: 'passive',
    stats: { finalDmg: 50 },
    cp: { role: 'passive' },
  },
]

export const DARK_KNIGHT_3RD_SIM_SKILLS     = DARK_KNIGHT_3RD_SKILLS.filter((s) => s.sim)
export const DARK_KNIGHT_3RD_PASSIVE_SKILLS = DARK_KNIGHT_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const DARK_KNIGHT_3RD_BUFFS          = DARK_KNIGHT_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const DARK_KNIGHT_3RD_BATTLE_BUFFS   = DARK_KNIGHT_3RD_SKILLS.filter((s) => s.battle)
export const DARK_KNIGHT_3RD_VMATRIX_SKILLS = DARK_KNIGHT_3RD_SKILLS.filter((s) => s.vmatrix)
