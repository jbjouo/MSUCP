// 超技能 (Hyper Skills) — 每角色 5 點,從 9 個選項中點 1 點 / 技能
// 僅支援火毒 (archmageFP) 的 9 個選項;其他職業日後可擴充。
//
// 效果 payload 欄位 (合計在 useHyperSkills.effectsForSkill(skillId) 裡回傳):
//   damagePct            主傷害 % 加成(乘進技能 hit% → hit × (1 + pct/100))
//   burnDamagePct        DoT / 持續傷害 % 加成(乘進技能 burn%)
//   burnDurationBonusSec DoT 持續時間 + N 秒
//   hitsPerCastBonus     每次施放命中次數 + N
//   ignoreDefPct         單技能額外無視防禦 %
//   cooldownOwnPctRed    技能自身冷卻 % 減免(併入 skill.cooldownOwnPctRed)

export const HYPER_SKILL_POINTS_CAP = 5

const ICON = (name) => `https://media.maplestorywiki.net/yetidb/Skill_${name}.png`

export const HYPER_SKILLS = [
  // ── Poison Mist ───────────────────────────────────────────
  {
    id: 'poison_mist_reinforce',
    nameKey: 'hyperSkill.skills.poison_mist_reinforce.name',
    descKey: 'hyperSkill.skills.poison_mist_reinforce.desc',
    group: 'poison_mist',
    jobs: ['archmageFP'],
    levelReq: 140,
    imageUrl: ICON('Poison_Mist'),
    effect: { targetSkill: 'poison_mist', damagePct: 20 },
  },
  {
    id: 'poison_mist_aftermath',
    nameKey: 'hyperSkill.skills.poison_mist_aftermath.name',
    descKey: 'hyperSkill.skills.poison_mist_aftermath.desc',
    group: 'poison_mist',
    jobs: ['archmageFP'],
    levelReq: 150,
    imageUrl: ICON('Poison_Mist'),
    effect: { targetSkill: 'poison_mist', burnDurationBonusSec: 6 },
  },
  {
    id: 'poison_mist_cripple',
    nameKey: 'hyperSkill.skills.poison_mist_cripple.name',
    descKey: 'hyperSkill.skills.poison_mist_cripple.desc',
    group: 'poison_mist',
    jobs: ['archmageFP'],
    levelReq: 180,
    imageUrl: ICON('Poison_Mist'),
    effect: { targetSkill: 'poison_mist', burnDamagePct: 20 },
  },
  // ── Flame Sweep ───────────────────────────────────────────
  {
    id: 'flame_sweep_reinforce',
    nameKey: 'hyperSkill.skills.flame_sweep_reinforce.name',
    descKey: 'hyperSkill.skills.flame_sweep_reinforce.desc',
    group: 'flame_sweep',
    jobs: ['archmageFP'],
    levelReq: 140,
    imageUrl: ICON('Flame_Sweep'),
    effect: { targetSkill: 'flame_sweep', damagePct: 10 },
  },
  {
    id: 'flame_sweep_cripple',
    nameKey: 'hyperSkill.skills.flame_sweep_cripple.name',
    descKey: 'hyperSkill.skills.flame_sweep_cripple.desc',
    group: 'flame_sweep',
    jobs: ['archmageFP'],
    levelReq: 165,
    imageUrl: ICON('Flame_Sweep'),
    effect: { targetSkill: 'flame_sweep', burnDamagePct: 20 },
  },
  {
    id: 'flame_sweep_extra_strike',
    nameKey: 'hyperSkill.skills.flame_sweep_extra_strike.name',
    descKey: 'hyperSkill.skills.flame_sweep_extra_strike.desc',
    group: 'flame_sweep',
    jobs: ['archmageFP'],
    levelReq: 180,
    imageUrl: ICON('Flame_Sweep'),
    effect: { targetSkill: 'flame_sweep', hitsPerCastBonus: 1 },
  },
  // ── Mist Eruption ─────────────────────────────────────────
  {
    id: 'mist_eruption_reinforce',
    nameKey: 'hyperSkill.skills.mist_eruption_reinforce.name',
    descKey: 'hyperSkill.skills.mist_eruption_reinforce.desc',
    group: 'mist_eruption',
    jobs: ['archmageFP'],
    levelReq: 150,
    imageUrl: ICON('Mist_Eruption'),
    effect: { targetSkill: 'mist_eruption', damagePct: 10 },
  },
  {
    id: 'mist_eruption_guardbreaker',
    nameKey: 'hyperSkill.skills.mist_eruption_guardbreaker.name',
    descKey: 'hyperSkill.skills.mist_eruption_guardbreaker.desc',
    group: 'mist_eruption',
    jobs: ['archmageFP'],
    levelReq: 165,
    imageUrl: ICON('Mist_Eruption'),
    effect: { targetSkill: 'mist_eruption', ignoreDefPct: 20 },
  },
  {
    id: 'mist_eruption_cooldown_cutter',
    nameKey: 'hyperSkill.skills.mist_eruption_cooldown_cutter.name',
    descKey: 'hyperSkill.skills.mist_eruption_cooldown_cutter.desc',
    group: 'mist_eruption',
    jobs: ['archmageFP'],
    levelReq: 190,
    imageUrl: ICON('Mist_Eruption'),
    effect: { targetSkill: 'mist_eruption', cooldownOwnPctRed: 50 },
  },
]

// 依 group (parent skill id) 分組,UI 用
export function hyperSkillGroups(jobKey) {
  const applicable = HYPER_SKILLS.filter((h) => !h.jobs || h.jobs.includes(jobKey))
  const order = []
  const bucket = new Map()
  for (const sk of applicable) {
    if (!bucket.has(sk.group)) {
      bucket.set(sk.group, [])
      order.push(sk.group)
    }
    bucket.get(sk.group).push(sk)
  }
  return order.map((g) => ({ group: g, skills: bucket.get(g) }))
}
