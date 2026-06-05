// 冒險家盜賊共通 — 1 轉

import { LOCAL_ICON } from '../../helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'common')

const ADVENTURER_THIEF_1ST_SKILLS = [
  {
    id: 'nimble_body',
    name: 'Nimble Body',
    imageUrl: ICON('Nimble_Body'),
    jobs: ['shadower', 'nightlord', 'dualblade'],
    advancement: 1,
    kind: 'passive',
    stats: { luk: 20 },
    cp: { role: 'passive' },
  },
]

export const ADVENTURER_THIEF_1ST_TOGGLE_SKILLS = ADVENTURER_THIEF_1ST_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ADVENTURER_THIEF_1ST_BUFFS          = ADVENTURER_THIEF_1ST_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ADVENTURER_THIEF_1ST_VMATRIX_SKILLS = ADVENTURER_THIEF_1ST_SKILLS.filter((s) => s.vmatrix)
export const ADVENTURER_THIEF_1ST_BATTLE_BUFFS   = ADVENTURER_THIEF_1ST_SKILLS.filter((s) => s.battle)
export const ADVENTURER_THIEF_1ST_PASSIVE_SKILLS = ADVENTURER_THIEF_1ST_SKILLS.filter((s) => s.cp?.role === 'passive')
