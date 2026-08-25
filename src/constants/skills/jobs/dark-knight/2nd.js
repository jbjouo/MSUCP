// Dark Knight — 2 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/dark-knight/Skill_${skillId}.png`)

export const DARK_KNIGHT_2ND_SKILLS = [
  {
    id: 'dk_physical_training',
    name: 'Physical Training',
    imageUrl: ICON(1300009),
    jobs: ['darkKnight'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 30, dex: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'dk_weapon_mastery',
    name: 'Weapon Mastery',
    imageUrl: ICON(1300000),
    jobs: ['darkKnight'],
    advancement: 2,
    kind: 'passive',
    contribute(ctx) {
      if (ctx.weaponSubType === 'Spear') return { dmgPct: 5 }
      return null
    },
    cp: { role: 'passive' },
  },
  {
    id: 'dk_agile_arms',
    name: 'Agile Arms',
    imageUrl: ICON(1300015),
    jobs: ['darkKnight'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 20 },
    cp: { role: 'passive' },
  },
]

export const DARK_KNIGHT_2ND_SIM_SKILLS     = DARK_KNIGHT_2ND_SKILLS.filter((s) => s.sim)
export const DARK_KNIGHT_2ND_PASSIVE_SKILLS = DARK_KNIGHT_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const DARK_KNIGHT_2ND_BUFFS          = DARK_KNIGHT_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const DARK_KNIGHT_2ND_BATTLE_BUFFS   = DARK_KNIGHT_2ND_SKILLS.filter((s) => s.battle)
export const DARK_KNIGHT_2ND_VMATRIX_SKILLS = DARK_KNIGHT_2ND_SKILLS.filter((s) => s.vmatrix)
