// 火毒 — 2 轉技能
//
// wiki 分類:
//   Flame Orb / Poison Breath / Meditation / Agile Magic / Ignite /
//   Spell Mastery / High Wisdom / MP Eater / Elemental Drain
//
// 本檔:
//   - IGNITE 從舊 5 轉檔搬移過來,保留所有既有數值(含 sim / vmatrix core)
//   - 其他舊 3/5 轉技能(agile_magic / meditation / high_wisdom)也搬到本檔
//   - 新增 flame_orb / poison_breath / mp_eater / elemental_drain 骨架
//
// Teleport Mastery 在 3 轉(見 3rd.js)。

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-fp')

// ─── Ignite (從原 5 轉搬入,advancement 改為 2,其他不動) ───────────────────
// passive (master Lv10);不進 sim 排程,由施放火屬技能時 proc 生成火牆。
export const IGNITE = {
  id: 'ignite',
  name: 'Ignite',
  nameKey: 'skills.archmageFP.ignite.name',
  descriptionKey: 'skills.archmageFP.ignite.description',
  imageUrl: ICON('Ignite'),
  color: '#ff6a2a',
  jobs: ['archmageFP'],
  advancement: 2,
  kind: 'passive',
  element: 'fire',
  baseLevel: 10,
  maxEnemies: 8,
  ignite: {
    procRate: { base: 50, perLevel: 4 },
    damage:   { base: 40, perLevel: 1 },
    tickIntervalSec: 2,
    durationSec: 6,
    hitsPerTick: 3,
  },
  vmatrix: {
    kind: 'boost',
    maxLevel: 60,
    finalDmgPerLevel: 4,
    ignoreDefBonus: { threshold: 40, value: 20 },
    descriptionKey: 'vmatrix.skills.ignite_core.description',
  },
  sim: {
    role: 'passive',
  },
}

// ─── 2 轉所有火毒技能 ───────────────────────────────────────────────────────
export const ARCHMAGE_FP_2ND_SKILLS = [
  // 攻擊技能(骨架,數值待補)
  {
    id: 'flame_orb',
    name: 'Flame Orb',
    nameKey: 'skills.archmageFP.flame_orb.name',
    descriptionKey: 'skills.archmageFP.flame_orb.description',
    imageUrl: ICON('Flame_Orb'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'attack',
    element: 'fire',
    vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  },
  {
    id: 'poison_breath',
    name: 'Poison Breath',
    nameKey: 'skills.archmageFP.poison_breath.name',
    descriptionKey: 'skills.archmageFP.poison_breath.description',
    imageUrl: ICON('Poison_Breath'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'attack',
    element: 'poison',
    vmatrix: { kind: 'boost', maxLevel: 60, finalDmgPerLevel: 2, ignoreDefBonus: { threshold: 40, value: 20 } },
  },
  // Ignite 主動 toggle / 火牆 passive(既有資料)
  IGNITE,
  // Buff
  {
    id: 'meditation',
    name: 'Meditation',
    nameKey: 'skills.archmageFP.meditation.name',
    descriptionKey: 'skills.archmageFP.meditation.description',
    icon: '/skills/meditation.png',
    imageUrl: ICON('Meditation'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'buff',
    stats: { matk: 30 },
    cp: { role: 'buff' },
  },
  // Passive
  {
    id: 'spell_mastery',
    name: 'Spell Mastery',
    imageUrl: ICON('Spell_Mastery'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'passive',
    stats: { matk: 10, critRate: 5 },
    cp: { role: 'passive' },
  },
  {
    id: 'high_wisdom',
    name: 'High Wisdom',
    imageUrl: ICON('High_Wisdom'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 40 },
    cp: { role: 'passive' },
  },
  {
    id: 'agile_magic',
    name: 'Agile Magic',
    imageUrl: ICON('Agile_Magic_(Magician)'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'passive',
    stats: { int: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'mp_eater',
    name: 'MP Eater',
    nameKey: 'skills.archmageFP.mp_eater.name',
    descriptionKey: 'skills.archmageFP.mp_eater.description',
    imageUrl: ICON('MP_Eater'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'passive',
  },
  {
    id: 'elemental_drain',
    name: 'Elemental Drain',
    nameKey: 'skills.archmageFP.elemental_drain.name',
    descriptionKey: 'skills.archmageFP.elemental_drain.description',
    imageUrl: ICON('Elemental_Drain'),
    jobs: ['archmageFP'],
    advancement: 2,
    kind: 'passive',
  },
]

// 子分類 — 全部從主列表 filter derive
export const ARCHMAGE_FP_2ND_SIM_SKILLS     = ARCHMAGE_FP_2ND_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_2ND_TOGGLE_SKILLS  = ARCHMAGE_FP_2ND_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ARCHMAGE_FP_2ND_BUFFS          = ARCHMAGE_FP_2ND_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_2ND_PASSIVE_SKILLS = ARCHMAGE_FP_2ND_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_2ND_VMATRIX_SKILLS = ARCHMAGE_FP_2ND_SKILLS.filter((s) => s.vmatrix)
export const ARCHMAGE_FP_2ND_BATTLE_BUFFS   = ARCHMAGE_FP_2ND_SKILLS.filter((s) => s.battle)
