// 實戰觸發型 buff — 戰鬥模擬會讀取這裡每個 buff 的 source 來源取得最新等級與效果數值。
//   source: 'linkSkill'    → 從 LinkSkillPanel 取得等級與 per-level stats
//   source: 'passive'      → 技能自帶,不需觸發;passiveType 指定層數來源
//     passiveType: 'dotCount' → 層數 = 目標身上生效中的 DoT 數 (由 useDotTracker 提供)
//   source: 'activeToggle' → 戰鬥模擬「開始」後自動觸發,附 castDelay → expire → cooldown 週期
//                            時間基準為 sim elapsed (state.elapsedMs);結束/重置戰鬥時連同清空
//                            Final Damage 隨時間階梯上升:base + floor(elapsed / tickInterval) × perTick
//                            持續時間受 Buff Duration% (CP statTotal('buffDuration')) 放大
//   source: 'linkCycle'    → 自 LinkSkillPanel 取得等級與 stats { damage, duration, cooldown };
//                            自動循環觸發:啟動 → 持續 duration 秒 → 冷卻「從啟動瞬間」算 cooldown 秒後再觸發
//                            效果為 +damage% Damage(與 CP/其他 Damage% 相加);不吃 Buff Duration% / CD 減免

const YETIDB = (name) => `https://media.maplestorywiki.net/yetidb/Skill_${name}.png`

export const BATTLE_BUFFS = [
  {
    id: 'empirical_knowledge',
    source: 'linkSkill',
    nameKey: 'linkSkill.skills.empirical_knowledge.name',
    descriptionKey: 'linkSkill.skills.empirical_knowledge.flavor',
    imageUrl: '/skills/link/empirical_knowledge.png',
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    // 成功 proc 時視為向怪物上 debuff(供 linkCycle/triggerOn='debuffApplied' 使用)
    appliesDebuff: true,
  },
  {
    id: 'fervent_drain',
    source: 'passive',
    passiveType: 'dotCount',
    nameKey: 'battleBuffs.fervent_drain.name',
    descriptionKey: 'battleBuffs.fervent_drain.description',
    imageUrl: YETIDB('Elemental_Drain'),
    jobs: ['archmageFP'],
    maxStacks: 5,
    perStackFinalDmgPct: 5, // 每一層 +5% 最終傷害(同技能層數相加,不同來源互乘)
  },
  {
    id: 'arcane_aim',
    source: 'passive',
    passiveType: 'procOnHit',
    nameKey: 'battleBuffs.arcane_aim.name',
    descriptionKey: 'battleBuffs.arcane_aim.description',
    imageUrl: YETIDB('Arcane_Aim'),
    jobs: ['archmageFP', 'archmageIL', 'bishop'],
    // Lv30:每次攻擊 100% 機率疊 1 層,上限 5 層,持續 5 秒(每層觸發刷新計時)
    procRate: 100,
    maxStacks: 5,
    durationSec: 5,
    perStackDamagePct: 8, // 每層 +8% Damage(同層相加,與 CP 的 Damage% 相加後併入 basic/boss)
    // 註:Arcane Aim 的 20% 無視防禦已在 CP 面板 (SKILLS 內) 計入,此處只補戰鬥層的 Damage 疊層
  },
  {
    id: 'infinity',
    source: 'activeToggle',
    nameKey: 'battleBuffs.infinity.name',
    descriptionKey: 'battleBuffs.infinity.description',
    imageUrl: YETIDB('Infinity'),
    jobs: ['archmageFP'],
    baseLevel: 30,
    // 等級 = baseLevel + (Combat Orders 啟用 ? 1 : 0)
    //   durationSec    = 40 + (level - 30)
    //   baseFinalDmgPct = 70 + (level - 30)
    base: {
      durationSec: 40,
      baseFinalDmgPct: 70,
      tickIntervalSec: 5,
      tickIncreasePct: 3,
    },
    perLevelBonus: {
      durationSec: 1,
      baseFinalDmgPct: 1,
    },
    cooldownSec: 180,
    cooldownIgnoresReset: true, // 註記:此 CD 不受 CD 重置影響
    // 戰鬥開始到第一次自動施放的延遲 (施放動作)
    initialDelayBySpeed: { 7: 500, 8: 450 },
  },
  {
    id: 'thiefs_cunning',
    source: 'linkCycle',
    nameKey: 'linkSkill.skills.thiefs_cunning.name',
    descriptionKey: 'linkSkill.skills.thiefs_cunning.flavor',
    imageUrl: '/skills/link/thiefs_cunning.png',
    // 觸發條件:對怪物上 debuff 時(目前由 Empirical Knowledge 成功 proc 代表)
    // 啟動後 CD 從觸發瞬間算 → duration 結束後再等 (cooldown - duration) 秒才能重觸發
    triggerOn: 'debuffApplied',
  },
]

// 解出 activeToggle buff 在指定等級的效果參數
export function resolveActiveToggleStats(buff, level) {
  const bl = buff.baseLevel || 1
  const delta = Math.max(0, (level || bl) - bl)
  const base = buff.base || {}
  const per = buff.perLevelBonus || {}
  return {
    level: bl + delta,
    durationSec: (base.durationSec || 0) + delta * (per.durationSec || 0),
    baseFinalDmgPct: (base.baseFinalDmgPct || 0) + delta * (per.baseFinalDmgPct || 0),
    tickIntervalSec: base.tickIntervalSec || 0,
    tickIncreasePct: base.tickIncreasePct || 0,
    cooldownSec: buff.cooldownSec || 0,
  }
}

export function visibleBuffsForJob(jobKey) {
  return BATTLE_BUFFS.filter((b) => !b.jobs || b.jobs.includes(jobKey))
}
