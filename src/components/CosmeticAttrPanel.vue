<script setup>
import { useI18n } from 'vue-i18n'
import { useCosmetic } from '../composables/useCosmetic.js'
import { COSMETIC_ATTRS } from '../constants/cosmetic.js'

// 時裝期限屬性 — 已抽選完成,直接下拉選數值
const { t } = useI18n()
const { state, setAttr } = useCosmetic()

function onChange(slot, e) {
  setAttr(slot, e.target.value === '' ? null : Number(e.target.value))
}
</script>

<template>
  <div class="attr-panel">
    <header class="attr-panel__header">
      <h2>{{ t('cosmetic.attr.title') }}</h2>
    </header>
    <div class="attr-list">
      <label v-for="def in COSMETIC_ATTRS" :key="def.slot" class="attr-row">
        <span class="attr-row__slot">{{ t(`equipment.slots.${def.slot}`) }}</span>
        <span class="attr-row__stat">{{ t(def.labelKey) }}</span>
        <select
          class="attr-row__select"
          :class="{ 'attr-row__select--set': state.attrs[def.slot] }"
          :value="state.attrs[def.slot] ?? ''"
          @change="onChange(def.slot, $event)"
        >
          <option value="">{{ t('cosmetic.attr.none') }}</option>
          <option v-for="v in def.tiers" :key="v" :value="v">+{{ v }}{{ def.pct ? '%' : '' }}</option>
        </select>
      </label>
    </div>
  </div>
</template>

<style scoped>
.attr-panel {
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}
.attr-panel__header h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: #ffcc33;
}
.attr-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.attr-row {
  display: grid;
  grid-template-columns: 4.5rem 1fr 6.5rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.6rem;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 8px;
  font-size: 0.82rem;
}
.attr-row__slot {
  color: #8089a3;
  font-weight: 700;
}
.attr-row__stat {
  color: #e9edf5;
}
.attr-row__select {
  background: #141a2e;
  color: #8089a3;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.25rem 0.4rem;
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
}
.attr-row__select:focus-visible {
  outline: none;
  border-color: #7ee8fa;
}
.attr-row__select--set {
  color: #7ee8fa;
  font-weight: 700;
  border-color: rgba(126, 232, 250, 0.45);
}
</style>
