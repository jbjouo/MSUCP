// 火毒 — 超技能 (Hyper Skills)
//
// Hyper 分兩種,同一個主列表:
//   hyperKind: 'enhancement' — 5 點配點的 passive 強化(9 項;依 group 分組,同 group 只能點 1)
//   hyperKind: 'active'      — Lv 140+ 自動解鎖的主動技能(3 項:Inferno Aura / Megiddo Flame / Epic Adventure)
//
// 對外 export:
//   ARCHMAGE_FP_HYPER_SKILLS         — enhancement 子集 (9);useHyperSkills / HyperSkillPanel 消費
//   ARCHMAGE_FP_HYPER_ACTIVE_SKILLS  — active 子集 (3);主 skill 列表會包含這些 entry
//   INFERNO_AURA / MEGIDDO_FLAME / EPIC_ADVENTURE — 單支 const(相容既有 import)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

// ─── Hyper Active 單支 const(供外部需要時直接引用) ────────────────────────
export const INFERNO_AURA = {
  id: 'inferno_aura',
  name: 'Inferno Aura',
  nameKey: 'skills.archmageFP.inferno_aura.name',
  descriptionKey: 'skills.archmageFP.inferno_aura.description',
  imageUrl: ICON('Inferno_Aura'),
  color: '#ff5a2e',
  jobs: ['archmageFP'],
  advancement: 'hyper',
  hyperKind: 'active',
  kind: 'toggle',
  element: 'fire',
  baseLevel: 1,
  mpCost: 100,
  hitsPerCast: 2,
  maxEnemies: 10,
  damage: { base: 400, perLevel: 0 },
  burn: {
    base: 500,
    perLevel: 0,
    durationSec: 30,
    tickIntervalSec: 1,
  },
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

// Megiddo Flame — Hyper Active(Lv 160)
// 官方描述:
//   MP 500 / CD 50s,Blue Flames 初始 3 顆;每顆 380% × 4 擊。
//   命中後分裂 1 顆新火球(0.2s 後命中);總共最多 11 顆(含原始)。
//   同敵人被多顆擊中時,後續火球 FD -55%(僅 45%)。
//   DoT:700%/秒 × 30 秒。
//
// sim 分波命中(與 DoT Punisher 類似,所有 orb 都走 pendingOrbHits):
//   施放 → 500ms 首波 3 顆命中;每顆命中後分裂 1 顆,於 300ms 後命中;
//   若尚未到 maxTotal=11,上一代 命中後再分裂,直到累計 11 顆為止。
//   生代序列(3 → 3 → 3 → 2):
//     t+500ms  orb 0..2   (首顆 FD 100%,同波其餘 FD 45%)
//     t+800ms  orb 3..5
//     t+1100ms orb 6..8
//     t+1400ms orb 9..10  (達到 11 上限)
//   每顆 orb 獨立:4 擊 × mainHitDmg × FD / useCount +1 / Meteor Shower 1 roll / Ignite 1 roll
// DoT 自動由 burn 機制處理(同 id 再施加 → refresh expireAt)。
export const MEGIDDO_FLAME = {
  id: 'megiddo_flame',
  name: 'Megiddo Flame',
  nameKey: 'skills.archmageFP.megiddo_flame.name',
  descriptionKey: 'skills.archmageFP.megiddo_flame.description',
  imageUrl: ICON('Megiddo_Flame'),
  color: '#5aa9ff',
  jobs: ['archmageFP'],
  advancement: 'hyper',
  hyperKind: 'active',
  kind: 'attack',
  element: 'fire',
  baseLevel: 1,
  mpCost: 500,
  hitsPerCast: 44,         // 11 顆 × 4 擊;sim 依 orbs 分組套 FD 遞減(見下方)
  maxEnemies: 6,
  damage: { base: 380, perLevel: 0 },
  burn: {
    base: 700,
    perLevel: 0,
    durationSec: 30,
    tickIntervalSec: 1,
  },
  cooldown: 50,            // 可吃 CD 減免
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 750, 8: 690 },
    priority: 90,          // 僅次於 Flame Haze (100),優先於 Mist Eruption (80)
    // 分波火球機制(與 DoT Punisher 類似,走 pendingOrbHits 獨立命中)
    orbs: {
      initialCount: 3,         // 首波 3 顆
      splitPerOrb: 1,          // 每顆命中分裂 1 顆
      maxTotal: 11,            // 總上限(含首波)
      attacksPerOrb: 4,        // 每顆 4 擊
      subsequentFdMult: 0.45,  // 首顆 FD 100%,其餘 45%
      initialDelayMs: 500,     // 施放 → 首波命中
      splitDelayMs: 300,       // 世代間延遲(命中 → 下一代命中)
    },
  },
}

// Epic Adventure — Hyper Active(Lv 190)
// MP 100 / Duration 60s / CD 120s / +10% Damage(隊伍冒險家可共享)
// sim 特性:不吃 Buff Duration%(加持),吃 CD 減免
// Damage 以 + 併入主擊 Damage% 桶(與 CP Damage / Buff Damage 相加後進 basic/boss 公式)
export const EPIC_ADVENTURE = {
  id: 'epic_adventure',
  name: 'Epic Adventure',
  nameKey: 'skills.archmageFP.epic_adventure.name',
  descriptionKey: 'skills.archmageFP.epic_adventure.description',
  imageUrl: ICON('Epic_Adventure_(Magician)'),
  jobs: ['archmageFP'],
  advancement: 'hyper',
  hyperKind: 'active',
  kind: 'buff',
  baseLevel: 1,
  mpCost: 100,
  cooldownSec: 120,
  battle: {
    source: 'activeToggle',
    base: {
      durationSec: 60,
      baseDamagePct: 10,       // 啟動中 Damage +10%(與 CP Damage% 相加)
      baseFinalDmgPct: 0,
      tickIntervalSec: 0,
      tickIncreasePct: 0,
    },
    perLevelBonus: {},
    cooldownSec: 120,
    ignoresBuffDuration: true, // 不吃 Buff Duration% 加持
    initialDelayBySpeed: { 7: 0, 8: 0 }, // 施放 0 延遲,不鎖其他技能的 cast lock
  },
}

// ─── 所有 Hyper 技能(enhancement + active) 單一主列表 ─────────────────────
const ARCHMAGE_FP_ALL_HYPER = [
  // ── Poison Mist 強化(5 點配點) ───────────────────────────────────────
  {
    id: 'poison_mist_reinforce',
    nameKey: 'hyperSkill.skills.poison_mist_reinforce.name',
    descKey: 'hyperSkill.skills.poison_mist_reinforce.desc',
    group: 'poison_mist',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 140,
    imageUrl: ICON('Poison_Mist_-_Reinforce'),
    effect: { targetSkill: 'poison_mist', damagePct: 20 },
  },
  {
    id: 'poison_mist_aftermath',
    nameKey: 'hyperSkill.skills.poison_mist_aftermath.name',
    descKey: 'hyperSkill.skills.poison_mist_aftermath.desc',
    group: 'poison_mist',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 150,
    imageUrl: ICON('Poison_Mist_-_Aftermath'),
    effect: { targetSkill: 'poison_mist', burnDurationBonusSec: 6 },
  },
  {
    id: 'poison_mist_cripple',
    nameKey: 'hyperSkill.skills.poison_mist_cripple.name',
    descKey: 'hyperSkill.skills.poison_mist_cripple.desc',
    group: 'poison_mist',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 180,
    imageUrl: ICON('Poison_Mist_-_Cripple'),
    effect: { targetSkill: 'poison_mist', burnDamagePct: 20 },
  },
  // ── Flame Sweep 強化 ──────────────────────────────────────────────────
  {
    id: 'flame_sweep_reinforce',
    nameKey: 'hyperSkill.skills.flame_sweep_reinforce.name',
    descKey: 'hyperSkill.skills.flame_sweep_reinforce.desc',
    group: 'flame_sweep',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 140,
    imageUrl: ICON('Flame_Sweep_-_Reinforce'),
    effect: { targetSkill: 'flame_sweep', damagePct: 10 },
  },
  {
    id: 'flame_sweep_cripple',
    nameKey: 'hyperSkill.skills.flame_sweep_cripple.name',
    descKey: 'hyperSkill.skills.flame_sweep_cripple.desc',
    group: 'flame_sweep',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 165,
    imageUrl: ICON('Flame_Sweep_-_Cripple'),
    effect: { targetSkill: 'flame_sweep', burnDamagePct: 20 },
  },
  {
    id: 'flame_sweep_extra_strike',
    nameKey: 'hyperSkill.skills.flame_sweep_extra_strike.name',
    descKey: 'hyperSkill.skills.flame_sweep_extra_strike.desc',
    group: 'flame_sweep',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 180,
    imageUrl: ICON('Flame_Sweep_-_Extra_Strike'),
    effect: { targetSkill: 'flame_sweep', hitsPerCastBonus: 1 },
  },
  // ── Mist Eruption 強化 ────────────────────────────────────────────────
  {
    id: 'mist_eruption_reinforce',
    nameKey: 'hyperSkill.skills.mist_eruption_reinforce.name',
    descKey: 'hyperSkill.skills.mist_eruption_reinforce.desc',
    group: 'mist_eruption',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 150,
    imageUrl: ICON('Mist_Eruption_-_Reinforce'),
    effect: { targetSkill: 'mist_eruption', damagePct: 10 },
  },
  {
    id: 'mist_eruption_guardbreaker',
    nameKey: 'hyperSkill.skills.mist_eruption_guardbreaker.name',
    descKey: 'hyperSkill.skills.mist_eruption_guardbreaker.desc',
    group: 'mist_eruption',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 165,
    imageUrl: ICON('Mist_Eruption_-_Guardbreaker'),
    effect: { targetSkill: 'mist_eruption', ignoreDefPct: 20 },
  },
  {
    id: 'mist_eruption_cooldown_cutter',
    nameKey: 'hyperSkill.skills.mist_eruption_cooldown_cutter.name',
    descKey: 'hyperSkill.skills.mist_eruption_cooldown_cutter.desc',
    group: 'mist_eruption',
    jobs: ['archmageFP'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 190,
    imageUrl: ICON('Mist_Eruption_-_Cooldown_Cutter'),
    effect: { targetSkill: 'mist_eruption', cooldownOwnPctRed: 50 },
  },

  // ── Hyper Active(Lv 140+ 自動解鎖,不佔 5 點)────────────────────────
  INFERNO_AURA,
  MEGIDDO_FLAME,
  EPIC_ADVENTURE,
]

// 子分類 — filter derive
export const ARCHMAGE_FP_HYPER_SKILLS        = ARCHMAGE_FP_ALL_HYPER.filter((s) => s.hyperKind === 'enhancement')
export const ARCHMAGE_FP_HYPER_ACTIVE_SKILLS = ARCHMAGE_FP_ALL_HYPER.filter((s) => s.hyperKind === 'active')
