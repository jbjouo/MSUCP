<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useArcane } from '../composables/useArcane.js'
import { useCharacter } from '../composables/useCharacter.js'
import { ARCANE_SYMBOLS } from '../constants/arcaneSymbols.js'

const { t } = useI18n()
const {
  state,
  totalArc,
  totalMainStat,
  setLevel,
  reset,
  MAX_LEVEL,
} = useArcane()
const { primaryStat } = useCharacter()

const primaryLabel = computed(() => t(`equipment.stats.${primaryStat.value}`))
</script>

<template>
  <section class="arc-panel">
    <header class="arc-panel__head">
      <span>{{ t('arcane.title') }}</span>
      <button class="arc-panel__reset" type="button" @click="reset">
        {{ t('arcane.reset') }}
      </button>
    </header>

    <!-- 總覽 (ARC / 主屬性) -->
    <div class="arc-summary">
      <div class="arc-summary__row">
        <span class="arc-summary__label">{{ t('arcane.totalArc') }}</span>
        <span class="arc-summary__val arc-summary__val--cyan">+{{ totalArc }}</span>
      </div>
      <div class="arc-summary__row">
        <span class="arc-summary__label">{{ primaryLabel }}</span>
        <span class="arc-summary__val arc-summary__val--gold">+{{ totalMainStat }}</span>
      </div>
    </div>

    <!-- 6 個符文 -->
    <div class="arc-grid">
      <div
        v-for="symbol in ARCANE_SYMBOLS"
        :key="symbol.id"
        class="arc-slot"
        :class="{ 'arc-slot--max': (state.levels[symbol.id] || 0) >= MAX_LEVEL }"
      >
        <img
          v-if="symbol.imageUrl"
          class="arc-slot__icon"
          :src="symbol.imageUrl"
          :alt="t(symbol.nameKey)"
          loading="lazy"
        />
        <div class="arc-slot__body">
          <div class="arc-slot__name">{{ t(symbol.nameKey) }}</div>
          <div class="arc-slot__input-wrap">
            <input
              type="number"
              class="arc-input"
              :min="0"
              :max="MAX_LEVEL"
              :value="state.levels[symbol.id] || 0"
              @input="(e) => setLevel(symbol.id, e.target.value)"
            />
            <span class="arc-cap">/ {{ MAX_LEVEL }}</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.arc-panel {
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
.arc-panel__head {
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
.arc-panel__reset {
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
.arc-panel__reset:hover { color: #ffc857; border-color: #ffc857; }

.arc-summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.arc-summary__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
}
.arc-summary__label {
  font-size: 0.78rem;
  color: #c9d2dd;
  letter-spacing: 0.04em;
  font-weight: 600;
}
.arc-summary__val {
  font-size: 0.98rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.arc-summary__val--cyan { color: #5cd1ea; }
.arc-summary__val--gold { color: #ffc857; }

.arc-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}
@media (max-width: 720px) {
  .arc-grid { grid-template-columns: 1fr 1fr; }
}

.arc-slot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  min-width: 0;
}
.arc-slot--max {
  border-color: #ffc857;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 0 0 1px rgba(255, 200, 87, 0.35);
}
.arc-slot__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 6px;
  flex-shrink: 0;
}
.arc-slot__body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  flex: 1 1 auto;
}
.arc-slot__name {
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  color: #e8edf2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.arc-slot__input-wrap {
  display: flex;
  align-items: center;
  gap: 0.3rem;
}
.arc-input {
  width: 50px;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 5px;
  padding: 0.2rem 0.35rem;
  font-family: inherit;
  font-size: 0.86rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}
.arc-input:focus { outline: none; border-color: #ffc857; }
.arc-cap {
  font-size: 0.72rem;
  color: #8ea6b8;
  flex-shrink: 0;
}
</style>
