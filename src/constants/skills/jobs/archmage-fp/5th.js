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
// Wiki: 依敵人身上 DoT 層數召喚火焰球,主擊 850%×5 擊 / 顆 (Lv30);master 25 → max 30 via V
// 火球數 = min(maxTotal, baseCount + perDotStack × 敵方 DoT 層數)
// 施放 → 0.5~1.5s 之間火球分別命中;第 2 顆起 FD ×0.55 (−45%)
// 每顆火球 = 1 useCount;每顆獨立 roll Meteor Shower + Ignite
// DoT: 290% / 1s × 8s (Lv30)
export const DOT_PUNISHER = {
  id: 'dot_punisher',
  name: 'DoT Punisher',
  nameKey: 'skills.archmageFP.dot_punisher.name',
  descriptionKey: 'skills.archmageFP.dot_punisher.description',
  imageUrl: ICON('DoT_Punisher'),
  color: '#ff8a3d',
  jobs: ['archmageFP'],
  advancement: 5,
  kind: 'attack',
  element: 'fire',
  baseLevel: 30,
  hitsPerCast: 5,                       // 每顆火球的擊數;orbs 分波後以 attacksPerOrb 使用
  maxEnemies: 1,
  damage: { base: 850, perLevel: 15 },  // Lv30 = 850%;+15%/Lv (Lv1=415 / Lv25=775)
  burn: { base: 290, perLevel: 3, durationSec: 8, tickIntervalSec: 1 },
  cooldown: 25,
  // Combat Orders 只作用於特定 4 轉技能,DoT Punisher 不在其中 → 不加 combatOrdersEligible
  vmatrix: { kind: 'skill', maxLevel: 30 },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 750, 8: 690 },
    priority: 85,                       // 介於 Megiddo Flame (90) 與 Mist Eruption (80) 之間
    orbs: {
      baseCount: 15,                    // 起始火球數
      perDotStack: 1,                   // 每 DoT 層 +1 顆
      maxTotal: 25,                     // 封頂
      attacksPerOrb: 5,                 // 每顆 5 擊
      subsequentFdMult: 0.55,           // 第 2+ 顆 FD ×0.55 (-45%)
      hitDelayRange: [500, 1500],       // 火球命中時間(相對 tCast,ms 均勻分佈)
    },
  },
}

// ─── Poison Nova (class-specific V) ─────────────────────────────────────────
// Wiki: 12 hits × 500% (Lv25) / 550% (Lv30);DoT 600%/1s × 10s → 660%/1s
// 施放時產生 11 個毒雲(不進入 fieldState;由 sim 以 lastCastAt 推算);
//   t<2s:無法引爆 / t≥2s:雲數 = max(0, 11 − floor((t−2s)/0.3s))
// 引爆由 Mist Eruption 執行:爆炸次數 = 當下雲數 N;前 3 發 FD 100% / 第 4+ 發 FD 50%
// 主擊每次施放 → Meteor Shower 1 次 roll(role:'attack' 既有規則)
export const POISON_NOVA = {
  id: 'poison_nova',
  name: 'Poison Nova',
  nameKey: 'skills.archmageFP.poison_nova.name',
  descriptionKey: 'skills.archmageFP.poison_nova.description',
  imageUrl: ICON('Poison_Nova'),
  color: '#8ff05a',
  jobs: ['archmageFP'],
  advancement: 5,
  kind: 'attack',
  element: 'poison',
  baseLevel: 30,
  hitsPerCast: 12,
  maxEnemies: 1,
  mpCost: 500,
  damage: { base: 550, perLevel: 10 },   // Lv25=500 · Lv30=550
  burn: { base: 660, perLevel: 12, durationSec: 10, tickIntervalSec: 1 },
  cooldown: 25,
  // Combat Orders 只作用於特定 4 轉技能,Poison Nova 不在其中 → 不加 combatOrdersEligible
  vmatrix: { kind: 'skill', maxLevel: 30 },
  // 引爆傷害參數(Mist Eruption 觸發時使用 Poison Nova 本體的所有屬性)
  //   damage% 依 Poison Nova 自身等級計算(Lv25 450% / Lv30 495%,+9/lv)
  //   所有乘區(VM / ignoreDef / element / mastery / CO 等級加成)一律走 Poison Nova
  detonation: {
    damage: { base: 495, perLevel: 9 },   // Lv25=450 · Lv30=495
    hitsPerCast: 12,                       // 每發爆炸 12 擊
    fdThresholdCount: 3,                   // 前 3 發 FD 1.0
    fdAfterThreshold: 0.5,                 // 第 4+ 發 FD 0.5
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 620, 8: 570 },
    priority: 88,                          // Flame Haze 100 > Megiddo 90 > Poison Nova 88 > DoT Punisher 85 > Mist Eruption 80
    clouds: {
      initialCount: 11,
      detonateGraceMs: 2000,               // 施放後 2s 才可引爆
      decayIntervalMs: 300,                // grace 之後每 0.3s -1 顆
    },
  },
}

// ─── 5 轉所有火毒技能 ───────────────────────────────────────────────────────
export const ARCHMAGE_FP_5TH_SKILLS = [
  DOT_PUNISHER,
  POISON_NOVA,
]

// 子分類 — 全部從主列表 filter derive
export const ARCHMAGE_FP_5TH_SIM_SKILLS     = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_5TH_TOGGLE_SKILLS  = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_5TH_BUFFS          = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_5TH_PASSIVE_SKILLS = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_5TH_VMATRIX_SKILLS = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.vmatrix)
export const ARCHMAGE_FP_5TH_BATTLE_BUFFS   = ARCHMAGE_FP_5TH_SKILLS.filter((s) => s.battle)
