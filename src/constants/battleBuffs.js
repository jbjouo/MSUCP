// 實戰觸發型 buff — 戰鬥模擬會讀取這裡每個 buff 的 source 來源取得最新等級與效果數值。
//   source: 'linkSkill'    → 從 LinkSkillPanel 取得等級與 per-level stats
//   source: 'passive'      → 技能自帶,不需觸發;passiveType 指定層數來源
//     passiveType: 'dotCount' → 層數 = 目標身上生效中的 DoT 數 (由 useDotTracker 提供)

const YETIDB = (name) => `https://media.maplestorywiki.net/yetidb/Skill_${name}.png`

export const BATTLE_BUFFS = [
  {
    id: 'empirical_knowledge',
    source: 'linkSkill',
    nameKey: 'linkSkill.skills.empirical_knowledge.name',
    descriptionKey: 'linkSkill.skills.empirical_knowledge.flavor',
    imageUrl: '/skills/link/empirical_knowledge.png',
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
  },
  {
    id: 'fervent_drain',
    source: 'passive',
    passiveType: 'dotCount',
    nameKey: 'battleBuffs.fervent_drain.name',
    descriptionKey: 'battleBuffs.fervent_drain.description',
    imageUrl: YETIDB('Elemental_Drain'),
    jobs: ['archmageFP'],
    maxStacks: 5,
    perStackFinalDmgPct: 5, // 每一層 +5% 最終傷害(同技能層數相加,不同來源互乘)
  },
]

export function visibleBuffsForJob(jobKey) {
  return BATTLE_BUFFS.filter((b) => !b.jobs || b.jobs.includes(jobKey))
}
