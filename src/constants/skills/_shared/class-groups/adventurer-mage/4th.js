// 冒險家法師共通 — 4 轉
// Arcane Aim — 同時是 CP 自動 passive (ignoreDef) + 戰鬥 buff (層數 Damage)
//
// 技能本體描述一次,各系統角色透過子物件表達:
//   cp:     { role: 'passive' }   → CP 自動 passive (20% 無視防禦)
//   battle: { ... }                → 戰鬥模擬用的層數 buff (perStackDamagePct 等)

import { LOCAL_ICON } from '../../helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'common')

export const ADVENTURER_MAGE_4TH_SKILLS = [
  {
    id: 'arcane_aim',
    name: 'Arcane Aim',
    nameKey: 'battleBuffs.arcane_aim.name',
    descriptionKey: 'battleBuffs.arcane_aim.description',
    imageUrl: ICON('Arcane_Aim'),
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    advancement: 4,
    kind: 'passive',
    baseLevel: 30,
    // Lv30: ignoreDef +20%;每升 1 級 +1% (動態貢獻保留在 skill 本體)
    contribute(ctx) {
      const lv = (this.baseLevel || 30) + (ctx.skillLevelBonus || 0)
      return { ignoreDef: 20 + (lv - 30) }
    },
    cp: { role: 'passive' },
    // 戰鬥模擬層數 buff — 每次攻擊 100% 疊 1 層,max 5 層,5s 刷新,每層 +8% Damage
    battle: {
      source: 'passive',
      passiveType: 'procOnHit',
      procRate: 100,
      maxStacks: 5,
      durationSec: 5,
      perStackDamagePct: 8,
    },
  },
]

// 子分類:CP passive / Battle Buff 各自 filter derive
export const ADVENTURER_MAGE_4TH_TOGGLE_SKILLS  = ADVENTURER_MAGE_4TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ADVENTURER_MAGE_4TH_BUFFS          = ADVENTURER_MAGE_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ADVENTURER_MAGE_4TH_PASSIVE_SKILLS = ADVENTURER_MAGE_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ADVENTURER_MAGE_4TH_VMATRIX_SKILLS = ADVENTURER_MAGE_4TH_SKILLS.filter((s) => s.vmatrix)

// Battle Buff 從技能的 battle 子物件 derive — entry 合併技能 id/name/img + battle 參數
export const ADVENTURER_MAGE_4TH_BATTLE_BUFFS = ADVENTURER_MAGE_4TH_SKILLS
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
