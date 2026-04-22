// [相容殼] — V 矩陣資料已整合進各技能 entry 的 `vmatrix` 欄位;
// 本檔只負責 export 對外常用的 VMATRIX_SKILLS(由頂層 barrel 統一彙整)
// 與 helper function。
//
// 新 schema:
//   skill.vmatrix = {
//     kind: 'boost' | 'skill'                     // ← 必填
//       'boost': 增強 1-4 轉既有技能(core 升級提供 finalDmgPerLevel / ignoreDefBonus)
//       'skill': V 技能本身(升級 = 技能自身等級;可帶 passive 貢獻 CP)
//     passive?: { type, per, statKey?, fixed? }   // 僅 kind:'skill' 使用:CP 面板被動加成
//     maxLevel?: number                            // 覆寫預設 30;boost 多半 60,skill 多半 30
//     finalDmgPerLevel?, ignoreDefBonus?           // 僅 kind:'boost' 使用:戰鬥模擬終傷與無視防禦
//     coreGroupId?: string                         // 多支 skill 共用同一個 core(等級同步)
//     descriptionKey?: string                      // V 矩陣面板自己的描述 key
//     nameKey?: string                             // V 矩陣面板自己的名稱 key
//   }

import { COMBINED_VMATRIX_SKILLS } from './skills/index.js'

export const VMATRIX_MAX_LEVEL = 30
export const VMATRIX_SKILLS = COMBINED_VMATRIX_SKILLS

// 只看 vmatrix.maxLevel — skill.maxLevel 是技能本體在 CP Buff 角色下的「技能本身 Max Level」
// (例:Decent Sharp Eyes CP Buff 的 maxLevel=1),與 V 矩陣等級(預設 0~30)無關,
// 不要 fallback 到 skill.maxLevel 免得跨角色互相干擾。
export function maxLevelOf(skill) {
  const v = skill?.vmatrix?.maxLevel ?? VMATRIX_MAX_LEVEL
  return Math.max(0, Math.floor(Number(v)))
}

export function skillAvailableForJob(skill, jobKey, branchKey) {
  if (!skill) return false
  if (skill.jobs && skill.jobs.length && !skill.jobs.includes(jobKey)) return false
  if (skill.branch && skill.branch !== branchKey) return false
  return true
}

export function passiveValueAt(skill, level) {
  const p = skill?.vmatrix?.passive
  if (!p) return 0
  const lv = Math.floor(Number(level) || 0)
  if (lv <= 0) return 0
  return Math.ceil(lv / p.per)
}

// 取得 V 矩陣面板用的名稱 / 描述 key(優先 vmatrix 內的,否則 fallback 到技能本體)
export function vmatrixNameKey(skill) {
  return skill?.vmatrix?.nameKey || skill?.nameKey || null
}
export function vmatrixDescriptionKey(skill) {
  return skill?.vmatrix?.descriptionKey || skill?.descriptionKey || null
}

// kind 判定 helper
export function isBoostCore(skill) {
  return skill?.vmatrix?.kind === 'boost'
}
export function isSkillCore(skill) {
  return skill?.vmatrix?.kind === 'skill'
}
