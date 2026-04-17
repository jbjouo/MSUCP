<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCharacter } from '../composables/useCharacter.js'

const { t } = useI18n()
const {
  state,
  setField,
  reset,
  currentJob,
  primaryStat,
  LEVEL_MIN,
  LEVEL_MAX,
  JOB_BRANCHES,
  JOBS_BY_BRANCH,
} = useCharacter()

const branchOptions = JOB_BRANCHES.map((b) => b.key)
const jobOptions = computed(() => JOBS_BY_BRANCH[state.branch] || [])

function onField(key, e) {
  setField(key, e.target.value)
}
</script>

<template>
  <section class="char-page">
    <header class="char-page__head">
      <h1>{{ t('pages.character.title') }}</h1>
      <button class="btn btn--ghost" @click="reset">{{ t('character.action.reset') }}</button>
    </header>

    <div class="char-page__body">
      <!-- 總覽卡 -->
      <aside class="summary-card">
        <div class="summary-card__avatar" aria-hidden="true">
          <span>{{ state.name ? state.name.charAt(0).toUpperCase() : '?' }}</span>
        </div>
        <div class="summary-card__info">
          <div class="summary-card__name">
            {{ state.name || t('character.nameless') }}
          </div>
          <div class="summary-card__meta">
            <span class="chip">Lv. {{ state.level }}</span>
            <span class="chip">
              {{ currentJob ? t(`character.jobs.${state.job}`) : t('character.jobs.beginner') }}
            </span>
            <span class="chip chip--stat">
              {{ t('character.primary') }}:
              {{ t(`equipment.stats.${primaryStat}`) }}
            </span>
          </div>
          <div v-if="state.world" class="summary-card__world">
            {{ t('character.world') }} · {{ state.world }}
          </div>
        </div>
      </aside>

      <!-- 表單 -->
      <form class="form" @submit.prevent>
        <div class="form__row">
          <label class="form__label">{{ t('character.fields.name') }}</label>
          <input
            class="form__input"
            :value="state.name"
            :placeholder="t('character.placeholders.name')"
            maxlength="16"
            @input="(e) => onField('name', e)"
          />
        </div>

        <div class="form__grid">
          <div class="form__row">
            <label class="form__label">{{ t('character.fields.level') }}</label>
            <input
              type="number"
              class="form__input"
              :value="state.level"
              :min="LEVEL_MIN"
              :max="LEVEL_MAX"
              @input="(e) => onField('level', e)"
            />
            <small class="form__hint">{{ LEVEL_MIN }}–{{ LEVEL_MAX }}</small>
          </div>

          <div class="form__row">
            <label class="form__label">{{ t('character.fields.world') }}</label>
            <input
              class="form__input"
              :value="state.world"
              :placeholder="t('character.placeholders.world')"
              maxlength="24"
              @input="(e) => onField('world', e)"
            />
          </div>

          <div class="form__row">
            <label class="form__label">{{ t('character.fields.legionLevel') }}</label>
            <input
              type="number"
              class="form__input"
              :value="state.legionLevel"
              :min="0"
              @input="(e) => onField('legionLevel', e)"
            />
          </div>
        </div>

        <div class="form__grid">
          <div class="form__row">
            <label class="form__label">{{ t('character.fields.branch') }}</label>
            <select
              class="form__input"
              :value="state.branch"
              @change="(e) => onField('branch', e)"
            >
              <option v-for="b in branchOptions" :key="b" :value="b">
                {{ t(`character.branches.${b}`) }}
              </option>
            </select>
          </div>

          <div class="form__row">
            <label class="form__label">{{ t('character.fields.job') }}</label>
            <select
              class="form__input"
              :value="state.job"
              @change="(e) => onField('job', e)"
            >
              <option v-for="j in jobOptions" :key="j.key" :value="j.key">
                {{ t(`character.jobs.${j.key}`) }}
              </option>
            </select>
          </div>
        </div>

        <div class="form__row">
          <label class="form__label">{{ t('character.fields.notes') }}</label>
          <textarea
            class="form__input form__textarea"
            :value="state.notes"
            :placeholder="t('character.placeholders.notes')"
            rows="3"
            maxlength="500"
            @input="(e) => onField('notes', e)"
          />
        </div>

        <p class="form__saved">{{ t('character.autoSaved') }}</p>
      </form>
    </div>
  </section>
</template>

<style scoped>
.char-page {
  padding: 0.5rem 0 2rem;
}
.char-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.char-page__head h1 {
  margin: 0;
  font-size: 1.4rem;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #ffb347, #ffcc33, #7ee8fa);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.char-page__body {
  display: grid;
  grid-template-columns: minmax(260px, 340px) 1fr;
  gap: 1rem;
  align-items: start;
}

.summary-card {
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  display: flex;
  gap: 0.75rem;
  align-items: center;
}
.summary-card__avatar {
  width: 56px;
  height: 56px;
  flex-shrink: 0;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffb347, #ffcc33);
  color: #1b2133;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.5rem;
  letter-spacing: 0.02em;
}
.summary-card__info { min-width: 0; flex: 1; }
.summary-card__name {
  font-weight: 700;
  font-size: 1.05rem;
  color: #e9edf5;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0.3rem;
}
.summary-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.chip {
  font-size: 0.72rem;
  padding: 0.12rem 0.5rem;
  border-radius: 999px;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  color: #c9cfe3;
}
.chip--stat { color: #7ee8fa; border-color: #2a3152; }
.summary-card__world {
  color: #8089a3;
  font-size: 0.78rem;
  margin-top: 0.4rem;
}

.form {
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  padding: 1rem 1.1rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.85rem;
}

.form__row { display: flex; flex-direction: column; gap: 0.3rem; }
.form__label { font-size: 0.82rem; color: #8089a3; letter-spacing: 0.02em; }
.form__input {
  background: #0a0e1c;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 8px;
  padding: 0.5rem 0.7rem;
  font-family: inherit;
  font-size: 0.9rem;
  transition: border-color 100ms ease;
}
.form__input:focus { outline: none; border-color: #7ee8fa; }
.form__textarea { resize: vertical; min-height: 72px; }
.form__hint { color: #4a5170; font-size: 0.7rem; }

.form__saved {
  margin: 0;
  color: #22c55e;
  font-size: 0.72rem;
  text-align: right;
}

.btn {
  background: #1b2140;
  color: #e9edf5;
  border: 1px solid #2a3152;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: background 120ms ease, border-color 120ms ease;
}
.btn:hover { background: #232a4f; border-color: #7ee8fa; }
.btn--ghost { background: transparent; }

@media (max-width: 720px) {
  .char-page__body { grid-template-columns: 1fr; }
  .char-page__head h1 { font-size: 1.2rem; }
}
</style>
