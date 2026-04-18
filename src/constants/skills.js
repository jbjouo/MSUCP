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
// 兩類用法:
//   1. 共通開關型 (passive: 否/省略 + stats):顯示在側欄,可切換
//   2. 自動職業技能 (passive: true + jobs + contribute):符合條件就生效,不顯示開關

export const SKILLS = [
  {
    id: 'will_of_the_alliance',
    name: 'Will of the Alliance',
    icon: '/skills/will_of_the_alliance.png',
    stats: {
      str: 5, dex: 5, int: 5, luk: 5,
      atk: 5, matk: 5,
    },
  },
  // 精靈的祝福 / 女皇的祝福 — 兩者互斥,同群組 'blessing' 內只能啟用一個
  {
    id: 'blessing_of_the_fairy',
    name: 'Blessing of the Fairy',
    icon: '/skills/blessing_of_the_fairy.png',
    group: 'blessing',
    stats: { atk: 20, matk: 20 },
  },
  {
    id: 'empress_blessing',
    name: "Empress's Blessing",
    icon: '/skills/empress_blessing.png',
    group: 'blessing',
    stats: { atk: 30, matk: 30 },
  },
  {
    id: 'mp_boost',
    name: 'MP Boost',
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    passive: true,
    contribute(ctx) {
      // 持有 Wand 時 +5% Critical Rate;Staff 不生效
      if (ctx.weaponSubType === 'wand') return { critRate: 5 }
      return null
    },
  },
  // ─── 火毒大魔導士 被動 ───
  {
    id: 'high_wisdom',
    name: 'High Wisdom',
    jobs: ['archmageFP'],
    passive: true,
    stats: { int: 40 },
  },
  {
    id: 'spell_mastery',
    name: 'Spell Mastery',
    jobs: ['archmageFP'],
    passive: true,
    stats: { matk: 10, critRate: 5 },
  },
  {
    id: 'agile_magic',
    name: 'Agile Magic',
    jobs: ['archmageFP'],
    passive: true,
    stats: { int: 20 },
  },
  {
    id: 'arcane_overdrive',
    name: 'Arcane Overdrive',
    jobs: ['archmageFP'],
    passive: true,
    stats: { critRate: 30, critDmg: 13 },
  },
  {
    id: 'element_amplification',
    name: 'Element Amplification',
    jobs: ['archmageFP'],
    passive: true,
    stats: { dmgPct: 50 },
  },
  {
    id: 'elemental_decrease',
    name: 'Elemental Decrease',
    jobs: ['archmageFP'],
    passive: true,
    stats: { finalDmg: 40 },
  },
  {
    id: 'arcane_aim',
    name: 'Arcane Aim',
    jobs: ['archmageFP'],
    passive: true,
    baseLevel: 30,
    contribute(ctx) {
      const lv = (this.baseLevel || 30) + (ctx.skillLevelBonus || 0)
      // Lv30: ignoreDef +20%;每升 1 級 +1%
      return { ignoreDef: 20 + (lv - 30) }
    },
  },
  {
    id: 'buff_mastery',
    name: 'Buff Mastery',
    jobs: ['archmageFP'],
    passive: true,
    // 技能基礎 Lv30;Combat Orders 開啟時 → Lv31
    baseLevel: 30,
    contribute(ctx) {
      const lv = (this.baseLevel || 30) + (ctx.skillLevelBonus || 0)
      // Lv30: matk +30 / buffDuration +50%;每升 1 級 matk +3、buffDuration +5%
      const extra = lv - 30
      return {
        matk: 30 + extra * 3,
        buffDuration: 50 + extra * 5,
      }
    },
  },
]

export const SKILLS_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]))
