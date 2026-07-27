// Bishop — 5 轉技能 (V Skills)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'bishop')

// ─── Benediction (1技,skillId 400021003) ───────────────────────────────────
// 開場 buff (靠後施放):自身終傷 +5% (全等級固定) + INT 快照加成,不可疊加。
// API 實值 Lv1~25:時長 = 30 + floor(lv/2) 秒 (Lv25 = 42s);Lv26~30 clamp → 外插 Lv30 = 45s
//   (與 master 描述 45 秒吻合);終傷基礎值全等級 +5%,等級只影響時長。
// INT 加成:每 2500 INT +1% (上限 +45%) — 「開啟當下」快照,期間屬性變動不影響;
//   每次重新開啟重新快照 (statScaledFinalDmg 引擎機制)。
// 隊伍向效果 (隊友終傷按人數遞減 / 回復 / 攻速) 對單模擬不建模;
// 5 秒內再次施放 (時長 −15s / CD −60s) 的縮短機制暫不建模。
export const BENEDICTION = {
  id: 'benediction',
  name: 'Benediction',
  nameKey: 'skills.bishop.benediction.name',
  descriptionKey: 'skills.bishop.benediction.description',
  imageUrl: ICON('Benediction'),
  color: '#ffe9a8',
  jobs: ['bishop'],
  advancement: 5,
  kind: 'buff',
  vSlot: 1,                              // 主動 V 技能格位:1技
  baseLevel: 30,                         // 等級由 V 矩陣面板 (0~30) 決定
  mpCost: 1000,
  cooldownSec: 180,
  vmatrix: { kind: 'skill', maxLevel: 30 },
  battle: {
    source: 'activeToggle',
    base: {
      durationSec: 45,                   // Lv30 = 45s (外插);floor 公式見 durationFloor
      baseFinalDmgPct: 5,                // 全等級固定 +5%
    },
    perLevelBonus: { durationSec: 0.5 },
    durationFloor: true,                 // 時長 = floor(45 − delta×0.5) → 30 + floor(lv/2)
    // INT 快照終傷 — 每 2500 INT +1%,上限 +45%;與基礎 5% 同 buff 內相加後轉單一乘區
    statScaledFinalDmg: { stat: 'int', perStat: 2500, pctPerStep: 1, maxPct: 45 },
    cooldownSec: 180,
    ignoresBuffDuration: true,           // 5 轉技能不吃加持 (Buff Duration%),只吃 CD 減免
    useVmatrixLevel: true,               // 等級 = V 矩陣面板等級
    requiresVmatrixLevel: true,          // 面板 0 = 未習得 — 不自動施放
    noCombatOrders: true,                // V 技能等級不吃 Combat Orders +1
    initialDelayBySpeed: { 7: 1400, 8: 1300 },  // 開場靠後 — Infinity (450ms) 之後啟動 (待實測)
  },
}

// ─── 5 轉所有主教技能 ───────────────────────────────────────────────────────
export const BISHOP_5TH_SKILLS = [
  BENEDICTION,
]

// 子分類 — 全部從主列表 filter derive
export const BISHOP_5TH_SIM_SKILLS     = BISHOP_5TH_SKILLS.filter((s) => s.sim)
export const BISHOP_5TH_PASSIVE_SKILLS = BISHOP_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BISHOP_5TH_BUFFS          = BISHOP_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BISHOP_5TH_VMATRIX_SKILLS = BISHOP_5TH_SKILLS.filter((s) => s.vmatrix)

// Battle Buff 從技能的 battle 子物件 derive — entry 合併技能 id/name/img + battle 參數
export const BISHOP_5TH_BATTLE_BUFFS = BISHOP_5TH_SKILLS
  .filter((s) => s.battle)
  .map((s) => ({
    id: s.id,
    nameKey: s.nameKey,
    descriptionKey: s.descriptionKey,
    imageUrl: s.imageUrl,
    jobs: s.jobs,
    advancement: s.advancement,
    kind: s.kind,
    baseLevel: s.baseLevel,
    ...s.battle,
  }))
