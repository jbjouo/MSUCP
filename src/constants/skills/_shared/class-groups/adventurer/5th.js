// 冒險家 (Explorer) 全職業共通 — 5 轉
//
// Maple World Goddess's Blessing (skillId 400001042) — 楓之世界女神的祝福
//   API 實值 (master 25):楓葉勇士類全職業 buff 增幅 +350% (Lv1 110%,+10/lv)、
//   Damage +17% (Lv1 5%,+0.5/lv),持續 60s / CD 180s / 可儲 2 次,MP 500
//   各級原始資料:scripts/skill-db/arch-mage-f-p/maple-world-goddess-blessing-levels.json
//   (Lv26~30 為線性外插,待實測)
//
// 戰鬥模擬 / CP 接入待後續 — 需先確認「buff 增幅」作用對象 (Maple Warrior 數值) 與
// Damage% 的疊加方式;目前僅作為 V 矩陣技能核心 (共通) 收錄。

import { LOCAL_ICON } from '../../helpers.js'

const ICON = (name) => LOCAL_ICON(name, 'common')

// 冒險家全職業 (jobs.js classGroup: 'explorer' 的所有 job key)
const ADVENTURER_JOBS = [
  'hero', 'paladin', 'darkKnight',
  'archmageFP', 'archmageIL', 'bishop',
  'bowmaster', 'marksman', 'pathfinder',
  'nightlord', 'shadower', 'dualblade',
  'buccaneer', 'corsair', 'cannoneer',
]

export const ADVENTURER_5TH_SKILLS = [
  {
    id: 'maple_world_goddess_blessing',
    name: "Maple World Goddess's Blessing",
    nameKey: 'vmatrix.skills.maple_world_goddess_blessing',
    descriptionKey: 'vmatrix.skills.maple_world_goddess_blessing_desc',
    imageUrl: ICON("Maple_World_Goddess's_Blessing"),
    jobs: ADVENTURER_JOBS,
    advancement: 5,
    kind: 'buff',
    vmTag: 'adventurer',   // V 矩陣面板「技能核心 (共通)」角標:冒險家
    baseLevel: 25,         // master 25;等級由 V 矩陣面板 (0~30) 調整
    vmatrix: { kind: 'skill', maxLevel: 30 },
    // 戰鬥模擬 — 無延遲施放 buff:開場緊接 Infinity (450ms) 之後自動啟動
    //   (排序由 BATTLE_BUFFS 順序保證:未列入 BATTLE_BUFF_ORDER → 排在 infinity 之後)
    //   效果 (已實測驗證公式):
    //   1. 主屬加成 (statBoost mapleWarriorEnhance 型,引擎實作):
    //        提升% = floor(楓葉祝福% × 增幅%/100) — 例 16% × 390% = 62.4 → 62%
    //        主屬 flat = floor(AP × 提升%/100) — 與楓葉祝福同規則
    //        需楓葉祝福 (CP buff) 開啟;增幅 Lv25 = 350%,+10%/lv (Lv29 = 390% 已實測驗證)
    //   2. Damage +17% (Lv25,+0.5/lv) — 一般 Damage%,與 Damage / Boss Damage 相加
    //   可儲 2 次的堆疊機制暫不實裝 (單純 180s CD 循環);等級不吃戰鬥命令 (noCombatOrders)
    battle: {
      source: 'activeToggle',
      base: {
        durationSec: 60,
        baseDamagePct: 17,
      },
      perLevelBonus: { baseDamagePct: 0.5 },
      statBoost: { type: 'mapleWarriorEnhance', basePct: 350, perLevelPct: 10 },
      cooldownSec: 180,
      ignoresBuffDuration: true,   // 不受加持 (Buff Duration%) 影響 — 固定 60 秒
      noCombatOrders: true,        // V 技能等級不吃 Combat Orders +1
      useVmatrixLevel: true,       // 等級 = V 矩陣面板等級
      requiresVmatrixLevel: true,  // 面板 0 = 未習得 — 不自動施放
      initialDelayBySpeed: { 7: 500, 8: 450 },
    },
  },
]

// 子分類 (由主列表 filter)
export const ADVENTURER_VMATRIX_SKILLS = ADVENTURER_5TH_SKILLS.filter((s) => s.vmatrix)

// Battle Buff — 從 skill.battle derive (與其他 class-group 相同模式)
export const ADVENTURER_BATTLE_BUFFS = ADVENTURER_5TH_SKILLS
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
