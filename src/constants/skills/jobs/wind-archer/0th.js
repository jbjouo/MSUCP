// Wind Archer — 0 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/wind-archer/Skill_${skillId}.png`)

const WIND_ARCHER_0TH_SKILLS = [
  {
    id: 'elemental_expert_wa',
    name: 'Elemental Expert',
    imageUrl: ICON(10000250),
    jobs: ['windarcher'],
    advancement: 0,
    kind: 'passive',
    stats: { atkPct: 10, matkPct: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'elemental_harmony_wa',
    name: 'Elemental Harmony',
    imageUrl: ICON(10000247),
    jobs: ['windarcher'],
    advancement: 0,
    kind: 'passive',
    contribute(ctx) {
      return { dex: Math.floor((ctx.characterLevel || 0) / 2) }
    },
    cp: { role: 'passive' },
  },
]

export const WIND_ARCHER_0TH_SIM_SKILLS = []
export const WIND_ARCHER_0TH_PASSIVE_SKILLS = WIND_ARCHER_0TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const WIND_ARCHER_0TH_LINK_SKILLS = []
