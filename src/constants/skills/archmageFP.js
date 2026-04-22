// [相容殼] — 新結構請看 ./jobs/archmage-fp/
//
// 原本的技能資料與 helper 已拆散到:
//   ./jobs/archmage-fp/{0th,1st,2nd,3rd,4th,5th,6th,hyper,index}.js
//   ./_shared/helpers.js
//
// 此檔僅重新輸出原有命名,以維持既有 consumer (useBattleSim / useVMatrix / BattlePage 等) 的 import 不受影響。

export {
  ARCHMAGE_FP_SKILLS,
  FLAME_SWEEP,
  FLAME_HAZE,
  MIST_ERUPTION,
  POISON_MIST,
  INFERNO_AURA,
  IFRIT,
  TELEPORT_MASTERY,
  METEOR_SHOWER,
  IGNITE,
  BURNING_MAGIC,
} from './jobs/archmage-fp/index.js'

export {
  skillDamagePct,
  skillIgnoreDefPct,
  skillExplosionCount,
  skillExplosionFinalDmgPct,
  skillVmatrixBonus,
  skillFinalAttackPcts,
  skillIgnitePcts,
} from './_shared/helpers.js'
