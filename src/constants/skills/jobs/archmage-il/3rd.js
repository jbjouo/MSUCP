// 冰雷 — 3 轉技能
//
// 資料來源:scripts/skill-db/arch-mage-i-l/3rd.json
// 待戰鬥模擬時收錄:Storm Magic(異常狀態終傷 +20%)、Shatter(凍結層數無視防禦 +2%/層)、
//   Ice Strike / Thunder Sphere / Frost Ward(攻擊)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-il')

export const ARCHMAGE_IL_3RD_SKILLS = [
  {
    id: 'element_amplification_il',
    name: 'Element Amplification',
    imageUrl: ICON('2210001'),
    jobs: ['archmageIL'],
    advancement: 3,
    kind: 'passive',
    stats: { dmgPct: 50 },
    cp: { role: 'passive' },
  },
  {
    id: 'elemental_decrease_il',
    name: 'Elemental Decrease',
    imageUrl: ICON('2210016'),
    jobs: ['archmageIL'],
    advancement: 3,
    kind: 'passive',
    stats: { finalDmg: 40, elementalResist: 10 },
    cp: { role: 'passive' },
  },
  {
    id: 'arcane_overdrive_il',
    name: 'Arcane Overdrive',
    imageUrl: ICON('2210009'),
    jobs: ['archmageIL'],
    advancement: 3,
    kind: 'passive',
    stats: { critRate: 30, critDmg: 13 },
    cp: { role: 'passive' },
  },
]

export const ARCHMAGE_IL_3RD_SIM_SKILLS     = ARCHMAGE_IL_3RD_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_IL_3RD_PASSIVE_SKILLS = ARCHMAGE_IL_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_IL_3RD_BUFFS          = ARCHMAGE_IL_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_IL_3RD_BATTLE_BUFFS   = ARCHMAGE_IL_3RD_SKILLS.filter((s) => s.battle)
export const ARCHMAGE_IL_3RD_VMATRIX_SKILLS = ARCHMAGE_IL_3RD_SKILLS.filter((s) => s.vmatrix)
