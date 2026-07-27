// 冒險家法師共通 — 4 轉
// Arcane Aim — 同時是 CP 自動 passive (ignoreDef) + 戰鬥 buff (層數 Damage)
//
// 技能本體描述一次,各系統角色透過子物件表達:
//   cp:     { role: 'passive' }   → CP 自動 passive (20% 無視防禦)
//   battle: { ... }                → 戰鬥模擬用的層數 buff (perStackDamagePct 等)

import { LOCAL_ICON } from '../../helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'common')

export const ADVENTURER_MAGE_4TH_SKILLS = [
  // Infinity (魔力無限) — 冒險家法師共通 activeToggle buff
  //   啟動 40s+1s/lv,基礎終傷 +70%+1%/lv,固定每 6 秒 +3% (tick 遞增,詳見 useBattleBuffs)
  //   CD 180s (不吃 CD 重置);Unreliable Memory 以 mirror: 'infinity' 複製本設定
  //   原位於 archmage-fp/4th.js,主教接入戰鬥模擬時移入共用層 (id / 數值不變)
  {
    id: 'infinity',
    nameKey: 'battleBuffs.infinity.name',
    descriptionKey: 'battleBuffs.infinity.description',
    imageUrl: ICON('Infinity'),
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    advancement: 4,
    kind: 'buff',
    baseLevel: 30,
    cooldownSec: 180,
    battle: {
      source: 'activeToggle',
      base: {
        durationSec: 40,
        baseFinalDmgPct: 70,
        tickIntervalSec: 6,
        tickIncreasePct: 3,
      },
      perLevelBonus: { durationSec: 1, baseFinalDmgPct: 1 },
      cooldownSec: 180,
      cooldownIgnoresReset: true,
      initialDelayBySpeed: { 7: 500, 8: 450 },
      skipWhileActive: ['unreliable_memory'],
    },
  },
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
    baseLevel: s.baseLevel,
    ...s.battle,
  }))
