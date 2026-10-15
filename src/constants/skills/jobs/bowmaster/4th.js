// Bowmaster — 4 轉技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/bowmaster/Skill_${skillId}.png`)

export const BOWMASTER_4TH_SKILLS = [
  {
    id: 'bm_bow_expert',
    name: 'Bow Expert',
    imageUrl: ICON(3120005),
    jobs: ['bowmaster'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 30,
    contribute(ctx) {
      const co = (ctx.skillLevelBonus || 0) * 2
      return { atk: 60 + co, critDmg: 16 }
    },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_illusion_step',
    name: 'Illusion Step',
    imageUrl: ICON(3120007),
    jobs: ['bowmaster'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 30,
    contribute(ctx) {
      const co = (ctx.skillLevelBonus || 0) * 2
      return { dex: 80 + co }
    },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_advanced_final_attack',
    name: 'Advanced Final Attack',
    imageUrl: ICON(3120008),
    jobs: ['bowmaster'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 30,
    contribute(ctx) {
      const co = ctx.skillLevelBonus || 0
      return { atk: 20 + co }
    },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_armor_break',
    name: 'Armor Break',
    imageUrl: ICON(3120018),
    jobs: ['bowmaster'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 10,
    stats: { ignoreDef: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_enchanted_quiver',
    name: 'Enchanted Quiver',
    imageUrl: ICON(3120022),
    jobs: ['bowmaster'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 10,
    stats: { finalDmg: 6 },
    cp: { role: 'passive' },
  },
  {
    id: 'bm_sharp_eyes',
    name: 'Sharp Eyes',
    icon: ICON(3121002),
    imageUrl: ICON(3121002),
    jobs: ['bowmaster'],
    advancement: 4,
    kind: 'buff',
    baseLevel: 30,
    stats: { critRate: 20, critDmg: 15 },
    contribute(ctx) {
      const co = ctx.effectiveLevel - (this.baseLevel || 30)
      if (!co) return []
      return [
        { key: 'critRate', value: co, isPct: true },
        { key: 'critDmg', value: co, isPct: true },
      ]
    },
    cp: { role: 'buff', group: 'sharp_eyes' },
  },
]

export const BOWMASTER_4TH_SIM_SKILLS     = BOWMASTER_4TH_SKILLS.filter((s) => s.sim)
export const BOWMASTER_4TH_PASSIVE_SKILLS = BOWMASTER_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BOWMASTER_4TH_BUFFS          = BOWMASTER_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BOWMASTER_4TH_BATTLE_BUFFS   = BOWMASTER_4TH_SKILLS.filter((s) => s.battle)
export const BOWMASTER_4TH_VMATRIX_SKILLS = BOWMASTER_4TH_SKILLS.filter((s) => s.vmatrix)
