// [相容殼] — 戰鬥模擬器技能匯總
// 新結構:SIM_SKILLS 由 skills/index.js 依 JOB_SKILL_REGISTRY 自動彙整

import { COMBINED_SIM_SKILLS } from './skills/index.js'

export const SIM_SKILLS = COMBINED_SIM_SKILLS

// 時間 (ms) → "HH:MM:SS" (battle summary 用)
export function fmtClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

// 時間軸用 (ms) → "MM:SS.XX" — 去掉小時、精確到百分之一秒
export function fmtTimelineClock(ms) {
  const total = Math.max(0, Math.floor(Number(ms) || 0))
  const totalSec = Math.floor(total / 1000)
  const m = Math.floor(totalSec / 60)
  const s = totalSec % 60
  const cs = Math.floor((total % 1000) / 10)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(m)}:${pad(s)}.${pad(cs)}`
}
