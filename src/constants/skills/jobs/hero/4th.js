// 英雄 — 4 轉技能
//
// 資料來源:scripts/skill-db/hero/4th.json(Lv1~30 逐級查 API 驗證公式)
// 共用層已涵蓋:Maple Warrior(all-jobs)
// 不收錄:Power Stance / Hero's Will / Magic Crash / 攻擊技(Raging Blow / Puncture)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (id) => LOCAL_ICON(id, 'hero')

// Advanced Combo:每顆終傷 5 + ceil(lv/6)%、鬥氣上限 5 + floor(lv/6)(Lv30 = 10%×10 顆;Lv31 = 11%×10 顆,實測)
const comboOrbs = (lv) => 5 + Math.floor(lv / 6)
const comboFdPerOrb = (lv) => 5 + Math.ceil(lv / 6)

export const HERO_4TH_SKILLS = [
  {
    id: 'hero_combat_mastery',
    name: 'Combat Mastery',
    imageUrl: ICON(1120012),
    jobs: ['hero'],
    advancement: 4,
    kind: 'passive',
    // 無視防禦 20 + lv(Lv30 = 50%)
    contribute(ctx) {
      return { ignoreDef: 50 + (ctx.skillLevelBonus || 0) }
    },
    cp: { role: 'passive' },
  },
  {
    id: 'hero_advanced_final_attack',
    name: 'Advanced Final Attack',
    imageUrl: ICON(1120013),
    jobs: ['hero'],
    advancement: 4,
    kind: 'passive',
    // ATT + lv(追打機率 / 傷害不收)
    // Hyper「Advanced Final Attack - Ferocity」:ATT +20
    contribute(ctx) {
      const ferocity = ctx.hasHyper?.('hero_afa_ferocity') ? 20 : 0
      return { atk: 30 + (ctx.skillLevelBonus || 0) + ferocity }
    },
    cp: { role: 'passive' },
  },
  // ── Combo Attack(2 轉開關)— 以鬥氣全滿計;顆數 / 每顆終傷由 Advanced Combo(4 轉)決定,吃 Combat Orders ──
  {
    id: 'hero_combo_attack',
    name: 'Combo Attack',
    icon: ICON(1101013),
    imageUrl: ICON(1101013),
    jobs: ['hero'],
    advancement: 4,
    kind: 'buff',
    baseLevel: 30,
    // 每顆 ATT +2(Combo Attack)、終傷 per orb(Advanced Combo,各顆相加)
    // Hyper:Reinforce 每顆終傷 +2%、Boss Rush 每顆首領傷害 +2%
    contribute(ctx) {
      const lv = ctx.effectiveLevel
      const orbs = comboOrbs(lv)
      const fdPerOrb = comboFdPerOrb(lv) + (ctx.hasHyper?.('hero_combo_reinforce') ? 2 : 0)
      const label = ctx.t ? ctx.t('cp.tip.buffPrefix', { name: `${this.name} (${orbs})` }) : this.name
      const out = [
        { key: 'atk', label, value: 2 * orbs },
        { key: 'finalDmg', label, value: fdPerOrb * orbs, isPct: true },
      ]
      if (ctx.hasHyper?.('hero_combo_boss_rush')) out.push({ key: 'bossDmg', label, value: 2 * orbs, isPct: true })
      return out
    },
    cp: { role: 'buff' },
  },
  {
    id: 'hero_enrage',
    name: 'Enrage',
    icon: ICON(1121010),
    imageUrl: ICON(1121010),
    jobs: ['hero'],
    advancement: 4,
    kind: 'buff',
    baseLevel: 30,
    // 終傷 10 + floor(lv/2)、爆傷 10 + floor(lv/3)(Lv30 = 25% / 20%)
    contribute(ctx) {
      const lv = ctx.effectiveLevel
      const label = ctx.t ? ctx.t('cp.tip.buffPrefix', { name: this.name }) : this.name
      return [
        { key: 'finalDmg', label, value: 10 + Math.floor(lv / 2), isPct: true },
        { key: 'critDmg', label, value: 10 + Math.floor(lv / 3), isPct: true },
      ]
    },
    cp: { role: 'buff' },
  },
]

export const HERO_4TH_SIM_SKILLS     = HERO_4TH_SKILLS.filter((s) => s.sim)
export const HERO_4TH_PASSIVE_SKILLS = HERO_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const HERO_4TH_BUFFS          = HERO_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const HERO_4TH_BATTLE_BUFFS   = HERO_4TH_SKILLS.filter((s) => s.battle)
export const HERO_4TH_VMATRIX_SKILLS = HERO_4TH_SKILLS.filter((s) => s.vmatrix)
