// [相容殼] — 新結構請看 ./skills/jobs/{job}/hyper.js
//
// 超技能 (Hyper Skills) — 每角色 5 點,從 9 個選項中點 1 點 / 技能
// 效果 payload 欄位 (hyperSkills 索引由 JOB_SKILL_REGISTRY 自動彙整):
//   damagePct            主傷害 % 加成(乘進技能 hit%)
//   burnDamagePct        DoT 持續傷害 % 加成
//   burnDurationBonusSec DoT 持續時間 + N 秒
//   hitsPerCastBonus     每次施放命中次數 + N
//   ignoreDefPct         單技能額外無視防禦 %
//   cooldownOwnPctRed    技能自身冷卻 % 減免

import { COMBINED_HYPER_SKILLS } from './skills/index.js'

export const HYPER_SKILL_POINTS_CAP = 5
export const HYPER_SKILLS = COMBINED_HYPER_SKILLS

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
