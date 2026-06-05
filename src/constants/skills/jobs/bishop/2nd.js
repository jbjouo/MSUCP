// Bishop — 2 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'bishop')

export const BISHOP_2ND_SKILLS = [
  {
    id: 'spell_mastery_bishop',
    name: 'Spell Mastery',
    imageUrl: ICON('Spell_Mastery'),
    jobs: ['bishop'],
    advancement: 2,
    kind: 'passive',
    mastery: 50,
    stats: { matk: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'high_wisdom_bishop',
    name: 'High Wisdom',
    imageUrl: ICON('High_Wisdom'),
    jobs: ['bishop'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'agile_magic_bishop',
    name: 'Agile Magic',
    imageUrl: ICON('Agile_Magic_(Magician)'),
    jobs: ['bishop'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 20 },
    cp: { role: 'passive' },
  },
]

export const BISHOP_2ND_SIM_SKILLS     = BISHOP_2ND_SKILLS.filter((s) => s.sim)
export const BISHOP_2ND_PASSIVE_SKILLS = BISHOP_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BISHOP_2ND_BUFFS          = BISHOP_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BISHOP_2ND_BATTLE_BUFFS   = BISHOP_2ND_SKILLS.filter((s) => s.battle)
export const BISHOP_2ND_VMATRIX_SKILLS = BISHOP_2ND_SKILLS.filter((s) => s.vmatrix)
