// 技能系統頂層 barrel
//
// 這裡負責把以下來源合併成舊系統對外暴露的集合:
//   _shared/all-jobs/           — 全職業共通
//   _shared/branches/*/         — 職業群共通 (如法師群)
//   _shared/class-groups/*/     — 次級共通 (如冒險家法師)
//   jobs/*/                     — 各職業
//
// 重構原則:
//   - 不改任何現有 consumer 的 import 路徑
//   - 舊檔案 (constants/skills.js / skills/archmageFP.js / hyperSkills.js /
//     vmatrix.js / battleBuffs.js / buffs.js / battleSim.js) 只保留 re-export 殼
//   - 所有技能 entry 新增 `advancement` 欄位 (0~6 或 'hyper');既有邏輯若沒讀這個欄位就不會受影響

import {
  ALL_JOBS_TOGGLE_SKILLS,
  ALL_JOBS_BUFFS,
  ALL_JOBS_VMATRIX_SKILLS,
} from './_shared/all-jobs/index.js'

import {
  ADVENTURER_MAGE_PASSIVE_SKILLS,
  ADVENTURER_MAGE_VMATRIX_SKILLS,
  ADVENTURER_MAGE_BATTLE_BUFFS,
} from './_shared/class-groups/adventurer-mage/index.js'

import {
  MAGICIAN_BRANCH_TOGGLE_SKILLS,
  MAGICIAN_BRANCH_BUFFS,
  MAGICIAN_BRANCH_VMATRIX_SKILLS,
  MAGICIAN_BRANCH_BATTLE_BUFFS,
  MAGICIAN_BRANCH_PASSIVE_SKILLS,
} from './_shared/branches/magician/index.js'

import {
  ALL_JOBS_ALL_SKILLS,
  ALL_JOBS_SIM_SKILLS,
  ALL_JOBS_PASSIVE_SKILLS,
  ALL_JOBS_JOB_BUFFS,
  ALL_JOBS_JOB_BATTLE_BUFFS,
  ALL_JOBS_JOB_VMATRIX,
  ALL_JOBS_HYPER_SKILLS,
  ALL_JOBS_LINK_SKILLS,
} from './jobs/index.js'

// ─── 舊 SKILLS export (constants/skills.js 消費) ─────────────────────────────
// 順序:全職業通用 (toggle) → 職業群通用 passive → 冒險家法師通用 passive → 職業 passive
export const COMBINED_SKILLS = [
  ...ALL_JOBS_TOGGLE_SKILLS,
  ...MAGICIAN_BRANCH_TOGGLE_SKILLS,
  ...MAGICIAN_BRANCH_PASSIVE_SKILLS,
  ...ADVENTURER_MAGE_PASSIVE_SKILLS,
  ...ALL_JOBS_PASSIVE_SKILLS,
]

// ─── 舊 BUFFS export (constants/buffs.js 消費) ───────────────────────────────
// 順序沿用舊檔:Meditation (火毒專屬) → 通用四項
// 為保留舊順序,這裡以「職業 buff → branch buff → all-jobs buff」鋪排
export const COMBINED_BUFFS = [
  ...ALL_JOBS_JOB_BUFFS,
  ...MAGICIAN_BRANCH_BUFFS,
  ...ALL_JOBS_BUFFS,
]

// ─── 舊 BATTLE_BUFFS export (constants/battleBuffs.js 消費) ──────────────────
// 原順序:empirical_knowledge (link) → fervent_drain (passive) → arcane_aim (passive) → infinity (active) → thiefs_cunning (linkCycle)
// 其中 empirical_knowledge / arcane_aim 屬冒險家法師;fervent_drain / infinity 屬火毒;thiefs_cunning 屬暗器
// 這些都是跨職業共用或多職業共用 — 先用 id 排序對應原陣列
import { LINK_SKILLS } from '../../data/linkSkills.js'

const THIEFS_CUNNING_BATTLE_BUFF = LINK_SKILLS.thiefs_cunning
  ? [{
      id: 'thiefs_cunning',
      source: 'linkCycle',
      nameKey: 'linkSkill.skills.thiefs_cunning.name',
      descriptionKey: 'linkSkill.skills.thiefs_cunning.flavor',
      imageUrl: '/skills/link/thiefs_cunning.png',
      advancement: 0,
      kind: 'link',
      triggerOn: 'debuffApplied',
    }]
  : []

// 依 id 重排以對齊原陣列順序
//   empirical_knowledge, fervent_drain, arcane_aim, infinity, thiefs_cunning
const BATTLE_BUFFS_UNORDERED = [
  ...ADVENTURER_MAGE_BATTLE_BUFFS,      // empirical_knowledge + arcane_aim
  ...MAGICIAN_BRANCH_BATTLE_BUFFS,
  ...ALL_JOBS_JOB_BATTLE_BUFFS,         // fervent_drain + infinity
  ...THIEFS_CUNNING_BATTLE_BUFF,
]

const BATTLE_BUFF_ORDER = ['empirical_knowledge', 'fervent_drain', 'arcane_aim', 'infinity', 'thiefs_cunning']
export const COMBINED_BATTLE_BUFFS = BATTLE_BUFFS_UNORDERED
  .slice()
  .sort((a, b) => {
    const ai = BATTLE_BUFF_ORDER.indexOf(a.id)
    const bi = BATTLE_BUFF_ORDER.indexOf(b.id)
    // 未在原順序中的條目往後排
    const ax = ai === -1 ? Number.MAX_SAFE_INTEGER : ai
    const bx = bi === -1 ? Number.MAX_SAFE_INTEGER : bi
    return ax - bx
  })

// ─── 舊 VMATRIX_SKILLS export (constants/vmatrix.js 消費) ────────────────────
// 重構後不再單獨維護 VMATRIX 陣列 — 所有有 `vmatrix` 欄位的 skill 都會被掃到此處。
// 包含:
//   - 全職業共通純 VM 技能 (rope_lift / decent_* / blink / erda_* / 等)
//   - 全職業共通「同時是 Buff + VM」的技能 (decent_sharp_eyes)
//   - 冒險家法師共通 (unreliable_memory)
//   - 火毒技能本體帶 skillSpecific core (flame_sweep / flame_haze / mist_eruption / ignite)
//
// 順序:all-jobs 通用 → class-groups → branches → 職業全部主列表(含未分類 entry)
const VMATRIX_CANDIDATES = [
  ...ALL_JOBS_VMATRIX_SKILLS,
  ...MAGICIAN_BRANCH_VMATRIX_SKILLS,
  ...ADVENTURER_MAGE_VMATRIX_SKILLS,
  // 掃各職業主列表(ALL_JOBS_ALL_SKILLS 包含 SIM / passive / buff / 無角色的骨架等)
  ...ALL_JOBS_ALL_SKILLS,
]
export const COMBINED_VMATRIX_SKILLS = (() => {
  const seen = new Set()
  const out = []
  for (const s of VMATRIX_CANDIDATES) {
    if (!s || !s.vmatrix) continue
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
  }
  return out
})()

// ─── 舊 HYPER_SKILLS export (constants/hyperSkills.js 消費) ──────────────────
export const COMBINED_HYPER_SKILLS = [...ALL_JOBS_HYPER_SKILLS]

// ─── SIM_SKILLS export (constants/battleSim.js 消費) ────────────────────────
// 「屬於戰鬥模擬系統」由 skill.sim 子物件定義,不再區分獨立 SIM 陣列 —
// 從所有技能池掃一遍,有 sim 欄位的都進;去重。
const SIM_CANDIDATES = [
  ...ALL_JOBS_ALL_SKILLS,           // 涵蓋每個職業的整主列表(含未分類 entry)
  ...ALL_JOBS_TOGGLE_SKILLS,
  ...ALL_JOBS_BUFFS,
  ...ALL_JOBS_VMATRIX_SKILLS,
  ...ADVENTURER_MAGE_VMATRIX_SKILLS,
  ...ADVENTURER_MAGE_PASSIVE_SKILLS,
  ...ADVENTURER_MAGE_BATTLE_BUFFS,
]
export const COMBINED_SIM_SKILLS = (() => {
  const seen = new Set()
  const out = []
  for (const s of SIM_CANDIDATES) {
    if (!s || !s.sim) continue
    if (seen.has(s.id)) continue
    seen.add(s.id)
    out.push(s)
  }
  return out
})()

// ─── LINK_SKILLS 索引 (僅彙整;真實 data 在 src/data/linkSkills.js) ──────────
export const JOB_LINK_SKILL_INDEX = [...ALL_JOBS_LINK_SKILLS]

// 再把所有子模組的命名 re-export,讓高階 UI 需要分組時可以直接用
export * from './_shared/all-jobs/index.js'
export * from './_shared/branches/magician/index.js'
export * from './_shared/class-groups/adventurer-mage/index.js'
export * from './jobs/index.js'
export * from './_shared/helpers.js'
