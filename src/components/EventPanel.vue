<script setup>
import { useI18n } from 'vue-i18n'
import { useEvent } from '../composables/useEvent.js'

const { t } = useI18n()
const {
  state,
  EVENT_SKILLS,
  EVENT_MAX_STAGE,
  EVENT_STAGE_POINTS,
  increment,
  decrement,
  resetAll,
} = useEvent()

const PCT_KEYS_EVENT = new Set(['bossDmg', 'ignoreDef', 'critRate', 'buffDuration'])

function currentValueText(skill) {
  const st = state.stage
  if (!st) return '0'
  const [k, v] = Object.entries(skill.valueAt(st) || {})[0] || []
  if (k === undefined) return '0'
  return `+${v}${PCT_KEYS_EVENT.has(k) ? '%' : ''}`
}
</script>

<template>
  <section class="ev-panel">
    <header class="ev-panel__head">
      <span>{{ t('event.title') }}</span>
      <button type="button" class="ev-panel__reset" @click="resetAll">
        {{ t('event.reset') }}
      </button>
    </header>

    <div class="ev-panel__body">
      <div class="ev-row ev-row--stage">
        <span class="ev-row__name">{{ t('event.stage') }}</span>
        <span class="ev-row__value" :class="{ 'ev-row__value--zero': !state.stage }">
          {{ t('event.points', { n: EVENT_STAGE_POINTS[state.stage] }) }}
        </span>
        <span class="ev-row__controls">
          <button
            class="ev-btn"
            type="button"
            :disabled="state.stage <= 0"
            @click="decrement"
          >−</button>
          <button
            class="ev-btn ev-btn--plus"
            type="button"
            :disabled="state.stage >= EVENT_MAX_STAGE"
            @click="increment"
          >＋</button>
        </span>
        <span class="ev-row__lv">
          Stage
          <span class="ev-row__num">{{ state.stage }}</span>
          <span class="ev-row__cap">/ {{ EVENT_MAX_STAGE }}</span>
        </span>
      </div>
      <div
        v-for="skill in EVENT_SKILLS"
        :key="skill.id"
        class="ev-row"
      >
        <span class="ev-row__name">{{ t(skill.labelKey) }}</span>
        <span class="ev-row__value" :class="{ 'ev-row__value--zero': !state.stage }">
          {{ currentValueText(skill) }}
        </span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.ev-panel {
  width: 100%;
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
  gap: 8px;
}
.ev-panel__head {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border: 1px solid #3d4554;
  border-radius: 8px;
  letter-spacing: 0.2em;
  font-weight: 700;
  font-size: 0.78rem;
  color: #ffc857;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.ev-panel__reset {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  color: #f1f3f7;
  border: 1px solid #3d4554;
  border-radius: 4px;
  padding: 0.2rem 0.6rem;
  font-family: inherit;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  cursor: pointer;
}
.ev-panel__reset:hover { filter: brightness(1.12); border-color: #ffc857; }

.ev-panel__body {
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  padding: 8px 12px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-x: hidden;
}

.ev-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(64px, auto) 64px 78px;
  align-items: center;
  gap: 8px;
  padding: 4px 4px;
  border-radius: 4px;
  font-size: 0.86rem;
  min-width: 0;
}
.ev-row:hover { background: rgba(255, 255, 255, 0.04); }
.ev-row--stage {
  padding-bottom: 6px;
  margin-bottom: 2px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.ev-row__name {
  color: #e8edf2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ev-row__value {
  color: #ffc857;
  font-weight: 700;
  text-align: right;
  font-size: 0.84rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ev-row__value--zero { color: #6a7684; font-weight: 500; }

.ev-row__controls { display: flex; gap: 4px; justify-content: flex-end; }
.ev-row__lv {
  color: #c9d2dd;
  font-size: 0.8rem;
  white-space: nowrap;
  text-align: right;
}
.ev-row__num { color: #ffc857; font-weight: 800; margin: 0 2px; }
.ev-row__cap { color: #8ea6b8; font-size: 0.74rem; }

.ev-btn {
  width: 26px;
  height: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  color: #f1f3f7;
  border: 1px solid #3d4554;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 700;
  line-height: 1;
}
.ev-btn:hover:not(:disabled) { filter: brightness(1.12); border-color: #ffc857; }
.ev-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.ev-btn--plus {
  background: linear-gradient(180deg, #5faee4 0%, #3e8ab8 100%);
  border-color: #1d5a78;
}
.ev-btn--plus:disabled { background: linear-gradient(180deg, #5b6577 0%, #49525f 100%); border-color: #3d4554; }
</style>
