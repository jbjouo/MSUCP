// 冰雷 — 4 轉技能
//
// 資料來源:scripts/skill-db/arch-mage-i-l/4th.json
// 共用層已涵蓋:Infinity / Arcane Aim(adventurer-mage)、Maple Warrior(all-jobs)
// 待戰鬥模擬時收錄:Frost Clutch(凍結層數:爆傷 +3%/層、雷屬消耗 +12%/層)、Chain Lightning、
//   Blizzard(含 60% 追擊)、Frozen Orb、Elquines(召喚)、Freezing Breath(魔防 −30% / 物防 −15%)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-il')

export const ARCHMAGE_IL_4TH_SKILLS = [
  {
    id: 'buff_mastery_il',
    name: 'Buff Mastery',
    imageUrl: ICON('2220013'),
    jobs: ['archmageIL'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 10,
    // Lv10:魔攻 +30、加持 +50%;Combat Orders 每級 +3 / +5%(同火毒)
    contribute(ctx) {
      const co = ctx.skillLevelBonus || 0
      return { matk: 30 + co * 3, buffDuration: 50 + co * 5 }
    },
    cp: { role: 'passive' },
  },
]

export const ARCHMAGE_IL_4TH_SIM_SKILLS     = ARCHMAGE_IL_4TH_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_IL_4TH_PASSIVE_SKILLS = ARCHMAGE_IL_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_IL_4TH_BUFFS          = ARCHMAGE_IL_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_IL_4TH_BATTLE_BUFFS   = ARCHMAGE_IL_4TH_SKILLS.filter((s) => s.battle)
export const ARCHMAGE_IL_4TH_VMATRIX_SKILLS = ARCHMAGE_IL_4TH_SKILLS.filter((s) => s.vmatrix)
