// Luminous — 5 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'luminous')

// ─── Aether Conduit (混沌共鳴) ──────────────────────────────────────────────
// V 2技:依狀態切換(光 4擊×24次 / 暗 5擊×28次 / 平衡 6擊×28次)
// 施放後 0.96s 準備,持續攻擊 5.04s;只在平衡使用
// 不是光暗平衡魔法(5轉),不吃追擊/affinity
export const AETHER_CONDUIT = {
  id: 'aether_conduit',
  name: 'Aether Conduit',
  nameKey: 'skills.luminous.aether_conduit.name',
  descriptionKey: 'skills.luminous.aether_conduit.description',
  imageUrl: ICON('400021041'),
  color: '#aa88ff',
  jobs: ['luminous'],
  advancement: 5,
  kind: 'attack',
  baseLevel: 1,
  combatOrdersEligible: false,
  mpCost: 1000,
  maxEnemies: 10,
  additionalCritRate: 15,
  cooldown: 30,
  // 平衡模式:6 擊 × 28 次 = 168 擊
  hitsPerCast: 6,
  explosions: { count: 28 },
  damage: { base: 442, perLevel: 17 },
  // 各狀態差異(資料保留,引擎目前用平衡模式)
  mirrorDamage: {
    light:       { damage: { base: 468, perLevel: 18 }, hitsPerCast: 4, ticks: 24 },
    dark:        { damage: { base: 328, perLevel: 13 }, hitsPerCast: 5, ticks: 28 },
    equilibrium: { damage: { base: 442, perLevel: 17 }, hitsPerCast: 6, ticks: 28 },
  },
  mirrorEquilibriumOnly: true,
  vmatrix: {
    kind: 'skill',
    maxLevel: 30,
    nameKey: 'vmatrix.skills.aether_conduit',
    descriptionKey: 'vmatrix.skills.aether_conduit_desc',
  },
  vSlot: 2,
  noCombatOrders: true,
  sim: {
    role: 'attack',
    castDelayBySpeed: { 8: 600 },
    priority: 110,
  },
}

// ─── Baptism of Light and Darkness (光與暗的洗禮) ───────────────────────────
// V 3技:13 次連擊 × 7 擊,100% CritRate + 100% IgnDef,CD 45s
// 平衡技能命中時 CD -3s;進入平衡時 CD 重置
export const BAPTISM = {
  id: 'baptism_of_light_and_darkness',
  name: 'Baptism of Light and Darkness',
  nameKey: 'skills.luminous.baptism.name',
  descriptionKey: 'skills.luminous.baptism.description',
  imageUrl: ICON('400021071'),
  color: '#55ddcc',
  jobs: ['luminous'],
  advancement: 5,
  kind: 'attack',
  baseLevel: 1,
  combatOrdersEligible: false,
  mirrorEnterEquilibrium: true,
  mpCost: 2000,
  hitsPerCast: 7,
  explosions: { count: 13 },
  maxEnemies: 2,
  damage: { base: 468, perLevel: 18 },
  ignoreDef: { base: 100, perLevel: 0 },
  additionalCritRate: 100,
  cooldown: 45,
  mirrorCdResetOnEnter: true,
  mirrorCdReduceOnEqHit: 3,
  vmatrix: {
    kind: 'skill',
    maxLevel: 30,
    nameKey: 'vmatrix.skills.baptism_of_light_and_darkness',
    descriptionKey: 'vmatrix.skills.baptism_of_light_and_darkness_desc',
  },
  vSlot: 3,
  noCombatOrders: true,
  sim: {
    role: 'attack',
    castDelayBySpeed: { 8: 600 },
    priority: 120,
  },
}

const LUMINOUS_5TH_SKILLS = [
  AETHER_CONDUIT,
  BAPTISM,
]

export const LUMINOUS_5TH_SIM_SKILLS     = LUMINOUS_5TH_SKILLS.filter((s) => s.sim)
export const LUMINOUS_5TH_PASSIVE_SKILLS = LUMINOUS_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const LUMINOUS_5TH_BUFFS          = LUMINOUS_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const LUMINOUS_5TH_BATTLE_BUFFS   = LUMINOUS_5TH_SKILLS
  .filter((s) => s.battle)
  .map((s) => ({
    id: s.id,
    nameKey: s.nameKey,
    descriptionKey: s.descriptionKey,
    imageUrl: s.imageUrl,
    jobs: s.jobs,
    advancement: s.advancement,
    kind: s.kind,
    baseLevel: s.baseLevel,
    ...s.battle,
  }))
export const LUMINOUS_5TH_VMATRIX_SKILLS = LUMINOUS_5TH_SKILLS.filter((s) => s.vmatrix)
