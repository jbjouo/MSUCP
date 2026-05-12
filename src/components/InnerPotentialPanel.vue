<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useInnerPotential } from '../composables/useInnerPotential.js'
import {
  INNER_POTENTIAL_OPTIONS,
  getInnerPotentialOption,
  optionFields,
  optionHasInput,
} from '../constants/innerPotential.js'

const { t } = useI18n()
const { state, setOption, setValue } = useInnerPotential()

const options = computed(() =>
  INNER_POTENTIAL_OPTIONS.map((o) => ({
    id: o.id,
    label: t(o.nameKey),
  })),
)

function lineOption(idx) {
  return getInnerPotentialOption(state.lines[idx]?.id)
}
function lineFields(idx) {
  return optionFields(lineOption(idx))
}
function lineHasInput(idx) {
  return optionHasInput(lineOption(idx))
}
function lineIsSpecial(idx) {
  const o = lineOption(idx)
  return !!(o && o.specialEffect)
}
function fieldUnit(field) {
  return field?.isPct ? '%' : ''
}
function fieldLabelKey(statKey) {
  return `innerPotential.fieldKeys.${statKey}`
}
</script>

<template>
  <section class="ip-panel">
    <header class="ip-panel__head">
      <span>{{ t('innerPotential.title') }}</span>
    </header>

    <div class="ip-lines">
      <div
        v-for="(line, idx) in state.lines"
        :key="idx"
        class="ip-line"
      >
        <div class="ip-line__head">
          <span class="ip-line__label">{{ t('innerPotential.line', { n: idx + 1 }) }}</span>
          <select
            class="ip-line__select"
            :value="line.id || ''"
            @change="(e) => setOption(idx, e.target.value || null)"
          >
            <option value="">{{ t('innerPotential.placeholder') }}</option>
            <option v-for="opt in options" :key="opt.id" :value="opt.id">
              {{ opt.label }}
            </option>
          </select>
        </div>

        <div v-if="line.id" class="ip-line__body">
          <template v-if="lineHasInput(idx)">
            <div
              v-for="(field, fIdx) in lineFields(idx)"
              :key="fIdx"
              class="ip-field"
            >
              <span class="ip-field__name">{{ t(fieldLabelKey(field.statKey)) }}</span>
              <input
                type="number"
                class="ip-field__input"
                min="0"
                :max="field.max"
                :value="line.values[fIdx] || 0"
                @input="(e) => setValue(idx, fIdx, e.target.value)"
              />
              <span class="ip-field__unit">{{ fieldUnit(field) }}</span>
            </div>
          </template>
          <span v-else-if="lineIsSpecial(idx)" class="ip-line__special">
            {{ t('innerPotential.noInput') }}
          </span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ip-panel {
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
.ip-panel__head {
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
.ip-lines {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.ip-line {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: #2b3441;
  border: 1px solid #1a1f27;
  border-radius: 6px;
}
.ip-line__head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.ip-line__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffc857;
  letter-spacing: 0.04em;
  flex-shrink: 0;
  width: 56px;
}
.ip-line__select {
  flex: 1 1 auto;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
  font-family: inherit;
  font-size: 0.84rem;
  min-width: 0;
}
.ip-line__select:focus { outline: none; border-color: #ffc857; }

.ip-line__body {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding-left: 64px;
}
.ip-field {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
  padding: 0.2rem 0.45rem;
}
.ip-field__name {
  font-size: 0.74rem;
  color: #5cd1ea;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.ip-field__input {
  width: 60px;
  background: transparent;
  color: #f1f3f7;
  border: none;
  padding: 0.1rem 0;
  font-family: inherit;
  font-size: 0.86rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.ip-field__input:focus { outline: none; }
.ip-field__unit {
  font-size: 0.74rem;
  color: #c9d2dd;
  font-weight: 600;
  width: 12px;
  text-align: left;
}
.ip-line__special {
  font-size: 0.74rem;
  color: #8ea6b8;
  letter-spacing: 0.04em;
  padding-left: 64px;
}
</style>
