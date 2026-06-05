// Shadower — 2 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'shadower')

export const SHADOWER_2ND_SKILLS = [
  {
    id: 'agile_daggers',
    name: 'Agile Daggers',
    imageUrl: ICON('Agile_Daggers'),
    jobs: ['shadower'],
    advancement: 2,
    kind: 'passive',
    stats: { luk: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'physical_training_shadower',
    name: 'Physical Training',
    imageUrl: ICON('Physical_Training'),
    jobs: ['shadower'],
    advancement: 2,
    kind: 'passive',
    stats: { luk: 30, dex: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'channel_karma',
    name: 'Channel Karma',
    imageUrl: ICON('Channel_Karma'),
    jobs: ['shadower'],
    advancement: 2,
    kind: 'passive',
    stats: { atk: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'shield_mastery',
    name: 'Shield Mastery',
    imageUrl: ICON('Shield_Mastery'),
    jobs: ['shadower'],
    advancement: 2,
    kind: 'passive',
    stats: { atk: 15 },
    cp: { role: 'passive' },
  },
  {
    id: 'critical_edge',
    name: 'Critical Edge',
    imageUrl: ICON('Critical_Edge'),
    jobs: ['shadower'],
    advancement: 2,
    kind: 'passive',
    stats: { critRate: 25, critDmg: 5 },
    cp: { role: 'passive' },
  },
]

export const SHADOWER_2ND_SIM_SKILLS     = SHADOWER_2ND_SKILLS.filter((s) => s.sim)
export const SHADOWER_2ND_PASSIVE_SKILLS = SHADOWER_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const SHADOWER_2ND_BUFFS          = SHADOWER_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const SHADOWER_2ND_BATTLE_BUFFS   = SHADOWER_2ND_SKILLS.filter((s) => s.battle)
export const SHADOWER_2ND_VMATRIX_SKILLS = SHADOWER_2ND_SKILLS.filter((s) => s.vmatrix)
