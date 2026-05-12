<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import EquipmentSlots from '../components/EquipmentSlots.vue'
import InventoryGrid from '../components/InventoryGrid.vue'
import ItemTooltip from '../components/ItemTooltip.vue'
import CatalogPicker from '../components/CatalogPicker.vue'
import EntryEditor from '../components/EntryEditor.vue'
import { useEquipment, requestPersistentStorage } from '../composables/useEquipment.js'

const { t } = useI18n()
const { state, equipEntry, unequipSlot } = useEquipment()

const selectedSlot = ref(null)
// hoveredEntry 可以是 { uid, item, stars } 或是 { item } (來自 catalog picker,尚未擁有)
const hoveredEntry = ref(null)
const mouse = ref({ x: 0, y: 0 })
const pickerOpen = ref(false)
const editingUid = ref(null)

onMounted(() => {
  requestPersistentStorage()
})

const acceptTypes = computed(() => selectedSlot.value?.accepts || null)

function onSlotClick(slot) {
  if (selectedSlot.value?.key === slot.key) {
    if (state.equipped[slot.key]) unequipSlot(slot.key)
    selectedSlot.value = null
    return
  }
  selectedSlot.value = slot
}

function onEntryClick(entry) {
  const ok = equipEntry(entry.uid, selectedSlot.value?.key || null)
  if (ok) selectedSlot.value = null
}

function onEntryEdit(entry) {
  editingUid.value = entry.uid
  // 開啟 dialog 時關閉 tooltip,避免疊在上面
  hoveredEntry.value = null
}

function clearSelection() {
  selectedSlot.value = null
}

function onMouseMove(e) {
  mouse.value = { x: e.clientX, y: e.clientY }
}

// 觸控裝置按下時也更新位置 (雖然 tooltip 主要是桌機體驗)
function onTouchStart(e) {
  const t0 = e.touches?.[0]
  if (t0) mouse.value = { x: t0.clientX, y: t0.clientY }
}

function setHoverEntry(entry) {
  hoveredEntry.value = entry
}
// catalog picker 只有 item,包成 { item } 給 tooltip 使用
function setHoverItem(item) {
  hoveredEntry.value = item ? { item, stars: 0 } : null
}

onUnmounted(() => {
  hoveredEntry.value = null
})
</script>

<template>
  <section
    class="equip-page"
    @mousemove="onMouseMove"
    @touchstart="onTouchStart"
  >
    <header class="equip-page__head">
      <h1>{{ t('pages.equipment.title') }}</h1>
      <div class="equip-page__actions">
        <button v-if="selectedSlot" class="btn btn--ghost" @click="clearSelection">
          {{ t('equipment.action.clearSelection') }}
        </button>
      </div>
    </header>

    <div class="equip-page__body">
      <aside class="equip-page__left">
        <EquipmentSlots
          :selected-slot-key="selectedSlot?.key || null"
          @slot-click="onSlotClick"
          @slot-hover="setHoverEntry"
        />
      </aside>

      <section class="equip-page__right">
        <div v-if="selectedSlot" class="selected-hint">
          {{ t('equipment.selectedHint', { slot: t(`equipment.slots.${selectedSlot.key}`) }) }}
        </div>
        <InventoryGrid
          :accept-types="acceptTypes"
          :columns="8"
          :min-cells="40"
          @entry-click="onEntryClick"
          @entry-hover="setHoverEntry"
          @entry-edit="onEntryEdit"
          @open-picker="pickerOpen = true"
        />
      </section>
    </div>

    <!-- 浮動 tooltip (teleport 到 body 避免被裁切) -->
    <Teleport to="body">
      <ItemTooltip :entry="hoveredEntry" :x="mouse.x" :y="mouse.y" />
    </Teleport>

    <CatalogPicker
      :open="pickerOpen"
      @close="pickerOpen = false"
      @hover="setHoverItem"
    />

    <EntryEditor
      :uid="editingUid"
      @close="editingUid = null"
    />
  </section>
</template>

<style scoped>
.equip-page {
  padding: 0.5rem 0 2rem;
}
.equip-page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
}
.equip-page__head h1 {
  margin: 0;
  font-size: 1.3rem;
  letter-spacing: 0.08em;
  color: #ffc857;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.equip-page__actions {
  display: flex;
  gap: 0.5rem;
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

.equip-page__body {
  display: grid;
  grid-template-columns: minmax(420px, 600px) 1fr;
  gap: 1rem;
  align-items: start;
}

.equip-page__left {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.selected-hint {
  background: rgba(255, 200, 87, 0.12);
  border: 1px solid rgba(255, 200, 87, 0.4);
  color: #ffc857;
  padding: 0.5rem 0.85rem;
  border-radius: 8px;
  margin-bottom: 0.6rem;
  font-size: 0.85rem;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}

@media (max-width: 860px) {
  .equip-page__body {
    grid-template-columns: 1fr;
  }
  .equip-page__head h1 { font-size: 1.2rem; }
}
</style>
