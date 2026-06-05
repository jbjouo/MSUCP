<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipment } from '../composables/useEquipment.js'

const props = defineProps({
  acceptTypes: { type: Array, default: null },
  columns: { type: Number, default: 8 },
  minCells: { type: Number, default: 32 },
})

const emit = defineEmits(['entry-click', 'entry-hover', 'entry-edit', 'open-picker'])

const { t } = useI18n()
const { inventoryEntries, removeEntry } = useEquipment()

const filterType = ref('all')
const pendingRemove = ref(null)

const typeOptions = computed(() => {
  const set = new Set(inventoryEntries.value.map((e) => e.item.type))
  return ['all', ...Array.from(set)]
})

const filtered = computed(() => {
  let list = inventoryEntries.value
  if (props.acceptTypes && props.acceptTypes.length) {
    list = list.filter((e) => props.acceptTypes.includes(e.item.type))
  } else if (filterType.value !== 'all') {
    list = list.filter((e) => e.item.type === filterType.value)
  }
  return list
})

const cells = computed(() => {
  const entries = filtered.value
  const pad = Math.max(0, props.minCells - entries.length)
  return [
    ...entries.map((entry) => ({ entry, empty: false })),
    ...Array(pad).fill(null).map(() => ({ entry: null, empty: true })),
  ]
})

function onClick(entry) {
  if (!entry) return
  emit('entry-click', entry)
}
function onEnter(entry) { emit('entry-hover', entry || null) }
function onLeave() { emit('entry-hover', null) }

function onRemove(e, entry) {
  e.stopPropagation()
  if (!entry) return
  pendingRemove.value = entry
}

function confirmRemove() {
  if (pendingRemove.value) {
    removeEntry(pendingRemove.value.uid)
    pendingRemove.value = null
  }
}

function cancelRemove() {
  pendingRemove.value = null
}

function onEdit(e, entry) {
  e.stopPropagation()
  if (!entry) return
  emit('entry-edit', entry)
}
</script>

<template>
  <div class="bag-panel">
    <header class="bag-panel__header">
      <h2>{{ t('equipment.bag.title') }}</h2>
      <div class="bag-panel__actions">
        <div v-if="!acceptTypes" class="bag-panel__filter">
          <label class="bag-panel__filter-label">{{ t('equipment.bag.filter') }}</label>
          <select v-model="filterType" class="bag-panel__select">
            <option v-for="opt in typeOptions" :key="opt" :value="opt">
              {{ opt === 'all' ? t('equipment.bag.all') : t(`equipment.types.${opt}`) }}
            </option>
          </select>
        </div>
        <span v-if="acceptTypes" class="bag-panel__hint">
          {{ t('equipment.bag.filteredBySlot') }}
        </span>
        <button class="bag-panel__add" @click="emit('open-picker')">
          + {{ t('equipment.bag.add') }}
        </button>
      </div>
    </header>
    <div
      class="bag-grid"
      :style="{ '--bag-cols': columns }"
    >
      <div
        v-for="(cell, idx) in cells"
        :key="cell.entry ? cell.entry.uid : `empty-${idx}`"
        class="bag-cell-wrap"
      >
        <button
          class="bag-cell"
          :class="cell.empty ? 'bag-cell--empty' : 'bag-cell--filled'"
          :disabled="cell.empty"
          :title="cell.entry ? cell.entry.item.name : ''"
          @click="onClick(cell.entry)"
          @mouseenter="onEnter(cell.entry)"
          @mouseleave="onLeave"
          @focus="onEnter(cell.entry)"
          @blur="onLeave"
        >
          <template v-if="cell.entry">
            <img
              v-if="cell.entry.item.imageUrl || cell.entry.item.icon"
              class="bag-cell__img"
              :src="cell.entry.item.imageUrl || cell.entry.item.icon"
              :alt="cell.entry.item.name"
              loading="lazy"
            />
            <span v-else class="bag-cell__img bag-cell__img--placeholder" aria-hidden="true" />
            <span class="bag-cell__name">{{ cell.entry.item.name }}</span>
          </template>
        </button>
        <span
          v-if="cell.entry && cell.entry.stars > 0"
          class="bag-cell__badge"
          aria-hidden="true"
        >★{{ cell.entry.stars }}</span>
        <div v-if="cell.entry" class="bag-cell__actions">
          <button
            class="bag-cell__btn bag-cell__btn--edit"
            :title="t('equipment.bag.edit')"
            :aria-label="t('equipment.bag.edit')"
            @click="onEdit($event, cell.entry)"
          >✎</button>
          <button
            class="bag-cell__btn bag-cell__btn--remove"
            :title="t('equipment.bag.remove')"
            :aria-label="t('equipment.bag.remove')"
            @click="onRemove($event, cell.entry)"
          >×</button>
        </div>
      </div>
    </div>
    <p v-if="!filtered.length" class="bag-empty">
      {{ t('equipment.bag.empty') }}
    </p>
    <Teleport to="body">
      <div v-if="pendingRemove" class="confirm-backdrop" @click.self="cancelRemove">
        <div class="confirm-dialog">
          <p class="confirm-dialog__msg">
            {{ t('equipment.bag.confirmRemove', { name: pendingRemove.item.name }) }}
          </p>
          <div class="confirm-dialog__actions">
            <button class="confirm-dialog__btn confirm-dialog__btn--cancel" @click="cancelRemove">
              {{ t('equipment.bag.cancel') }}
            </button>
            <button class="confirm-dialog__btn confirm-dialog__btn--ok" @click="confirmRemove">
              {{ t('equipment.bag.confirmDelete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.bag-panel {
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.bag-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.bag-panel__header h2 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: #7ee8fa;
}
.bag-panel__actions {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.bag-panel__filter { display: flex; align-items: center; gap: 0.4rem; }
.bag-panel__filter-label { color: #8089a3; font-size: 0.8rem; }
.bag-panel__select {
  background: #0a0e1c;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
  font-family: inherit;
}
.bag-panel__hint { color: #ffcc33; font-size: 0.8rem; }
.bag-panel__add {
  background: #1b2140;
  color: #7ee8fa;
  border: 1px solid #2a3152;
  padding: 0.3rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  transition: background 100ms ease, border-color 100ms ease;
}
.bag-panel__add:hover { background: #232a4f; border-color: #7ee8fa; }

.bag-grid {
  display: grid;
  gap: 4px;
  flex: 1;
  grid-template-columns: repeat(var(--bag-cols, 8), minmax(0, 1fr));
}
@media (max-width: 900px) {
  .bag-grid { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
@media (max-width: 640px) {
  .bag-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
}
@media (max-width: 480px) {
  .bag-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); }
}

.bag-cell-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.bag-cell {
  aspect-ratio: 1 / 1;
  width: 100%;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 6px;
  color: #e9edf5;
  font-family: inherit;
  font-size: 0.58rem;
  line-height: 1;
  padding: 2px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  text-align: center;
  gap: 2px;
  transition: transform 90ms ease, border-color 120ms ease, box-shadow 120ms ease;
  overflow: hidden;
}
.bag-cell:hover:not(:disabled),
.bag-cell:focus-visible:not(:disabled) {
  border-color: #7ee8fa;
  transform: translateY(-1px);
  outline: none;
}
.bag-cell--empty { cursor: default; opacity: 0.4; }

.bag-cell__img {
  flex: 1;
  min-height: 0;
  width: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  display: block;
}
.bag-cell__img--placeholder {
  background:
    linear-gradient(135deg, rgba(126, 232, 250, 0.08), transparent 60%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 4px, transparent 4px 8px);
  border-radius: 4px;
}
.bag-cell__name {
  max-width: 100%;
  min-width: 0;
  flex-shrink: 0;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.8;
}

.bag-cell__badge {
  position: absolute;
  top: 2px;
  left: 3px;
  z-index: 2;
  font-size: 0.58rem;
  font-weight: 700;
  line-height: 1;
  color: #f0b429;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(0, 0, 0, 0.7);
  pointer-events: none;
  letter-spacing: 0.02em;
}
.bag-cell__actions {
  position: absolute;
  top: 2px;
  right: 2px;
  display: none;
  gap: 2px;
  z-index: 2;
}
.bag-cell-wrap:hover .bag-cell__actions,
.bag-cell__actions:focus-within {
  display: inline-flex;
}
.bag-cell__btn {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.7);
  font-size: 0.78rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid;
}
.bag-cell__btn:focus-visible { outline: none; }
.bag-cell__btn--edit { color: #7ee8fa; border-color: #7ee8fa; }
.bag-cell__btn--edit:hover { background: #7ee8fa; color: #0a0e1c; }
.bag-cell__btn--remove { color: #ff8080; border-color: #ff8080; font-size: 0.9rem; }
.bag-cell__btn--remove:hover { background: #ff8080; color: #0a0e1c; }

.bag-empty {
  color: #8089a3;
  text-align: center;
  padding: 1rem;
  margin: 0.5rem 0 0;
}

@media (max-width: 640px) {
  .bag-cell { font-size: 0.58rem; }
  .bag-cell__actions { display: inline-flex; }
  .bag-cell__btn { width: 16px; height: 16px; font-size: 0.7rem; }
  .bag-cell__btn--remove { font-size: 0.8rem; }
}

.confirm-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 18, 0.7);
  backdrop-filter: blur(4px);
  z-index: 950;
  display: flex;
  align-items: center;
  justify-content: center;
}
.confirm-dialog {
  background: linear-gradient(180deg, #1a2038 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 12px;
  padding: 1.5rem 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  min-width: 280px;
  max-width: 400px;
  text-align: center;
}
.confirm-dialog__msg {
  color: #e9edf5;
  font-size: 0.95rem;
  margin: 0 0 1.2rem;
  line-height: 1.5;
}
.confirm-dialog__actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}
.confirm-dialog__btn {
  padding: 0.45rem 1.2rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  border: 1px solid;
  transition: filter 100ms ease, background 100ms ease;
}
.confirm-dialog__btn--cancel {
  background: transparent;
  color: #8089a3;
  border-color: #3a4270;
}
.confirm-dialog__btn--cancel:hover {
  border-color: #7ee8fa;
  color: #e9edf5;
}
.confirm-dialog__btn--ok {
  background: #ff5555;
  color: #fff;
  border-color: #ff5555;
}
.confirm-dialog__btn--ok:hover {
  filter: brightness(1.15);
}
</style>
