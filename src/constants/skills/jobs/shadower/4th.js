// Shadower — 4 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'shadower')

export const SHADOWER_4TH_SKILLS = [
  {
    id: 'dagger_expert',
    name: 'Dagger Expert',
    imageUrl: ICON('Dagger_Expert'),
    jobs: ['shadower'],
    advancement: 4,
    kind: 'passive',
    mastery: 70,
    stats: { atk: 40, critDmg: 15 },
    cp: { role: 'passive' },
  },
  {
    id: 'shadower_instinct',
    name: 'Shadower Instinct',
    imageUrl: ICON('Shadower_Instinct'),
    jobs: ['shadower'],
    advancement: 4,
    kind: 'passive',
    stats: { atk: 50, finalDmg: 15, ignoreDef: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'bloody_money',
    name: 'Bloody Money',
    imageUrl: ICON('Bloody_Money'),
    jobs: ['shadower'],
    advancement: 4,
    kind: 'passive',
    stats: { luk: 10, critDmg: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'cruel_stab',
    name: 'Cruel Stab',
    imageUrl: ICON('Cruel_Stab'),
    jobs: ['shadower'],
    advancement: 4,
    kind: 'attack',
    stats: { finalDmg: 25 },
    cp: { role: 'passive' },
  },
]

export const SHADOWER_4TH_SIM_SKILLS     = SHADOWER_4TH_SKILLS.filter((s) => s.sim)
export const SHADOWER_4TH_PASSIVE_SKILLS = SHADOWER_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const SHADOWER_4TH_BUFFS          = SHADOWER_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const SHADOWER_4TH_BATTLE_BUFFS   = SHADOWER_4TH_SKILLS.filter((s) => s.battle)
export const SHADOWER_4TH_VMATRIX_SKILLS = SHADOWER_4TH_SKILLS.filter((s) => s.vmatrix)
