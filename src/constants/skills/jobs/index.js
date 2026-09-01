// 職業技能總匯 barrel
// 新增職業時在此 import + push,上層 skills/index.js 會自動彙整。

export * from './archmage-fp/index.js'
export * from './bishop/index.js'
export * from './buccaneer/index.js'
export * from './dark-knight/index.js'
export * from './luminous/index.js'
export * from './night-walker/index.js'
export * from './shadower/index.js'
export * from './wind-archer/index.js'

import {
  ARCHMAGE_FP_SKILLS,
  ARCHMAGE_FP_SIM_SKILLS,
  ARCHMAGE_FP_PASSIVE_SKILLS,
  ARCHMAGE_FP_BUFFS,
  ARCHMAGE_FP_BATTLE_BUFFS,
  ARCHMAGE_FP_VMATRIX_SKILLS,
  ARCHMAGE_FP_HYPER_SKILLS,
  ARCHMAGE_FP_LINK_SKILLS,
  ARCHMAGE_FP_MECHANICS,
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
  NIGHT_WALKER_SKILLS,
  NIGHT_WALKER_SIM_SKILLS,
  NIGHT_WALKER_PASSIVE_SKILLS,
  NIGHT_WALKER_BUFFS,
  NIGHT_WALKER_BATTLE_BUFFS,
  NIGHT_WALKER_VMATRIX_SKILLS,
  NIGHT_WALKER_HYPER_SKILLS_ALL,
  NIGHT_WALKER_LINK_SKILLS,
} from './night-walker/index.js'

import {
  BUCCANEER_SKILLS,
  BUCCANEER_SIM_SKILLS,
  BUCCANEER_PASSIVE_SKILLS,
  BUCCANEER_BUFFS,
  BUCCANEER_BATTLE_BUFFS,
  BUCCANEER_VMATRIX_SKILLS,
  BUCCANEER_HYPER_SKILLS_ALL,
  BUCCANEER_LINK_SKILLS,
} from './buccaneer/index.js'

import {
  DARK_KNIGHT_SKILLS,
  DARK_KNIGHT_SIM_SKILLS,
  DARK_KNIGHT_PASSIVE_SKILLS,
  DARK_KNIGHT_BUFFS,
  DARK_KNIGHT_BATTLE_BUFFS,
  DARK_KNIGHT_VMATRIX_SKILLS,
  DARK_KNIGHT_HYPER_SKILLS_ALL,
  DARK_KNIGHT_LINK_SKILLS,
} from './dark-knight/index.js'

import {
  LUMINOUS_SKILLS,
  LUMINOUS_SIM_SKILLS,
  LUMINOUS_PASSIVE_SKILLS,
  LUMINOUS_BUFFS,
  LUMINOUS_BATTLE_BUFFS,
  LUMINOUS_VMATRIX_SKILLS,
  LUMINOUS_HYPER_SKILLS_ALL,
  LUMINOUS_LINK_SKILLS,
  LUMINOUS_TOGGLE_SKILLS,
} from './luminous/index.js'

import {
  WIND_ARCHER_SKILLS,
  WIND_ARCHER_SIM_SKILLS,
  WIND_ARCHER_PASSIVE_SKILLS,
  WIND_ARCHER_BUFFS,
  WIND_ARCHER_BATTLE_BUFFS,
  WIND_ARCHER_VMATRIX_SKILLS,
  WIND_ARCHER_HYPER_SKILLS_ALL,
  WIND_ARCHER_LINK_SKILLS,
} from './wind-archer/index.js'

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
    // 戰鬥模擬機制設定 (可選) — 無此欄位的職業,引擎跳過所有機制管線
    mechanics: ARCHMAGE_FP_MECHANICS,
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
    jobKey: 'darkKnight',
    branchKey: 'warrior',
    all: DARK_KNIGHT_SKILLS,
    sim: DARK_KNIGHT_SIM_SKILLS,
    passive: DARK_KNIGHT_PASSIVE_SKILLS,
    buffs: DARK_KNIGHT_BUFFS,
    battleBuffs: DARK_KNIGHT_BATTLE_BUFFS,
    vmatrix: DARK_KNIGHT_VMATRIX_SKILLS,
    hyper: DARK_KNIGHT_HYPER_SKILLS_ALL,
    link: DARK_KNIGHT_LINK_SKILLS,
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
  {
    jobKey: 'buccaneer',
    branchKey: 'pirate',
    all: BUCCANEER_SKILLS,
    sim: BUCCANEER_SIM_SKILLS,
    passive: BUCCANEER_PASSIVE_SKILLS,
    buffs: BUCCANEER_BUFFS,
    battleBuffs: BUCCANEER_BATTLE_BUFFS,
    vmatrix: BUCCANEER_VMATRIX_SKILLS,
    hyper: BUCCANEER_HYPER_SKILLS_ALL,
    link: BUCCANEER_LINK_SKILLS,
  },
  {
    jobKey: 'luminous',
    branchKey: 'magician',
    all: LUMINOUS_SKILLS,
    sim: LUMINOUS_SIM_SKILLS,
    passive: LUMINOUS_PASSIVE_SKILLS,
    buffs: LUMINOUS_BUFFS,
    battleBuffs: LUMINOUS_BATTLE_BUFFS,
    vmatrix: LUMINOUS_VMATRIX_SKILLS,
    hyper: LUMINOUS_HYPER_SKILLS_ALL,
    link: LUMINOUS_LINK_SKILLS,
    toggle: LUMINOUS_TOGGLE_SKILLS,
  },
  {
    jobKey: 'windarcher',
    branchKey: 'cygnus',
    all: WIND_ARCHER_SKILLS,
    sim: WIND_ARCHER_SIM_SKILLS,
    passive: WIND_ARCHER_PASSIVE_SKILLS,
    buffs: WIND_ARCHER_BUFFS,
    battleBuffs: WIND_ARCHER_BATTLE_BUFFS,
    vmatrix: WIND_ARCHER_VMATRIX_SKILLS,
    hyper: WIND_ARCHER_HYPER_SKILLS_ALL,
    link: WIND_ARCHER_LINK_SKILLS,
  },
  {
    jobKey: 'nightwalker',
    branchKey: 'cygnus',
    all: NIGHT_WALKER_SKILLS,
    sim: NIGHT_WALKER_SIM_SKILLS,
    passive: NIGHT_WALKER_PASSIVE_SKILLS,
    buffs: NIGHT_WALKER_BUFFS,
    battleBuffs: NIGHT_WALKER_BATTLE_BUFFS,
    vmatrix: NIGHT_WALKER_VMATRIX_SKILLS,
    hyper: NIGHT_WALKER_HYPER_SKILLS_ALL,
    link: NIGHT_WALKER_LINK_SKILLS,
  },
]

// 依 jobKey 取該職業的戰鬥模擬技能清單
//   查無該職業 (或該職業尚未建立 sim 資料) → 回空陣列,戰鬥模擬器不排程任何技能
export function simSkillsForJob(jobKey) {
  const entry = JOB_SKILL_REGISTRY.find((j) => j.jobKey === jobKey)
  return entry?.sim || []
}

// 依 jobKey 取該職業的戰鬥模擬機制設定 (mechanics.js) — 熱路徑用 Map 快取
//   無設定的職業回 null,引擎跳過所有機制管線 (Final Attack / Ignite / DoT 被動)
const MECHANICS_BY_JOB = new Map(
  JOB_SKILL_REGISTRY.filter((j) => j.mechanics).map((j) => [j.jobKey, j.mechanics]),
)
export function mechanicsForJob(jobKey) {
  return MECHANICS_BY_JOB.get(jobKey) || null
}

// 跨職業總合 — 直接餵給頂層 barrel 的命名 export
export const ALL_JOBS_ALL_SKILLS        = JOB_SKILL_REGISTRY.flatMap((j) => j.all)
export const ALL_JOBS_SIM_SKILLS        = JOB_SKILL_REGISTRY.flatMap((j) => j.sim)
export const ALL_JOBS_PASSIVE_SKILLS    = JOB_SKILL_REGISTRY.flatMap((j) => j.passive)
export const ALL_JOBS_JOB_BUFFS         = JOB_SKILL_REGISTRY.flatMap((j) => j.buffs)
export const ALL_JOBS_JOB_BATTLE_BUFFS  = JOB_SKILL_REGISTRY.flatMap((j) => j.battleBuffs)
export const ALL_JOBS_JOB_VMATRIX       = JOB_SKILL_REGISTRY.flatMap((j) => j.vmatrix)
export const ALL_JOBS_HYPER_SKILLS      = JOB_SKILL_REGISTRY.flatMap((j) => j.hyper)
export const ALL_JOBS_LINK_SKILLS       = JOB_SKILL_REGISTRY.flatMap((j) => j.link)
export const ALL_JOBS_JOB_TOGGLE_SKILLS = JOB_SKILL_REGISTRY.flatMap((j) => j.toggle || [])
