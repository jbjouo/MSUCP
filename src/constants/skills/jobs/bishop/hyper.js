// Bishop — 超技能 (Hyper Skills)

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'bishop')

const BISHOP_ALL_HYPER = [
  {
    id: 'righteously_indignant',
    name: 'Righteously Indignant',
    imageUrl: ICON('Righteously_Indignant'),
    jobs: ['bishop'],
    advancement: 'hyper',
    hyperKind: 'active',
    kind: 'passive',
    stats: { matk: 50, finalDmg: 30, ignoreDef: 20, elementalResist: 10 },
    cp: { role: 'passive' },
  },
]

export const BISHOP_HYPER_SKILLS        = BISHOP_ALL_HYPER.filter((s) => s.hyperKind === 'enhancement')
export const BISHOP_HYPER_ACTIVE_SKILLS = BISHOP_ALL_HYPER.filter((s) => s.hyperKind === 'active')
