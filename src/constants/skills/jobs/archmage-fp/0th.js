// 火毒 (Archmage Fire/Poison) — 0 轉技能
// 0 轉 = 新手 + 職業 Link Skill (Empirical Knowledge / 法師傳授)
//
// Link Skill 資料單一事實源仍在 src/data/linkSkills.js,其規則 (classGroup
// 疊加、slot cap、uniqueByJob) 由 useLinkSkills.js 維持,請勿改動。
// 這裡僅「引用」LINK_SKILLS.empirical_knowledge 並標上 advancement: 0,
// 讓火毒的技能索引完整涵蓋 0 轉。

import { LINK_SKILLS } from '../../../../data/linkSkills.js'

const EMPIRICAL_KNOWLEDGE = LINK_SKILLS.empirical_knowledge

export const ARCHMAGE_FP_0TH_LINK_SKILLS = EMPIRICAL_KNOWLEDGE
  ? [{ ...EMPIRICAL_KNOWLEDGE, advancement: 0 }]
  : []

export const ARCHMAGE_FP_0TH_SIM_SKILLS = []
export const ARCHMAGE_FP_0TH_PASSIVE_SKILLS = []
