import { reactive, computed, watch } from 'vue'
import {
  PET_COUNT_MAX,
  PET_EQUIPMENT_BONUS,
  PET_EQUIPMENT_SLOTS,
  petCountBonus,
} from '../constants/pets.js'

const STORAGE_KEY = 'msucp.pet.v1'

function defaultState() {
  return {
    count: 0,
    equipment: Array.from({ length: PET_EQUIPMENT_SLOTS }, () => false),
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const count = Math.max(0, Math.min(PET_COUNT_MAX, Math.floor(Number(parsed?.count) || 0)))
      const equipment = Array.from(
        { length: PET_EQUIPMENT_SLOTS },
        (_, i) => !!parsed?.equipment?.[i],
      )
      return { count, equipment }
    }
  } catch { /* fall through */ }
  return defaultState()
}

const state = reactive(loadState())

watch(state, (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}, { deep: true })

export function usePet() {
  const countBonus = computed(() => petCountBonus(state.count))
  const equippedCount = computed(() => state.equipment.filter(Boolean).length)
  const equipmentBonus = computed(() => equippedCount.value * PET_EQUIPMENT_BONUS)
  const totalAtkBonus = computed(() => countBonus.value + equipmentBonus.value)
  function setCount(n) {
    state.count = Math.max(0, Math.min(PET_COUNT_MAX, Math.floor(Number(n) || 0)))
  }
  function toggleEquipment(index) {
    if (index < 0 || index >= PET_EQUIPMENT_SLOTS) return
    state.equipment[index] = !state.equipment[index]
  }
  function reset() {
    state.count = 0
    for (let i = 0; i < PET_EQUIPMENT_SLOTS; i++) state.equipment[i] = false
  }
  return {
    state,
    countBonus,
    equippedCount,
    equipmentBonus,
    totalAtkBonus,
    setCount,
    toggleEquipment,
    reset,
    PET_COUNT_MAX,
    PET_EQUIPMENT_BONUS,
    PET_EQUIPMENT_SLOTS,
  }
}
