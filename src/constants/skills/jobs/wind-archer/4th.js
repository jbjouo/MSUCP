// Wind Archer — 4 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/wind-archer/Skill_${skillId}.png`)

export const WIND_ARCHER_4TH_SKILLS = [
  {
    id: 'wa_albatross_max',
    name: 'Albatross Max',
    imageUrl: ICON(13120008),
    jobs: ['windarcher'],
    advancement: 4,
    kind: 'passive',
    stats: { atk: 30, dmgPct: 25, ignoreDef: 15, critRate: 15 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_touch_of_the_wind',
    name: 'Touch of the Wind',
    imageUrl: ICON(13120004),
    jobs: ['windarcher'],
    advancement: 4,
    kind: 'passive',
    stats: { atkPct: 10, dexPct: 15 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_bow_expert',
    name: 'Bow Expert',
    imageUrl: ICON(13120006),
    jobs: ['windarcher'],
    advancement: 4,
    kind: 'passive',
    stats: { atk: 30, finalDmg: 35, critDmg: 20, bossDmg: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'wa_sharp_eyes',
    name: 'Sharp Eyes',
    icon: ICON(13121005),
    imageUrl: ICON(13121005),
    jobs: ['windarcher'],
    advancement: 4,
    kind: 'buff',
    stats: { critRate: 20, critDmg: 15 },
    cp: { role: 'buff', group: 'sharp_eyes' },
  },
]

export const WIND_ARCHER_4TH_SIM_SKILLS     = WIND_ARCHER_4TH_SKILLS.filter((s) => s.sim)
export const WIND_ARCHER_4TH_PASSIVE_SKILLS = WIND_ARCHER_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const WIND_ARCHER_4TH_BUFFS          = WIND_ARCHER_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const WIND_ARCHER_4TH_BATTLE_BUFFS   = WIND_ARCHER_4TH_SKILLS.filter((s) => s.battle)
export const WIND_ARCHER_4TH_VMATRIX_SKILLS = WIND_ARCHER_4TH_SKILLS.filter((s) => s.vmatrix)
