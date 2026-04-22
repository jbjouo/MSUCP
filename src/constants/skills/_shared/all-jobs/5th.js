// 全職業共通 — 5 轉 (V 矩陣世代)
//
// 所有 5 轉技能以單一主列表 ALL_JOBS_5TH_SKILLS 表達;
// V 矩陣角色以 `vmatrix` 欄位存在於 skill entry 內,不再單獨維護 VMATRIX 陣列。
//
// entry 可具備的「角色」(filter 出來才會被 consumer 讀到):
//   stats / mastery / skillLevelBonus / contribute → CP Buff 面板
//   vmatrix.passive: { type, per }                  → V 矩陣面板 + CP 屬性貢獻
//   vmatrix.skillSpecific: true / finalDmgPerLevel  → V 矩陣面板 (技能專屬 core,不貢獻 CP passive)
//   vmatrix 欄位存在 (不論是否有 passive)             → V 矩陣面板顯示
//
// kind:技能本質(passive / buff / toggle / attack / summon / link / utility)
// cp:  CP 計算機裡扮演的角色(可能與 kind 不同,例如 Will of the Alliance kind=passive 但 cp.role=toggle)

import { LOCAL_ICON } from '../helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'common')

export const ALL_JOBS_5TH_SKILLS = [
  // ── Decent Sharp Eyes — 同時是 CP Buff 與 V 矩陣 ───────────────────────
  {
    id: 'decent_sharp_eyes',
    name: 'Decent Sharp Eyes',
    nameKey: 'skills.common.decent_sharp_eyes.name',
    descriptionKey: 'skills.common.decent_sharp_eyes.description',
    icon: '/skills/decent_sharp_eyes.png',
    imageUrl: ICON('Sharp_Eyes'),
    advancement: 5,
    kind: 'buff',
    maxLevel: 1,
    masterLevel: 1,
    stats: { critRate: 10, critDmg: 8 },
    cp: { role: 'buff' },
    vmatrix: {
      kind: 'skill',
      passive: { type: 'allStat', per: 5 },
      nameKey: 'vmatrix.skills.decent_sharp_eyes',
    },
  },
  // ── Combat Orders — 純 CP Buff (decent_combat_orders 才是 VM) ─────────
  {
    id: 'combat_orders',
    name: 'Combat Orders',
    nameKey: 'skills.common.combat_orders.name',
    descriptionKey: 'skills.common.combat_orders.description',
    icon: '/skills/combat_orders.png',
    advancement: 5,
    kind: 'buff',
    mastery: 1,
    skillLevelBonus: 1,
    cp: { role: 'buff' },
  },

  // ── 純 V 矩陣技能 (只具備 vmatrix 角色) ──────────────────────────────
  {
    id: 'rope_lift',
    nameKey: 'vmatrix.skills.rope_lift',
    imageUrl: ICON('Rope_Lift'),
    advancement: 5,
    kind: 'utility',
    vmatrix: { kind: 'skill', passive: { type: 'allStat', per: 1 } },
  },
  {
    id: 'decent_mystic_door',
    nameKey: 'vmatrix.skills.decent_mystic_door',
    imageUrl: ICON('Mystic_Door'),
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill', passive: { type: 'allStat', per: 5 } },
  },
  {
    id: 'decent_hyper_body',
    nameKey: 'vmatrix.skills.decent_hyper_body',
    imageUrl: ICON('Hyper_Body'),
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill', passive: { type: 'allStat', per: 5 } },
  },
  {
    id: 'decent_combat_orders',
    nameKey: 'vmatrix.skills.decent_combat_orders',
    imageUrl: ICON('Combat_Orders'),
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill' },
  },
  {
    id: 'decent_advanced_blessing',
    nameKey: 'vmatrix.skills.decent_advanced_blessing',
    imageUrl: ICON('Decent_Advanced_Blessing'),
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill', passive: { type: 'allStat', per: 5 } },
  },
  {
    id: 'decent_speed_infusion',
    nameKey: 'vmatrix.skills.decent_speed_infusion',
    imageUrl: ICON('Decent_Speed_Infusion'),
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill', passive: { type: 'allStat', per: 5 } },
  },
  {
    id: 'blink',
    nameKey: 'vmatrix.skills.blink',
    imageUrl: ICON('Blink'),
    advancement: 5,
    kind: 'utility',
    vmatrix: { kind: 'skill', passive: { type: 'attMatk', per: 1 } },
  },
  {
    id: 'erda_nova',
    nameKey: 'vmatrix.skills.erda_nova',
    imageUrl: ICON('Erda_Nova'),
    advancement: 5,
    kind: 'attack',
    vmatrix: { kind: 'skill' },
  },
  {
    id: 'will_of_erda',
    nameKey: 'vmatrix.skills.will_of_erda',
    imageUrl: ICON('Will_of_Erda'),
    advancement: 5,
    kind: 'utility',
    vmatrix: { kind: 'skill' },
  },
  {
    id: 'decent_holy_symbol',
    nameKey: 'vmatrix.skills.decent_holy_symbol',
    imageUrl: ICON('Holy_Symbol'),
    advancement: 5,
    kind: 'buff',
    vmatrix: { kind: 'skill' },
  },
]

// ─── 子類別 (對 consumer 的相容命名 — 由 cp.role / vmatrix 欄位 filter 而來) ──
export const ALL_JOBS_5TH_TOGGLE_SKILLS  = ALL_JOBS_5TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ALL_JOBS_5TH_BUFFS          = ALL_JOBS_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ALL_JOBS_5TH_PASSIVE_SKILLS = ALL_JOBS_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
// 有 vmatrix 欄位(不論是否有 passive)表示會顯示於 V 矩陣面板
export const ALL_JOBS_5TH_VMATRIX_SKILLS = ALL_JOBS_5TH_SKILLS.filter((s) => s.vmatrix)
export const ALL_JOBS_5TH_BATTLE_BUFFS = []
