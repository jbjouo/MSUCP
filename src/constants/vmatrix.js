// V 矩陣 — V 技能 (含通用 + 職業專屬)
//
// passive: 該技能在 CP 計算機的被動貢獻
//   - 1 等就有 1 點;之後每 per 等再 +1 → value = ceil(lv / per)
//     (per=1 → 等於 lv;per=5 → Lv1=1, Lv5=1, Lv6=2, Lv10=2, Lv11=3, ...)
//   - type: 'allStat'  → 同時加 STR/DEX/INT/LUK,吃 % 加成 (非 fixed)
//   - type: 'attMatk'  → 加 ATT 與 MATK (吃 % 加成)
//   - type: 'stat'     → 加單一屬性 (吃 % 加成),由 statKey 指定
//   - 沒有 passive 且沒有 skillSpecific → 該技能目前無效果,面板隱藏
//
// skillSpecific?: 技能專屬 V 矩陣 (例如 Flame Sweep 的加成僅作用於該技能本身,
//   不進 CP 面板;由戰鬥模擬器 (useBattleSim) 讀取 useVMatrix.state.levels[id] 套用)
//
// maxLevel?: 覆寫此技能的等級上限 (預設 VMATRIX_MAX_LEVEL = 30)
// jobs?  : 限定可見/可貢獻的職業 key 陣列 (與 jobs.js 對齊)
// branch?: 限定可見/可貢獻的職業群 key (warrior / magician / bowman / thief / pirate / ...)

export const VMATRIX_MAX_LEVEL = 30

const ICON = (name) => `https://media.maplestorywiki.net/yetidb/Skill_${name}.png`

export const VMATRIX_SKILLS = [
  { id: 'rope_lift',                nameKey: 'vmatrix.skills.rope_lift',                imageUrl: ICON('Rope_Lift'),
    passive: { type: 'allStat', per: 1 } },
  { id: 'decent_mystic_door',       nameKey: 'vmatrix.skills.decent_mystic_door',       imageUrl: ICON('Mystic_Door'),
    passive: { type: 'allStat', per: 5 } },
  { id: 'decent_sharp_eyes',        nameKey: 'vmatrix.skills.decent_sharp_eyes',        imageUrl: ICON('Sharp_Eyes'),
    passive: { type: 'allStat', per: 5 } },
  { id: 'decent_hyper_body',        nameKey: 'vmatrix.skills.decent_hyper_body',        imageUrl: ICON('Hyper_Body'),
    passive: { type: 'allStat', per: 5 } },
  { id: 'decent_combat_orders',     nameKey: 'vmatrix.skills.decent_combat_orders',     imageUrl: ICON('Combat_Orders') },
  { id: 'decent_advanced_blessing', nameKey: 'vmatrix.skills.decent_advanced_blessing', imageUrl: ICON('Decent_Advanced_Blessing'),
    passive: { type: 'allStat', per: 5 } },
  { id: 'decent_speed_infusion',    nameKey: 'vmatrix.skills.decent_speed_infusion',    imageUrl: ICON('Decent_Speed_Infusion'),
    passive: { type: 'allStat', per: 5 } },
  { id: 'blink',                    nameKey: 'vmatrix.skills.blink',                    imageUrl: ICON('Blink'),
    passive: { type: 'attMatk', per: 1 } },
  { id: 'erda_nova',                nameKey: 'vmatrix.skills.erda_nova',                imageUrl: ICON('Erda_Nova') },
  { id: 'will_of_erda',             nameKey: 'vmatrix.skills.will_of_erda',             imageUrl: ICON('Will_of_Erda') },
  { id: 'decent_holy_symbol',       nameKey: 'vmatrix.skills.decent_holy_symbol',       imageUrl: ICON('Holy_Symbol') },

  // ── 職業專屬 ──
  // 冒險家法師 (火毒 / 冰雷 / 主教) — 每 1 等 +1 INT
  { id: 'unreliable_memory', nameKey: 'vmatrix.skills.unreliable_memory', imageUrl: ICON('Unreliable_Memory'),
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    passive: { type: 'stat', statKey: 'int', per: 1 } },

  // ── 技能專屬 (不進 CP 面板,由戰鬥模擬器讀取) ──
  // 三支皆:每等 +2% 終傷 (僅此技能)、Lv40+ 額外無視防禦 +20% (僅此技能,與 Hyper 無視不相加,為獨立一排)
  { id: 'flame_sweep',
    nameKey: 'skills.archmageFP.flame_sweep.name',
    descriptionKey: 'vmatrix.skills.flame_sweep_core.description',
    imageUrl: ICON('Flame_Sweep'),
    jobs: ['archmageFP'],
    maxLevel: 60,
    skillSpecific: true },
  { id: 'flame_haze',
    nameKey: 'skills.archmageFP.flame_haze.name',
    descriptionKey: 'vmatrix.skills.flame_haze_core.description',
    imageUrl: ICON('Flame_Haze'),
    jobs: ['archmageFP'],
    maxLevel: 60,
    skillSpecific: true },
  { id: 'mist_eruption',
    nameKey: 'skills.archmageFP.mist_eruption.name',
    descriptionKey: 'vmatrix.skills.mist_eruption_core.description',
    imageUrl: ICON('Mist_Eruption'),
    jobs: ['archmageFP'],
    maxLevel: 60,
    skillSpecific: true },
]

export function maxLevelOf(skill) {
  return Math.max(0, Math.floor(Number(skill?.maxLevel ?? VMATRIX_MAX_LEVEL)))
}

export function skillAvailableForJob(skill, jobKey, branchKey) {
  if (!skill) return false
  if (skill.jobs && skill.jobs.length && !skill.jobs.includes(jobKey)) return false
  if (skill.branch && skill.branch !== branchKey) return false
  return true
}

export function passiveValueAt(skill, level) {
  if (!skill?.passive) return 0
  const lv = Math.floor(Number(level) || 0)
  if (lv <= 0) return 0
  return Math.ceil(lv / skill.passive.per)
}
