// Link Skill 資料庫
//
// 欄位:
//   id             — 技能唯一 id
//   nameKey        — i18n key (名稱)
//   icon           — 圖示 URL
//   owners         — 原生擁有此技能的職業 (job.key[])
//   classGroup     — 所屬職業群 (對應 jobs.js 的 branch.key)
//   uniqueByJob    — 同一 ownerJob 不可重複連結 (預設 true)
//   specialEffect  — 為條件型/特殊效果,不計入面板的「套用的能力值」統計
//   ownMaxLevel    — 自身可達上限
//   maxTotalLevel  — 自身 + 連結合計的上限
//   levels[]       — 各等級資料 { level, descKey, stats? }
//                    stats 供未來計算使用,目前 specialEffect 類型暫不進統計
//
// 規則摘要:
//   - 同職業群的連結不佔用 12 個 slot,改為提升自己的 link skill 等級 (受 maxTotalLevel 上限)
//   - 不同職業群的連結各佔 1 slot,帳號至多 12 slot
//   - 同 ownerJob 不可重複連結

import { ASSET } from '../constants/skills/_shared/helpers.js'

export const LINK_SKILLS = {
  // ─── 英雄團 (單一 owner,每支 link skill 獨立) ───
  combo_kill_blessing: {
    id: 'combo_kill_blessing',
    nameKey: 'linkSkill.skills.combo_kill_blessing.name',
    flavorKey: 'linkSkill.skills.combo_kill_blessing.flavor',
    icon: ASSET('skills/link/combo_kill_blessing.png'),
    owners: ['aran'],
    classGroup: 'heroes',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.combo_kill_blessing.desc.1' },
      { level: 2, descKey: 'linkSkill.skills.combo_kill_blessing.desc.2' },
    ],
  },
  rune_persistence: {
    id: 'rune_persistence',
    nameKey: 'linkSkill.skills.rune_persistence.name',
    flavorKey: 'linkSkill.skills.rune_persistence.flavor',
    icon: ASSET('skills/link/rune_persistence.png'),
    owners: ['evan'],
    classGroup: 'heroes',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.rune_persistence.desc.1' },
      { level: 2, descKey: 'linkSkill.skills.rune_persistence.desc.2' },
    ],
  },
  elven_blessing: {
    id: 'elven_blessing',
    nameKey: 'linkSkill.skills.elven_blessing.name',
    flavorKey: 'linkSkill.skills.elven_blessing.flavor',
    caveatKey: 'linkSkill.skills.elven_blessing.caveat',
    icon: ASSET('skills/link/elven_blessing.png'),
    owners: ['mercedes'],
    classGroup: 'heroes',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.elven_blessing.desc.1' },
      { level: 2, descKey: 'linkSkill.skills.elven_blessing.desc.2' },
    ],
  },
  phantom_instinct: {
    id: 'phantom_instinct',
    nameKey: 'linkSkill.skills.phantom_instinct.name',
    flavorKey: 'linkSkill.skills.phantom_instinct.flavor',
    icon: ASSET('skills/link/phantom_instinct.png'),
    owners: ['phantom'],
    classGroup: 'heroes',
    uniqueByJob: true,
    specialEffect: false,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.phantom_instinct.desc.1', stats: { critRate: 10 } },
      { level: 2, descKey: 'linkSkill.skills.phantom_instinct.desc.2', stats: { critRate: 15 } },
    ],
  },
  light_wash: {
    id: 'light_wash',
    nameKey: 'linkSkill.skills.light_wash.name',
    flavorKey: 'linkSkill.skills.light_wash.flavor',
    icon: ASSET('skills/link/light_wash.png'),
    owners: ['luminous'],
    classGroup: 'heroes',
    uniqueByJob: true,
    specialEffect: false,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.light_wash.desc.1', stats: { ignoreDef: 10 } },
      { level: 2, descKey: 'linkSkill.skills.light_wash.desc.2', stats: { ignoreDef: 15 } },
    ],
  },
  close_call: {
    id: 'close_call',
    nameKey: 'linkSkill.skills.close_call.name',
    flavorKey: 'linkSkill.skills.close_call.flavor',
    icon: ASSET('skills/link/close_call.png'),
    owners: ['shade'],
    classGroup: 'heroes',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.close_call.desc.1' },
      { level: 2, descKey: 'linkSkill.skills.close_call.desc.2' },
    ],
  },
  // ─── 米哈逸 (單職業) ───
  knights_watch: {
    id: 'knights_watch',
    nameKey: 'linkSkill.skills.knights_watch.name',
    flavorKey: 'linkSkill.skills.knights_watch.flavor',
    selfDescKey: 'linkSkill.skills.knights_watch.selfDesc',
    icon: ASSET('skills/link/knights_watch.png'),
    owners: ['mihile'],
    classGroup: 'mihile',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.knights_watch.desc.1' },
      { level: 2, descKey: 'linkSkill.skills.knights_watch.desc.2' },
    ],
  },
  cygnus_blessing: {
    id: 'cygnus_blessing',
    nameKey: 'linkSkill.skills.cygnus_blessing.name',
    flavorKey: 'linkSkill.skills.cygnus_blessing.flavor',
    caveatKey: 'linkSkill.skills.cygnus_blessing.caveat',
    icon: ASSET('skills/link/cygnus_blessing.png'),
    owners: ['dawnwarrior', 'blazewizard', 'windarcher', 'nightwalker', 'thunderbreaker'],
    classGroup: 'cygnus',
    uniqueByJob: true,
    specialEffect: false,
    ownMaxLevel: 2,
    maxTotalLevel: 10,
    levels: [
      { level: 1,  descKey: 'linkSkill.skills.cygnus_blessing.desc.1',  stats: { atk: 7,  matk: 7,  abnormalResist: 1,  elementalResist: 1  } },
      { level: 2,  descKey: 'linkSkill.skills.cygnus_blessing.desc.2',  stats: { atk: 9,  matk: 9,  abnormalResist: 3,  elementalResist: 3  } },
      { level: 3,  descKey: 'linkSkill.skills.cygnus_blessing.desc.3',  stats: { atk: 11, matk: 11, abnormalResist: 4,  elementalResist: 4  } },
      { level: 4,  descKey: 'linkSkill.skills.cygnus_blessing.desc.4',  stats: { atk: 13, matk: 13, abnormalResist: 6,  elementalResist: 6  } },
      { level: 5,  descKey: 'linkSkill.skills.cygnus_blessing.desc.5',  stats: { atk: 15, matk: 15, abnormalResist: 7,  elementalResist: 7  } },
      { level: 6,  descKey: 'linkSkill.skills.cygnus_blessing.desc.6',  stats: { atk: 17, matk: 17, abnormalResist: 9,  elementalResist: 9  } },
      { level: 7,  descKey: 'linkSkill.skills.cygnus_blessing.desc.7',  stats: { atk: 19, matk: 19, abnormalResist: 10, elementalResist: 10 } },
      { level: 8,  descKey: 'linkSkill.skills.cygnus_blessing.desc.8',  stats: { atk: 21, matk: 21, abnormalResist: 12, elementalResist: 12 } },
      { level: 9,  descKey: 'linkSkill.skills.cygnus_blessing.desc.9',  stats: { atk: 23, matk: 23, abnormalResist: 13, elementalResist: 13 } },
      { level: 10, descKey: 'linkSkill.skills.cygnus_blessing.desc.10', stats: { atk: 25, matk: 25, abnormalResist: 15, elementalResist: 15 } },
    ],
  },
  invincible_belief: {
    id: 'invincible_belief',
    nameKey: 'linkSkill.skills.invincible_belief.name',
    flavorKey: 'linkSkill.skills.invincible_belief.flavor',
    caveatKey: 'linkSkill.skills.invincible_belief.caveat',
    icon: ASSET('skills/link/invincible_belief.png'),
    owners: ['hero', 'paladin', 'darkKnight'],
    classGroup: 'warrior',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 6,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.invincible_belief.desc.1', stats: { healPct: 20, duration: 3, cooldown: 410 } },
      { level: 2, descKey: 'linkSkill.skills.invincible_belief.desc.2', stats: { healPct: 23, duration: 3, cooldown: 370 } },
      { level: 3, descKey: 'linkSkill.skills.invincible_belief.desc.3', stats: { healPct: 26, duration: 3, cooldown: 330 } },
      { level: 4, descKey: 'linkSkill.skills.invincible_belief.desc.4', stats: { healPct: 29, duration: 3, cooldown: 290 } },
      { level: 5, descKey: 'linkSkill.skills.invincible_belief.desc.5', stats: { healPct: 32, duration: 3, cooldown: 250 } },
      { level: 6, descKey: 'linkSkill.skills.invincible_belief.desc.6', stats: { healPct: 35, duration: 3, cooldown: 210 } },
    ],
  },
  adventurers_curiosity: {
    id: 'adventurers_curiosity',
    nameKey: 'linkSkill.skills.adventurers_curiosity.name',
    flavorKey: 'linkSkill.skills.adventurers_curiosity.flavor',
    icon: ASSET('skills/link/adventurers_curiosity.png'),
    owners: ['bowmaster', 'marksman', 'pathfinder'],
    classGroup: 'bowman',
    uniqueByJob: true,
    specialEffect: false,
    ownMaxLevel: 2,
    maxTotalLevel: 6,
    // 使用者要求:移除 Monster Collection 相關數值與描述,只保留 Critical Rate
    levels: [
      { level: 1, descKey: 'linkSkill.skills.adventurers_curiosity.desc.1', stats: { critRate: 3 } },
      { level: 2, descKey: 'linkSkill.skills.adventurers_curiosity.desc.2', stats: { critRate: 4 } },
      { level: 3, descKey: 'linkSkill.skills.adventurers_curiosity.desc.3', stats: { critRate: 6 } },
      { level: 4, descKey: 'linkSkill.skills.adventurers_curiosity.desc.4', stats: { critRate: 7 } },
      { level: 5, descKey: 'linkSkill.skills.adventurers_curiosity.desc.5', stats: { critRate: 9 } },
      { level: 6, descKey: 'linkSkill.skills.adventurers_curiosity.desc.6', stats: { critRate: 10 } },
    ],
  },
  pirate_blessing: {
    id: 'pirate_blessing',
    nameKey: 'linkSkill.skills.pirate_blessing.name',
    flavorKey: 'linkSkill.skills.pirate_blessing.flavor',
    selfOnlyKey: 'linkSkill.skills.pirate_blessing.selfOnly',
    icon: ASSET('skills/link/pirate_blessing.png'),
    owners: ['buccaneer', 'corsair', 'cannoneer'],
    classGroup: 'pirate',
    uniqueByJob: true,
    specialEffect: false,
    ownMaxLevel: 2,
    maxTotalLevel: 6,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.pirate_blessing.desc.1', stats: { str: 20, dex: 20, int: 20, luk: 20, hp: 350,  mp: 350,  damageTaken: -5  } },
      { level: 2, descKey: 'linkSkill.skills.pirate_blessing.desc.2', stats: { str: 30, dex: 30, int: 30, luk: 30, hp: 525,  mp: 525,  damageTaken: -7  } },
      { level: 3, descKey: 'linkSkill.skills.pirate_blessing.desc.3', stats: { str: 40, dex: 40, int: 40, luk: 40, hp: 700,  mp: 700,  damageTaken: -9  } },
      { level: 4, descKey: 'linkSkill.skills.pirate_blessing.desc.4', stats: { str: 50, dex: 50, int: 50, luk: 50, hp: 875,  mp: 875,  damageTaken: -11 } },
      { level: 5, descKey: 'linkSkill.skills.pirate_blessing.desc.5', stats: { str: 60, dex: 60, int: 60, luk: 60, hp: 1050, mp: 1050, damageTaken: -13 } },
      { level: 6, descKey: 'linkSkill.skills.pirate_blessing.desc.6', stats: { str: 70, dex: 70, int: 70, luk: 70, hp: 1225, mp: 1225, damageTaken: -15 } },
    ],
  },
  thiefs_cunning: {
    id: 'thiefs_cunning',
    nameKey: 'linkSkill.skills.thiefs_cunning.name',
    flavorKey: 'linkSkill.skills.thiefs_cunning.flavor',
    caveatKey: 'linkSkill.skills.thiefs_cunning.caveat',
    icon: ASSET('skills/link/thiefs_cunning.png'),
    owners: ['nightlord', 'shadower', 'dualblade'],
    classGroup: 'thief',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 6,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.thiefs_cunning.desc.1', stats: { damage: 3,  duration: 10, cooldown: 20 } },
      { level: 2, descKey: 'linkSkill.skills.thiefs_cunning.desc.2', stats: { damage: 6,  duration: 10, cooldown: 20 } },
      { level: 3, descKey: 'linkSkill.skills.thiefs_cunning.desc.3', stats: { damage: 9,  duration: 10, cooldown: 20 } },
      { level: 4, descKey: 'linkSkill.skills.thiefs_cunning.desc.4', stats: { damage: 12, duration: 10, cooldown: 20 } },
      { level: 5, descKey: 'linkSkill.skills.thiefs_cunning.desc.5', stats: { damage: 15, duration: 10, cooldown: 20 } },
      { level: 6, descKey: 'linkSkill.skills.thiefs_cunning.desc.6', stats: { damage: 18, duration: 10, cooldown: 20 } },
    ],
  },
  solus: {
    id: 'solus',
    nameKey: 'linkSkill.skills.solus.name',
    flavorKey: 'linkSkill.skills.solus.flavor',
    icon: ASSET('skills/link/solus.png'),
    owners: ['ark'],
    classGroup: 'flora',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 2,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.solus.desc.1', stats: { combatDuration: 5, maxStacks: 5, duration: 5, dmgPct: 1, dmgPctPerStack: 1 } },
      { level: 2, descKey: 'linkSkill.skills.solus.desc.2', stats: { combatDuration: 5, maxStacks: 5, duration: 5, dmgPct: 1, dmgPctPerStack: 2 } },
    ],
  },
  empirical_knowledge: {
    id: 'empirical_knowledge',
    nameKey: 'linkSkill.skills.empirical_knowledge.name',
    flavorKey: 'linkSkill.skills.empirical_knowledge.flavor',
    icon: ASSET('skills/link/empirical_knowledge.png'),
    owners: ['archmageFP', 'archmageIL', 'bishop'],
    classGroup: 'magician',
    uniqueByJob: true,
    specialEffect: true,
    ownMaxLevel: 2,
    maxTotalLevel: 6,
    levels: [
      { level: 1, descKey: 'linkSkill.skills.empirical_knowledge.desc.1', stats: { procRate: 15, maxStacks: 3, duration: 10, damagePerStack: 1, ignoreDefPerStack: 1 } },
      { level: 2, descKey: 'linkSkill.skills.empirical_knowledge.desc.2', stats: { procRate: 17, maxStacks: 3, duration: 10, damagePerStack: 1, ignoreDefPerStack: 1 } },
      { level: 3, descKey: 'linkSkill.skills.empirical_knowledge.desc.3', stats: { procRate: 19, maxStacks: 3, duration: 10, damagePerStack: 2, ignoreDefPerStack: 2 } },
      { level: 4, descKey: 'linkSkill.skills.empirical_knowledge.desc.4', stats: { procRate: 21, maxStacks: 3, duration: 10, damagePerStack: 2, ignoreDefPerStack: 2 } },
      { level: 5, descKey: 'linkSkill.skills.empirical_knowledge.desc.5', stats: { procRate: 23, maxStacks: 3, duration: 10, damagePerStack: 3, ignoreDefPerStack: 3 } },
      { level: 6, descKey: 'linkSkill.skills.empirical_knowledge.desc.6', stats: { procRate: 25, maxStacks: 3, duration: 10, damagePerStack: 3, ignoreDefPerStack: 3 } },
    ],
  },
}

export const LINK_SKILL_BY_JOB = {}
for (const skill of Object.values(LINK_SKILLS)) {
  for (const ownerJob of skill.owners) {
    LINK_SKILL_BY_JOB[ownerJob] = skill.id
  }
}

export function getLinkSkill(id) {
  return id ? LINK_SKILLS[id] || null : null
}

export function getLinkSkillByJob(jobKey) {
  const id = LINK_SKILL_BY_JOB[jobKey]
  return id ? LINK_SKILLS[id] : null
}

export function getLinkSkillLevelData(skillOrId, level) {
  const skill = typeof skillOrId === 'string' ? LINK_SKILLS[skillOrId] : skillOrId
  if (!skill) return null
  return skill.levels.find((lv) => lv.level === level) || null
}

// 取小於等於 level 的最高 levelData (用於 fallback)
export function bestLinkSkillLevelDataFor(skillOrId, level) {
  const skill = typeof skillOrId === 'string' ? LINK_SKILLS[skillOrId] : skillOrId
  if (!skill) return null
  let best = null
  for (const lv of skill.levels) {
    if (lv.level <= level && (!best || lv.level > best.level)) best = lv
  }
  return best || skill.levels[0] || null
}

// 連結 slot 上限 (不同職業群的連結合計)
export const LINK_SKILL_SLOT_CAP = 12
