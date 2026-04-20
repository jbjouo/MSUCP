// 火毒 (Archmage FP) 技能資料庫
// 用於戰鬥模擬器。技能 damage/DoT 百分比隨等級線性成長。

const ICON = (name) => `https://media.maplestorywiki.net/yetidb/Skill_${name}.png`

// ─── Flame Sweep ────────────────────────────────────────────────────────────
// 火屬性範圍攻擊。主傷害 + 點燃 DoT。
// Lv30: Damage 220%, Attacks 7, Burn 240%/sec × 5sec
// Lv31: Damage 223%, Burn 244%/sec × 5sec  (每級 +3% / +4%)
// 施放間隔依攻速階級:8 階 = 600ms、7 階 = 660ms (僅保留兩階資料)
export const FLAME_SWEEP = {
  id: 'flame_sweep',
  name: 'Flame Sweep',
  nameKey: 'skills.archmageFP.flame_sweep.name',
  descriptionKey: 'skills.archmageFP.flame_sweep.description',
  imageUrl: ICON('Flame_Sweep'),
  color: '#ffa477',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'attack',
  baseLevel: 30,
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
  castDelayBySpeed: { 7: 660, 8: 600 },
  variance: 0.15,
  // 技能專屬 V 矩陣 (僅作用於此技能,不顯示於角色面板)
  //   maxLevel = 60
  //   每等級 +2% 終傷
  //   Lv40+ 額外無視防禦 +20% (僅此技能)
  vmatrix: {
    maxLevel: 60,
    finalDmgPerLevel: 2,
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
}

// ─── Flame Haze ────────────────────────────────────────────────────────────
// 火屬性單體高連擊 + DoT,附帶形成 Poison Mist (MIST) 雲霧(目前 sim 不模擬 mist)
// Lv30: Damage 202%, Attacks 15, Burn 200%/sec × 10sec, CD 10s
// Lv31: Damage 205%, Burn 203%/sec × 10sec  (每級 +3% / +3%)
// Lv1:  Damage 115%, Burn 113%/sec × 10sec
export const FLAME_HAZE = {
  id: 'flame_haze',
  name: 'Flame Haze',
  nameKey: 'skills.archmageFP.flame_haze.name',
  descriptionKey: 'skills.archmageFP.flame_haze.description',
  imageUrl: ICON('Flame_Haze'),
  color: '#ff8a3d',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'attack',
  baseLevel: 30,
  mpCost: 70,
  hitsPerCast: 15,
  maxEnemies: 1, // 單體
  damage: { base: 202, perLevel: 3 },
  burn: {
    base: 200,
    perLevel: 3,
    durationSec: 10,
    tickIntervalSec: 1,
  },
  castDelayBySpeed: { 7: 960, 8: 900 },
  variance: 0.15,
  cooldown: 10,
  // 開場優先序 (高優先 → 先排程)
  priority: 100,
  // 命中時衍生其他技能 (如 Poison Mist) — 於同一 tCast 一併 emitCast
  onHitSpawn: ['poison_mist'],
  // 技能專屬 V 矩陣 — 每等 +2% 終傷,Lv40+ 額外 +20% 無視防禦 (獨立一排,不與 Hyper 無視相加)
  vmatrix: {
    maxLevel: 60,
    finalDmgPerLevel: 2,
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
}

// ─── Mist Eruption ─────────────────────────────────────────────────────────
// 毒屬 AoE 範爆 — 引爆目標周圍的 Poison Mist / DoT,爆炸數越多傷害越高。
// Lv30: Damage 125%, Attacks 10, 無視防禦 +40%, CD 10s
//        爆炸 2 → +20% FD、3 → +45% FD、4 → +80% FD、5 → +125% FD
//        命中 ≥ 5 爆炸 → 自身 CD -2s (step 1 優先減免)
//        命中時 → 重置 Flame Haze 的 CD
// Lv31: Damage 126%,無視 +41% (每級 +1%)
// Lv1:  Damage 96%, 無視 +11%
export const MIST_ERUPTION = {
  id: 'mist_eruption',
  name: 'Mist Eruption',
  nameKey: 'skills.archmageFP.mist_eruption.name',
  descriptionKey: 'skills.archmageFP.mist_eruption.description',
  imageUrl: ICON('Mist_Eruption'),
  color: '#b983ff',
  jobs: ['archmageFP'],
  element: 'poison',
  type: 'attack',
  baseLevel: 30,
  mpCost: 100,
  // 每次「爆炸」的擊數 (Number of Attacks);實際每施放總擊數 = hitsPerCast × 爆炸數
  hitsPerCast: 10,
  maxEnemies: 12,
  damage: { base: 125, perLevel: 1 },
  // 技能自帶無視防禦(Lv30 +40%,每級 +1%)
  ignoreDef: { base: 40, perLevel: 1 },
  castDelayBySpeed: { 7: 780, 8: 720 },
  variance: 0.15,
  cooldown: 10,
  // 固定每次施放爆炸 count 次,總擊數 = hitsPerCast × count
  //   DoT 層數只影響終傷查表(finalDmgByExplosions)與 CD 優先減免,與擊數無關
  explosions: { count: 2 },
  // 命中 ≥ threshold 個 DoT (爆炸數) 時觸發 -redSec (Step 1,早於百分比減免)
  cooldownPriorityRedSec: 2,
  cooldownPriorityThreshold: 5,
  // Mercedes 等外部 % 以 baseCd 為基準(與原 Mist Eruption 特例一致)
  cooldownExternalPctUsesBaseAsFlat: true,
  // 命中時立即重置這些技能的 CD (nextCastAt 被設為 tCast + 此技動畫)
  onHitResetCooldown: ['flame_haze'],
  // 爆炸數 → 終傷 % 表
  finalDmgByExplosions: { 2: 20, 3: 45, 4: 80, 5: 125 },
  // 開場優先序:在 Flame Haze 之後
  priority: 80,
  // 需要場上存在指定技能的「場地」才能施放(sim 每次試施放時檢查 fieldState)
  requiresField: 'poison_mist',
  // 技能專屬 V 矩陣 — 每等 +2% 終傷,Lv40+ 額外 +20% 無視防禦 (獨立一排,不與 Hyper 無視相加)
  vmatrix: {
    maxLevel: 60,
    finalDmgPerLevel: 2,
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
}

// ─── Poison Mist ───────────────────────────────────────────────────────────
// 毒屬場地技能 — 原本為玩家主動施放,但在本 sim 我們把它設為「由 Flame Haze 命中時衍生」
// (type: 'derived' 跳過主 cast loop,透過 onHitSpawn 觸發)
// 場上持續時間 (fieldDurationSec) 控制 Mist Eruption 能否使用
// Lv20: 直接 270% × 1,DoT 240%/sec × 6sec,場上持續 15s
// Lv1:  直接 194%, DoT 126%/sec × 4sec,場上持續 5s
export const POISON_MIST = {
  id: 'poison_mist',
  name: 'Poison Mist',
  nameKey: 'skills.archmageFP.poison_mist.name',
  descriptionKey: 'skills.archmageFP.poison_mist.description',
  imageUrl: ICON('Poison_Mist'),
  color: '#7de070',
  jobs: ['archmageFP'],
  element: 'poison',
  type: 'derived', // 不進主 cast loop,由 Flame Haze 衍生
  baseLevel: 20,
  mpCost: 55,
  hitsPerCast: 1,
  maxEnemies: 6,
  damage: { base: 270, perLevel: 4 },   // Lv20 270,每級 +4
  burn: {
    base: 240,
    perLevel: 6,                        // Lv20 240,每級 +6
    durationSec: 6,                     // Lv20 固定 6s(非線性變化,簡化)
    tickIntervalSec: 1,
  },
  castDelayBySpeed: { 7: 0, 8: 0 },
  variance: 0.15,
  // 場上霧氣存在時長(控制 Mist Eruption 可用性)
  fieldDurationSec: 15,
}

// ─── Inferno Aura ──────────────────────────────────────────────────────────
// 火屬開關型持續技能(預設開啟)— 每 3 秒觸發一次:2 擊主傷 + 30 秒 DoT
// Lv1 (master):主 400% × 2、DoT 500%/sec × 30sec、MP/sec 100
// 第一次觸發時間在戰鬥開始 0-3 秒間隨機
export const INFERNO_AURA = {
  id: 'inferno_aura',
  name: 'Inferno Aura',
  nameKey: 'skills.archmageFP.inferno_aura.name',
  descriptionKey: 'skills.archmageFP.inferno_aura.description',
  imageUrl: ICON('Inferno_Aura'),
  color: '#ff5a2e',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'aura',
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
  // 開關型:非一般施放,不占動畫時間;cast 延遲空 0 配合 aura 間隔排程
  castDelayBySpeed: { 7: 0, 8: 0 },
  variance: 0.15,
  // 開關型持續技能 — 固定間隔觸發,忽略 cooldown 與 priority cascade
  aura: {
    intervalSec: 3,
    firstHitWindowSec: [0, 3], // 首次觸發時間戰鬥開始 0-3s 內隨機
    defaultEnabled: true,
  },
}

// ─── Ifrit ─────────────────────────────────────────────────────────────────
// 火屬召喚獸(sim 視為 aura 型常駐)— 每 3 秒攻擊一次:3 擊主傷 + 2 秒 DoT
// Lv30: 主 150%、3 擊、DoT 140%/sec × 2sec;被動:熟練度 +70% (尚未接入 CP)
// Lv31: 主 152%、DoT 143% (每級 +2% / +3%)
// 首次觸發在戰鬥開始 0-3s 內隨機(與 Inferno Aura 相同)
// 召喚持續時間 (260s) 在 sim 視為常駐,不追蹤
export const IFRIT = {
  id: 'ifrit',
  name: 'Ifrit',
  nameKey: 'skills.archmageFP.ifrit.name',
  descriptionKey: 'skills.archmageFP.ifrit.description',
  imageUrl: ICON('Ifrit'),
  color: '#ff7340',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'aura',
  baseLevel: 30,
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
  castDelayBySpeed: { 7: 0, 8: 0 },
  variance: 0.15,
  aura: {
    intervalSec: 3,
    firstHitWindowSec: [0, 3],
    defaultEnabled: true,
  },
  // 參考用(Lv30 被動 +70% Mastery) — 目前 sim/CP 尚未接入,未來可透過 SKILLS 的被動項目注入
  passiveMasteryPct: { base: 70, perLevel: 1 },
}

// ─── Teleport Mastery ──────────────────────────────────────────────────────
// 開關技能(sim 預設開啟)— 戰鬥開始後第一次排程使用,之後每 15s 重施一次刷新 DoT
// Lv10 (master):單擊 272% + DoT 98%/2sec × 20sec(10 ticks);CD 15s
// Lv1: 200% / 71% (每級 +8% 主 / +3% DoT)
// 對應 priority 60 → 開場在 Flame Haze(100) / Mist Eruption(80) 之後排程
export const TELEPORT_MASTERY = {
  id: 'teleport_mastery',
  name: 'Teleport Mastery',
  nameKey: 'skills.archmageFP.teleport_mastery.name',
  descriptionKey: 'skills.archmageFP.teleport_mastery.description',
  imageUrl: ICON('Teleport_Mastery'),
  color: '#9ad4ff',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'attack',
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
  // 瞬移無施放延遲;fire 時不鎖其他主動技能 (animDelay=0 → lockUntil = tCast,等於沒鎖)
  castDelayBySpeed: { 7: 0, 8: 0 },
  variance: 0.15,
  cooldown: 15,
  priority: 60,
}

export const ARCHMAGE_FP_SKILLS = [
  FLAME_SWEEP, FLAME_HAZE, MIST_ERUPTION, INFERNO_AURA, POISON_MIST, IFRIT, TELEPORT_MASTERY,
]

// 依等級計算實際傷害 / DoT 百分比
export function skillDamagePct(skill, level) {
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = lv - skill.baseLevel
  return {
    hit: skill.damage.base + delta * skill.damage.perLevel,
    burn: skill.burn ? skill.burn.base + delta * skill.burn.perLevel : 0,
  }
}

// 技能自帶的無視防禦 (例:Mist Eruption Lv30 +40%) — 僅主擊,DoT 本來無視防禦
export function skillIgnoreDefPct(skill, level) {
  const ig = skill?.ignoreDef
  if (!ig) return 0
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = Math.max(0, lv - skill.baseLevel)
  return (ig.base || 0) + delta * (ig.perLevel || 0)
}

// 技能一次施放的固定爆炸次數(hits multiplier)— 與 DoT 數無關
//   技能沒有 explosions 設定 → 回傳 1
export function skillExplosionCount(skill) {
  const ex = skill?.explosions
  if (!ex) return 1
  return Math.max(1, Math.floor(Number(ex.count) || 1))
}

// 依目標身上 DoT 層數查終傷 %(Mist Eruption 用);< 2 → 0%
//   表格 key 為 DoT 層數;超過最大 key 一律取最大值(例 5)
export function skillExplosionFinalDmgPct(skill, dotCount) {
  const table = skill?.finalDmgByExplosions
  if (!table) return 0
  const c = Math.max(0, Math.floor(Number(dotCount) || 0))
  if (c < 2) return 0
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b)
  let hit = 0
  for (const k of keys) {
    if (k <= c) hit = table[k]
    else break
  }
  return hit
}

// 依 V 矩陣等級計算「僅作用於此技能」的加成
//   finalDmgPct — 額外終傷 % (主擊與 DoT 皆吃)
//   ignoreDefPct — 額外無視防禦 % (只對主擊有意義,DoT 本來就無視防禦)
export function skillVmatrixBonus(skill, level) {
  const vm = skill?.vmatrix
  if (!vm) return { level: 0, maxLevel: 0, finalDmgPct: 0, ignoreDefPct: 0 }
  const lv = Math.max(0, Math.min(vm.maxLevel, Math.floor(Number(level) || 0)))
  const bonus = vm.ignoreDefBonus
  return {
    level: lv,
    maxLevel: vm.maxLevel,
    finalDmgPct: lv * (vm.finalDmgPerLevel || 0),
    ignoreDefPct: bonus && lv >= bonus.threshold ? bonus.value : 0,
  }
}
