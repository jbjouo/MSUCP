// 英雄 — 3 轉技能
//
// 資料來源:scripts/skill-db/hero/3rd.json
// Chance Attack 的「對刺穿怪物終傷 +25%」為條件型,不收(只收常駐爆擊率)
// Combo Synergy(每顆鬥氣終傷 5%)由 4 轉 Advanced Combo 取代 → Combo Attack buff(4th.js)
// 不收錄:Self Recovery / Endure / Scarring Sword(怪物 debuff)/ 攻擊技

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (id) => LOCAL_ICON(id, 'hero')

export const HERO_3RD_SKILLS = [
  {
    id: 'hero_chance_attack',
    name: 'Chance Attack',
    imageUrl: ICON(1110009),
    jobs: ['hero'],
    advancement: 3,
    kind: 'passive',
    stats: { critRate: 20 },
    cp: { role: 'passive' },
  },
]

export const HERO_3RD_SIM_SKILLS     = HERO_3RD_SKILLS.filter((s) => s.sim)
export const HERO_3RD_PASSIVE_SKILLS = HERO_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const HERO_3RD_BUFFS          = HERO_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const HERO_3RD_BATTLE_BUFFS   = HERO_3RD_SKILLS.filter((s) => s.battle)
export const HERO_3RD_VMATRIX_SKILLS = HERO_3RD_SKILLS.filter((s) => s.vmatrix)
