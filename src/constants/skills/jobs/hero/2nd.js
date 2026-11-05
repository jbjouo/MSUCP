// 英雄 — 2 轉技能
//
// 資料來源:scripts/skill-db/hero/2nd.json
// 不收錄:Final Attack / Brandish / Flash Blade(攻擊技,未列入戰鬥模擬)
// Combo Attack(鬥氣)數值由 4 轉 Advanced Combo 決定 → 定義於 4th.js

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (id) => LOCAL_ICON(id, 'hero')

export const HERO_2ND_SKILLS = [
  {
    id: 'hero_weapon_mastery',
    name: 'Weapon Mastery',
    imageUrl: ICON(1100000),
    jobs: ['hero'],
    advancement: 2,
    kind: 'passive',
    // 終傷 +10%、爆擊率 +15%;裝備斧(單手 / 雙手)時另 Damage +5%(熟練度、攻速不收)
    contribute(ctx) {
      const bag = { finalDmg: 10, critRate: 15 }
      if (/axe/.test(ctx.weaponSubType || '')) bag.dmgPct = 5
      return bag
    },
    cp: { role: 'passive' },
  },
  {
    id: 'hero_physical_training',
    name: 'Physical Training',
    imageUrl: ICON(1100009),
    jobs: ['hero'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 30, dex: 30 },
    cp: { role: 'passive' },
  },
  {
    id: 'hero_agile_arms',
    name: 'Agile Arms',
    imageUrl: ICON(1100015),
    jobs: ['hero'],
    advancement: 2,
    kind: 'passive',
    stats: { str: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'hero_spirit_blade',
    name: 'Spirit Blade',
    icon: ICON(1101006),
    imageUrl: ICON(1101006),
    jobs: ['hero'],
    advancement: 2,
    kind: 'buff',
    stats: { atk: 30 },
    cp: { role: 'buff' },
  },
]

export const HERO_2ND_SIM_SKILLS     = HERO_2ND_SKILLS.filter((s) => s.sim)
export const HERO_2ND_PASSIVE_SKILLS = HERO_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const HERO_2ND_BUFFS          = HERO_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const HERO_2ND_BATTLE_BUFFS   = HERO_2ND_SKILLS.filter((s) => s.battle)
export const HERO_2ND_VMATRIX_SKILLS = HERO_2ND_SKILLS.filter((s) => s.vmatrix)
