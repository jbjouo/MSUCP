// 戰鬥模擬器 — 技能匯總
// 目前只納入火毒 (Archmage FP) 的 Flame Sweep。
// 未來新增其他職業請建立 src/constants/skills/{jobKey}.js 後在此 merge。

import { ARCHMAGE_FP_SKILLS } from './skills/archmageFP.js'

export const SIM_SKILLS = [...ARCHMAGE_FP_SKILLS]

// 時間 (ms) → "00:03:01" (battle summary 用,保留時:分:秒)
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
