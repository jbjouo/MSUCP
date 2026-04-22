// [相容殼] — 新結構請看 ./skills/index.js 與 ./skills/{_shared,jobs}/
//
// Job / trait skills 登錄
//
// 欄位:
//   id, name, icon?
//   stats?     — 靜態屬性加成 (key → value)
//   mastery?   — 附加熟練度 % (給 ATT STATS 公式用)
//   jobs?      — 限定職業 (job.key[]);未填 = 全職業
//   passive    — true 表示自動生效,不在側欄顯示開關
//   group?     — 互斥群組;同一 group 內只能同時啟用一個
//   contribute(ctx) — 動態貢獻;回傳 { key: value } bag
//     ctx = { jobKey, weaponSubType, characterLevel }
//
// 重構後所有 entry 新增 `advancement` 欄位 (0~6);既有消費端若沒讀不會受影響。

import { COMBINED_SKILLS } from './skills/index.js'

export const SKILLS = COMBINED_SKILLS
export const SKILLS_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]))
