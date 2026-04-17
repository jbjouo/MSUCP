<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  stars: { type: Number, default: 0 },
  max: { type: Number, default: 0 },
  editableMax: { type: Number, default: null },
  size: { type: String, default: 'normal' },
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['update:stars'])

const hovered = ref(-1)

// 每 5 顆一組 → 每 3 組一列
const rows = computed(() => {
  const m = Math.max(0, props.max | 0)
  const groups = []
  for (let start = 1; start <= m; start += 5) {
    const end = Math.min(start + 4, m)
    const g = []
    for (let i = start; i <= end; i++) g.push(i)
    groups.push(g)
  }
  const out = []
  for (let i = 0; i < groups.length; i += 3) out.push(groups.slice(i, i + 3))
  return out
})

function isLocked(i) {
  return props.editableMax != null && i > props.editableMax
}

function onClick(i, e) {
  if (!props.editable || !props.max) return
  if (isLocked(i)) return
  e.stopPropagation()
  if (e.shiftKey) {
    emit('update:stars', 0)
    return
  }
  if (i === props.stars) emit('update:stars', i - 1)
  else emit('update:stars', i)
}

function onEnter(i) {
  if (!props.editable) return
  hovered.value = i
}
function onLeave() { hovered.value = -1 }
</script>

<template>
  <div
    v-if="max > 0"
    class="star-bar"
    :class="[`star-bar--${size}`, { 'star-bar--editable': editable }]"
    @mouseleave="onLeave"
    @click.stop
  >
    <div
      v-for="(row, ri) in rows"
      :key="ri"
      class="star-bar__row"
    >
      <div
        v-for="(group, gi) in row"
        :key="gi"
        class="star-bar__group"
      >
        <button
          v-for="i in group"
          :key="i"
          type="button"
          class="star"
          :class="{
            'star--filled': i <= stars,
            'star--preview': editable && hovered >= i && hovered > stars,
            'star--locked': isLocked(i),
          }"
          :aria-label="`set stars ${i}`"
          :tabindex="editable && !isLocked(i) ? 0 : -1"
          :disabled="!editable || isLocked(i)"
          @click="onClick(i, $event)"
          @mouseenter="onEnter(i)"
        >★</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.star-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  user-select: none;
}
.star-bar__row {
  display: flex;
  justify-content: center;
  gap: 14px;
}
.star-bar__group {
  display: grid;
  grid-template-columns: repeat(5, 1em);
  justify-items: center;
}

.star {
  all: unset;
  display: inline-block;
  width: 1em;
  text-align: center;
  line-height: 1;
  font-size: 0.72rem;
  color: #2e3550;
  cursor: default;
  transition: color 90ms ease, transform 90ms ease;
}
.star--filled { color: #f0b429; text-shadow: 0 0 4px rgba(240, 180, 41, 0.45); }
.star--preview { color: #fff6c2; }
.star--locked { cursor: not-allowed; opacity: 0.35; }
.star-bar--editable .star { cursor: pointer; }
.star-bar--editable .star:hover:not(.star--locked) { transform: scale(1.25); }
.star-bar--editable .star--locked:hover { transform: none; }

.star-bar--compact { gap: 2px; }
.star-bar--compact .star-bar__row { gap: 8px; }
.star-bar--compact .star { font-size: 0.62rem; }

.star-bar--large { gap: 5px; }
.star-bar--large .star-bar__row { gap: 18px; }
.star-bar--large .star { font-size: 1rem; }
</style>
