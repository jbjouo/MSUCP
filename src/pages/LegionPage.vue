<script setup>
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
</script>

<template>
  <section class="page">
    <h1>{{ t('pages.legion.title') }}</h1>
    <p class="placeholder">{{ t('pages.legion.placeholder') }}</p>
  </section>
</template>
