// 冒險家法師共通 — 0 轉 (Link Skill)
// Empirical Knowledge (法師傳授) — Link Skill + Battle Buff
//
// Link Skill 的資料單一事實源仍在 src/data/linkSkills.js;此處 skill entry 只描述
// 「同樣這支技能在 CP/Battle 系統裡的角色」— 不複製等級表、不改動 link 系統規則。

import { ASSET } from '../../helpers.js'

export const ADVENTURER_MAGE_0TH_SKILLS = [
  {
    id: 'empirical_knowledge',
    nameKey: 'linkSkill.skills.empirical_knowledge.name',
    descriptionKey: 'linkSkill.skills.empirical_knowledge.flavor',
    imageUrl: ASSET('skills/link/empirical_knowledge.png'),
    // Link Skill — 全職業可連結,不限定 jobs
    advancement: 0,
    kind: 'link',
    // 戰鬥模擬角色(資料來自 link skill 系統 — useBattleBuffs 會依 source 再解析 level/stats)
    battle: {
      source: 'linkSkill',
      appliesDebuff: true, // 成功 proc 時視為對怪物上 debuff
    },
  },
]

// 子分類
export const ADVENTURER_MAGE_0TH_TOGGLE_SKILLS  = ADVENTURER_MAGE_0TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ADVENTURER_MAGE_0TH_BUFFS          = ADVENTURER_MAGE_0TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ADVENTURER_MAGE_0TH_PASSIVE_SKILLS = ADVENTURER_MAGE_0TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ADVENTURER_MAGE_0TH_VMATRIX_SKILLS = ADVENTURER_MAGE_0TH_SKILLS.filter((s) => s.vmatrix)

export const ADVENTURER_MAGE_0TH_BATTLE_BUFFS = ADVENTURER_MAGE_0TH_SKILLS
  .filter((s) => s.battle)
  .map((s) => ({
    id: s.id,
    nameKey: s.nameKey,
    descriptionKey: s.descriptionKey,
    imageUrl: s.imageUrl,
    jobs: s.jobs,
    advancement: s.advancement,
    ...s.battle,
  }))
