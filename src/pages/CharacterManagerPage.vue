<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useActiveCharacter, readForCharacter } from '../composables/useActiveCharacter.js'

const { t, te } = useI18n()
const router = useRouter()
const {
  roster,
  createCharacter,
  renameCharacter,
  deleteCharacter,
  cloneCharacter,
  selectCharacter,
} = useActiveCharacter()

const renaming = ref(null) // { id, value }
function startRename(c) { renaming.value = { id: c.id, value: c.name } }
function commitRename() {
  if (!renaming.value) return
  renameCharacter(renaming.value.id, renaming.value.value)
  renaming.value = null
}
function cancelRename() { renaming.value = null }

function jobLabel(jobKey) {
  if (!jobKey) return '—'
  const key = `character.jobs.${jobKey}`
  return te(key) ? t(key) : jobKey
}

function summaryOf(charId) {
  const char = readForCharacter(charId, 'character.v1') || {}
  const snaps = readForCharacter(charId, 'cpCompare.v1')
  const latestCp =
    Array.isArray(snaps) && snaps.length
      ? snaps[0]?.cp ?? null
      : null
  const latestBossAvg =
    Array.isArray(snaps) && snaps.length
      ? snaps[0]?.bossAvg ?? null
      : null
  return {
    job: char.job || '',
    level: char.level || 1,
    name: char.name || '',
    latestCp,
    latestBossAvg,
  }
}

const charSummaries = computed(() =>
  roster.list.map((c) => ({ ...c, summary: summaryOf(c.id) })),
)

function fmtNum(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

function onCreate() {
  const name = window.prompt(t('charManager.promptCreate'), '')
  if (name == null) return
  const id = createCharacter(name)
  if (id) selectCharacter(id)
}
function onClone(c) {
  const id = cloneCharacter(c.id)
  if (id) alert(t('charManager.clonedTo', { name: c.name }))
}
function onDelete(c) {
  if (roster.list.length <= 1) {
    alert(t('charManager.cannotDeleteLast'))
    return
  }
  if (!window.confirm(t('charManager.confirmDelete', { name: c.name }))) return
  deleteCharacter(c.id)
}
function onSelect(c) {
  if (c.id === roster.activeId) {
    router.push('/character')
    return
  }
  selectCharacter(c.id)
  // selectCharacter triggers reload, so this won't run, but kept for safety
}
function goCurrent() {
  router.push('/character')
}
</script>

<template>
  <section class="char-manager">
    <header class="char-manager__head">
      <h2>{{ t('charManager.title') }}</h2>
      <div class="char-manager__actions">
        <button class="btn btn--primary" type="button" @click="onCreate">
          + {{ t('charManager.create') }}
        </button>
        <button class="btn" type="button" @click="goCurrent">
          {{ t('charManager.goToCurrent') }}
        </button>
      </div>
    </header>

    <p class="char-manager__hint">{{ t('charManager.hint') }}</p>

    <ul class="char-list">
      <li
        v-for="c in charSummaries"
        :key="c.id"
        class="char-card"
        :class="{ 'char-card--active': c.id === roster.activeId }"
      >
        <div class="char-card__head">
          <div class="char-card__title">
            <template v-if="renaming && renaming.id === c.id">
              <input
                v-model="renaming.value"
                class="char-card__name-input"
                type="text"
                autofocus
                @keydown.enter="commitRename"
                @keydown.esc="cancelRename"
              />
              <button class="btn btn--small" type="button" @click="commitRename">
                {{ t('charManager.save') }}
              </button>
              <button class="btn btn--small btn--ghost" type="button" @click="cancelRename">
                {{ t('charManager.cancel') }}
              </button>
            </template>
            <template v-else>
              <span class="char-card__name">{{ c.name }}</span>
              <span
                v-if="c.id === roster.activeId"
                class="char-card__badge"
              >{{ t('charManager.active') }}</span>
            </template>
          </div>
          <div class="char-card__buttons" v-if="!renaming || renaming.id !== c.id">
            <button
              v-if="c.id !== roster.activeId"
              class="btn btn--small btn--primary"
              type="button"
              @click="onSelect(c)"
            >{{ t('charManager.select') }}</button>
            <button class="btn btn--small" type="button" @click="startRename(c)">
              {{ t('charManager.rename') }}
            </button>
            <button class="btn btn--small" type="button" @click="onClone(c)">
              {{ t('charManager.clone') }}
            </button>
            <button
              class="btn btn--small btn--danger"
              type="button"
              :disabled="roster.list.length <= 1"
              @click="onDelete(c)"
            >{{ t('charManager.delete') }}</button>
          </div>
        </div>

        <dl class="char-card__stats">
          <div class="char-card__stat">
            <dt>{{ t('charManager.jobLabel') }}</dt>
            <dd>{{ jobLabel(c.summary.job) }}</dd>
          </div>
          <div class="char-card__stat">
            <dt>{{ t('charManager.levelLabel') }}</dt>
            <dd>Lv {{ c.summary.level }}</dd>
          </div>
          <div class="char-card__stat">
            <dt>{{ t('cp.attStats.cp') }}</dt>
            <dd class="char-card__stat--accent">{{ fmtNum(c.summary.latestCp) }}</dd>
          </div>
          <div class="char-card__stat">
            <dt>{{ t('cp.attStats.bossAvg') }}</dt>
            <dd>{{ fmtNum(c.summary.latestBossAvg) }}</dd>
          </div>
        </dl>
        <div v-if="c.summary.latestCp == null" class="char-card__nosnap">
          {{ t('charManager.noSnapshot') }}
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.char-manager {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.char-manager__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.char-manager__head h2 {
  margin: 0;
  color: var(--ms-accent);
  font-size: 1.4rem;
  letter-spacing: 0.04em;
}
.char-manager__actions {
  display: flex;
  gap: 0.5rem;
}
.char-manager__hint {
  margin: 0;
  color: var(--ms-text-dim);
  font-size: 0.85rem;
}
.char-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.85rem;
}
.char-card {
  background: var(--ms-panel-bg);
  border: 1px solid var(--ms-panel-border);
  border-radius: var(--ms-panel-radius);
  box-shadow: var(--ms-panel-shadow);
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  color: var(--ms-text);
}
.char-card--active {
  border-color: var(--ms-accent);
  box-shadow:
    0 0 0 1px rgba(255, 200, 87, 0.45),
    var(--ms-panel-shadow);
}
.char-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.char-card__title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
}
.char-card__name {
  font-weight: 700;
  font-size: 1.05rem;
  color: #fff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.char-card__name-input {
  background: var(--ms-input-bg-deep);
  border: 1px solid var(--ms-input-border);
  color: var(--ms-text);
  border-radius: 4px;
  padding: 0.25rem 0.5rem;
  font-size: 0.95rem;
}
.char-card__badge {
  font-size: 0.7rem;
  color: var(--ms-accent);
  border: 1px solid var(--ms-accent);
  border-radius: 4px;
  padding: 1px 6px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.char-card__buttons {
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.char-card__stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.35rem 0.8rem;
  margin: 0;
  padding: 0.5rem 0.7rem;
  background: var(--ms-section-bg);
  border: 1px solid var(--ms-section-border);
  border-radius: var(--ms-section-radius);
}
.char-card__stat {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
}
.char-card__stat dt {
  color: var(--ms-text-dim);
}
.char-card__stat dd {
  margin: 0;
  font-weight: 600;
}
.char-card__stat--accent {
  color: var(--ms-accent);
}
.char-card__nosnap {
  font-size: 0.75rem;
  color: var(--ms-text-weak);
  font-style: italic;
}

.btn {
  background: var(--ms-section-bg);
  border: 1px solid var(--ms-section-border);
  color: var(--ms-text);
  border-radius: 6px;
  padding: 0.4rem 0.7rem;
  font-size: 0.85rem;
  cursor: pointer;
  font-family: inherit;
  transition: filter 120ms ease, border-color 120ms ease;
}
.btn:hover:not(:disabled) {
  filter: brightness(1.15);
  border-color: var(--ms-accent);
}
.btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.btn--small { padding: 0.25rem 0.55rem; font-size: 0.78rem; }
.btn--primary {
  background: linear-gradient(180deg, #d4a430 0%, #b07d18 100%);
  border-color: #7c5a14;
  color: #1b1f27;
  font-weight: 700;
}
.btn--ghost { background: transparent; }
.btn--danger { color: #ff8089; }
.btn--danger:hover:not(:disabled) { border-color: #ff8089; }
</style>
