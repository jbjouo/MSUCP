// {JOB_NAME} — 0 轉技能
// 規則:0 轉 = 新手共通 + 職業原生 Link Skill
//
// Link Skill 資料單一事實源仍然放在 src/data/linkSkills.js
// (其規則由 useLinkSkills.js / LinkSkillPanel 處理,不要改動)。
// 此處只以「引用 + 標上 advancement: 0」的方式把它納入職業技能索引。
//
// 範例:
//   import { LINK_SKILLS } from '../../../../data/linkSkills.js'
//   export const { {link_id}: LINK_{LINK_ID} } = LINK_SKILLS
//   export const TEMPLATE_0TH_LINK_SKILLS = [
//     { ...LINK_{LINK_ID}, advancement: 0 },
//   ]

export const TEMPLATE_0TH_SIM_SKILLS = []      // 不會主動施放
export const TEMPLATE_0TH_PASSIVE_SKILLS = []  // 0 轉通常沒 passive
export const TEMPLATE_0TH_LINK_SKILLS = []     // 填入職業 link skill
