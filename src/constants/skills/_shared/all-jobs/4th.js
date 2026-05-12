// 全職業共通 — 4 轉
// Maple Warrior — 主屬 AP × X% 的可開關 buff

import { LOCAL_ICON, ASSET } from '../helpers.js'

export const ALL_JOBS_4TH_SKILLS = [
  {
    id: 'maple_warrior',
    name: 'Maple Warrior',
    nameKey: 'skills.common.maple_warrior.name',
    descriptionKey: 'skills.common.maple_warrior.description',
    icon: ASSET('skills/maple_warrior.png'),
    imageUrl: LOCAL_ICON('Maple_Warrior', 'common'),
    advancement: 4,
    kind: 'buff',
    baseLevel: 30,
    // 依 AP 配點的主屬性 × X%;Lv30 = 15%,Combat Orders +1 → 16%
    contribute(ctx) {
      const lv = ctx.effectiveLevel
      const pct = Math.max(0, 15 + (lv - 30))
      const ap = ctx.baseStats[ctx.primary] || 0
      const bonus = Math.floor(ap * pct / 100)
      if (!bonus) return []
      const label = ctx.t
        ? ctx.t('cp.buffs.mapleWarriorLabel', { name: this.name, lv, pct })
        : `Buff: ${this.name} (Lv ${lv}, +${pct}% AP)`
      return [{ key: ctx.primary, label, value: bonus }]
    },
    cp: { role: 'buff' },
  },
]

export const ALL_JOBS_4TH_TOGGLE_SKILLS = ALL_JOBS_4TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ALL_JOBS_4TH_BUFFS         = ALL_JOBS_4TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ALL_JOBS_4TH_PASSIVE_SKILLS = ALL_JOBS_4TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ALL_JOBS_4TH_VMATRIX_SKILLS = ALL_JOBS_4TH_SKILLS.filter((s) => s.vmatrix)
export const ALL_JOBS_4TH_BATTLE_BUFFS = []
