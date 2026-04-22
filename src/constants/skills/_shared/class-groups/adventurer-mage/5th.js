// 冒險家法師共通 — 5 轉
// Unreliable Memory (V 矩陣) — 選擇一個技能將自身變為該技能;sim 中固定鏡像 Infinity
// 其 vmatrix passive 原設為 +1 INT / lv(sim 戰鬥 buff 面向獨立於 CP passive)

import { LOCAL_ICON } from '../../helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'common')

export const ADVENTURER_MAGE_5TH_SKILLS = [
  {
    id: 'unreliable_memory',
    nameKey: 'vmatrix.skills.unreliable_memory',
    descriptionKey: 'vmatrix.skills.unreliable_memory_desc',
    imageUrl: ICON('Unreliable_Memory'),
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    advancement: 5,
    kind: 'passive',
    vmatrix: { kind: 'skill', passive: { type: 'stat', statKey: 'int', per: 1 } },
    // 戰鬥模擬配置:鏡像 Infinity,Infinity expire 後自動觸發一次
    //   onceOnly: 戰鬥中只能施放一次
    //   mirror: 鏡像目標 buff id — activate 時複製其 cfg(含 tick 分布)
    //   triggerAfter: 目標 buff expire 後才能啟動
    battle: {
      source: 'activeToggle',
      mirror: 'infinity',
      triggerAfter: 'infinity',
      onceOnly: true,
      hideCooldown: true,
      initialDelayBySpeed: { 7: 0, 8: 0 },
    },
  },
]

// 子分類 (由主列表 filter)
export const ADVENTURER_MAGE_5TH_TOGGLE_SKILLS  = ADVENTURER_MAGE_5TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const ADVENTURER_MAGE_5TH_BUFFS          = ADVENTURER_MAGE_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const ADVENTURER_MAGE_5TH_PASSIVE_SKILLS = ADVENTURER_MAGE_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const ADVENTURER_MAGE_5TH_VMATRIX_SKILLS = ADVENTURER_MAGE_5TH_SKILLS.filter((s) => s.vmatrix)

// Battle Buff — 從 skill.battle derive;合併 meta + battle 參數
export const ADVENTURER_MAGE_5TH_BATTLE_BUFFS = ADVENTURER_MAGE_5TH_SKILLS
  .filter((s) => s.battle)
  .map((s) => ({
    id: s.id,
    nameKey: s.nameKey,
    descriptionKey: s.descriptionKey,
    imageUrl: s.imageUrl,
    jobs: s.jobs,
    advancement: s.advancement,
    kind: s.kind,
    baseLevel: s.baseLevel,
    ...s.battle,
  }))
