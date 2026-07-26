// 技能計算通用 helper
//
// 這些函式與「特定職業」無關,給戰鬥模擬器 / CP 計算機共用。
// 原本散落於 constants/skills/archmageFP.js;重構後集中到此,
// 職業檔案只存 data,計算一律走這裡。

// 依等級計算技能實際的 主傷 / DoT 百分比
//   damage 欄位可缺省 (例:Creeping Toxin 施放本身無直擊,傷害全在 burn / detonation) → hit 回 0
export function skillDamagePct(skill, level) {
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = lv - skill.baseLevel
  return {
    hit: (skill.damage?.base ?? 0) + delta * (skill.damage?.perLevel ?? 0),
    burn: skill.burn ? skill.burn.base + delta * skill.burn.perLevel : 0,
  }
}

// 技能自帶的無視防禦 (例:Mist Eruption Lv30 +40%) — 僅主擊
export function skillIgnoreDefPct(skill, level) {
  const ig = skill?.ignoreDef
  if (!ig) return 0
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = Math.max(0, lv - skill.baseLevel)
  return (ig.base || 0) + delta * (ig.perLevel || 0)
}

// 技能一次施放的固定爆炸次數 (hits multiplier) — 與 DoT 數無關
export function skillExplosionCount(skill) {
  const ex = skill?.explosions
  if (!ex) return 1
  return Math.max(1, Math.floor(Number(ex.count) || 1))
}

// 依目標身上 DoT 層數查終傷 %(Mist Eruption 用);< 2 → 0%
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

// 技能專屬 V 矩陣 — 僅作用於此技能的加成
//   finalDmgPct  — 額外終傷 % (主擊與 DoT 皆吃)
//   ignoreDefPct — 額外無視防禦 % (只對主擊有意義)
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

// Meteor Shower 被動 Final Attack 在給定等級的實際數值
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

// Ignite 實際數值 — 若技能無 ignite 設定回 null
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

// 共用 icon 產生器 — 從 public/skills/common/ 載入 (原 yetidb 已下載到本地)
export const YETIDB_ICON = (name) => `${import.meta.env.BASE_URL}skills/common/Skill_${name}.png`

// public/ 資源 URL — 自動 prepend vite 的 BASE_URL,讓部署到子路徑也能正確載入
// (BASE_URL 預設 '/';正式部署在 wasaizanla.github.io/msucp/ 時為 '/msucp/')
export const ASSET = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`

// 本地 icon 產生器 — 從 public/skills/<scope>/Skill_<name>.png 載入
// scope: 'archmage-fp' | 'common' | 其他職業資料夾
// 這些檔名對應 wiki 原始檔名(含括號、單引號等),瀏覽器會自動 URL-encode
export const LOCAL_ICON = (name, scope = 'common') => ASSET(`skills/${scope}/Skill_${name}.png`)
