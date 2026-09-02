// 夜光 (Luminous) — 戰鬥模擬職業機制設定
//
// stateMirror — 光暗狀態鏡:
//   光狀態只排程 light 技能,暗狀態只排程 dark 技能,平衡狀態都可用
//   施放光/暗技能時增加能量,能量滿後使用平衡技能進入平衡
//   平衡期間平衡技能 CD 歸零
//   平衡結束後自動切換到下一個狀態(光→暗,暗→光)

export const LUMINOUS_MECHANICS = {
  stateMirror: {
    maxEnergy: 10000,
    initialState: 'light',
    initialEnergy: 10000,
    equilibriumDurationSec: 17,
    darknessMasteryDurationBonus: 7,
    darknessMasteryEnergyBonus: 0.05,
  },
}
