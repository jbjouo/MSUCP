// Luminous — 4 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/luminous/Skill_${skillId}.png`)

export const LUMINOUS_4TH_SKILLS = [
  {
    id: 'lumi_magic_mastery',
    name: 'Magic Mastery',
    imageUrl: ICON(27120007),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'passive',
    stats: { matk: 30, critRate: 15, critDmg: 18 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_arcane_pitch_passive',
    name: 'Arcane Pitch',
    imageUrl: ICON(27121006),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'passive',
    stats: { finalDmg: 40, ignoreDef: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_arcane_pitch_buff',
    name: 'Arcane Pitch',
    icon: ICON(27121006),
    imageUrl: ICON(27121006),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'buff',
    stats: { elementalResist: 10 },
    cp: { role: 'buff' },
  },
  {
    id: 'lumi_morning_star',
    name: 'Morning Star',
    imageUrl: ICON(27121201),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'passive',
    stats: { finalDmg: 40, bossDmg: 15 },
    cp: { role: 'passive' },
  },
]

export const LUMINOUS_4TH_SIM_SKILLS     = LUMINOUS_4TH_SKILLS.filter((s) => s.sim)
export const LUMINOUS_4TH_PASSIVE_SKILLS = LUMINOUS_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const LUMINOUS_4TH_BUFFS          = LUMINOUS_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const LUMINOUS_4TH_BATTLE_BUFFS   = LUMINOUS_4TH_SKILLS.filter((s) => s.battle)
export const LUMINOUS_4TH_VMATRIX_SKILLS = LUMINOUS_4TH_SKILLS.filter((s) => s.vmatrix)
