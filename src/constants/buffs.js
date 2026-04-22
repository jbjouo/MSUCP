// [相容殼] — 新結構請看 ./skills/_shared/all-jobs/buffs.js 與 ./skills/jobs/{job}/{Nth}.js
//
// Buff 定義 — 計算機右側可切換的增益效果
//
// 欄位:
//   id, name, icon
//   baseLevel?        : 技能本身的 base 等級 (預設 0)
//   skillLevelBonus?  : 啟用時為其他 buff 的 effectiveLevel +N
//   mastery?          : 固定 +N% 武器熟練度
//   stats?            : 靜態屬性加成 bag { key: value, ... }
//   contribute?       : (ctx) => [{ key, label, value, isPct? }]
//       ctx = { charState, baseStats, primary, effectiveLevel }

import { COMBINED_BUFFS } from './skills/index.js'

export const BUFFS = COMBINED_BUFFS
export const BUFFS_BY_ID = Object.fromEntries(BUFFS.map((b) => [b.id, b]))
