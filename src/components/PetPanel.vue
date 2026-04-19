<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { usePet } from '../composables/usePet.js'
import { PET_COUNT_BONUS } from '../constants/pets.js'

const { t } = useI18n()
const {
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
} = usePet()

const countOptions = computed(() =>
  Array.from({ length: PET_COUNT_MAX + 1 }, (_, n) => ({
    value: n,
    bonus: PET_COUNT_BONUS[n] || 0,
  })),
)
</script>

<template>
  <section class="pet-panel">
    <header class="pet-panel__head">
      <span>{{ t('pet.title') }}</span>
      <button class="pet-panel__reset" type="button" @click="reset">
        {{ t('pet.reset') }}
      </button>
    </header>

    <!-- 總覽 (ATT / Magic ATT 合計) -->
    <div class="pet-summary">
      <div class="pet-summary__row">
        <span class="pet-summary__label">ATT / Magic ATT</span>
        <span class="pet-summary__val">+{{ totalAtkBonus }}</span>
      </div>
      <div class="pet-summary__breakdown">
        <span>{{ t('pet.countBonus') }}: +{{ countBonus }}</span>
        <span>{{ t('pet.equipmentBonus', { n: equippedCount }) }}: +{{ equipmentBonus }}</span>
      </div>
    </div>

    <!-- Multi Pet 隻數 -->
    <div class="pet-section">
      <div class="pet-section__label">{{ t('pet.multiPet') }}</div>
      <div class="pet-count-options">
        <button
          v-for="opt in countOptions"
          :key="opt.value"
          type="button"
          class="pet-count-btn"
          :class="{ 'pet-count-btn--active': state.count === opt.value }"
          @click="setCount(opt.value)"
        >
          <span class="pet-count-btn__n">{{ opt.value }}</span>
          <span class="pet-count-btn__plus">+{{ opt.bonus }}</span>
        </button>
      </div>
    </div>

    <!-- 寵物裝備 toggles -->
    <div class="pet-section">
      <div class="pet-section__label">
        {{ t('pet.equipment') }}
        <span class="pet-section__hint">(+{{ PET_EQUIPMENT_BONUS }} / {{ t('pet.each') }})</span>
      </div>
      <div class="pet-equipment-grid">
        <button
          v-for="i in PET_EQUIPMENT_SLOTS"
          :key="i"
          type="button"
          class="pet-equip-btn"
          :class="{ 'pet-equip-btn--on': state.equipment[i - 1] }"
          @click="toggleEquipment(i - 1)"
        >
          <span>{{ t('pet.equipmentSlot', { n: i }) }}</span>
          <span class="pet-equip-btn__status">
            {{ state.equipment[i - 1] ? t('pet.on') : t('pet.off') }}
          </span>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.pet-panel {
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border: 1px solid #3d4554;
  border-radius: 14px;
  padding: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #f1f3f7;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}
.pet-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: linear-gradient(180deg, #3d4554 0%, #2f3642 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #ffc857;
  font-size: 0.92rem;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.pet-panel__reset {
  padding: 0.25rem 0.65rem;
  background: transparent;
  color: #c9d2dd;
  border: 1px solid #2f3642;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}
.pet-panel__reset:hover { color: #ffc857; border-color: #ffc857; }

.pet-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.pet-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.pet-summary__label {
  font-size: 0.82rem;
  font-weight: 600;
  color: #c9d2dd;
  letter-spacing: 0.04em;
}
.pet-summary__val {
  font-size: 1.05rem;
  font-weight: 700;
  color: #ffc857;
  font-variant-numeric: tabular-nums;
}
.pet-summary__breakdown {
  display: flex;
  justify-content: space-between;
  font-size: 0.72rem;
  color: #8ea6b8;
  letter-spacing: 0.02em;
}

.pet-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.pet-section__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #c9d2dd;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.pet-section__hint {
  font-size: 0.7rem;
  color: #8ea6b8;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.pet-count-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
}
.pet-count-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  background: #2b3441;
  color: #e8edf2;
  border: 1px solid #141a22;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
}
.pet-count-btn:hover { border-color: #ffc857; }
.pet-count-btn--active {
  background: #3d4554;
  border-color: #ffc857;
  box-shadow: 0 0 0 1px rgba(255, 200, 87, 0.35);
}
.pet-count-btn__n {
  font-size: 1rem;
  font-weight: 700;
  color: #ffc857;
  font-variant-numeric: tabular-nums;
}
.pet-count-btn__plus {
  font-size: 0.68rem;
  color: #5cd1ea;
  font-weight: 600;
}

.pet-equipment-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}
.pet-equip-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 6px 4px;
  background: #2b3441;
  color: #c9d2dd;
  border: 1px solid #141a22;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
}
.pet-equip-btn:hover { border-color: #ffc857; color: #ffc857; }
.pet-equip-btn--on {
  background: #3d4554;
  border-color: #ffc857;
  color: #ffc857;
  box-shadow: 0 0 0 1px rgba(255, 200, 87, 0.35);
}
.pet-equip-btn__status {
  font-size: 0.68rem;
  letter-spacing: 0.08em;
}
</style>
