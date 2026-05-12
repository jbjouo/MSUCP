<script setup>
import TopBar from './components/TopBar.vue'
</script>

<template>
  <div class="layout">
    <TopBar />
    <main class="layout__main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}
.layout__main {
  flex: 1;
  min-width: 0;
  padding: 1.5rem 1.25rem 3rem;
  box-sizing: border-box;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 140ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
