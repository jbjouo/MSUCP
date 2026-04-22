<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCharacter } from '../composables/useCharacter.js'
import LinkSkillPanel from '../components/LinkSkillPanel.vue'
import CollectionPanel from '../components/CollectionPanel.vue'
import LegionPanel from '../components/LegionPanel.vue'
import HyperStatPanel from '../components/HyperStatPanel.vue'
import ArcanePanel from '../components/ArcanePanel.vue'
import PetPanel from '../components/PetPanel.vue'
import InnerPotentialPanel from '../components/InnerPotentialPanel.vue'
import VMatrixPanel from '../components/VMatrixPanel.vue'
import HyperSkillPanel from '../components/HyperSkillPanel.vue'
import {
  exportData,
  importData,
  downloadJSON,
  readFileAsJSON,
  loadSeedFile,
} from '../composables/useDataIO.js'

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

// ── 資料匯出 / 匯入 ───────────────────────────
const fileInput = ref(null)
const ioStatus = ref('')

function onExport() {
  const payload = exportData()
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  downloadJSON(payload, `msucp-data-${stamp}.json`)
  ioStatus.value = t('character.io.exported')
  setTimeout(() => { ioStatus.value = '' }, 2500)
}
function triggerImport() { fileInput.value?.click() }
async function onFileSelected(e) {
  const f = e.target.files?.[0]
  if (!f) return
  if (!confirm(t('character.io.confirmImport'))) {
    e.target.value = ''
    return
  }
  try {
    const payload = await readFileAsJSON(f)
    importData(payload) // reload inside
  } catch (err) {
    alert(`${t('character.io.importFailed')}\n${err.message || err}`)
    e.target.value = ''
  }
}
async function onLoadSeed() {
  if (!confirm(t('character.io.confirmSeed'))) return
  try {
    const payload = await loadSeedFile()
    importData(payload)
  } catch (err) {
    alert(`${t('character.io.seedFailed')}\n${err.message || err}`)
  }
}
</script>

<template>
  <section class="char-page">
    <header class="char-page__head">
      <h1>{{ t('pages.character.title') }}</h1>
      <div class="char-page__actions">
        <span v-if="ioStatus" class="char-page__status">{{ ioStatus }}</span>
        <button class="btn" type="button" @click="onExport">{{ t('character.io.export') }}</button>
        <button class="btn" type="button" @click="triggerImport">{{ t('character.io.import') }}</button>
        <button class="btn btn--ghost" type="button" @click="onLoadSeed">{{ t('character.io.loadSeed') }}</button>
        <button class="btn btn--ghost" type="button" @click="reset">{{ t('character.action.reset') }}</button>
        <input
          ref="fileInput"
          type="file"
          accept="application/json,.json"
          class="char-page__file"
          @change="onFileSelected"
        />
      </div>
    </header>

    <!-- 總覽卡 (上方) -->
    <aside class="summary-card">
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
    </aside>

    <!-- 表單 -->
    <form class="form" @submit.prevent>
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

      <p class="form__saved">{{ t('character.autoSaved') }}</p>
    </form>

    <!-- Link Skill 系統 -->
    <LinkSkillPanel />

    <!-- 聯盟戰地 (獨立一整塊) -->
    <LegionPanel />

    <!-- 圖鑑 + Hyper Stat (左右分割) -->
    <div class="char-page__split">
      <CollectionPanel />
      <HyperStatPanel />
    </div>

    <!-- ARC 系統 + 寵物 (左右 5:5) -->
    <div class="char-page__split">
      <ArcanePanel />
      <PetPanel />
    </div>

    <!-- 內潛 (獨立一整行) -->
    <InnerPotentialPanel />

    <!-- V 矩陣 (獨立一整行) -->
    <VMatrixPanel />

    <!-- 超技能 (5 點配點) -->
    <HyperSkillPanel />
  </section>
</template>

<style scoped>
.char-page {
  padding: 0.5rem 0 2rem;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.char-page__split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
  align-items: stretch;
}
@media (max-width: 900px) {
  .char-page__split { grid-template-columns: 1fr; }
}
.char-page__reserved {
  /* 右側保留區 — 供未來面板填入,目前維持空白 */
  min-height: 1px;
}
.char-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.char-page__actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.char-page__status {
  color: #8fe09d;
  font-size: 0.78rem;
  letter-spacing: 0.02em;
}
.char-page__file { display: none; }
.char-page__head h1 {
  margin: 0;
  font-size: 1.3rem;
  letter-spacing: 0.08em;
  color: #ffc857;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}

.summary-card,
.form {
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border: 1px solid #3d4554;
  border-radius: 14px;
  padding: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #f1f3f7;
}
.summary-card__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  padding: 8px 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.chip {
  font-size: 0.82rem;
  padding: 0.18rem 0.7rem;
  border-radius: 999px;
  background: #2b3441;
  border: 1px solid #141a22;
  color: #e8edf2;
  letter-spacing: 0.02em;
}
.chip--stat { color: #5cd1ea; }

.form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.form__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  padding: 10px 14px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.form__row { display: flex; flex-direction: column; gap: 0.25rem; }
.form__label {
  font-size: 0.78rem;
  color: #c9d2dd;
  letter-spacing: 0.02em;
  font-weight: 600;
}
.form__input {
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 6px;
  padding: 0.45rem 0.7rem;
  font-family: inherit;
  font-size: 0.88rem;
  transition: border-color 100ms ease;
}
.form__input:focus { outline: none; border-color: #ffc857; }
.form__hint { color: #8ea6b8; font-size: 0.7rem; }

.form__saved {
  margin: 0;
  color: #8fe09d;
  font-size: 0.72rem;
  text-align: right;
}

.btn {
  padding: 0.4rem 0.9rem;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  color: #f1f3f7;
  border: 1px solid #3d4554;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  transition: filter 120ms ease, border-color 120ms ease;
}
.btn:hover { filter: brightness(1.12); border-color: #ffc857; }
.btn--ghost { background: transparent; }

@media (max-width: 720px) {
  .char-page__head h1 { font-size: 1.2rem; }
}
</style>
