// Luminous — 4 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'luminous')

// ─── Reflection ─────────────────────────────────────────────────────────────
// [光技能] 填充攻擊,光狀態下增加能量條
export const REFLECTION = {
  id: 'reflection',
  name: 'Reflection',
  nameKey: 'skills.luminous.reflection.name',
  descriptionKey: 'skills.luminous.reflection.description',
  imageUrl: ICON('27121100'),
  color: '#ffe066',
  jobs: ['luminous'],
  advancement: 4,
  kind: 'attack',
  element: 'light',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 81,
  hitsPerCast: 4,
  maxEnemies: 8,
  damage: { base: 440, perLevel: 4 },
  gaugeEnergy: 390,
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 2,
    maxTargetBonus: { threshold: 20, value: 1 },
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 8: 630 },
  },
}

// ─── Apocalypse ─────────────────────────────────────────────────────────────
// [暗技能] 填充攻擊,暗狀態下增加能量條
export const APOCALYPSE = {
  id: 'apocalypse',
  name: 'Apocalypse',
  nameKey: 'skills.luminous.apocalypse.name',
  descriptionKey: 'skills.luminous.apocalypse.description',
  imageUrl: ICON('27121202'),
  color: '#9966cc',
  jobs: ['luminous'],
  advancement: 4,
  kind: 'attack',
  element: 'dark',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 100,
  hitsPerCast: 7,
  maxEnemies: 8,
  damage: { base: 375, perLevel: 4 },
  gaugeEnergy: 410,
  gaugeEnergyRecharge: 450,
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 2,
    maxTargetBonus: { threshold: 20, value: 1 },
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 8: 720 },
  },
}

// ─── Ender ──────────────────────────────────────────────────────────────────
// [平衡技能] CD 攻擊,不增加能量;自帶 100% CritRate + IgnDef
export const ENDER = {
  id: 'ender',
  name: 'Ender',
  nameKey: 'skills.luminous.ender.name',
  descriptionKey: 'skills.luminous.ender.description',
  imageUrl: ICON('27121303'),
  color: '#66cccc',
  jobs: ['luminous'],
  advancement: 4,
  kind: 'attack',
  element: 'equilibrium',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 49,
  hitsPerCast: 7,
  maxEnemies: 2,
  damage: { base: 455, perLevel: 5 },
  ignoreDef: { base: 40, perLevel: 1 },
  additionalCritRate: 100,
  cooldown: 12,
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 2,
    maxTargetBonus: { threshold: 20, value: 1 },
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 8: 600 },
    priority: 100,
  },
}

// ─── Dark Crescendo ─────────────────────────────────────────────────────────
// 攻擊命中 80% 機率疊層,每層 +8% Damage,最多 5 層,30s
const DARK_CRESCENDO = {
  id: 'dark_crescendo',
  name: 'Dark Crescendo',
  nameKey: 'skills.luminous.dark_crescendo.name',
  descriptionKey: 'skills.luminous.dark_crescendo.description',
  imageUrl: ICON('27120005'),
  jobs: ['luminous'],
  advancement: 4,
  kind: 'passive',
  baseLevel: 30,
  battle: {
    source: 'passive',
    passiveType: 'procOnHit',
    procRate: 80,
    maxStacks: 5,
    durationSec: 30,
    perStackDamagePct: 8,
  },
}

export const LUMINOUS_4TH_SKILLS = [
  REFLECTION,
  APOCALYPSE,
  ENDER,
  DARK_CRESCENDO,
  {
    id: 'lumi_magic_mastery',
    name: 'Magic Mastery',
    imageUrl: ICON(27120007),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'passive',
    stats: { matk: 30, critRate: 15, critDmg: 18 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_arcane_pitch_passive',
    name: 'Arcane Pitch',
    imageUrl: ICON(27121006),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'passive',
    stats: { finalDmg: 40, ignoreDef: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_arcane_pitch_buff',
    name: 'Arcane Pitch',
    icon: ICON(27121006),
    imageUrl: ICON(27121006),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'buff',
    stats: { elementalResist: 10 },
    cp: { role: 'buff' },
  },
  {
    id: 'lumi_morning_star',
    name: 'Morning Star',
    imageUrl: ICON(27121201),
    jobs: ['luminous'],
    advancement: 4,
    kind: 'passive',
    stats: { finalDmg: 40, bossDmg: 15 },
    cp: { role: 'passive' },
  },
]

export const LUMINOUS_4TH_SIM_SKILLS     = LUMINOUS_4TH_SKILLS.filter((s) => s.sim)
export const LUMINOUS_4TH_PASSIVE_SKILLS = LUMINOUS_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const LUMINOUS_4TH_BUFFS          = LUMINOUS_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const LUMINOUS_4TH_BATTLE_BUFFS   = LUMINOUS_4TH_SKILLS
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
export const LUMINOUS_4TH_VMATRIX_SKILLS = LUMINOUS_4TH_SKILLS.filter((s) => s.vmatrix)
