<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHyperSkills } from '../composables/useHyperSkills.js'
import { useCharacter } from '../composables/useCharacter.js'

const { t } = useI18n()
const {
  groups,
  usedPoints,
  remainingPoints,
  HYPER_SKILL_POINTS_CAP,
  isPicked,
  canPick,
  meetsLevel,
  toggle,
  resetAll,
} = useHyperSkills()
const { state: charState } = useCharacter()

// 沒有適用分支 (非 archmageFP) 就隱藏整塊
const hasOptions = computed(() => groups.value.some((g) => g.skills.length))
</script>

<template>
  <section v-if="hasOptions" class="hyskill-panel">
    <header class="hyskill-panel__head">
      <span>{{ t('hyperSkill.title') }}</span>
      <button class="hyskill-panel__reset" type="button" @click="resetAll">
        {{ t('hyperSkill.reset') }}
      </button>
    </header>

    <div class="hyskill-panel__groups">
      <div v-for="g in groups" :key="g.group" class="hyskill-col">
        <div class="hyskill-col__title">
          {{ t(`hyperSkill.groups.${g.group}`) }}
        </div>
        <div class="hyskill-col__list">
          <button
            v-for="sk in g.skills"
            :key="sk.id"
            class="hyskill-card"
            :class="{
              'hyskill-card--picked': isPicked(sk.id),
              'hyskill-card--locked': !meetsLevel(sk),
              'hyskill-card--disabled': !isPicked(sk.id) && !canPick(sk.id),
            }"
            type="button"
            :disabled="!isPicked(sk.id) && !canPick(sk.id)"
            :title="t(sk.descKey)"
            @click="toggle(sk.id)"
          >
            <img
              class="hyskill-card__icon"
              :src="sk.imageUrl"
              :alt="t(sk.nameKey)"
              loading="lazy"
            />
            <div class="hyskill-card__body">
              <div class="hyskill-card__name">{{ t(sk.nameKey) }}</div>
              <div class="hyskill-card__desc">{{ t(sk.descKey) }}</div>
              <div class="hyskill-card__meta">
                <span class="hyskill-card__req" :class="{ 'hyskill-card__req--ok': meetsLevel(sk) }">
                  Lv. {{ sk.levelReq }}
                </span>
                <span v-if="isPicked(sk.id)" class="hyskill-card__tag">
                  {{ t('hyperSkill.picked') }}
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>

    <footer class="hyskill-panel__foot">
      <span class="hyskill-panel__point-label">{{ t('hyperSkill.points') }}</span>
      <span class="hyskill-panel__point-val">
        <span class="hyskill-panel__used">{{ usedPoints }}</span>
        <span class="hyskill-panel__sep"> / </span>
        <span class="hyskill-panel__total">{{ HYPER_SKILL_POINTS_CAP }}</span>
      </span>
      <span class="hyskill-panel__remain">
        {{ t('hyperSkill.remaining', { n: remainingPoints }) }}
      </span>
    </footer>
  </section>
</template>

<style scoped>
.hyskill-panel {
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
.hyskill-panel__head {
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
.hyskill-panel__reset {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 3px 10px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  color: #e8edf2;
  border: 1px solid #141a22;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}
.hyskill-panel__reset:hover { filter: brightness(1.15); }

.hyskill-panel__groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  padding: 8px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
@media (max-width: 900px) {
  .hyskill-panel__groups { grid-template-columns: 1fr; }
}

.hyskill-col {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.hyskill-col__title {
  color: #ffc857;
  font-weight: 700;
  font-size: 0.76rem;
  letter-spacing: 0.1em;
  padding: 4px 6px;
  text-transform: uppercase;
  border-bottom: 1px solid #2f3642;
}
.hyskill-col__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.hyskill-card {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #141a22;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  color: inherit;
  font-family: inherit;
  transition: border-color 120ms ease, filter 120ms ease, background 120ms ease;
}
.hyskill-card:hover:not(:disabled) {
  border-color: #5cd1ea;
  filter: brightness(1.08);
}
.hyskill-card--picked {
  border-color: #ffc857;
  background: linear-gradient(180deg, #3d3526 0%, #2a2319 100%);
  box-shadow: 0 0 0 1px rgba(255, 200, 87, 0.35), 0 0 10px rgba(255, 200, 87, 0.2);
}
.hyskill-card--picked:hover { border-color: #ffc857; }
.hyskill-card--locked { opacity: 0.55; }
.hyskill-card--disabled { cursor: not-allowed; }
.hyskill-card--disabled:hover { filter: none; border-color: #141a22; }

.hyskill-card__icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
}
.hyskill-card__body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.hyskill-card__name {
  color: #e8edf2;
  font-weight: 700;
  font-size: 0.8rem;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hyskill-card--picked .hyskill-card__name { color: #ffc857; }
.hyskill-card__desc {
  color: #8ea6b8;
  font-size: 0.7rem;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}
.hyskill-card__meta {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 2px;
}
.hyskill-card__req {
  font-size: 0.68rem;
  color: #ff7b6b;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.hyskill-card__req--ok { color: #8fe09d; }
.hyskill-card__tag {
  font-size: 0.66rem;
  color: #ffc857;
  background: rgba(255, 200, 87, 0.1);
  border: 1px solid rgba(255, 200, 87, 0.4);
  border-radius: 3px;
  padding: 1px 5px;
  letter-spacing: 0.06em;
  font-weight: 700;
}

.hyskill-panel__foot {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-size: 0.82rem;
}
.hyskill-panel__point-label {
  color: #c9d2dd;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-size: 0.78rem;
}
.hyskill-panel__point-val {
  color: #f1f3f7;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.hyskill-panel__used { color: #ffc857; }
.hyskill-panel__sep { color: #8ea6b8; }
.hyskill-panel__total { color: #e8edf2; }
.hyskill-panel__remain {
  color: #8ea6b8;
  font-size: 0.74rem;
  text-align: right;
}
</style>
