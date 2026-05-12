<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useCharacter } from '../composables/useCharacter.js'
import { useCharacterSidebar } from '../composables/useCharacterSidebar.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const { state } = useCharacter()
const {
  sidebarOpen,
  isMobile,
  activeSection,
  updateViewport,
  toggleSidebar,
  setActiveSection,
} = useCharacterSidebar()

const BATTLE_JOBS = new Set(['archmageFP'])

const navTree = computed(() => {
  const items = [
    {
      key: 'character',
      labelKey: 'nav.character',
      path: '/character',
      children: [
        { key: 'basic', labelKey: 'character.sidebar.basic' },
        { key: 'linkSkill', labelKey: 'character.sidebar.linkSkill' },
        { key: 'collection', labelKey: 'character.sidebar.collection' },
        { key: 'legion', labelKey: 'character.sidebar.legion' },
        { key: 'skill', labelKey: 'character.sidebar.skill' },
      ],
    },
    { key: 'equipment', labelKey: 'nav.equipment', path: '/equipment' },
    { key: 'cp', labelKey: 'nav.cp', path: '/cp' },
  ]
  if (BATTLE_JOBS.has(state.job)) {
    items.push({ key: 'battle', labelKey: 'nav.battle', path: '/battle' })
  }
  return items
})

const expanded = ref(new Set(['character']))
function isExpanded(key) {
  return expanded.value.has(key)
}
function toggleGroup(key) {
  const next = new Set(expanded.value)
  if (next.has(key)) next.delete(key)
  else next.add(key)
  expanded.value = next
}

function clickGroup(item) {
  toggleGroup(item.key)
  if (route.path !== item.path) router.push(item.path)
}
function clickLeaf(parentKey, childKey) {
  if (parentKey === 'character') {
    if (route.path !== '/character') router.push('/character')
    setActiveSection(childKey)
  }
  if (isMobile.value) sidebarOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
function clickFlat(item) {
  if (route.path !== item.path) router.push(item.path)
  if (isMobile.value) sidebarOpen.value = false
}

function syncBodyClass() {
  const shouldOffset = sidebarOpen.value && !isMobile.value
  document.body.classList.toggle('has-sidebar', shouldOffset)
}

watch([sidebarOpen, isMobile], syncBodyClass)

onMounted(() => {
  updateViewport()
  syncBodyClass()
  window.addEventListener('resize', updateViewport)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateViewport)
  document.body.classList.remove('has-sidebar')
})
</script>

<template>
  <aside
    class="sidebar"
    :class="{ 'sidebar--open': sidebarOpen, 'sidebar--mobile': isMobile }"
    :aria-hidden="!sidebarOpen"
  >
    <div class="sidebar__head">
      <span class="sidebar__title">{{ t('character.sidebar.menu') }}</span>
      <button
        v-if="isMobile"
        type="button"
        class="sidebar__close"
        aria-label="Close menu"
        @click="toggleSidebar"
      >×</button>
    </div>
    <nav class="sidebar__nav">
      <template v-for="item in navTree" :key="item.key">
        <template v-if="item.children">
          <button
            type="button"
            class="sidebar__group"
            :class="{ 'sidebar__group--active': route.path === item.path }"
            @click="clickGroup(item)"
          >
            <span
              class="sidebar__chevron"
              :class="{ 'sidebar__chevron--open': isExpanded(item.key) }"
            >▸</span>
            <span class="sidebar__label">{{ t(item.labelKey) }}</span>
          </button>
          <div v-show="isExpanded(item.key)" class="sidebar__children">
            <button
              v-for="child in item.children"
              :key="child.key"
              type="button"
              class="sidebar__leaf"
              :class="{
                'sidebar__leaf--active':
                  route.path === item.path && activeSection === child.key,
              }"
              @click="clickLeaf(item.key, child.key)"
            >{{ t(child.labelKey) }}</button>
          </div>
        </template>
        <button
          v-else
          type="button"
          class="sidebar__item"
          :class="{ 'sidebar__item--active': route.path === item.path }"
          @click="clickFlat(item)"
        >{{ t(item.labelKey) }}</button>
      </template>
    </nav>
  </aside>
  <div
    v-if="isMobile && sidebarOpen"
    class="sidebar__backdrop"
    @click="toggleSidebar"
  ></div>
</template>

<style scoped>
.sidebar {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: 220px;
  z-index: 15;
  padding: 64px 10px 16px;
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border-right: 1px solid #3d4554;
  box-shadow:
    8px 0 22px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  color: #f1f3f7;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  transform: translateX(-100%);
  transition: transform 220ms ease;
}
.sidebar--open {
  transform: translateX(0);
}
.sidebar--mobile {
  width: 78vw;
  max-width: 280px;
  z-index: 50;
}

.sidebar__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px 4px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}
.sidebar__title {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  color: #ffc857;
  font-weight: 700;
  text-transform: uppercase;
}
.sidebar__close {
  background: none;
  border: none;
  color: #f1f3f7;
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 4px;
}

.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sidebar__item,
.sidebar__group,
.sidebar__leaf {
  text-align: left;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  color: #e8edf2;
  border: 1px solid #2f3642;
  border-radius: 6px;
  padding: 0.5rem 0.7rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: filter 120ms ease, border-color 120ms ease, color 120ms ease;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 6px;
}
.sidebar__item:hover,
.sidebar__group:hover,
.sidebar__leaf:hover {
  filter: brightness(1.12);
  border-color: #ffc857;
}
.sidebar__item--active,
.sidebar__group--active,
.sidebar__leaf--active {
  border-color: #ffc857;
  color: #ffc857;
  box-shadow: inset 0 0 0 1px rgba(255, 200, 87, 0.25);
}

.sidebar__chevron {
  display: inline-block;
  font-size: 0.7rem;
  color: #c9d2dd;
  transition: transform 160ms ease;
  width: 12px;
}
.sidebar__chevron--open {
  transform: rotate(90deg);
}

.sidebar__children {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-left: 16px;
  margin: 2px 0 4px;
}
.sidebar__leaf {
  font-size: 0.8rem;
  padding: 0.4rem 0.7rem;
  background: linear-gradient(180deg, #404956 0%, #353d48 100%);
}

.sidebar__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 49;
}
</style>
