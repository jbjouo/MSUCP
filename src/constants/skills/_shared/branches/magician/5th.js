// 法師群共通 — 5 轉
// Mana Overload — 切換型技能;消耗 MP 換取所有技能 Final Damage +N%。
// 戰鬥模擬中視為「常駐獨立終傷乘區」(permanent activeToggle),不需開啟動作、
// 不會過期、不顯示剩餘時間與 CD。

import { YETIDB_ICON } from '../../helpers.js'

export const MAGICIAN_BRANCH_5TH_SKILLS = [
  {
    id: 'mana_overload',
    name: 'Mana Overload',
    nameKey: 'battleBuffs.mana_overload.name',
    descriptionKey: 'battleBuffs.mana_overload.description',
    imageUrl: YETIDB_ICON('Mana_Overload'),
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    advancement: 5,
    kind: 'toggle',
    baseLevel: 25, // Master Level 25 → +7% 最終傷害
    // V 矩陣(5 轉技能本體)— 等級 0-30 可在角色頁 V 矩陣面板調整。
    //   不帶 passive → 不貢獻 CP 屬性值;等級只作用於戰鬥模擬(升級提升 baseFinalDmgPct)。
    vmatrix: {
      kind: 'skill',
      maxLevel: 30,
      nameKey: 'vmatrix.skills.mana_overload',
      descriptionKey: 'vmatrix.skills.mana_overload_desc',
    },
    battle: {
      source: 'activeToggle',
      permanent: true,
      // 讀角色頁 V 矩陣等級 → effective level = max(baseLevel=25, vmLevel);
      // 預設 VM=0 仍視為 Lv25(Master 基線)→ +7% FD;VM 升到 30 → +8% FD
      useVmatrixLevel: true,
      base: {
        durationSec: 99999, // 常駐(超長 duration)— permanent 旗標另外阻擋時間顯示
        baseFinalDmgPct: 7, // Lv25 baseline
        tickIntervalSec: 0,
        tickIncreasePct: 0,
      },
      // Lv25 → 7%、Lv30 → 8%(+1% / 5 levels = 0.2/lv)
      perLevelBonus: { baseFinalDmgPct: 0.2 },
      ignoresBuffDuration: true,
      cooldownSec: 0,
      initialDelayBySpeed: { 7: 0, 8: 0 },
      hideCooldown: true,
    },
  },
]

export const MAGICIAN_BRANCH_5TH_TOGGLE_SKILLS  = MAGICIAN_BRANCH_5TH_SKILLS.filter((s) => s.cp?.role === 'toggle')
export const MAGICIAN_BRANCH_5TH_BUFFS          = MAGICIAN_BRANCH_5TH_SKILLS.filter((s) => s.cp?.role === 'buff')
export const MAGICIAN_BRANCH_5TH_PASSIVE_SKILLS = MAGICIAN_BRANCH_5TH_SKILLS.filter((s) => s.cp?.role === 'passive')
export const MAGICIAN_BRANCH_5TH_VMATRIX_SKILLS = MAGICIAN_BRANCH_5TH_SKILLS.filter((s) => s.vmatrix)

export const MAGICIAN_BRANCH_5TH_BATTLE_BUFFS = MAGICIAN_BRANCH_5TH_SKILLS
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
