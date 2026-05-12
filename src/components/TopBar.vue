<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import { routes } from '../router'
import { useCharacter } from '../composables/useCharacter.js'
import { useCharacterSidebar } from '../composables/useCharacterSidebar.js'

const { t, locale } = useI18n()
const route = useRoute()
const { state } = useCharacter()
const { toggleSidebar } = useCharacterSidebar()

const iconUrl = `${import.meta.env.BASE_URL}new-icon.png`

const BATTLE_JOBS = new Set(['archmageFP'])

const navItems = computed(() =>
  routes
    .filter((r) => r.meta?.navKey)
    .filter((r) => r.meta.navKey !== 'battle' || BATTLE_JOBS.has(state.job))
    .map((r) => ({ to: r.path, key: r.meta.navKey })),
)

const showSidebarToggle = computed(() => route.path.startsWith('/character'))

function onLocaleChange(e) {
  setLocale(e.target.value)
}
</script>

<template>
  <header class="topbar">
    <div class="topbar__inner">
      <button
        v-if="showSidebarToggle"
        type="button"
        class="topbar__menu"
        :aria-label="t('character.sidebar.toggle')"
        @click="toggleSidebar"
      >☰</button>
      <div class="brand">
        <img
          :src="iconUrl"
          alt="MSUCP"
          class="brand__mark"
        />
        <span class="brand__title">{{ t('app.title') }}</span>
      </div>

      <nav class="nav">
        <router-link
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          class="nav__item"
          active-class="is-active"
        >
          {{ t(`nav.${item.key}`) }}
        </router-link>
      </nav>

      <div class="lang">
        <label :for="'lang-select'" class="lang__label">
          {{ t('language.label') }}
        </label>
        <select
          id="lang-select"
          class="lang__select"
          :value="locale"
          @change="onLocaleChange"
        >
          <option v-for="l in SUPPORTED_LOCALES" :key="l.code" :value="l.code">
            {{ l.label }}
          </option>
        </select>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border-bottom: 1px solid #3d4554;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}
.topbar__inner {
  padding: 0.65rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.25rem;
}

.topbar__menu {
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #141a22;
  color: #ffc857;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  font-size: 1.05rem;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: filter 120ms ease, border-color 120ms ease;
}
.topbar__menu:hover {
  filter: brightness(1.18);
  border-color: #ffc857;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.brand__mark {
  width: 34px;
  height: 34px;
  display: block;
  object-fit: contain;
}
.brand__title {
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #f1f3f7;
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}

.nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  flex-wrap: wrap;
}
.nav__item {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  text-decoration: none;
  color: #d6dce6;
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  border: 1px solid transparent;
  transition: background 120ms ease, color 120ms ease, border-color 120ms ease;
}
.nav__item:hover {
  color: #ffc857;
  background: rgba(255, 255, 255, 0.06);
}
.nav__item.is-active {
  color: #ffc857;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border-color: #141a22;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.lang {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.lang__label {
  font-size: 0.78rem;
  color: #d6dce6;
}
.lang__select {
  padding: 0.35rem 0.6rem;
  border-radius: 6px;
  border: 1px solid #141a22;
  background: #1f2630;
  color: #f1f3f7;
  font-size: 0.85rem;
  cursor: pointer;
}
.lang__select:focus {
  outline: none;
  border-color: #ffc857;
}

@media (max-width: 720px) {
  .topbar__inner {
    flex-wrap: wrap;
    gap: 0.75rem;
  }
  .nav {
    order: 3;
    width: 100%;
    justify-content: center;
  }
}
</style>
