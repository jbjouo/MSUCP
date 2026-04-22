// 火毒 (Archmage Fire/Poison) — 彙整 barrel
//
// 對外輸出:
//   ARCHMAGE_FP_SKILLS              — 所有火毒技能 (0~6 轉 + hyper active)
//   ARCHMAGE_FP_SIM_SKILLS          — filter s.sim 的子集
//   ARCHMAGE_FP_PASSIVE_SKILLS      — CP SKILLS passive (cp.role === 'passive')
//   ARCHMAGE_FP_BUFFS               — CP 側欄 buff (cp.role === 'buff')
//   ARCHMAGE_FP_BATTLE_BUFFS        — 戰鬥 buff (從 battle 子物件 derive)
//   ARCHMAGE_FP_VMATRIX_SKILLS      — V 矩陣 (有 vmatrix 欄位)
//   ARCHMAGE_FP_HYPER_SKILLS        — 超技能點數配置 (passive enhancements)
//   ARCHMAGE_FP_HYPER_ACTIVE_SKILLS — Hyper Active 技能 (Inferno Aura / Megiddo / Epic Adventure)
//   ARCHMAGE_FP_LINK_SKILLS         — link skill 索引
//   ARCHMAGE_FP_ALL_BY_ADVANCEMENT  — 以轉數分組的總表

import { ARCHMAGE_FP_0TH_LINK_SKILLS } from './0th.js'
import { ARCHMAGE_FP_1ST_SKILLS } from './1st.js'
import {
  ARCHMAGE_FP_2ND_SKILLS,
  IGNITE,
} from './2nd.js'
import {
  ARCHMAGE_FP_3RD_SKILLS,
  POISON_MIST,
  TELEPORT_MASTERY,
  BURNING_MAGIC,
} from './3rd.js'
import {
  ARCHMAGE_FP_4TH_SKILLS,
  FLAME_SWEEP,
  FLAME_HAZE,
  MIST_ERUPTION,
  IFRIT,
  METEOR_SHOWER,
} from './4th.js'
import { ARCHMAGE_FP_5TH_SKILLS } from './5th.js'
import { ARCHMAGE_FP_6TH_SKILLS } from './6th.js'
import {
  ARCHMAGE_FP_HYPER_SKILLS,         // 9 支 enhancement (5 點配點)
  ARCHMAGE_FP_HYPER_ACTIVE_SKILLS,   // 3 支 active (Inferno Aura / Megiddo / Epic Adventure)
  INFERNO_AURA,
} from './hyper.js'

// ─── 所有火毒技能 — 1~6 + hyper-active 單一主列表 ──────────────────────────
export const ARCHMAGE_FP_SKILLS = [
  ...ARCHMAGE_FP_1ST_SKILLS,
  ...ARCHMAGE_FP_2ND_SKILLS,
  ...ARCHMAGE_FP_3RD_SKILLS,
  ...ARCHMAGE_FP_4TH_SKILLS,
  ...ARCHMAGE_FP_5TH_SKILLS,
  ...ARCHMAGE_FP_6TH_SKILLS,
  ...ARCHMAGE_FP_HYPER_ACTIVE_SKILLS,
]

// 子分類 — 從主列表 filter derive
export const ARCHMAGE_FP_SIM_SKILLS     = ARCHMAGE_FP_SKILLS.filter((s) => s.sim)
export const ARCHMAGE_FP_PASSIVE_SKILLS = ARCHMAGE_FP_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ARCHMAGE_FP_BUFFS          = ARCHMAGE_FP_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ARCHMAGE_FP_VMATRIX_SKILLS = ARCHMAGE_FP_SKILLS.filter((s) => s.vmatrix)

// Battle Buff — 從 skill.battle 子物件 derive
export const ARCHMAGE_FP_BATTLE_BUFFS = ARCHMAGE_FP_SKILLS
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

export { ARCHMAGE_FP_HYPER_SKILLS, ARCHMAGE_FP_HYPER_ACTIVE_SKILLS }

export const ARCHMAGE_FP_LINK_SKILLS = ARCHMAGE_FP_0TH_LINK_SKILLS

// 以轉數分組的總表 (UI 用)
export const ARCHMAGE_FP_ALL_BY_ADVANCEMENT = {
  0: { skills: [], link: ARCHMAGE_FP_0TH_LINK_SKILLS },
  1: { skills: ARCHMAGE_FP_1ST_SKILLS },
  2: { skills: ARCHMAGE_FP_2ND_SKILLS },
  3: { skills: ARCHMAGE_FP_3RD_SKILLS },
  4: { skills: ARCHMAGE_FP_4TH_SKILLS },
  5: { skills: ARCHMAGE_FP_5TH_SKILLS },
  6: { skills: ARCHMAGE_FP_6TH_SKILLS },
  hyper: ARCHMAGE_FP_HYPER_SKILLS,
  hyperActive: ARCHMAGE_FP_HYPER_ACTIVE_SKILLS,
}

// 單支技能常數 re-export (相容原 archmageFP.js)
export {
  FLAME_SWEEP,
  FLAME_HAZE,
  MIST_ERUPTION,
  POISON_MIST,
  INFERNO_AURA,
  IFRIT,
  TELEPORT_MASTERY,
  METEOR_SHOWER,
  IGNITE,
  BURNING_MAGIC,
}
