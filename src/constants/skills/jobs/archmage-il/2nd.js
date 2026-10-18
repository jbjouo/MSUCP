// 冰雷 — 2 轉技能
//
// 資料來源:scripts/skill-db/arch-mage-i-l/2nd.json
// Meditation 與火毒共用同一個 buff(定義於 archmage-fp/2nd.js,jobs 含 archmageIL)
// Freezing Crush(凍結層數:爆傷 / 雷屬消耗層數增傷)待戰鬥模擬時收錄

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-il')

export const ARCHMAGE_IL_2ND_SKILLS = [
  {
    id: 'spell_mastery_il',
    name: 'Spell Mastery',
    imageUrl: ICON('2200006'),
    jobs: ['archmageIL'],
    advancement: 2,
    kind: 'passive',
    mastery: 50,
    stats: { matk: 10, critRate: 5 },
    cp: { role: 'passive' },
  },
  {
    id: 'high_wisdom_il',
    name: 'High Wisdom',
    imageUrl: ICON('2200007'),
    jobs: ['archmageIL'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'agile_magic_il',
    name: 'Agile Magic',
    imageUrl: ICON('2200012'),
    jobs: ['archmageIL'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 20 },
    cp: { role: 'passive' },
  },
]

export const ARCHMAGE_IL_2ND_SIM_SKILLS     = ARCHMAGE_IL_2ND_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_IL_2ND_PASSIVE_SKILLS = ARCHMAGE_IL_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_IL_2ND_BUFFS          = ARCHMAGE_IL_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_IL_2ND_BATTLE_BUFFS   = ARCHMAGE_IL_2ND_SKILLS.filter((s) => s.battle)
export const ARCHMAGE_IL_2ND_VMATRIX_SKILLS = ARCHMAGE_IL_2ND_SKILLS.filter((s) => s.vmatrix)
