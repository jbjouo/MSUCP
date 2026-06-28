// Night Walker — 超技能 (Hyper Skills)
//
// Hyper 分兩種:
//   hyperKind: 'enhancement' — 5 點配點的 passive 強化(9 項;依 group 分組,同 group 只能點 1)
//   hyperKind: 'active'      — Lv 140+ 自動解鎖的主動技能(3 項)

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/night-walker/Skill_${skillId}.png`)

// ─── Hyper Active ────────────────────────────────────────────────────────

export const DOMINION = {
  id: 'nw_dominion',
  name: 'Dominion',
  nameKey: 'hyperSkill.skills.nw_dominion.name',
  descKey: 'hyperSkill.skills.nw_dominion.desc',
  imageUrl: ICON(14121052),
  jobs: ['nightwalker'],
  advancement: 'hyper',
  hyperKind: 'active',
  kind: 'attack',
}

export const GLORY_OF_THE_GUARDIANS = {
  id: 'nw_glory_of_the_guardians',
  name: 'Glory of the Guardians',
  nameKey: 'hyperSkill.skills.nw_glory_of_the_guardians.name',
  descKey: 'hyperSkill.skills.nw_glory_of_the_guardians.desc',
  imageUrl: ICON(14121053),
  jobs: ['nightwalker'],
  advancement: 'hyper',
  hyperKind: 'active',
  kind: 'buff',
}

export const SHADOW_ILLUSION = {
  id: 'nw_shadow_illusion',
  name: 'Shadow Illusion',
  nameKey: 'hyperSkill.skills.nw_shadow_illusion.name',
  descKey: 'hyperSkill.skills.nw_shadow_illusion.desc',
  imageUrl: ICON(14121054),
  jobs: ['nightwalker'],
  advancement: 'hyper',
  hyperKind: 'active',
  kind: 'buff',
}

// ─── 所有 Hyper 技能 (enhancement + active) ──────────────────────────────
const NIGHT_WALKER_ALL_HYPER = [
  // ── Quintuple Star 強化 (3 選) ────────────────────────────────────────
  {
    id: 'nw_quintuple_star_reinforce',
    nameKey: 'hyperSkill.skills.nw_quintuple_star_reinforce.name',
    descKey: 'hyperSkill.skills.nw_quintuple_star_reinforce.desc',
    imageUrl: ICON(14120043),
    group: 'quintuple_star',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 140,
    effect: { targetSkill: 'quintuple_star', damagePct: 20 },
  },
  {
    id: 'nw_quintuple_star_boss_rush',
    nameKey: 'hyperSkill.skills.nw_quintuple_star_boss_rush.name',
    descKey: 'hyperSkill.skills.nw_quintuple_star_boss_rush.desc',
    imageUrl: ICON(14120044),
    group: 'quintuple_star',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 165,
    effect: { targetSkill: 'quintuple_star', bossDamagePct: 20 },
  },
  {
    id: 'nw_quintuple_star_critical_chance',
    nameKey: 'hyperSkill.skills.nw_quintuple_star_critical_chance.name',
    descKey: 'hyperSkill.skills.nw_quintuple_star_critical_chance.desc',
    imageUrl: ICON(14120045),
    group: 'quintuple_star',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 180,
    effect: { targetSkill: 'quintuple_star', critRate: 10 },
  },
  // ── Dark Omen 強化 (3 選) ─────────────────────────────────────────────
  {
    id: 'nw_dark_omen_cooldown',
    nameKey: 'hyperSkill.skills.nw_dark_omen_cooldown.name',
    descKey: 'hyperSkill.skills.nw_dark_omen_cooldown.desc',
    imageUrl: ICON(14120046),
    group: 'dark_omen',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 140,
    effect: { targetSkill: 'dark_omen', cooldownOwnPctRed: 50 },
  },
  {
    id: 'nw_dark_omen_spread',
    nameKey: 'hyperSkill.skills.nw_dark_omen_spread.name',
    descKey: 'hyperSkill.skills.nw_dark_omen_spread.desc',
    imageUrl: ICON(14120047),
    group: 'dark_omen',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 150,
    effect: { targetSkill: 'dark_omen', maxEnemiesBonus: 9 },
  },
  {
    id: 'nw_dark_omen_reinforce',
    nameKey: 'hyperSkill.skills.nw_dark_omen_reinforce.name',
    descKey: 'hyperSkill.skills.nw_dark_omen_reinforce.desc',
    imageUrl: ICON(14120048),
    group: 'dark_omen',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 180,
    effect: { targetSkill: 'dark_omen', damagePct: 20 },
  },
  // ── Vitality Siphon 強化 (3 選) ───────────────────────────────────────
  {
    id: 'nw_vitality_siphon_extra_point',
    nameKey: 'hyperSkill.skills.nw_vitality_siphon_extra_point.name',
    descKey: 'hyperSkill.skills.nw_vitality_siphon_extra_point.desc',
    imageUrl: ICON(14120049),
    group: 'vitality_siphon',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 140,
    effect: { targetSkill: 'vitality_siphon', shieldHpPct: 3 },
  },
  {
    id: 'nw_vitality_siphon_reinforce',
    nameKey: 'hyperSkill.skills.nw_vitality_siphon_reinforce.name',
    descKey: 'hyperSkill.skills.nw_vitality_siphon_reinforce.desc',
    imageUrl: ICON(14120050),
    group: 'vitality_siphon',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 150,
    effect: { targetSkill: 'vitality_siphon', atk: 60 },
  },
  {
    id: 'nw_vitality_siphon_preparation',
    nameKey: 'hyperSkill.skills.nw_vitality_siphon_preparation.name',
    descKey: 'hyperSkill.skills.nw_vitality_siphon_preparation.desc',
    imageUrl: ICON(14120051),
    group: 'vitality_siphon',
    jobs: ['nightwalker'],
    advancement: 'hyper',
    hyperKind: 'enhancement',
    levelReq: 180,
    effect: { targetSkill: 'vitality_siphon', statusResist: 20 },
  },

  // ── Hyper Active ──────────────────────────────────────────────────────
  DOMINION,
  GLORY_OF_THE_GUARDIANS,
  SHADOW_ILLUSION,
]

export const NIGHT_WALKER_HYPER_SKILLS        = NIGHT_WALKER_ALL_HYPER.filter((s) => s.hyperKind === 'enhancement')
export const NIGHT_WALKER_HYPER_ACTIVE_SKILLS = NIGHT_WALKER_ALL_HYPER.filter((s) => s.hyperKind === 'active')
