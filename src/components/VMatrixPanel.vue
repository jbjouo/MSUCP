<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useVMatrix } from '../composables/useVMatrix.js'
import { maxLevelOf, vmatrixNameKey, vmatrixDescriptionKey } from '../constants/vmatrix.js'

const { t } = useI18n()
const { state, setLevel, visibleSkills: jobSkills, MAX_LEVEL } = useVMatrix()

// V 矩陣面板:顯示所有帶 vmatrix 欄位的技能(不論 kind='boost' 或 'skill')
const visibleSkills = computed(() =>
  jobSkills.value.filter((s) => !!s.vmatrix),
)
</script>

<template>
  <section class="vm-panel">
    <header class="vm-panel__head">
      <span>{{ t('vmatrix.title') }}</span>
    </header>

    <div class="vm-grid">
      <div
        v-for="skill in visibleSkills"
        :key="skill.id"
        class="vm-cell"
        :title="vmatrixDescriptionKey(skill) ? t(vmatrixDescriptionKey(skill)) : ''"
      >
        <img
          class="vm-cell__icon"
          :src="skill.imageUrl"
          :alt="t(vmatrixNameKey(skill))"
          loading="lazy"
        />
        <div class="vm-cell__name">{{ t(vmatrixNameKey(skill)) }}</div>
        <div class="vm-cell__level">
          <input
            type="number"
            class="vm-cell__input"
            min="0"
            :max="maxLevelOf(skill)"
            :value="state.levels[skill.id] || 0"
            @input="(e) => setLevel(skill.id, e.target.value)"
          />
          <span class="vm-cell__cap">/ {{ maxLevelOf(skill) }}</span>
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
.vm-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(104px, 1fr));
  gap: 8px;
  padding: 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

/* Cell:固定三段 — icon / name / level
   外框統一素色(不隨狀態變色),底色統一藍灰,不依 kind 區分 */
.vm-cell {
  display: grid;
  grid-template-rows: auto 2.4em auto;
  align-items: center;
  justify-items: center;
  gap: 6px;
  padding: 8px 4px;
  background: #3d4654;
  border: 1px solid #1a1f27;
  border-radius: 6px;
  min-width: 0;
}

.vm-cell__icon {
  width: 40px;
  height: 40px;
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
  line-height: 1.2;
  width: 100%;
  word-break: break-word;
  hyphens: auto;
  display: flex;
  align-items: center;
  justify-content: center;
}
.vm-cell__level {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}
.vm-cell__input {
  width: 44px;
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
  font-size: 0.7rem;
  color: #8ea6b8;
  font-variant-numeric: tabular-nums;
}
</style>
