<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCosmetic } from '../composables/useCosmetic.js'
import { useCpDamage } from '../composables/useCpDamage.js'
import { COSMETIC_ATTRS } from '../constants/cosmetic.js'

// 時裝期限屬性 — 已抽選完成,直接下拉選數值
const { t } = useI18n()
const { state, setAttr } = useCosmetic()
const { combatPowerForCosmeticAttrs } = useCpDamage()

// 各部位各數值的 CP 增量:以「其他部位維持目前設定、本部位為無」為基準
//   cpGain[slot][value] = CP(本部位=value) − CP(本部位=無)
const cpGain = computed(() => {
  const out = {}
  for (const def of COSMETIC_ATTRS) {
    const base = combatPowerForCosmeticAttrs({ ...state.attrs, [def.slot]: null })
    out[def.slot] = {}
    for (const v of def.tiers) {
      out[def.slot][v] = combatPowerForCosmeticAttrs({ ...state.attrs, [def.slot]: v }) - base
    }
  }
  return out
})

function fmtGain(n) {
  return `${n >= 0 ? '+' : ''}${n.toLocaleString()}`
}

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
          <option v-for="v in def.tiers" :key="v" :value="v">
            +{{ v }}{{ def.pct ? '%' : '' }} ({{ t('cosmetic.attr.cpShort') }} {{ fmtGain(cpGain[def.slot][v]) }})
          </option>
        </select>
        <span
          class="attr-row__cp"
          :class="{ 'attr-row__cp--none': !state.attrs[def.slot] || !cpGain[def.slot][state.attrs[def.slot]] }"
        >
          <template v-if="state.attrs[def.slot]">
            {{ t('cosmetic.attr.cpGain') }} {{ fmtGain(cpGain[def.slot][state.attrs[def.slot]]) }}
            <span v-if="!cpGain[def.slot][state.attrs[def.slot]]" class="attr-row__note">{{ t('cosmetic.attr.notInCp') }}</span>
          </template>
          <template v-else>{{ t('cosmetic.attr.cpGain') }} —</template>
        </span>
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
  grid-template-columns: 4.5rem 1fr 11rem;
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
.attr-row__cp {
  grid-column: 2 / -1;
  font-size: 0.74rem;
  font-weight: 700;
  color: #ffc857;
  letter-spacing: 0.02em;
}
.attr-row__cp--none {
  color: #5d6582;
  font-weight: 400;
}
.attr-row__note {
  margin-left: 0.4rem;
  font-size: 0.7rem;
}
.attr-row__select--set {
  color: #7ee8fa;
  font-weight: 700;
  border-color: rgba(126, 232, 250, 0.45);
}
</style>
