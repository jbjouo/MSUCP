// Luminous — 2 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/luminous/Skill_${skillId}.png`)

export const LUMINOUS_2ND_SKILLS = [
  {
    id: 'lumi_spell_mastery',
    name: 'Spell Mastery',
    imageUrl: ICON(27100005),
    jobs: ['luminous'],
    advancement: 2,
    kind: 'passive',
    stats: { matk: 10, dmgPct: 15, critRate: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_high_wisdom',
    name: 'High Wisdom',
    imageUrl: ICON(27100006),
    jobs: ['luminous'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_agile_magic',
    name: 'Agile Magic',
    imageUrl: ICON(27100007),
    jobs: ['luminous'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_black_blessing',
    name: 'Black Blessing',
    imageUrl: ICON(27100008),
    jobs: ['luminous'],
    advancement: 2,
    kind: 'passive',
    stats: { matk: 30 },
    cp: { role: 'passive' },
  },
]

export const LUMINOUS_2ND_SIM_SKILLS     = LUMINOUS_2ND_SKILLS.filter((s) => s.sim)
export const LUMINOUS_2ND_PASSIVE_SKILLS = LUMINOUS_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const LUMINOUS_2ND_BUFFS          = LUMINOUS_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const LUMINOUS_2ND_BATTLE_BUFFS   = LUMINOUS_2ND_SKILLS.filter((s) => s.battle)
export const LUMINOUS_2ND_VMATRIX_SKILLS = LUMINOUS_2ND_SKILLS.filter((s) => s.vmatrix)
