// Bowmaster — 超技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/bowmaster/Skill_${skillId}.png`)

const BOWMASTER_ALL_HYPER = []

export const BOWMASTER_HYPER_SKILLS = BOWMASTER_ALL_HYPER.filter((s) => s.hyperKind === 'enhancement')

export const BOWMASTER_HYPER_ACTIVE_SKILLS = [
  {
    id: 'bm_epic_adventure',
    name: 'Epic Adventure',
    icon: ICON(3121053),
    imageUrl: ICON(3121053),
    jobs: ['bowmaster'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'buff',
    baseLevel: 1,
    stats: { dmgPct: 10 },
    cp: { role: 'buff' },
    _temporary: true,
  },
  {
    id: 'bm_concentration',
    name: 'Concentration',
    icon: ICON(3121054),
    imageUrl: ICON(3121054),
    jobs: ['bowmaster'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'buff',
    baseLevel: 1,
    stats: { atk: 50, bossDmg: 20 },
    cp: { role: 'buff' },
    _temporary: true,
  },
]
