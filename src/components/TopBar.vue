<script setup>
import { useI18n } from 'vue-i18n'
import { SUPPORTED_LOCALES, setLocale } from '../i18n'
import { routes } from '../router'

const { t, locale } = useI18n()

const navItems = routes
  .filter((r) => r.meta?.navKey)
  .map((r) => ({ to: r.path, key: r.meta.navKey }))

function onLocaleChange(e) {
  setLocale(e.target.value)
}
</script>

<template>
  <header class="topbar">
    <div class="topbar__inner">
      <div class="brand">
        <span class="brand__mark">MSU</span>
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
  background: rgba(15, 19, 34, 0.85);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #252b40;
}
.topbar__inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.brand__mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, #ffb347, #ffcc33);
  color: #1b2133;
  font-weight: 800;
  font-size: 0.85rem;
  letter-spacing: 0.05em;
}
.brand__title {
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #e9edf5;
  white-space: nowrap;
}

.nav {
  display: flex;
  gap: 0.25rem;
  flex: 1;
  flex-wrap: wrap;
}
.nav__item {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  text-decoration: none;
  color: #9aa3b8;
  font-size: 0.92rem;
  transition: color 120ms ease, background 120ms ease;
}
.nav__item:hover {
  color: #e9edf5;
  background: rgba(126, 232, 250, 0.08);
}
.nav__item.is-active {
  color: #1b2133;
  background: linear-gradient(90deg, #ffb347, #ffcc33);
  font-weight: 600;
}

.lang {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.lang__label {
  font-size: 0.8rem;
  color: #9aa3b8;
}
.lang__select {
  padding: 0.4rem 0.6rem;
  border-radius: 8px;
  border: 1px solid #2e3550;
  background: #0f1322;
  color: #e9edf5;
  font-size: 0.9rem;
  cursor: pointer;
}
.lang__select:focus {
  outline: none;
  border-color: #7ee8fa;
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
