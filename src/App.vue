<script setup>
import TopBar from './components/TopBar.vue'
import Sidebar from './components/Sidebar.vue'
</script>

<template>
  <div class="layout">
    <TopBar />
    <Sidebar />
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
}
.layout__main {
  flex: 1;
  min-width: 0;
  padding: 1.5rem 1.25rem 3rem;
  margin-top: 56px;
  box-sizing: border-box;
  transition: margin-left 220ms ease;
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

<!-- 非 scoped:sidebar 開啟 + 寬螢幕時讓主內容讓位 -->
<style>
@media (min-width: 1280px) {
  body.has-sidebar .layout__main {
    margin-left: 220px;
  }
}
</style>
