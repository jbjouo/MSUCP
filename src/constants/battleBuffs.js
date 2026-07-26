// [相容殼] — 新結構請看 ./skills/jobs/{job}/{Nth}.js 與 ./skills/_shared/class-groups/
//
// 實戰觸發型 buff — 欄位說明見原系統:
//   source: 'linkSkill'    → 從 LinkSkillPanel 取得等級與 per-level stats
//   source: 'passive'      → 技能自帶,passiveType 指定層數來源
//   source: 'activeToggle' → 戰鬥模擬開始後自動觸發
//   source: 'linkCycle'    → 從 LinkSkillPanel 取等級,啟動 / 冷卻循環

import { COMBINED_BATTLE_BUFFS } from './skills/index.js'

export const BATTLE_BUFFS = COMBINED_BATTLE_BUFFS

// 解出 activeToggle buff 在指定等級的效果參數
export function resolveActiveToggleStats(buff, level) {
  const bl = buff.baseLevel || 1
  // delta 允許為負 — V 技能 buff (requiresVmatrixLevel) 面板等級低於 baseLevel 時向下縮放
  //   (例:MWGB VM10 → 增幅 350 + (10−25)×10 = 200%);既有 buff 等級恆 ≥ baseLevel,不受影響
  const delta = (level || bl) - bl
  const base = buff.base || {}
  const per = buff.perLevelBonus || {}
  return {
    level: bl + delta,
    durationSec: (base.durationSec || 0) + delta * (per.durationSec || 0),
    baseFinalDmgPct: (base.baseFinalDmgPct || 0) + delta * (per.baseFinalDmgPct || 0),
    // 啟動期間固定附加的 Damage%(與 CP Damage% 相加後進主擊公式)— 不隨 tick 遞增
    baseDamagePct: (base.baseDamagePct || 0) + delta * (per.baseDamagePct || 0),
    tickIntervalSec: base.tickIntervalSec || 0,
    tickIncreasePct: base.tickIncreasePct || 0,
    // 伺服器延遲模擬:每次 tick 可能是正常間隔(tickIntervalSec)或延遲間隔(tickDelayedIntervalSec)
    //   tickServerDelayRate 預設 0.8 → 期望間隔 = 0.2×5 + 0.8×10 = 9 秒
    tickDelayedIntervalSec: base.tickDelayedIntervalSec || 0,
    tickServerDelayRate: typeof base.tickServerDelayRate === 'number' ? base.tickServerDelayRate : 0,
    // 不吃 Buff Duration% 加持(例:Epic Adventure)
    ignoresBuffDuration: !!buff.ignoresBuffDuration,
    cooldownSec: buff.cooldownSec || 0,
  }
}

export function visibleBuffsForJob(jobKey) {
  return BATTLE_BUFFS.filter((b) => !b.jobs || b.jobs.includes(jobKey))
}
