// Luminous — 超技能

import { ASSET } from '../../_shared/helpers.js'

const ICON = (skillId) => ASSET(`skills/luminous/Skill_${skillId}.png`)

export const LUMINOUS_HYPER_SKILLS = []
export const LUMINOUS_HYPER_ACTIVE_SKILLS = [
  {
    id: 'lumi_heroic_memories',
    name: 'Heroic Memories',
    icon: ICON(27121053),
    imageUrl: ICON(27121053),
    jobs: ['luminous'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'buff',
    stats: { dmgPct: 10 },
    cp: { role: 'buff' },
    _temporary: true,
  },
]
