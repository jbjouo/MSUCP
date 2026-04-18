// Link Skill 共享狀態 — 提供給 LinkSkillPanel 與 CpCalculator 使用
//
// 匯出:
//   appliedSkills   (ref<[{ skillId, ownerJob }]>) — 已連結的 link skills
//   persistApplied  — 把 appliedSkills 寫回 localStorage
//   combinedLevelFor(skillId, myJobKey) — 某 skill 在當前設定的有效等級 (own + 連結,capped)
//   bestLevelDataFor(skill, level) — 取 ≤ level 的最高 levelData
//   flattenStats(stats) — 把 per-stack / 條件型欄位攤平成單層屬性 bag
//   activeSkillContributions(myJobKey) — 為計算機用的 contribution 清單

import { ref } from 'vue'
import {
  getLinkSkill,
  bestLinkSkillLevelDataFor,
} from '../data/linkSkills.js'

const APPLIED_KEY = 'msucp.linkSkills.applied.v3'

function loadApplied() {
  try {
    const raw = localStorage.getItem(APPLIED_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    if (!Array.isArray(arr)) return []
    const seen = new Set()
    const out = []
    for (const a of arr) {
      if (!a?.skillId || !a?.ownerJob) continue
      const key = `${a.skillId}@${a.ownerJob}`
      if (seen.has(key)) continue
      seen.add(key)
      out.push({ skillId: a.skillId, ownerJob: a.ownerJob })
    }
    return out
  } catch { return [] }
}

export const appliedSkills = ref(loadApplied())

export function persistApplied() {
  try { localStorage.setItem(APPLIED_KEY, JSON.stringify(appliedSkills.value)) } catch {}
}

export function combinedLevelFor(skillId, myJobKey = null) {
  const skill = getLinkSkill(skillId)
  if (!skill) return 0
  let total = myJobKey && skill.owners.includes(myJobKey) ? skill.ownMaxLevel : 0
  for (const a of appliedSkills.value) {
    if (a.skillId === skillId) total += skill.ownMaxLevel
  }
  return Math.min(total, skill.maxTotalLevel)
}

// 不要把這些 key 當成「累加屬性」(條件型/觸發型的描述欄位)
const EXCLUDED_STAT_KEYS = new Set(['procRate', 'duration', 'cooldown', 'maxStacks'])

export function flattenStats(stats) {
  if (!stats) return {}
  const out = {}
  const maxStacks = stats.maxStacks || 1
  for (const [k, v] of Object.entries(stats)) {
    if (EXCLUDED_STAT_KEYS.has(k)) continue
    if (k.endsWith('PerStack')) {
      const base = k.replace(/PerStack$/, '')
      out[base] = (out[base] || 0) + v * maxStacks
    } else {
      out[k] = (out[k] || 0) + v
    }
  }
  return out
}

export { bestLinkSkillLevelDataFor as bestLevelDataFor }

// 產出「目前該角色生效中所有 link skill」的屬性 contribution 清單 (給計算機用)
//   - 排除 specialEffect (條件型) 技能
//   - 每個 skill 合併為一筆 { skill, level, stats: {key:value} }
export function activeSkillContributions(myJobKey, myLinkSkillId = null) {
  const out = []
  const seen = new Set()
  const push = (skillId) => {
    if (seen.has(skillId)) return
    seen.add(skillId)
    const skill = getLinkSkill(skillId)
    if (!skill) return
    if (skill.specialEffect) return
    const level = combinedLevelFor(skillId, myJobKey)
    if (!level) return
    const levelData = bestLinkSkillLevelDataFor(skill, level)
    const flat = flattenStats(levelData?.stats)
    if (!Object.keys(flat).length) return
    out.push({ skill, level, stats: flat })
  }
  if (myLinkSkillId) push(myLinkSkillId)
  for (const a of appliedSkills.value) push(a.skillId)
  return out
}
