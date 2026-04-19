// 寵物系統 — Multi Pet 隻數 + 寵物裝備 toggles
//
// Multi Pet 隻數 (ATT / Magic ATT 加成):
//   1 隻 → +3   / +3
//   2 隻 → +14  / +14
//   3 隻 → +30  / +30
//
// 寵物裝備 (每件 toggle 開啟):
//   ATT / Magic ATT 各 +5 / 件

export const PET_COUNT_MAX = 3
// index = 寵物隻數 (0 / 1 / 2 / 3)
export const PET_COUNT_BONUS = [0, 3, 14, 30]
export const PET_EQUIPMENT_BONUS = 5
export const PET_EQUIPMENT_SLOTS = 3

export function petCountBonus(n) {
  const i = Math.max(0, Math.min(PET_COUNT_MAX, Math.floor(Number(n) || 0)))
  return PET_COUNT_BONUS[i] || 0
}
