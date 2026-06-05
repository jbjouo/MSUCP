// 職業技能總匯 barrel
// 新增職業時在此 import + push,上層 skills/index.js 會自動彙整。

export * from './archmage-fp/index.js'
export * from './bishop/index.js'
export * from './shadower/index.js'

import {
  ARCHMAGE_FP_SKILLS,
  ARCHMAGE_FP_SIM_SKILLS,
  ARCHMAGE_FP_PASSIVE_SKILLS,
  ARCHMAGE_FP_BUFFS,
  ARCHMAGE_FP_BATTLE_BUFFS,
  ARCHMAGE_FP_VMATRIX_SKILLS,
  ARCHMAGE_FP_HYPER_SKILLS,
  ARCHMAGE_FP_LINK_SKILLS,
} from './archmage-fp/index.js'

import {
  BISHOP_SKILLS,
  BISHOP_SIM_SKILLS,
  BISHOP_PASSIVE_SKILLS,
  BISHOP_BUFFS,
  BISHOP_BATTLE_BUFFS,
  BISHOP_VMATRIX_SKILLS,
  BISHOP_HYPER_SKILLS_ALL,
  BISHOP_LINK_SKILLS,
} from './bishop/index.js'

import {
  SHADOWER_SKILLS,
  SHADOWER_SIM_SKILLS,
  SHADOWER_PASSIVE_SKILLS,
  SHADOWER_BUFFS,
  SHADOWER_BATTLE_BUFFS,
  SHADOWER_VMATRIX_SKILLS,
  SHADOWER_HYPER_SKILLS_ALL,
  SHADOWER_LINK_SKILLS,
} from './shadower/index.js'

// 每個職業一筆 entry;新增職業時在此 push。
// all:該職業 0~6 轉的全部技能(主列表);各系統子集從 all filter 得,這裡僅沿用命名習慣。
export const JOB_SKILL_REGISTRY = [
  {
    jobKey: 'archmageFP',
    branchKey: 'magician',
    all: ARCHMAGE_FP_SKILLS,
    sim: ARCHMAGE_FP_SIM_SKILLS,
    passive: ARCHMAGE_FP_PASSIVE_SKILLS,
    buffs: ARCHMAGE_FP_BUFFS,
    battleBuffs: ARCHMAGE_FP_BATTLE_BUFFS,
    vmatrix: ARCHMAGE_FP_VMATRIX_SKILLS,
    hyper: ARCHMAGE_FP_HYPER_SKILLS,
    link: ARCHMAGE_FP_LINK_SKILLS,
  },
  {
    jobKey: 'bishop',
    branchKey: 'magician',
    all: BISHOP_SKILLS,
    sim: BISHOP_SIM_SKILLS,
    passive: BISHOP_PASSIVE_SKILLS,
    buffs: BISHOP_BUFFS,
    battleBuffs: BISHOP_BATTLE_BUFFS,
    vmatrix: BISHOP_VMATRIX_SKILLS,
    hyper: BISHOP_HYPER_SKILLS_ALL,
    link: BISHOP_LINK_SKILLS,
  },
  {
    jobKey: 'shadower',
    branchKey: 'thief',
    all: SHADOWER_SKILLS,
    sim: SHADOWER_SIM_SKILLS,
    passive: SHADOWER_PASSIVE_SKILLS,
    buffs: SHADOWER_BUFFS,
    battleBuffs: SHADOWER_BATTLE_BUFFS,
    vmatrix: SHADOWER_VMATRIX_SKILLS,
    hyper: SHADOWER_HYPER_SKILLS_ALL,
    link: SHADOWER_LINK_SKILLS,
  },
]

// 跨職業總合 — 直接餵給頂層 barrel 的命名 export
export const ALL_JOBS_ALL_SKILLS        = JOB_SKILL_REGISTRY.flatMap((j) => j.all)
export const ALL_JOBS_SIM_SKILLS        = JOB_SKILL_REGISTRY.flatMap((j) => j.sim)
export const ALL_JOBS_PASSIVE_SKILLS    = JOB_SKILL_REGISTRY.flatMap((j) => j.passive)
export const ALL_JOBS_JOB_BUFFS         = JOB_SKILL_REGISTRY.flatMap((j) => j.buffs)
export const ALL_JOBS_JOB_BATTLE_BUFFS  = JOB_SKILL_REGISTRY.flatMap((j) => j.battleBuffs)
export const ALL_JOBS_JOB_VMATRIX       = JOB_SKILL_REGISTRY.flatMap((j) => j.vmatrix)
export const ALL_JOBS_HYPER_SKILLS      = JOB_SKILL_REGISTRY.flatMap((j) => j.hyper)
export const ALL_JOBS_LINK_SKILLS       = JOB_SKILL_REGISTRY.flatMap((j) => j.link)
