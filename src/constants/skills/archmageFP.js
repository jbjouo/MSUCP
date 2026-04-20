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

export const ARCHMAGE_FP_SKILLS = [FLAME_SWEEP]

// 依等級計算實際傷害 / DoT 百分比
export function skillDamagePct(skill, level) {
  const lv = Math.max(skill.baseLevel, Number(level) || skill.baseLevel)
  const delta = lv - skill.baseLevel
  return {
    hit: skill.damage.base + delta * skill.damage.perLevel,
    burn: skill.burn ? skill.burn.base + delta * skill.burn.perLevel : 0,
  }
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
