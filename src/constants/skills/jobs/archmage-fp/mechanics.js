// 火毒 (Archmage F/P) — 戰鬥模擬職業機制設定
//
// useBattleSim 引擎只實作「通用管線」,本檔決定哪些技能掛進哪條管線:
//   finalAttack — 主動攻擊技能施放時機率追打 (Meteor Shower passive Final Attack)
//                 掛入的技能需有 `finalAttack` 資料欄位 (procRate / damage)
//   ignite      — 指定屬性技能施放時機率生成獨立火牆 DoT (Ignite)
//                 掛入的技能需有 `ignite` 資料欄位 (procRate / damage / tick 設定)
//   dotPassive  — 場上 DoT ≥1 時主擊終傷 + DoT 時長倍率 (Burning Magic)
//   firstCastDebugSkillId — debug 用:戰鬥開始後第一次施放此技能時
//                 記錄傷害 snapshot 到 result.megiddoFirstCast
//
// 新職業要接戰鬥模擬時:
//   1. 各技能加上 `sim` 子物件 (排程資料)
//   2. 若有本檔涵蓋的機制,建立自己的 mechanics.js
//   3. 在 jobs/index.js 的 JOB_SKILL_REGISTRY entry 加上 `mechanics` 欄位
// 沒有 mechanics 的職業,引擎會自動跳過所有機制管線。

import { BURNING_MAGIC } from './3rd.js'

export const ARCHMAGE_FP_MECHANICS = {
  // Final Attack 追打:主動攻擊技能 (role='attack'、非 derived/aura/passive)
  // 每次施放 roll 一次;延遲火球型每顆 orb 獨立 roll 一次
  finalAttack: { skillId: 'meteor_shower' },
  // 火牆生成:triggerElement 屬性的技能施放時 roll;excludeSourceIds 內的來源不觸發
  ignite: {
    skillId: 'ignite',
    triggerElement: 'fire',
    excludeSourceIds: ['inferno_aura'],
  },
  // DoT 被動 (Burning Magic Lv10):場上 DoT ≥1 → 主擊終傷 +20%;DoT 時長 ×2
  // 數值單一來源:3rd.js 的 BURNING_MAGIC
  dotPassive: {
    finalDmgPctWhenDotActive: BURNING_MAGIC.finalDmgPctWhenDotActive,
    dotDurationMult: BURNING_MAGIC.dotDurationMult,
  },
  // debug snapshot 目標技能
  firstCastDebugSkillId: 'megiddo_flame',
  // Poison Region (Creeping Toxin) — 毒池生成 / 蔓延 / 引爆 / 補毒量化模型
  // 完整規格與實測依據:根目錄 POISON_REGION_SPEC.md (2026-07-26,逐幀實測)
  //   - 全域判定網格 ψ + n×0.922s (蔓延與補毒共用,不因毒爆重置)
  //   - 引爆事件 = 火屬主動攻擊 (role='attack') 的「命中時點」:
  //       一般技能 → 施放瞬間;延遲火球型 → 每顆 orb 的 fireAt
  //   - 每個生成週期只取第一個引爆事件;補毒 = 死區後的第一個判定 (輸出,非常數)
  //   - 左右池以死區 ±drift/2 保留 41ms/cycle 週期差 (鎖同相會低估傷害約三成)
  poisonRegion: {
    skillId: 'creeping_toxin',
    detonator: { triggerElement: 'fire' },   // + sim.role === 'attack' (引擎判定)
    poolCount: 3,                            // L1 + R1 + L2 (L2 晚一個判定生成;規格 §8.4 基準為 L1/R1)
    judgeIntervalSec: 0.922,                 // JUDGE_INTERVAL — 全域判定網格
    armDelaySec: 1.5,                        // ARM_DELAY — 生成 → 可引爆 (技能描述,硬性)
    deadTimeSec: 0.1,                        // DEAD_TIME — 毒爆 → 格位釋出 (規格擬合值 0.68;依實測調整)
    castAnimSec: 1.17,                       // CAST_ANIM — 施放 → 第 1 次判定
    triggerLagSec: 0.19,                     // TRIGGER_LAG — 引爆施放 → 畫面爆炸 (衰減排序用)
    sideDriftSecPerCycle: 0.041,             // 左右池週期差 (L1 2.804s vs R1 2.763s)
    chainDecay: { windowSec: 0.4, multiplier: 0.40 },  // ≤0.4s 連鎖爆炸 ×0.40 (韓版資料)
  },
}
