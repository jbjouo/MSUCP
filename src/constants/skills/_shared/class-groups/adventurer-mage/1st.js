// 冒險家法師共通 — 1 轉
// MP Boost — 持 Wand 時 +5% 爆擊率(職業自動生效)

export const ADVENTURER_MAGE_1ST_SKILLS = [
  {
    id: 'mp_boost',
    name: 'MP Boost',
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    advancement: 1,
    kind: 'passive',
    contribute(ctx) {
      // 持有 Wand 時 +5% Critical Rate;Staff 不生效
      if (ctx.weaponSubType === 'wand') return { critRate: 5 }
      return null
    },
    cp: { role: 'passive' },
  },
]

export const ADVENTURER_MAGE_1ST_TOGGLE_SKILLS  = ADVENTURER_MAGE_1ST_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ADVENTURER_MAGE_1ST_BUFFS          = ADVENTURER_MAGE_1ST_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ADVENTURER_MAGE_1ST_PASSIVE_SKILLS = ADVENTURER_MAGE_1ST_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ADVENTURER_MAGE_1ST_VMATRIX_SKILLS = ADVENTURER_MAGE_1ST_SKILLS.filter((s) => s.vmatrix)
export const ADVENTURER_MAGE_1ST_BATTLE_BUFFS = []
