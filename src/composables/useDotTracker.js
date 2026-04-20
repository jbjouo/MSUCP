import { reactive } from 'vue'

// 追蹤目前目標身上生效中的 DoT 數量 (由戰鬥模擬器 useBattleSim 寫入,
// 其他模組如 useBattleBuffs 讀取以計算依賴「DoT 數量」的被動 buff)

const state = reactive({
  activeDotCount: 0,
})

export function useDotTracker() {
  function setActiveDotCount(n) {
    state.activeDotCount = Math.max(0, Math.floor(Number(n) || 0))
  }
  return { state, setActiveDotCount }
}
