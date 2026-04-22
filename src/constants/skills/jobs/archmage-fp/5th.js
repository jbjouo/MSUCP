// 火毒 — 5 轉 (V Skills)
//
// wiki 分類:
//   Class-Specific Skills: DoT Punisher
//   Enhancements: Flame Orb / Poison Breath / Ignite / Explosion / Poison Mist /
//                 Teleport Mastery (與 Creeping Toxin 共用) / Flame Haze /
//                 Mist Eruption / Ifrit / Flame Sweep / Meteor Shower /
//                 Inferno Aura / Megiddo Flame
//
// 各技能的 V 矩陣 core(enhancement)以 `vmatrix` 欄位掛在技能本體 entry,
// 不在此檔另建獨立 boost 條目 — 與既有 flame_sweep / flame_haze / mist_eruption / ignite 一致。
//
// 通用 V 技能(Rope Lift / Decent 系列 / Blink / Erda Nova / Decent Holy Symbol 等)
// 在 _shared/all-jobs/5th.js。

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

// ─── DoT Punisher (class-specific V) ───────────────────────────────────────
// Wiki: 依敵人身上 DoT 層數召喚火焰球攻擊;master 25
// 本檔僅骨架,數值(傷害 / 等級表 / MP / CD)待後續補齊。
export const DOT_PUNISHER = {
  id: 'dot_punisher',
  name: 'DoT Punisher',
  nameKey: 'skills.archmageFP.dot_punisher.name',
  descriptionKey: 'skills.archmageFP.dot_punisher.description',
  imageUrl: ICON('DoT_Punisher'),
  jobs: ['archmageFP'],
  advancement: 5,
  kind: 'attack',
  element: 'fire',
  // 5 轉 V 技能本體 — skill core(等級 = V 技能自身等級)
  vmatrix: { kind: 'skill', maxLevel: 30 },
}

// ─── 5 轉所有火毒技能 ───────────────────────────────────────────────────────
export const ARCHMAGE_FP_5TH_SKILLS = [
  DOT_PUNISHER,
]

// 子分類 — 全部從主列表 filter derive
export const ARCHMAGE_FP_5TH_SIM_SKILLS     = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_5TH_TOGGLE_SKILLS  = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_5TH_BUFFS          = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_5TH_PASSIVE_SKILLS = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_5TH_VMATRIX_SKILLS = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.vmatrix)
export const ARCHMAGE_FP_5TH_BATTLE_BUFFS   = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.battle)
