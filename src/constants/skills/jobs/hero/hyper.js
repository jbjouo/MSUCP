// 英雄 — 超技能 (Hyper Skills)
//
// 資料來源:scripts/skill-db/hero/hyper.json + 掃描 1120043~1120051(角色資料只列 6 項,補齊 9 項)
//   hyperKind: 'enhancement' — 5 點配點(3 組 × 3)
//   hyperKind: 'active'      — 主動技能
//
// 影響 CP 的強化(配點後由 CP 讀取 ctx.hasHyper):
//   Advanced Combo Attack - Reinforce → Combo Attack buff 每顆終傷 +2%(4th.js)
//   Advanced Combo Attack - Boss Rush → Combo Attack buff 每顆首領傷害 +2%(4th.js)
//   Advanced Final Attack - Ferocity  → Advanced Final Attack 被動 ATT +20(4th.js)
// 其餘(Raging Blow 系列 / Opportunity / AFA Reinforce)只影響單一技能,不進 CP
// TODO: levelReq 待確認(暫全設 140)
// Rising Rage(攻擊)不收錄

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (id) => LOCAL_ICON(id, 'hero')

const ENH = (id, skillId, group, effect = {}) => ({
  id,
  nameKey: `hyperSkill.skills.${id}.name`,
  descKey: `hyperSkill.skills.${id}.desc`,
  imageUrl: ICON(skillId),
  group,
  jobs: ['hero'],
  advancement: 'hyper',
  hyperKind: 'enhancement',
  levelReq: 140,
  effect,
})

const HERO_ALL_HYPER = [
  // ── Advanced Combo Attack 強化 ──
  ENH('hero_combo_reinforce', 1120043, 'hero_advanced_combo'),
  ENH('hero_combo_opportunity', 1120044, 'hero_advanced_combo'),
  ENH('hero_combo_boss_rush', 1120045, 'hero_advanced_combo'),
  // ── Advanced Final Attack 強化 ──
  ENH('hero_afa_reinforce', 1120046, 'hero_advanced_final_attack', { targetSkill: 'hero_advanced_final_attack', damagePct: 10 }),
  ENH('hero_afa_ferocity', 1120047, 'hero_advanced_final_attack'),
  ENH('hero_afa_opportunity', 1120048, 'hero_advanced_final_attack'),
  // ── Raging Blow 強化 ──
  ENH('hero_raging_blow_reinforce', 1120049, 'hero_raging_blow', { targetSkill: 'hero_raging_blow', damagePct: 20 }),
  ENH('hero_raging_blow_spread', 1120050, 'hero_raging_blow', { targetSkill: 'hero_raging_blow', maxEnemiesBonus: 2 }),
  ENH('hero_raging_blow_extra_strike', 1120051, 'hero_raging_blow', { targetSkill: 'hero_raging_blow', hitsPerCastBonus: 1 }),

  // ── Hyper Active(60 / 30 秒,CD 120 秒 → 臨時增益)──
  {
    id: 'hero_epic_adventure',
    name: 'Epic Adventure',
    icon: ICON(1121053),
    imageUrl: ICON(1121053),
    jobs: ['hero'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'buff',
    baseLevel: 1,
    stats: { dmgPct: 10 },
    cp: { role: 'buff' },
    _temporary: true,
  },
  {
    id: 'hero_cry_valhalla',
    name: 'Cry Valhalla',
    icon: ICON(1121054),
    imageUrl: ICON(1121054),
    jobs: ['hero'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'buff',
    baseLevel: 1,
    // ATT +50、爆擊率 +30%(鬥氣全滿已由 Combo Attack buff 涵蓋;抗性 / 追加劍擊不收)
    stats: { atk: 50, critRate: 30 },
    cp: { role: 'buff' },
    _temporary: true,
  },
]

export const HERO_HYPER_SKILLS        = HERO_ALL_HYPER.filter((s) => s.hyperKind === 'enhancement')
export const HERO_HYPER_ACTIVE_SKILLS = HERO_ALL_HYPER.filter((s) => s.hyperKind === 'active')
