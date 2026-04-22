// 火毒 — 1 轉技能 (Intro to Magic)
//
// wiki:https://maplestorywiki.net/w/Arch_Mage_(Fire,_Poison)/Skills
// 本檔目前僅骨架(id/name/kind 等 meta),數值(傷害/等級表/MP/CD)待後續補齊。

// 注意:Teleport Mastery 在 3 轉(見 3rd.js)。
// MP Boost 屬三法系共通(_shared/class-groups/adventurer-mage/1st.js)。

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

export const ARCHMAGE_FP_1ST_SKILLS = [
  {
    id: 'energy_bolt',
    name: 'Energy Bolt',
    nameKey: 'skills.archmageFP.energy_bolt.name',
    descriptionKey: 'skills.archmageFP.energy_bolt.description',
    imageUrl: ICON('Energy_Bolt'),
    jobs: ['archmageFP'],
    advancement: 1,
    kind: 'attack',
    element: 'fire',
  },
  {
    id: 'magic_guard',
    name: 'Magic Guard',
    nameKey: 'skills.archmageFP.magic_guard.name',
    descriptionKey: 'skills.archmageFP.magic_guard.description',
    imageUrl: ICON('Magic_Guard_(Magician)'),
    jobs: ['archmageFP'],
    advancement: 1,
    kind: 'toggle',
  },
  {
    id: 'teleport',
    name: 'Teleport',
    nameKey: 'skills.archmageFP.teleport.name',
    descriptionKey: 'skills.archmageFP.teleport.description',
    // wiki 無獨立 Teleport 主圖,暫用 Teleport Mastery 共用
    imageUrl: ICON('Teleport_Mastery_(Fire,_Poison)'),
    jobs: ['archmageFP'],
    advancement: 1,
    kind: 'utility',
  },
  {
    id: 'mana_wave',
    name: 'Mana Wave',
    nameKey: 'skills.archmageFP.mana_wave.name',
    descriptionKey: 'skills.archmageFP.mana_wave.description',
    imageUrl: ICON('Mana_Wave'),
    jobs: ['archmageFP'],
    advancement: 1,
    kind: 'utility',
  },
  {
    id: 'magic_armor',
    name: 'Magic Armor',
    nameKey: 'skills.archmageFP.magic_armor.name',
    descriptionKey: 'skills.archmageFP.magic_armor.description',
    imageUrl: ICON('Magic_Armor'),
    jobs: ['archmageFP'],
    advancement: 1,
    kind: 'passive',
  },
]

// 子分類 — 全部從主列表 filter derive
export const ARCHMAGE_FP_1ST_SIM_SKILLS     = ARCHMAGE_FP_1ST_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_1ST_TOGGLE_SKILLS  = ARCHMAGE_FP_1ST_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_1ST_BUFFS          = ARCHMAGE_FP_1ST_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_1ST_PASSIVE_SKILLS = ARCHMAGE_FP_1ST_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_1ST_VMATRIX_SKILLS = ARCHMAGE_FP_1ST_SKILLS.filter((s) => s.vmatrix)
export const ARCHMAGE_FP_1ST_BATTLE_BUFFS   = ARCHMAGE_FP_1ST_SKILLS.filter((s) => s.battle)
