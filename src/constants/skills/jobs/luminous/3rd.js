// Luminous — 3 轉技能

import { LOCAL_ICON } from '../../_shared/helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'luminous')

export const LUMINOUS_3RD_SKILLS = [
  {
    id: 'lumi_photic_meditation',
    name: 'Photic Meditation',
    icon: ICON(27111006),
    imageUrl: ICON(27111006),
    jobs: ['luminous'],
    advancement: 3,
    kind: 'buff',
    stats: { matk: 40 },
    cp: { role: 'buff' },
  },
]

export const LUMINOUS_3RD_SIM_SKILLS     = LUMINOUS_3RD_SKILLS.filter((s) => s.sim)
export const LUMINOUS_3RD_PASSIVE_SKILLS = LUMINOUS_3RD_SKILLS.filter((s) => s.cp?.role === 'passive')
export const LUMINOUS_3RD_BUFFS          = LUMINOUS_3RD_SKILLS.filter((s) => s.cp?.role === 'buff')
export const LUMINOUS_3RD_BATTLE_BUFFS   = LUMINOUS_3RD_SKILLS.filter((s) => s.battle)
export const LUMINOUS_3RD_VMATRIX_SKILLS = LUMINOUS_3RD_SKILLS.filter((s) => s.vmatrix)
