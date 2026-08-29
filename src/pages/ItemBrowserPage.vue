<script setup>
import { ref, computed } from 'vue'

const startId = ref(1113060)
const endId = ref(1113130)
const step = ref(1)
const page = ref(1)
const perPage = 30

const loadedIds = ref([])
const loading = ref(false)

const BASE_URL = 'https://api-static.msu.io/itemimages/icon'

function generate() {
  const ids = []
  for (let id = startId.value; id <= endId.value; id += step.value) {
    ids.push(id)
  }
  loadedIds.value = []
  page.value = 1
  loading.value = true

  let checked = 0
  const valid = []
  const total = ids.length

  ids.forEach((id) => {
    const img = new Image()
    img.onload = () => {
      valid.push(id)
      checked++
      if (checked === total) finish(valid)
    }
    img.onerror = () => {
      checked++
      if (checked === total) finish(valid)
    }
    img.src = `${BASE_URL}/${id}.png`
  })
}

function finish(valid) {
  loadedIds.value = valid.sort((a, b) => a - b)
  loading.value = false
}

const totalPages = computed(() => Math.max(1, Math.ceil(loadedIds.value.length / perPage)))
const pagedIds = computed(() => {
  const s = (page.value - 1) * perPage
  return loadedIds.value.slice(s, s + perPage)
})

function prevPage() { if (page.value > 1) page.value-- }
function nextPage() { if (page.value < totalPages.value) page.value++ }
</script>

<template>
  <div class="sb">
    <h2 class="sb__title">Item Icon Browser</h2>

    <div class="sb__form">
      <label>
        <span>Start ID</span>
        <input v-model.number="startId" type="number" />
      </label>
      <label>
        <span>End ID</span>
        <input v-model.number="endId" type="number" />
      </label>
      <label>
        <span>Step</span>
        <input v-model.number="step" type="number" min="1" />
      </label>
      <button @click="generate" :disabled="loading">
        {{ loading ? 'Loading...' : 'Search' }}
      </button>
    </div>

    <div v-if="loadedIds.length" class="sb__info">
      Found {{ loadedIds.length }} icons — Page {{ page }} / {{ totalPages }}
    </div>

    <div v-if="pagedIds.length" class="sb__grid">
      <div v-for="id in pagedIds" :key="id" class="sb__item">
        <img :src="`${BASE_URL}/${id}.png`" :alt="id" loading="lazy" />
        <span class="sb__id">{{ id }}</span>
      </div>
    </div>

    <div v-if="totalPages > 1" class="sb__pager">
      <button @click="prevPage" :disabled="page <= 1">← Prev</button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button @click="nextPage" :disabled="page >= totalPages">Next →</button>
    </div>
  </div>
</template>

<style scoped>
.sb {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}
.sb__title {
  margin: 0 0 1rem;
  font-size: 1.2rem;
}
.sb__form {
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  flex-wrap: wrap;
  margin-bottom: 1rem;
}
.sb__form label {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  font-size: 0.8rem;
}
.sb__form input {
  width: 130px;
  padding: 0.35rem 0.5rem;
  border: 1px solid var(--c-border, #555);
  border-radius: 4px;
  background: var(--c-bg-soft, #1a1a2e);
  color: inherit;
  font-size: 0.85rem;
}
.sb__form button {
  padding: 0.4rem 1rem;
  border: 1px solid var(--c-primary, #6c8cff);
  border-radius: 4px;
  background: var(--c-primary, #6c8cff);
  color: #fff;
  cursor: pointer;
  font-size: 0.85rem;
}
.sb__form button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.sb__info {
  font-size: 0.8rem;
  margin-bottom: 0.75rem;
  opacity: 0.7;
}
.sb__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.5rem;
}
.sb__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.4rem;
  border: 1px solid var(--c-border, #333);
  border-radius: 6px;
  background: var(--c-bg-soft, rgba(20,26,46,0.6));
}
.sb__item img {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}
.sb__id {
  font-size: 0.65rem;
  opacity: 0.6;
  user-select: all;
}
.sb__pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}
.sb__pager button {
  padding: 0.3rem 0.8rem;
  border: 1px solid var(--c-border, #555);
  border-radius: 4px;
  background: var(--c-bg-soft, #1a1a2e);
  color: inherit;
  cursor: pointer;
  font-size: 0.8rem;
}
.sb__pager button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.sb__pager span {
  font-size: 0.8rem;
}
</style>
