// 火毒 — 3 轉技能
//
// wiki 分類:
//   Explosion / Poison Mist / Creeping Toxin / Elemental Adaptation /
//   Teleport Mastery / Teleport Boost / Elemental Decrease /
//   Element Amplification / Arcane Overdrive / Burning Magic
//
// 本檔:
//   - Poison Mist / Element Amplification / Teleport Mastery / Burning Magic /
//     Arcane Overdrive / Elemental Decrease — 既有數值保留,僅調整 advancement
//   - 新增 explosion / creeping_toxin / elemental_adaptation / teleport_boost 骨架

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

// ─── Poison Mist (保留原數值) ──────────────────────────────────────────────
export const POISON_MIST = {
  id: 'poison_mist',
  name: 'Poison Mist',
  nameKey: 'skills.archmageFP.poison_mist.name',
  descriptionKey: 'skills.archmageFP.poison_mist.description',
  imageUrl: ICON('Poison_Mist'),
  color: '#7de070',
  jobs: ['archmageFP'],
  advancement: 3,
  kind: 'attack',
  element: 'poison',
  baseLevel: 20,
  mpCost: 55,
  hitsPerCast: 1,
  maxEnemies: 6,
  damage: { base: 270, perLevel: 4 },
  burn: {
    base: 240,
    perLevel: 6,
    durationSec: 6,
    tickIntervalSec: 1,
  },
  fieldDurationSec: 15,
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  sim: {
    role: 'derived',
    castDelayBySpeed: { 7: 0, 8: 0 },
  },
}

// creeping_toxin 與 teleport_mastery 共用同一個 V 矩陣 core —
// 等級同步(用 coreGroupId 標記,useVMatrix 會同步寫入同組所有 id)。
const CORE_GROUP_TELEPORT_CREEPING = 'teleport_mastery_creeping_toxin'

// ─── Teleport Mastery (從 2 轉搬入,advancement 2→3,其他不動) ──────────────
// 遊戲本質為 passive(mastery);本 sim 為延續 DoT 改為週期性 aura 排程。
export const TELEPORT_MASTERY = {
  id: 'teleport_mastery',
  name: 'Teleport Mastery',
  nameKey: 'skills.archmageFP.teleport_mastery.name',
  descriptionKey: 'skills.archmageFP.teleport_mastery.description',
  imageUrl: ICON('Teleport_Mastery_(Fire,_Poison)'),
  color: '#9ad4ff',
  jobs: ['archmageFP'],
  advancement: 3,
  kind: 'passive',
  element: 'fire',
  baseLevel: 10,
  mpCost: 20,
  hitsPerCast: 1,
  maxEnemies: 6,
  damage: { base: 272, perLevel: 8 },
  burn: {
    base: 98,
    perLevel: 3,
    durationSec: 20,
    tickIntervalSec: 2,
  },
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 3, ignoreDefBonus: { threshold: 40, value: 20 }, coreGroupId: CORE_GROUP_TELEPORT_CREEPING },
  sim: {
    role: 'aura',
    castDelayBySpeed: { 7: 0, 8: 0 },
    aura: {
      intervalSec: 30,
      firstHitWindowSec: [0, 0],
      defaultEnabled: true,
    },
  },
}

// ─── Burning Magic (從 5 轉搬入,advancement 5→3) ──────────────────────────
export const BURNING_MAGIC = {
  id: 'burning_magic',
  name: 'Burning Magic',
  nameKey: 'skills.archmageFP.burning_magic.name',
  descriptionKey: 'skills.archmageFP.burning_magic.description',
  imageUrl: ICON('Burning_Magic'),
  jobs: ['archmageFP'],
  advancement: 3,
  kind: 'passive',
  baseLevel: 10,
  finalDmgPctWhenDotActive: 20,
  dotDurationMult: 2.0,
}

// ─── 3 轉所有火毒技能 ───────────────────────────────────────────────────────
export const ARCHMAGE_FP_3RD_SKILLS = [
  // 攻擊 / 召喚(骨架,數值待補)
  {
    id: 'explosion',
    name: 'Explosion',
    nameKey: 'skills.archmageFP.explosion.name',
    descriptionKey: 'skills.archmageFP.explosion.description',
    imageUrl: ICON('Explosion'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'attack',
    element: 'fire',
    vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  },
  POISON_MIST,
  {
    id: 'creeping_toxin',
    name: 'Creeping Toxin',
    nameKey: 'skills.archmageFP.creeping_toxin.name',
    descriptionKey: 'skills.archmageFP.creeping_toxin.description',
    imageUrl: ICON('Creeping_Toxin'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'summon',
    element: 'poison',
    vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 3, ignoreDefBonus: { threshold: 40, value: 20 }, coreGroupId: CORE_GROUP_TELEPORT_CREEPING },
  },
  // Buff
  {
    id: 'elemental_adaptation',
    name: 'Elemental Adaptation',
    nameKey: 'skills.archmageFP.elemental_adaptation.name',
    descriptionKey: 'skills.archmageFP.elemental_adaptation.description',
    imageUrl: ICON('Elemental_Adaptation_(Fire,_Poison)'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'buff',
  },
  // Teleport Mastery / Boost
  TELEPORT_MASTERY,
  {
    id: 'teleport_boost',
    name: 'Teleport Boost',
    nameKey: 'skills.archmageFP.teleport_boost.name',
    descriptionKey: 'skills.archmageFP.teleport_boost.description',
    imageUrl: ICON('Teleport_Boost_(Fire,_Poison)'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'utility',
  },
  // Passive
  {
    id: 'element_amplification',
    name: 'Element Amplification',
    imageUrl: ICON('Element_Amplification'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'passive',
    stats: { dmgPct: 50 },
    cp: { role: 'passive' },
  },
  {
    id: 'elemental_decrease',
    name: 'Elemental Decrease',
    imageUrl: ICON('Elemental_Decrease_(Magician)'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'passive',
    stats: { finalDmg: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'arcane_overdrive',
    name: 'Arcane Overdrive',
    imageUrl: ICON('Arcane_Overdrive'),
    jobs: ['archmageFP'],
    advancement: 3,
    kind: 'passive',
    stats: { critRate: 30, critDmg: 13 },
    cp: { role: 'passive' },
  },
  BURNING_MAGIC,
]

// 子分類 — 全部從主列表 filter derive
export const ARCHMAGE_FP_3RD_SIM_SKILLS     = ARCHMAGE_FP_3RD_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_3RD_TOGGLE_SKILLS  = ARCHMAGE_FP_3RD_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_3RD_BUFFS          = ARCHMAGE_FP_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_3RD_PASSIVE_SKILLS = ARCHMAGE_FP_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_3RD_VMATRIX_SKILLS = ARCHMAGE_FP_3RD_SKILLS.filter((s) => s.vmatrix)
export const ARCHMAGE_FP_3RD_BATTLE_BUFFS   = ARCHMAGE_FP_3RD_SKILLS.filter((s) => s.battle)
