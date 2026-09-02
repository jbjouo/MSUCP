// Luminous — 0 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'luminous')

const LUMINOUS_0TH_SKILLS = [
  {
    id: 'lumi_inner_light',
    name: 'Inner Light',
    imageUrl: ICON(20040221),
    jobs: ['luminous'],
    advancement: 0,
    kind: 'passive',
    stats: { int: 20 },
    cp: { role: 'passive' },
  },
  {
    id: 'lumi_dark_affinity',
    name: 'Dark Affinity',
    icon: ICON(27000207),
    imageUrl: ICON(27000207),
    jobs: ['luminous'],
    advancement: 1,
    kind: 'passive',
    stats: { finalDmg: 5 },
    cp: { role: 'toggle', group: 'lumi_affinity', defaultOn: true },
    cpExclude: true,
  },
  {
    id: 'lumi_light_affinity',
    name: 'Light Affinity',
    icon: ICON(27000106),
    imageUrl: ICON(27000106),
    jobs: ['luminous'],
    advancement: 1,
    kind: 'passive',
    stats: { finalDmg: 5 },
    cp: { role: 'toggle', group: 'lumi_affinity' },
    cpExclude: true,
  },
]

export const LUMINOUS_0TH_SIM_SKILLS = []
export const LUMINOUS_0TH_PASSIVE_SKILLS = LUMINOUS_0TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const LUMINOUS_0TH_LINK_SKILLS = []
export const LUMINOUS_0TH_TOGGLE_SKILLS = LUMINOUS_0TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
