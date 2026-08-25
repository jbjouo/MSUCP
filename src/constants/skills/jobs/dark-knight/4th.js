// Dark Knight — 4 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/dark-knight/Skill_${skillId}.png`)

export const DARK_KNIGHT_4TH_SKILLS = [
  {
    id: 'dk_barricade_mastery',
    name: 'Barricade Mastery',
    imageUrl: ICON(1320018),
    jobs: ['darkKnight'],
    advancement: 4,
    kind: 'passive',
    stats: { atk: 30, critDmg: 15 },
    cp: { role: 'passive' },
  },
  {
    id: 'dk_final_pact_passive',
    name: 'Final Pact',
    imageUrl: ICON(1320016),
    jobs: ['darkKnight'],
    advancement: 4,
    kind: 'passive',
    stats: { finalDmg: 30, critRate: 10, critDmg: 15 },
    cp: { role: 'passive' },
  },
  {
    id: 'dk_dark_resonance_passive',
    name: 'Dark Resonance',
    imageUrl: ICON(1321015),
    jobs: ['darkKnight'],
    advancement: 4,
    kind: 'passive',
    stats: { ignoreDef: 30 },
    cp: { role: 'passive' },
  },
]

export const DARK_KNIGHT_4TH_SIM_SKILLS     = DARK_KNIGHT_4TH_SKILLS.filter((s) => s.sim)
export const DARK_KNIGHT_4TH_PASSIVE_SKILLS = DARK_KNIGHT_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const DARK_KNIGHT_4TH_BUFFS          = DARK_KNIGHT_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const DARK_KNIGHT_4TH_BATTLE_BUFFS   = DARK_KNIGHT_4TH_SKILLS.filter((s) => s.battle)
export const DARK_KNIGHT_4TH_VMATRIX_SKILLS = DARK_KNIGHT_4TH_SKILLS.filter((s) => s.vmatrix)
