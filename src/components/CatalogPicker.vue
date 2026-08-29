<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipment } from '../composables/useEquipment.js'
import { useCharacter } from '../composables/useCharacter.js'
import { SET_FILTER_GROUPS, setsForItem } from '../constants/itemSets.js'

const props = defineProps({
  open: { type: Boolean, default: false },
})
const emit = defineEmits(['close', 'hover'])

const { t } = useI18n()
const { CATALOG, addToInventory } = useEquipment()
const { combatClass } = useCharacter()

const COMBAT_CLASSES = ['warrior', 'magician', 'bowman', 'thief', 'pirate']

const keyword = ref('')
const typeFilter = ref('all')
// 快捷篩選 — 第一排職業 (互斥;開啟時預設當前角色職業類別)、第二排套裝 (再點一次取消)
const classFilter = ref('all')
const setFilter = ref(null)     // null = 不篩;SET_FILTER_GROUPS key 或 'others' (無套裝)
const addedFlash = ref(null) // id 閃一下提示已加入

watch(() => props.open, (v) => {
  if (v) {
    keyword.value = ''
    typeFilter.value = 'all'
    classFilter.value = combatClass.value || 'all'
    setFilter.value = null
  }
})

function toggleSetFilter(key) {
  setFilter.value = setFilter.value === key ? null : key
}

const typeOptions = computed(() => {
  const set = new Set(CATALOG.map((it) => it.type))
  return ['all', ...Array.from(set).sort()]
})

// 套裝分組 key → 成員 item.id 集合 (含 group 多選一成員展開;經 setsForItem 反向索引)
function itemInSetGroup(item, groupKey) {
  const group = SET_FILTER_GROUPS.find((g) => g.key === groupKey)
  if (!group) return false
  return setsForItem(item.id).some((s) => group.setIds.includes(s.id))
}

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  const cc = classFilter.value
  return CATALOG.filter((it) => {
    if (cc !== 'all' && it.classes && it.classes.length > 0 && !it.classes.includes(cc)) return false
    if (typeFilter.value !== 'all' && it.type !== typeFilter.value) return false
    if (setFilter.value === 'projectile') {
      if (!['star', 'arrow', 'bullet'].includes(it.type)) return false
    } else if (setFilter.value === 'skillRing') {
      if (!it.skillRing) return false
    } else if (setFilter.value === 'others') {
      if (setsForItem(it.id).length > 0 || it.skillRing || it.systemGear || it.filterTag || ['star', 'arrow', 'bullet'].includes(it.type)) return false
    } else if (setFilter.value) {
      if (!itemInSetGroup(it, setFilter.value) && !(setFilter.value === 'fourth_magician' && it.systemGear) && it.filterTag !== setFilter.value) return false
    }
    if (!kw) return true
    return (
      it.name.toLowerCase().includes(kw) ||
      (it.nameEn || '').toLowerCase().includes(kw) ||
      it.id.toLowerCase().includes(kw)
    )
  })
})

function onAdd(item) {
  addToInventory(item.id)
  addedFlash.value = item.id
  setTimeout(() => {
    if (addedFlash.value === item.id) addedFlash.value = null
  }, 600)
}

function onBackdrop(e) {
  if (e.target === e.currentTarget) emit('close')
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="picker-backdrop"
      @click="onBackdrop"
      @keydown="onKey"
      tabindex="-1"
    >
      <div class="picker" role="dialog" :aria-label="t('equipment.picker.title')">
        <header class="picker__head">
          <h2>{{ t('equipment.picker.title') }}</h2>
          <button class="picker__close" @click="emit('close')" aria-label="close">×</button>
        </header>
        <div class="picker__filters">
          <input
            v-model="keyword"
            class="picker__input"
            type="search"
            :placeholder="t('equipment.picker.search')"
            autofocus
          />
          <select v-model="typeFilter" class="picker__select">
            <option v-for="opt in typeOptions" :key="opt" :value="opt">
              {{ opt === 'all' ? t('equipment.bag.all') : t(`equipment.types.${opt}`) }}
            </option>
          </select>
        </div>
        <!-- 快捷篩選第一排:職業 (互斥) -->
        <div class="picker__quick">
          <button
            type="button"
            class="picker__chip"
            :class="{ 'picker__chip--active': classFilter === 'all' }"
            @click="classFilter = 'all'"
          >{{ t('equipment.picker.allClasses') }}</button>
          <button
            v-for="c in COMBAT_CLASSES"
            :key="c"
            type="button"
            class="picker__chip"
            :class="{ 'picker__chip--active': classFilter === c }"
            @click="classFilter = c"
          >{{ t(`character.branches.${c}`) }}</button>
        </div>
        <!-- 快捷篩選第二排:套裝俗稱 (再點一次取消);「其他」= 無套裝裝備 -->
        <div class="picker__quick">
          <button
            v-for="g in SET_FILTER_GROUPS"
            :key="g.key"
            type="button"
            class="picker__chip"
            :class="{ 'picker__chip--active': setFilter === g.key }"
            @click="toggleSetFilter(g.key)"
          >{{ t(`itemSet.filter.${g.key}`) }}</button>
          <button
            type="button"
            class="picker__chip"
            :class="{ 'picker__chip--active': setFilter === 'projectile' }"
            @click="toggleSetFilter('projectile')"
          >{{ t('itemSet.filter.projectile') }}</button>
          <button
            type="button"
            class="picker__chip"
            :class="{ 'picker__chip--active': setFilter === 'skillRing' }"
            @click="toggleSetFilter('skillRing')"
          >{{ t('itemSet.filter.skillRing') }}</button>
          <button
            type="button"
            class="picker__chip"
            :class="{ 'picker__chip--active': setFilter === 'others' }"
            @click="toggleSetFilter('others')"
          >{{ t('itemSet.filter.others') }}</button>
        </div>
        <div class="picker__count">
          {{ t('equipment.picker.count', { n: filtered.length }) }}
        </div>
        <ul class="picker__list">
          <li
            v-for="item in filtered"
            :key="item.id"
            class="picker__row"
            :class="{ 'picker__row--flash': addedFlash === item.id }"
          >
            <!-- tooltip hover 只掛在 thumbnail + info 範圍,避免覆蓋到右邊的「新增」按鈕 -->
            <div
              class="picker__thumb"
              @mouseenter="emit('hover', item)"
              @mouseleave="emit('hover', null)"
            >
              <img
                v-if="item.imageUrl || item.icon"
                :src="item.imageUrl || item.icon"
                :alt="item.name"
                loading="lazy"
              />
              <span v-else class="picker__thumb-ph" aria-hidden="true" />
            </div>
            <div
              class="picker__info"
              @mouseenter="emit('hover', item)"
              @mouseleave="emit('hover', null)"
            >
              <div class="picker__name">{{ item.name }}</div>
              <div class="picker__meta">
                <span>{{ t(`equipment.types.${item.type}`) }}</span>
                <span>·</span>
                <span>Lv. {{ item.level }}</span>
              </div>
            </div>
            <button
              class="picker__add"
              @click="onAdd(item)"
              @mouseenter="emit('hover', null)"
            >
              {{ addedFlash === item.id ? t('equipment.picker.added') : t('equipment.picker.add') }}
            </button>
          </li>
          <li v-if="!filtered.length" class="picker__empty">
            {{ t('equipment.picker.noResult') }}
          </li>
        </ul>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 18, 0.7);
  backdrop-filter: blur(4px);
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.picker {
  width: min(720px, 100%);
  max-height: min(80vh, 720px);
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  color: #e9edf5;
}
.picker__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2a3152;
}
.picker__head h2 {
  margin: 0;
  font-size: 1rem;
  letter-spacing: 0.06em;
  color: #ffcc33;
}
.picker__close {
  background: transparent;
  border: 1px solid #2a3152;
  color: #e9edf5;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
}
.picker__close:hover { border-color: #7ee8fa; }

.picker__filters {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2a3152;
}
/* 快捷篩選按鈕排 (職業 / 套裝) */
.picker__quick {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  padding: 0.5rem 1rem 0;
}
.picker__quick:last-of-type {
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #2a3152;
}
.picker__chip {
  background: #0a0e1c;
  color: #aab4cc;
  border: 1px solid #2a3152;
  border-radius: 999px;
  padding: 0.22rem 0.65rem;
  font-size: 0.78rem;
  font-family: inherit;
  cursor: pointer;
  line-height: 1.2;
}
.picker__chip:hover { color: #ffc857; border-color: #ffc857; }
.picker__chip--active {
  background: #ffc857;
  color: #1a1408;
  border-color: #ffc857;
  font-weight: 700;
}
.picker__input,
.picker__select {
  background: #0a0e1c;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
}
.picker__input:focus,
.picker__select:focus {
  outline: none;
  border-color: #7ee8fa;
}

.picker__count {
  padding: 0.4rem 1rem;
  font-size: 0.75rem;
  color: #8089a3;
  border-bottom: 1px solid #1f2540;
}

.picker__list {
  list-style: none;
  margin: 0;
  padding: 0.5rem;
  overflow-y: auto;
  flex: 1;
}
.picker__row {
  display: grid;
  grid-template-columns: 40px 1fr auto;
  gap: 0.6rem;
  align-items: center;
  padding: 0.4rem 0.5rem;
  border: 1px solid #1f2540;
  border-radius: 8px;
  background: #0f1324;
  margin-bottom: 4px;
  transition: border-color 120ms ease, background 120ms ease;
}
.picker__row:hover {
  border-color: #7ee8fa;
  background: #141a2e;
}
.picker__row--flash {
  animation: flash 500ms ease;
}
@keyframes flash {
  0%   { background: rgba(126, 232, 250, 0.25); }
  100% { background: #0f1324; }
}

.picker__thumb {
  width: 40px;
  height: 40px;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.picker__thumb img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
.picker__thumb-ph {
  width: 60%;
  height: 60%;
  background:
    linear-gradient(135deg, rgba(126, 232, 250, 0.08), transparent 60%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 4px, transparent 4px 8px);
  border-radius: 3px;
}
.picker__info {
  min-width: 0;
}
.picker__name {
  font-weight: 600;
  font-size: 0.9rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.picker__meta {
  color: #8089a3;
  font-size: 0.75rem;
  display: flex;
  gap: 0.3rem;
  flex-wrap: wrap;
}
.picker__add {
  background: #1b2140;
  color: #7ee8fa;
  border: 1px solid #2a3152;
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.8rem;
  transition: background 100ms ease, border-color 100ms ease;
}
.picker__add:hover {
  background: #232a4f;
  border-color: #7ee8fa;
}
.picker__empty {
  color: #8089a3;
  text-align: center;
  padding: 2rem 0;
}

@media (max-width: 520px) {
  .picker__filters {
    grid-template-columns: 1fr;
  }
}
</style>
