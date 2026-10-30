// 公會技能 — 角色頁「技能」分頁(祝福技能下、V 矩陣上)
//
// 兩類:
//   normal — 普通技能:被動,填等級即計入 CP 頁 breakdown
//   noble  — 貴族技能:buff,等級 > 0 才出現在 CP 增益欄(Combat Orders 之後),開關後生效
//
// 欄位:
//   id, group, guildLevel (普通技能:解鎖公會等級,面板分欄用), maxLevel, icon (null = 圖示待補,面板顯示佔位框)
//   effect(lv) → { statKey: value }   — 依等級回傳屬性 bag(% 類 key 走 PCT_KEYS);未定義 = 無效果
//   公會技能一律不計入戰鬥力,只增加數值(breakdown 走 cpExclude)
//
// TODO: 普通技能(skillId 91000xxx)名稱 / 能力 / 圖示待補,目前隱藏

const BASE_URL = import.meta.env.BASE_URL
const ICON = (name) => `${BASE_URL}skills/guild/${name}.png`

export const GUILD_SKILL_GROUPS = ['normal', 'noble']
// 面板顯示 / CP 生效的分組 — 普通技能資料未齊,先隱藏(保留資料結構供之後新增)
export const GUILD_VISIBLE_GROUPS = ['noble']

// 普通技能依「公會等級」分欄(Lv1 / 5 / 10 / 15 / 20 / 25;Lv30 不收錄)
export const GUILD_NORMAL_TIERS = [1, 5, 10, 15, 20, 25]

export const GUILD_SKILLS = [
  { id: 'guild_lv1_1', group: 'normal', guildLevel: 1, maxLevel: 1, icon: null },
  { id: 'guild_lv1_2', group: 'normal', guildLevel: 1, maxLevel: 1, icon: null },
  { id: 'guild_lv1_3', group: 'normal', guildLevel: 1, maxLevel: 1, icon: null },
  { id: 'guild_lv5_1', group: 'normal', guildLevel: 5, maxLevel: 1, icon: null },
  { id: 'guild_lv5_2', group: 'normal', guildLevel: 5, maxLevel: 1, icon: null },
  { id: 'guild_lv5_3', group: 'normal', guildLevel: 5, maxLevel: 1, icon: null },
  { id: 'guild_lv10_1', group: 'normal', guildLevel: 10, maxLevel: 1, icon: null },
  { id: 'guild_lv10_2', group: 'normal', guildLevel: 10, maxLevel: 1, icon: null },
  { id: 'guild_lv15_1', group: 'normal', guildLevel: 15, maxLevel: 1, icon: null },
  { id: 'guild_lv15_2', group: 'normal', guildLevel: 15, maxLevel: 1, icon: null },
  { id: 'guild_lv20_1', group: 'normal', guildLevel: 20, maxLevel: 1, icon: null },
  { id: 'guild_lv20_2', group: 'normal', guildLevel: 20, maxLevel: 1, icon: null },
  { id: 'guild_lv25_1', group: 'normal', guildLevel: 25, maxLevel: 1, icon: null },
  { id: 'guild_lv25_2', group: 'normal', guildLevel: 25, maxLevel: 1, icon: null },
  // 貴族技能 — 4 項皆 Master 15,每級 +2%(持續 2 分/級,CD 116 − 4×(lv−1) 分)
  { id: 'guild_boss_slayers', skillId: 91001022, group: 'noble', maxLevel: 15, icon: ICON(91001022), effect: (lv) => ({ bossDmg: 2 * lv }) },
  { id: 'guild_undeterred', skillId: 91001023, group: 'noble', maxLevel: 15, icon: ICON(91001023), effect: (lv) => ({ ignoreDef: 2 * lv }) },
  { id: 'guild_for_the_guild', skillId: 91001024, group: 'noble', maxLevel: 15, icon: ICON(91001024), effect: (lv) => ({ dmgPct: 2 * lv }) },
  { id: 'guild_hard_hitter', skillId: 91001025, group: 'noble', maxLevel: 15, icon: ICON(91001025), effect: (lv) => ({ critDmg: 2 * lv }) },
]

export const GUILD_SKILLS_BY_ID = Object.fromEntries(GUILD_SKILLS.map((s) => [s.id, s]))

export function guildSkillBag(skill, lv) {
  if (!skill || lv <= 0 || typeof skill.effect !== 'function') return null
  const bag = skill.effect(lv)
  return bag && Object.keys(bag).length ? bag : null
}

// 貴族技能 → CP 增益欄 buff(併入 COMBINED_BUFFS 末端)
//   等級由 ctx.guildLevel(id) 讀取;等級 0 時不顯示、不生效
export const GUILD_NOBLE_BUFFS = GUILD_SKILLS.filter((s) => s.group === 'noble').map((s) => ({
  id: s.id,
  nameKey: `guildSkills.skills.${s.id}.name`,
  icon: s.icon,
  descriptionKey: `guildSkills.skills.${s.id}.description`,
  kind: 'buff',
  cp: { role: 'buff' },
  guild: true,
  contribute(ctx) {
    const lv = ctx.guildLevel?.(s.id) || 0
    const bag = guildSkillBag(s, lv)
    if (!bag) return []
    const label = ctx.t ? ctx.t('cp.tip.buffPrefix', { name: ctx.t(this.nameKey) }) : s.id
    return Object.entries(bag).map(([key, value]) => ({ key, label, value, isPct: !!ctx.isPctKey?.(key) }))
  },
}))
