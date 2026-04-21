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
  castDelayBySpeed: { 7: 660, 8: 600 },
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
  combatOrdersEligible: true,
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
  combatOrdersEligible: true,
  mpCost: 100,
  // 每次「爆炸」的擊數 (Number of Attacks);實際每施放總擊數 = hitsPerCast × 爆炸數
  hitsPerCast: 10,
  maxEnemies: 12,
  damage: { base: 125, perLevel: 1 },
  // 技能自帶無視防禦(Lv30 +40%,每級 +1%)
  ignoreDef: { base: 40, perLevel: 1 },
  castDelayBySpeed: { 7: 780, 8: 720 },
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
  castDelayBySpeed: { 7: 0, 8: 0 },
  aura: {
    intervalSec: 3,
    firstHitWindowSec: [0, 3],
    defaultEnabled: true,
  },
  // 參考用(Lv30 被動 +70% Mastery) — 目前 sim/CP 尚未接入,未來可透過 SKILLS 的被動項目注入
  passiveMasteryPct: { base: 70, perLevel: 1 },
}

// ─── Teleport Mastery ──────────────────────────────────────────────────────
// 遊戲中 CD = 0,sim 用 aura 型作週期性排程以延續 DoT。
//   開場 t=0 立即使用一次,之後每 30 秒重施 (DoT 40s ≥ 30s + 安全緩衝)。
//   aura 型不受其他技能的 cast lock 影響、也不會鎖住其他技能;不會出現在 CD 面板。
// Lv10 (master):單擊 272% + DoT 98%/2sec × 20sec(Lv30 + Burning Magic ×2 → 40sec)
// Lv1: 200% / 71% (每級 +8% 主 / +3% DoT)
export const TELEPORT_MASTERY = {
  id: 'teleport_mastery',
  name: 'Teleport Mastery',
  nameKey: 'skills.archmageFP.teleport_mastery.name',
  descriptionKey: 'skills.archmageFP.teleport_mastery.description',
  imageUrl: 'https://media.maplestorywiki.net/yetidb/Skill_Teleport_Mastery_%28Fire%2C_Poison%29.png',
  color: '#9ad4ff',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'aura',
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
  castDelayBySpeed: { 7: 0, 8: 0 },
  // 開場 t=0 立即施放,之後每 30s 一次 (延續 DoT)
  aura: {
    intervalSec: 30,
    firstHitWindowSec: [0, 0],
    defaultEnabled: true,
  },
}

// ─── Meteor Shower ─────────────────────────────────────────────────────────
// 本 sim 僅視為「被動 Final Attack」— 永遠不主動施放(type: 'passive' 不進排程)。
// 角色主動技能的每次「使用」有機率追加 1 顆隕石。
// Lv30: 60% 機率 / 220% × 1 擊
// Lv31: 62% / 224%               (每級 +2% / +4%)
// Lv1:   2% / 104%
// 觸發來源:任何有主擊的技能,除 Meteor Shower 自身
//   → 含 type='attack' (主動) / 'aura' (Inferno Aura / Ifrit) / 'derived' (Poison Mist) 之主擊
//   爆炸型技能(Mist Eruption 2 次)每次施放 roll explosions.count 次(= useCount)
//
// 參考:完整主動版本 Lv30 = 315% × 12 擊、CD 45s、MP 300;在本 sim 不使用。
export const METEOR_SHOWER = {
  id: 'meteor_shower',
  name: 'Meteor Shower',
  nameKey: 'skills.archmageFP.meteor_shower.name',
  descriptionKey: 'skills.archmageFP.meteor_shower.description',
  imageUrl: ICON('Meteor_Shower'),
  color: '#ff784a',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'passive',
  baseLevel: 30,
  combatOrdersEligible: true,
  // 參考用(主動版本);sim 不排程,只用於 simulateSingleCast 顯示
  mpCost: 300,
  hitsPerCast: 12,
  maxEnemies: 15,
  damage: { base: 315, perLevel: 3 },
  finalAttack: {
    procRate: { base: 60, perLevel: 2 }, // %
    damage:   { base: 220, perLevel: 4 }, // %
  },
}

// ─── Burning Magic ─────────────────────────────────────────────────────────
// 火毒 passive (Master Lv10) — 不進 SIM_SKILLS (不產生傷害,純 passive 加成,避免
// 在技能詳情表出現全 0 的 row)。useBattleSim 直接 import 本常數取值。
//
// Lv10:
//   - 場上有任何 DoT 生效 → 主擊終傷 +20% (與其他終傷來源相乘)
//   - DoT 持續時間 +100%  (目前 sim 尚未套用)
// 觸發條件:currentJobKey ∈ jobs。main hit 才吃,DoT tick 不吃 (依既有「DoT 不吃通用終傷」規則)。
export const BURNING_MAGIC = {
  id: 'burning_magic',
  name: 'Burning Magic',
  nameKey: 'skills.archmageFP.burning_magic.name',
  descriptionKey: 'skills.archmageFP.burning_magic.description',
  imageUrl: ICON('Burning_Magic'),
  jobs: ['archmageFP'],
  baseLevel: 10,
  finalDmgPctWhenDotActive: 20,
  dotDurationMult: 2.0, // 參考:Lv10 DoT 時長 +100%;sim 尚未套用
}

// ─── Ignite ────────────────────────────────────────────────────────────────
// 火毒 passive (Master Lv10) — 開關技能,sim 視為常駐。
// 玩家施放「火屬性」技能時有機率在目標位置生成火牆;
//   火牆每 tickIntervalSec 造成一次傷害,持續 durationSec (3 ticks:+2s / +4s / +6s)。
//   每次 tick 走主擊 pipeline (爆擊 / 熟練度 / 防禦 / ARC / 屬性 / Burning Magic 等)。
//   多個火牆互相獨立 — 每次施放 proc 都可能疊生一個新火牆。
//
// sim 規則:
//   - 觸發來源:emitCast 呼叫 + skill.element === 'fire' + skill.id !== 'inferno_aura'
//   - type: 'passive' → 不進 scheduler、也不會觸發 Meteor Shower 追打 (meteorTriggerRolls 回 0)
//   - 每次 tick = +1 useCount、+hitsPerTick attackCount
//   - 不是 DoT (不進 burnState,Burning Magic 計數不變)
//
// Lv10 (master): 50% 觸發,40% × 1 擊,持續 6s (3 ticks);Max 8 enemies
// Lv1:  14%,31%,持續 4s
// sim 使用線性推定 (perLevel);duration 固定 6s
// Ignite 非 4 轉技能 → 不吃 Combat Orders +1 (baseLevel 為最終 master 10)
export const IGNITE = {
  id: 'ignite',
  name: 'Ignite',
  nameKey: 'skills.archmageFP.ignite.name',
  descriptionKey: 'skills.archmageFP.ignite.description',
  imageUrl: ICON('Ignite'),
  color: '#ff6a2a',
  jobs: ['archmageFP'],
  element: 'fire',
  type: 'passive',
  baseLevel: 10,
  // Ignite 非 4 轉技能,不吃 Combat Orders +1 (上限固定為 master Lv10)
  maxEnemies: 8,
  ignite: {
    procRate: { base: 50, perLevel: 4 },   // Lv1 14% → Lv10 50% (master)
    damage:   { base: 40, perLevel: 1 },   // Lv1 31% → Lv10 40%
    tickIntervalSec: 2,
    durationSec: 6,                         // 固定 6s (Lv10)
    hitsPerTick: 3,                         // Attack Count: 3 → 每次 tick 3 下攻擊
  },
  // 技能專屬 V 矩陣 — 每等級 +4% 終傷;Lv40+ 額外無視防禦 +20% (獨立一排,與 Hyper 無視不相加)
  vmatrix: {
    maxLevel: 60,
    finalDmgPerLevel: 4,
    ignoreDefBonus: { threshold: 40, value: 20 },
  },
}

// 依等級計算 Ignite 實際數值 — 若技能無 ignite 設定回 null
export function skillIgnitePcts(skill, level) {
  const d = skill?.ignite
  if (!d) return null
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = Math.max(0, lv - skill.baseLevel)
  return {
    procRate: (d.procRate?.base || 0) + delta * (d.procRate?.perLevel || 0),
    damage:   (d.damage?.base   || 0) + delta * (d.damage?.perLevel   || 0),
    tickIntervalSec: d.tickIntervalSec || 2,
    durationSec: d.durationSec || 6,
    hitsPerTick: d.hitsPerTick || 1,
  }
}

export const ARCHMAGE_FP_SKILLS = [
  FLAME_SWEEP, FLAME_HAZE, MIST_ERUPTION, METEOR_SHOWER, IGNITE, INFERNO_AURA, POISON_MIST, IFRIT, TELEPORT_MASTERY,
]

// Meteor Shower 被動 Final Attack 在給定等級的實際數值 — 若技能無 finalAttack 回 null。
export function skillFinalAttackPcts(skill, level) {
  const fa = skill?.finalAttack
  if (!fa) return null
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = Math.max(0, lv - skill.baseLevel)
  return {
    procRate: (fa.procRate?.base || 0) + delta * (fa.procRate?.perLevel || 0),
    damage:   (fa.damage?.base   || 0) + delta * (fa.damage?.perLevel   || 0),
  }
}

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
