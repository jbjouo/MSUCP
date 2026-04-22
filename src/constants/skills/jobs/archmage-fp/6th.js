// 火毒 — 6 轉 (HEXA Skills)
//
// wiki 分類:
//   Shared Skills:        Sol Janus / Sol Janus: Dusk
//   Class-Specific:       Infernal Venom (Origin) / Immortal Flame (Ascent)
//   Mastery Skills (9):   HEXA Flame Sweep / Flame Haze / Mist Eruption / Ignite /
//                         Ifrit / Inferno Aura / Creeping Toxin / Meteor Shower / Megiddo Flame
//   Enhancements:         DoT Punisher Boost
//
// 目前全部為骨架 entry(id / name / kind / advancement=6);數值待補。
// 使用者:6 轉未開放 → 只建檔。

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

// ─── 6 轉 HEXA Skills 主列表 ────────────────────────────────────────────────
export const ARCHMAGE_FP_6TH_SKILLS = [
  // ── Shared ─────────────────────────────────────────────────────────────
  {
    id: 'sol_janus',
    name: 'Sol Janus',
    nameKey: 'skills.common.sol_janus.name',
    descriptionKey: 'skills.common.sol_janus.description',
    imageUrl: ICON('Sol_Janus'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'active',
  },
  {
    id: 'sol_janus_dusk',
    name: 'Sol Janus: Dusk',
    nameKey: 'skills.common.sol_janus_dusk.name',
    descriptionKey: 'skills.common.sol_janus_dusk.description',
    imageUrl: ICON('Sol_Janus_Dusk'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'passive',
  },

  // ── Class-Specific ──────────────────────────────────────────────────────
  {
    id: 'infernal_venom',
    name: 'Infernal Venom',
    nameKey: 'skills.archmageFP.infernal_venom.name',
    descriptionKey: 'skills.archmageFP.infernal_venom.description',
    imageUrl: ICON('Infernal_Venom'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'fire',
    // HEXA Origin skill — 終極火毒融合攻擊
    hexa: { origin: true },
  },
  {
    id: 'immortal_flame',
    name: 'Immortal Flame',
    nameKey: 'skills.archmageFP.immortal_flame.name',
    descriptionKey: 'skills.archmageFP.immortal_flame.description',
    imageUrl: ICON('Immortal_Flame'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'fire',
    // HEXA Ascent skill
    hexa: { ascent: true },
  },

  // ── Mastery Skills (9):HEXA 化原技能版本 ──────────────────────────────
  {
    id: 'hexa_flame_sweep',
    name: 'HEXA Flame Sweep',
    nameKey: 'skills.archmageFP.hexa_flame_sweep.name',
    descriptionKey: 'skills.archmageFP.hexa_flame_sweep.description',
    imageUrl: ICON('HEXA_Flame_Sweep'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'flame_sweep' },
  },
  {
    id: 'hexa_flame_haze',
    name: 'HEXA Flame Haze',
    nameKey: 'skills.archmageFP.hexa_flame_haze.name',
    descriptionKey: 'skills.archmageFP.hexa_flame_haze.description',
    imageUrl: ICON('HEXA_Flame_Haze'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'flame_haze' },
  },
  {
    id: 'hexa_mist_eruption',
    name: 'HEXA Mist Eruption',
    nameKey: 'skills.archmageFP.hexa_mist_eruption.name',
    descriptionKey: 'skills.archmageFP.hexa_mist_eruption.description',
    imageUrl: ICON('HEXA_Mist_Eruption'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'poison',
    hexa: { mastery: true, baseSkillId: 'mist_eruption' },
  },
  {
    id: 'hexa_ignite',
    name: 'HEXA Ignite',
    nameKey: 'skills.archmageFP.hexa_ignite.name',
    descriptionKey: 'skills.archmageFP.hexa_ignite.description',
    imageUrl: ICON('HEXA_Ignite'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'passive',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'ignite' },
  },
  {
    id: 'hexa_ifrit',
    name: 'HEXA Ifrit',
    nameKey: 'skills.archmageFP.hexa_ifrit.name',
    descriptionKey: 'skills.archmageFP.hexa_ifrit.description',
    imageUrl: ICON('HEXA_Ifrit'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'summon',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'ifrit' },
  },
  {
    id: 'hexa_inferno_aura',
    name: 'HEXA Inferno Aura',
    nameKey: 'skills.archmageFP.hexa_inferno_aura.name',
    descriptionKey: 'skills.archmageFP.hexa_inferno_aura.description',
    imageUrl: ICON('HEXA_Inferno_Aura'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'toggle',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'inferno_aura' },
  },
  {
    id: 'hexa_creeping_toxin',
    name: 'HEXA Creeping Toxin',
    nameKey: 'skills.archmageFP.hexa_creeping_toxin.name',
    descriptionKey: 'skills.archmageFP.hexa_creeping_toxin.description',
    imageUrl: ICON('HEXA_Creeping_Toxin'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'summon',
    element: 'poison',
    hexa: { mastery: true, baseSkillId: 'creeping_toxin' },
  },
  {
    id: 'hexa_meteor_shower',
    name: 'HEXA Meteor Shower',
    nameKey: 'skills.archmageFP.hexa_meteor_shower.name',
    descriptionKey: 'skills.archmageFP.hexa_meteor_shower.description',
    imageUrl: ICON('HEXA_Meteor_Shower'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'meteor_shower' },
  },
  {
    id: 'hexa_megiddo_flame',
    name: 'HEXA Megiddo Flame',
    nameKey: 'skills.archmageFP.hexa_megiddo_flame.name',
    descriptionKey: 'skills.archmageFP.hexa_megiddo_flame.description',
    imageUrl: ICON('HEXA_Megiddo_Flame'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'attack',
    element: 'fire',
    hexa: { mastery: true, baseSkillId: 'megiddo_flame' },
  },

  // ── Enhancement:DoT Punisher Boost (沿用 DoT Punisher 圖示) ──────────
  {
    id: 'dot_punisher_boost',
    name: 'DoT Punisher Boost',
    nameKey: 'skills.archmageFP.dot_punisher_boost.name',
    descriptionKey: 'skills.archmageFP.dot_punisher_boost.description',
    imageUrl: ICON('DoT_Punisher'),
    jobs: ['archmageFP'],
    advancement: 6,
    kind: 'passive',
    hexa: { enhancement: true, baseSkillId: 'dot_punisher', maxLevel: 30 },
  },
]

// 子分類 — 從主列表 filter derive
export const ARCHMAGE_FP_6TH_SIM_SKILLS     = ARCHMAGE_FP_6TH_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_6TH_TOGGLE_SKILLS  = ARCHMAGE_FP_6TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_6TH_BUFFS          = ARCHMAGE_FP_6TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_6TH_PASSIVE_SKILLS = ARCHMAGE_FP_6TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_6TH_VMATRIX_SKILLS = ARCHMAGE_FP_6TH_SKILLS.filter((s) => s.vmatrix)
export const ARCHMAGE_FP_6TH_BATTLE_BUFFS   = ARCHMAGE_FP_6TH_SKILLS.filter((s) => s.battle)
