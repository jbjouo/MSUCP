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

// ─── Liberation Orb (解放寶珠) ──────────────────────────────────────────────
// V 4技 (skillId: 400021105):被動追擊(6s CD) + 主動 buff(45s/CD 180s)
//
// [Passive] 光/暗技能命中 → 追擊 damage×4 + 累積 Magic Power(光暗各 4,最多 8)
//   Lv1: 390%, Lv25: 750%, +15%/lv
//   6s 被動 CD;平衡狀態下光暗同時觸發
//
// [Active] 需 ≥1 MP → 45s buff,攻擊命中生成 10 球 × 20 次觸發(0.9s 間隔)
//   Balance  Lv1: 676%, Lv25: 1300%, +26%/lv
//   Imbalance Lv1: 624%, Lv25: 1200%, +24%/lv
//   每多 1 MP(超過第 1 點)傷害 +mpBonus%: Lv1: 78%, Lv25: 150%, +3%/lv
//   滿 8 MP Balance: (1300+150×7)×10 = 23,500% per trigger (Lv25)
//   100% CritRate,不吃狀態鏡效果
//
// 簡化模型:假設滿 8 MP Balance,一次施放算 200 擊(20 觸發 × 10 球)
export const LIBERATION_ORB_PASSIVE = {
  id: 'liberation_orb_passive',
  name: 'Liberation Orb (Passive)',
  nameKey: 'skills.luminous.liberation_orb_passive.name',
  descriptionKey: 'skills.luminous.liberation_orb_passive.description',
  imageUrl: ICON('400021105'),
  color: '#ffaa55',
  jobs: ['luminous'],
  advancement: 5,
  kind: 'attack',
  baseLevel: 1,
  hitsPerCast: 4,
  maxEnemies: 7,
  damage: { base: 390, perLevel: 15 },
  sim: {
    role: 'passive',
  },
  liberationOrb: {
    passiveCdSec: 6,
  },
}

export const LIBERATION_ORB_ACTIVE = {
  id: 'liberation_orb_active',
  name: 'Liberation Orb',
  nameKey: 'skills.luminous.liberation_orb_active.name',
  descriptionKey: 'skills.luminous.liberation_orb_active.description',
  imageUrl: ICON('400021105'),
  color: '#ffaa55',
  jobs: ['luminous'],
  advancement: 5,
  kind: 'attack',
  baseLevel: 1,
  combatOrdersEligible: false,
  mpCost: 1200,
  hitsPerCast: 0,
  maxEnemies: 1,
  // damage 用 Balance + 滿 8 MP combined 值(供 sim 單擊傷害計算)
  damage: { base: 1222, perLevel: 47 },
  liberationOrb: {
    balanceDamage: { base: 676, perLevel: 26 },
    imbalanceDamage: { base: 624, perLevel: 24 },
    mpBonusDamage: { base: 78, perLevel: 3 },
    assumedMp: 8,
  },
  additionalCritRate: 100,
  cooldown: 180,
  vmatrix: {
    kind: 'skill',
    maxLevel: 30,
    nameKey: 'vmatrix.skills.liberation_orb',
    descriptionKey: 'vmatrix.skills.liberation_orb_desc',
  },
  vSlot: 4,
  noCombatOrders: true,
  sim: {
    role: 'attack',
    castDelayBySpeed: { 8: 510 },
    priority: 140,
    buffAttack: {
      triggers: 20,
      intervalMs: 900,
      hitsPerTrigger: 10,
      durationSec: 45,
    },
  },
}

const LUMINOUS_5TH_SKILLS = [
  AETHER_CONDUIT,
  BAPTISM,
  LIBERATION_ORB_ACTIVE,
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
