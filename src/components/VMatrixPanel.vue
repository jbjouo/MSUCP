<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVMatrix } from '../composables/useVMatrix.js'

const { t } = useI18n()
const { state, setLevel, reset, visibleSkills: jobSkills, MAX_LEVEL } = useVMatrix()

// 暫時隱藏無被動效果的技能 (在職業可見範圍內再過濾)
const visibleSkills = computed(() => jobSkills.value.filter((s) => s.passive))
</script>

<template>
  <section class="vm-panel">
    <header class="vm-panel__head">
      <span>{{ t('vmatrix.title') }}</span>
      <button class="vm-panel__reset" type="button" @click="reset">
        {{ t('vmatrix.reset') }}
      </button>
    </header>

    <div class="vm-grid">
      <div
        v-for="skill in visibleSkills"
        :key="skill.id"
        class="vm-cell"
        :class="{ 'vm-cell--max': (state.levels[skill.id] || 0) >= MAX_LEVEL }"
      >
        <img
          class="vm-cell__icon"
          :src="skill.imageUrl"
          :alt="t(skill.nameKey)"
          :title="t(skill.nameKey)"
          loading="lazy"
        />
        <div class="vm-cell__name">{{ t(skill.nameKey) }}</div>
        <div class="vm-cell__input-wrap">
          <input
            type="number"
            class="vm-cell__input"
            min="0"
            :max="MAX_LEVEL"
            :value="state.levels[skill.id] || 0"
            @input="(e) => setLevel(skill.id, e.target.value)"
          />
          <span class="vm-cell__cap">/ {{ MAX_LEVEL }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.vm-panel {
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
.vm-panel__head {
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
.vm-panel__reset {
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
.vm-panel__reset:hover { color: #ffc857; border-color: #ffc857; }

.vm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 8px;
  padding: 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.vm-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px 4px;
  background: #2b3441;
  border: 1px solid #1a1f27;
  border-radius: 6px;
  min-width: 0;
}
.vm-cell--max {
  border-color: #ffc857;
  box-shadow: 0 0 0 1px rgba(255, 200, 87, 0.35);
}
.vm-cell__icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
  flex-shrink: 0;
}
.vm-cell__name {
  font-size: 0.7rem;
  color: #e8edf2;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-align: center;
  line-height: 1.15;
  width: 100%;
  word-break: break-word;
  hyphens: auto;
}
.vm-cell__input-wrap {
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}
.vm-cell__input {
  width: 42px;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 4px;
  padding: 0.15rem 0.3rem;
  font-family: inherit;
  font-size: 0.82rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.vm-cell__input:focus { outline: none; border-color: #ffc857; }
.vm-cell__cap {
  font-size: 0.66rem;
  color: #8ea6b8;
}
</style>
