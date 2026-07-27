// Bishop — 4 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'bishop')

// ─── Angel Ray (主力填充技,skillId 2321007) ────────────────────────────────
// 聖屬單體 14 擊,鎖定最高 Max HP 目標;無 CD。
// API 實值:Lv30 = 225%、Lv29 = 220% → +5%/lv (master 30)
// 命中對敵方上 debuff:隊伍終傷 +2%/層,20 秒,疊 5 層 (對單模擬 = 自身終傷,滿層 +10%)
//   → battle procOnHit buff,procFromSkillIds 限定僅 Angel Ray 施放時疊層
//   同 buff 層數相加後轉單一乘區 (5 層 = ×1.10),再與其他終傷來源相乘 (currentBonuses 既有規則)
// 回復隊伍 10% Max HP — 不影響輸出,不建模。
export const ANGEL_RAY = {
  id: 'angel_ray',
  name: 'Angel Ray',
  nameKey: 'skills.bishop.angel_ray.name',
  descriptionKey: 'skills.bishop.angel_ray.description',
  imageUrl: ICON('Angel_Ray'),
  color: '#ffe27a',
  jobs: ['bishop'],
  advancement: 4,
  kind: 'attack',
  element: 'holy',
  baseLevel: 30,
  mpCost: 56,
  maxEnemies: 1,
  hitsPerCast: 14,
  damage: { base: 225, perLevel: 5 },   // Lv30 = 225% (API) · Lv29 = 220%
  // Angel Ray Boost (V 矩陣強化核心) — 與火毒 4 轉 boost core 同形狀
  vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  // 命中 debuff — 隊伍終傷 +2%/層 × 5 層 × 20s (對單 = 自身);僅 Angel Ray 施放時 roll
  battle: {
    source: 'passive',
    passiveType: 'procOnHit',
    procFromSkillIds: ['angel_ray'],
    procRate: 100,
    maxStacks: 5,
    durationSec: 20,
    perStackFinalDmgPct: 2,
  },
  sim: {
    role: 'attack',
    castDelayBySpeed: { 7: 690, 8: 630 },   // 攻速 8 實測 630ms;7 階依慣例 +60ms 推估
    priority: 10,                            // 填充技 — 其他技能就緒時讓位
  },
}

// ─── 4 轉所有主教技能 (SIM / passive / battle buff 全合在一個主列表) ─────────
export const BISHOP_4TH_SKILLS = [
  ANGEL_RAY,
  {
    id: 'buff_mastery_bishop',
    name: 'Buff Mastery',
    imageUrl: ICON('Buff_Mastery'),
    jobs: ['bishop'],
    advancement: 4,
    kind: 'passive',
    stats: { buffDuration: 50 },
    cp: { role: 'passive' },
  },
]

export const BISHOP_4TH_SIM_SKILLS     = BISHOP_4TH_SKILLS.filter((s) => s.sim)
export const BISHOP_4TH_PASSIVE_SKILLS = BISHOP_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const BISHOP_4TH_BUFFS          = BISHOP_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const BISHOP_4TH_VMATRIX_SKILLS = BISHOP_4TH_SKILLS.filter((s) => s.vmatrix)

// Battle Buff 從技能的 battle 子物件 derive — entry 合併技能 id/name/img + battle 參數
export const BISHOP_4TH_BATTLE_BUFFS = BISHOP_4TH_SKILLS
  .filter((s) => s.battle)
  .map((s) => ({
    id: s.id,
    nameKey: s.nameKey,
    descriptionKey: s.descriptionKey,
    imageUrl: s.imageUrl,
    jobs: s.jobs,
    advancement: s.advancement,
    kind: s.kind,
    ...s.battle,
  }))
