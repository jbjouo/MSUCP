<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipment } from '../composables/useEquipment.js'
import { useCharacter } from '../composables/useCharacter.js'
import { EQUIP_GRID_COLS, EQUIP_GRID_ROWS } from '../constants/equipmentSlots.js'
import { projectileTypeOf } from '../constants/jobs.js'

const props = defineProps({
  selectedSlotKey: { type: String, default: null },
})

const emit = defineEmits(['slot-click', 'slot-hover'])

const { t } = useI18n()
const { state, EQUIP_SLOTS, resolveEntry } = useEquipment()
const { state: charState } = useCharacter()

const currentProjectile = computed(() => projectileTypeOf(charState.job))
const visibleSlots = computed(() =>
  EQUIP_SLOTS.filter((s) => !s.conditional || (s.key === 'projectile' && currentProjectile.value)),
)

function slotLabel(key) {
  return t(`equipment.slots.${key}`)
}

function entryIn(slotKey) {
  return resolveEntry(state.equipped[slotKey])
}

function onClick(slot) {
  emit('slot-click', slot)
}

function onEnter(slot) {
  emit('slot-hover', entryIn(slot.key))
}

function onLeave() {
  emit('slot-hover', null)
}
</script>

<template>
  <div class="equip-panel">
    <header class="equip-panel__header">
      <h2>{{ t('equipment.panel.title') }}</h2>
    </header>
    <div
      class="equip-grid"
      role="grid"
      :aria-label="t('equipment.panel.title')"
      :style="{
        gridTemplateColumns: `repeat(${EQUIP_GRID_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${EQUIP_GRID_ROWS}, minmax(0, 1fr))`,
        aspectRatio: `${EQUIP_GRID_COLS} / ${EQUIP_GRID_ROWS}`,
      }"
    >
      <div
        v-for="slot in visibleSlots"
        :key="slot.key"
        class="equip-slot-wrap"
        :style="{ gridRow: slot.row, gridColumn: slot.col }"
      >
        <button
          class="equip-slot"
          :class="{
            'equip-slot--filled': !!entryIn(slot.key),
            'equip-slot--selected': selectedSlotKey === slot.key,
          }"
          :title="entryIn(slot.key)?.item.name || slotLabel(slot.key)"
          :aria-label="slotLabel(slot.key)"
          @click="onClick(slot)"
          @mouseenter="onEnter(slot)"
          @mouseleave="onLeave"
          @focus="onEnter(slot)"
          @blur="onLeave"
        >
          <template v-if="entryIn(slot.key)">
            <img
              v-if="entryIn(slot.key).item.imageUrl || entryIn(slot.key).item.icon"
              class="equip-slot__img"
              :src="entryIn(slot.key).item.imageUrl || entryIn(slot.key).item.icon"
              :alt="entryIn(slot.key).item.name"
              loading="lazy"
            />
            <span v-else class="equip-slot__img equip-slot__img--placeholder" aria-hidden="true" />
            <span class="equip-slot__name">{{ entryIn(slot.key).item.name }}</span>
          </template>
          <span v-else class="equip-slot__label">{{ slotLabel(slot.key) }}</span>
        </button>
        <span
          v-if="entryIn(slot.key) && entryIn(slot.key).stars > 0"
          class="equip-slot__badge"
          aria-hidden="true"
        >★{{ entryIn(slot.key).stars }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.equip-panel {
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  padding: 1rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
}
.equip-panel__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.75rem;
}
.equip-panel__header h2 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: #ffcc33;
}

.equip-grid {
  display: grid;
  gap: 6px;
  max-width: 420px;
  margin: 0 auto;
}

.equip-slot-wrap {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.equip-slot {
  position: relative;
  width: 100%;
  height: 100%;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 8px;
  color: #8089a3;
  font-size: 0.7rem;
  font-family: inherit;
  cursor: pointer;
  padding: 2px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  gap: 2px;
  transition: transform 90ms ease, border-color 120ms ease, box-shadow 120ms ease;
}
.equip-slot:hover,
.equip-slot:focus-visible {
  border-color: #7ee8fa;
  outline: none;
  transform: translateY(-1px);
}
.equip-slot--filled {
  color: #e9edf5;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(0, 0, 0, 0.25) 100%),
    #141a2e;
}
.equip-slot--selected {
  border-color: #ffcc33 !important;
  box-shadow: 0 0 0 2px rgba(255, 204, 51, 0.35);
}

.equip-slot__label {
  opacity: 0.55;
  font-size: 0.68rem;
  line-height: 1.05;
  text-align: center;
}
.equip-slot__badge {
  position: absolute;
  top: 2px;
  left: 4px;
  z-index: 2;
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1;
  color: #f0b429;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.9), 0 1px 0 rgba(0, 0, 0, 0.7);
  pointer-events: none;
  letter-spacing: 0.02em;
}
.equip-slot__img {
  flex: 1;
  min-height: 0;
  width: 100%;
  object-fit: contain;
  image-rendering: pixelated;
  display: block;
}
.equip-slot__img--placeholder {
  background:
    linear-gradient(135deg, rgba(126, 232, 250, 0.08), transparent 60%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 4px, transparent 4px 8px);
  border-radius: 4px;
}
.equip-slot__name {
  font-weight: 600;
  font-size: 0.58rem;
  line-height: 1;
  text-align: center;
  word-break: keep-all;
  padding: 0 2px;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.85;
}

</style>
