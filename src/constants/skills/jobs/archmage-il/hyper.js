// 冰雷 — 超技能
//
// 資料來源:scripts/skill-db/arch-mage-i-l/hyper.json
// 超技能強化(Chain Lightning / Frozen Orb Reinforce 等)只影響單一技能傷害,不收錄
// Absolute Zero Aura(防禦光環)、Lightning Orb(攻擊)不影響 CP,不收錄

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'archmage-il')

export const ARCHMAGE_IL_HYPER_ACTIVE_SKILLS = [
  {
    id: 'il_epic_adventure',
    name: 'Epic Adventure',
    icon: ICON('2221053'),
    imageUrl: ICON('2221053'),
    jobs: ['archmageIL'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'buff',
    baseLevel: 1,
    // 60 秒 / CD 120 秒 → 臨時增益
    stats: { dmgPct: 10 },
    cp: { role: 'buff' },
    _temporary: true,
  },
]
