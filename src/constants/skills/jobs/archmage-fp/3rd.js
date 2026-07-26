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
//   - Creeping Toxin — Lv14 master 完整數值;戰鬥模擬僅框架 (機制待補)
//   - 新增 explosion / elemental_adaptation / teleport_boost 骨架

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

// ─── Creeping Toxin (Lv14 master 面板數值) ─────────────────────────────────
// 召喚毒霧圖騰,毒池沿平台水平蔓延;火系魔法可在毒池生成後短時間內引爆,
// 爆炸並可連鎖引爆鄰近毒池。
//
// 戰鬥模擬 — 機制走 mechanics.poisonRegion 管線 (量化模型見根目錄 POISON_REGION_SPEC.md):
//   - 施放建立毒池區域 (L1/R1),引爆 / 補毒 / 連鎖衰減由引擎管線處理
//   - 毒池持續傷害以 burn 表達 (204%/1s,時長=圖騰 60s,fixedDuration 不吃時長加成)
//     → 計入場上 DoT 數 (影響 Mist Eruption 終傷 / Fervent Drain / Burning Magic / DoT Punisher)
//   - recastIntervalSec: 60 — 圖騰到期即重置區域 (遊戲 CD 10s,輪替上以圖騰時長為週期)
export const CREEPING_TOXIN = {
  id: 'creeping_toxin',
  name: 'Creeping Toxin',
  nameKey: 'skills.archmageFP.creeping_toxin.name',
  descriptionKey: 'skills.archmageFP.creeping_toxin.description',
  imageUrl: ICON('Creeping_Toxin'),
  color: '#8fe0a0',
  jobs: ['archmageFP'],
  advancement: 3,
  kind: 'summon',
  element: 'poison',
  baseLevel: 14,             // Master Level 14 — 數值以 Lv14 面板為準
  mpCost: 54,
  cooldown: 10,
  hitsPerCast: 0,            // 施放本身無直擊 — 傷害全由毒池 DoT + 引爆管線產生
  // 圖騰本體
  totem: { durationSec: 60 },
  // 毒池:池內敵人每 1 秒受 204% 傷害,持續 10 秒
  pool: {
    damage: { base: 204, perLevel: 0 },  // perLevel 待查(僅有 master 面板數值)
    tickIntervalSec: 1,
    durationSec: 10,
  },
  // 毒池 DoT 的 sim 表達:Boss 站樁常駐於池 → 以圖騰時長連續 tick 近似
  //   fixedDuration:池時長是場地屬性,不吃 Burning Magic ×2 / hyper DoT 時長加成
  //   durationFromTotem:實際時長 = 圖騰有效時長 (含聯盟槍神 summonDuration% 加成)
  burn: {
    base: 204,
    perLevel: 0,
    durationSec: 60,        // 名目值;實際時長由 durationFromTotem 決定
    tickIntervalSec: 1,
    fixedDuration: true,
    durationFromTotem: true,
  },
  // 引爆 (Creeping Toxin Explosion):毒池生成後 1.5 秒內可被火系魔法引爆
  //   200% × 4 擊,最多 10 目標;由連鎖爆炸引發的引爆不耗 MP
  //   連鎖:與前一次爆炸間隔 < 0.4 秒的後續爆炸,首爆之後終傷 −60%
  detonation: {
    mpCost: 60,
    damage: { base: 200, perLevel: 0 },  // perLevel 待查
    hitsPerCast: 4,
    maxEnemies: 10,
    detonateWindowSec: 1.5,
    chain: { windowSec: 0.4, finalDmgReductionPct: 60 },
  },
  // 對一般怪物傷害 +50%(Boss 不吃)
  normalEnemyDmgPct: 50,
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 3, ignoreDefBonus: { threshold: 40, value: 20 }, coreGroupId: CORE_GROUP_TELEPORT_CREEPING },
  // buff 欄位顯示鏡像 — 由戰鬥模擬的施放事件驅動 (60s 倒數,無數值效果、無 CD 顯示)
  battle: {
    source: 'skillCast',
    durationSec: 60,
    hideCooldown: true,
  },
  sim: {
    role: 'attack',
    // 開場先立圖騰:毒池 DoT 提早計入場上 DoT 數,利於 Mist Eruption 等後續爆發
    priority: 120,
    // 攻速 8 階實測 750ms;7 階依既有慣例 +60ms 推估 (待實測修正)
    castDelayBySpeed: { 7: 810, 8: 750 },
    // 圖騰時長 60s — 排程以此為再施放週期 (遊戲 CD 10s 僅作 UI CD 顯示)
    recastIntervalSec: 60,
    // 補圖騰不打斷連技:首次開場即施放;之後到期只在「本槽原本要放 Flame Sweep」時頂替該槽
    recastReplaces: 'flame_sweep',
  },
}

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
  CREEPING_TOXIN,
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
