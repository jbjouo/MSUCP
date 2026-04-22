// 火毒 — 4 轉技能
//
// SIM:
//   Flame Sweep   (主要 filler)
//   Flame Haze    (4 轉 bound;會衍生 Poison Mist)
//   Mist Eruption (4 轉 finisher)
//   Ifrit         (4 轉召喚,sim 視為 aura)
//   Meteor Shower (被動 Final Attack,sim 不排程)
//
// PASSIVE (SKILLS passive: true):
//   Arcane Overdrive / Elemental Decrease / Buff Mastery
//
// BATTLE BUFFS:
//   Fervent Drain (passive / dotCount)
//   Infinity      (activeToggle)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

// ─── Flame Sweep ────────────────────────────────────────────────────────────
export const FLAME_SWEEP = {
  id: 'flame_sweep',
  name: 'Flame Sweep',
  nameKey: 'skills.archmageFP.flame_sweep.name',
  descriptionKey: 'skills.archmageFP.flame_sweep.description',
  imageUrl: ICON('Flame_Sweep'),
  color: '#ffa477',
  jobs: ['archmageFP'],
  advancement: 4,
  kind: 'attack',
  element: 'fire',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 40,
  hitsPerCast: 7,
  maxEnemies: 8,
  damage: { base: 220, perLevel: 3 },
  burn: {
    base: 240,
    perLevel: 4,
    durationSec: 5,
    tickIntervalSec: 1,
  },
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 2,
    ignoreDefBonus: { threshold: 40, value: 20 },
    descriptionKey: 'vmatrix.skills.flame_sweep_core.description',
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 660, 8: 600 },
  },
}

// ─── Flame Haze ─────────────────────────────────────────────────────────────
export const FLAME_HAZE = {
  id: 'flame_haze',
  name: 'Flame Haze',
  nameKey: 'skills.archmageFP.flame_haze.name',
  descriptionKey: 'skills.archmageFP.flame_haze.description',
  imageUrl: ICON('Flame_Haze'),
  color: '#ff8a3d',
  jobs: ['archmageFP'],
  advancement: 4,
  kind: 'attack',
  element: 'fire',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 70,
  hitsPerCast: 15,
  maxEnemies: 1,
  damage: { base: 202, perLevel: 3 },
  burn: {
    base: 200,
    perLevel: 3,
    durationSec: 10,
    tickIntervalSec: 1,
  },
  cooldown: 10,
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 2,
    ignoreDefBonus: { threshold: 40, value: 20 },
    descriptionKey: 'vmatrix.skills.flame_haze_core.description',
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 960, 8: 900 },
    priority: 100,
    onHitSpawn: ['poison_mist'],
  },
}

// ─── Mist Eruption ──────────────────────────────────────────────────────────
export const MIST_ERUPTION = {
  id: 'mist_eruption',
  name: 'Mist Eruption',
  nameKey: 'skills.archmageFP.mist_eruption.name',
  descriptionKey: 'skills.archmageFP.mist_eruption.description',
  imageUrl: ICON('Mist_Eruption'),
  color: '#b983ff',
  jobs: ['archmageFP'],
  advancement: 4,
  kind: 'attack',
  element: 'poison',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 100,
  hitsPerCast: 10,
  maxEnemies: 12,
  damage: { base: 125, perLevel: 1 },
  ignoreDef: { base: 40, perLevel: 1 },
  cooldown: 10,
  explosions: { count: 2 },
  finalDmgByExplosions: { 2: 20, 3: 45, 4: 80, 5: 125 },
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 2,
    ignoreDefBonus: { threshold: 40, value: 20 },
    descriptionKey: 'vmatrix.skills.mist_eruption_core.description',
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 780, 8: 720 },
    priority: 80,
    requiresField: 'poison_mist',
    onHitResetCooldown: ['flame_haze'],
    cooldown: {
      priorityRedSec: 2,
      priorityThreshold: 5,
      externalPctUsesBaseAsFlat: true,
    },
  },
}

// ─── Ifrit ──────────────────────────────────────────────────────────────────
export const IFRIT = {
  id: 'ifrit',
  name: 'Ifrit',
  nameKey: 'skills.archmageFP.ifrit.name',
  descriptionKey: 'skills.archmageFP.ifrit.description',
  imageUrl: ICON('Ifrit'),
  color: '#ff7340',
  jobs: ['archmageFP'],
  advancement: 4,
  kind: 'summon',
  element: 'fire',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 120,
  hitsPerCast: 3,
  maxEnemies: 3,
  damage: { base: 150, perLevel: 2 },
  burn: {
    base: 140,
    perLevel: 3,
    durationSec: 2,
    tickIntervalSec: 1,
  },
  // 參考用 — 目前 sim/CP 尚未接入
  passiveMasteryPct: { base: 70, perLevel: 1 },
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  sim: {
    role: 'aura',
    castDelayBySpeed: { 7: 0, 8: 0 },
    aura: {
      intervalSec: 3,
      firstHitWindowSec: [0, 3],
      defaultEnabled: true,
    },
  },
}

// ─── Meteor Shower ──────────────────────────────────────────────────────────
// 遊戲本質:主動攻擊 (12 擊 / CD 45s);本 sim 視為 passive Final Attack 追打。
export const METEOR_SHOWER = {
  id: 'meteor_shower',
  name: 'Meteor Shower',
  nameKey: 'skills.archmageFP.meteor_shower.name',
  descriptionKey: 'skills.archmageFP.meteor_shower.description',
  imageUrl: ICON('Meteor_Shower'),
  color: '#ff784a',
  jobs: ['archmageFP'],
  advancement: 4,
  kind: 'attack',
  element: 'fire',
  baseLevel: 30,
  combatOrdersEligible: true,
  mpCost: 300,
  hitsPerCast: 12,
  maxEnemies: 15,
  damage: { base: 315, perLevel: 3 },
  finalAttack: {
    procRate: { base: 60, perLevel: 2 },
    damage:   { base: 220, perLevel: 4 },
  },
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  sim: {
    role: 'passive', // sim 不排程主動施放,只觸發 Final Attack 追打
  },
}

// ─── 4 轉所有火毒技能 (SIM / passive / battle buff 全合在一個主列表) ───────
// 各系統從這裡 filter 自己要的 entry (s.sim / s.cp?.role / s.vmatrix / s.battle)
export const ARCHMAGE_FP_4TH_SKILLS = [
  // SIM 攻擊技能
  FLAME_SWEEP,
  FLAME_HAZE,
  MIST_ERUPTION,
  IFRIT,
  METEOR_SHOWER,
  // CP passive
  {
    id: 'buff_mastery',
    name: 'Buff Mastery',
    imageUrl: ICON('Buff_Mastery'),
    jobs: ['archmageFP'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 30,
    contribute(ctx) {
      const lv = (this.baseLevel || 30) + (ctx.skillLevelBonus || 0)
      const extra = lv - 30
      return { matk: 30 + extra * 3, buffDuration: 50 + extra * 5 }
    },
    cp: { role: 'passive' },
  },
  // 戰鬥 buff (無 CP 角色,只在 Battle 面板)
  {
    id: 'fervent_drain',
    nameKey: 'battleBuffs.fervent_drain.name',
    descriptionKey: 'battleBuffs.fervent_drain.description',
    imageUrl: ICON('Elemental_Drain'),
    jobs: ['archmageFP'],
    advancement: 4,
    kind: 'passive',
    battle: {
      source: 'passive',
      passiveType: 'dotCount',
      maxStacks: 5,
      perStackFinalDmgPct: 5,
    },
  },
  {
    id: 'infinity',
    nameKey: 'battleBuffs.infinity.name',
    descriptionKey: 'battleBuffs.infinity.description',
    imageUrl: ICON('Infinity'),
    jobs: ['archmageFP'],
    advancement: 4,
    kind: 'buff',
    baseLevel: 30,
    cooldownSec: 180,
    battle: {
      source: 'activeToggle',
      base: {
        durationSec: 40,
        baseFinalDmgPct: 70,
        tickIntervalSec: 5,              // 正常間隔
        tickDelayedIntervalSec: 10,      // 延遲間隔(伺服器延遲觸發)
        tickServerDelayRate: 0.8,        // 延遲率 → 期望 = 0.2×5 + 0.8×10 = 9 秒/tick
        tickIncreasePct: 3,
      },
      perLevelBonus: { durationSec: 1, baseFinalDmgPct: 1 },
      cooldownSec: 180,
      cooldownIgnoresReset: true,
      initialDelayBySpeed: { 7: 500, 8: 450 },
    },
  },
  // Hero's Will — 免狀態 active 技能 (骨架)
  {
    id: 'heros_will',
    name: "Hero's Will",
    nameKey: 'skills.archmageFP.heros_will.name',
    descriptionKey: 'skills.archmageFP.heros_will.description',
    imageUrl: ICON("Hero's_Will"),
    jobs: ['archmageFP'],
    advancement: 4,
    kind: 'active',
  },
]

// ─── 子分類 (全部從主列表 filter derive) ───────────────────────────────────
export const ARCHMAGE_FP_4TH_SIM_SKILLS     = ARCHMAGE_FP_4TH_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_4TH_TOGGLE_SKILLS  = ARCHMAGE_FP_4TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_4TH_BUFFS          = ARCHMAGE_FP_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_4TH_PASSIVE_SKILLS = ARCHMAGE_FP_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_4TH_VMATRIX_SKILLS = ARCHMAGE_FP_4TH_SKILLS.filter((s) => s.vmatrix)

// Battle Buff — 從 skill.battle 子物件 derive;合併技能 meta + battle 參數
export const ARCHMAGE_FP_4TH_BATTLE_BUFFS = ARCHMAGE_FP_4TH_SKILLS
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
