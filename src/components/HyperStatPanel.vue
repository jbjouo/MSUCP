<script setup>
import { useI18n } from 'vue-i18n'
import { useHyperStat } from '../composables/useHyperStat.js'

const { t } = useI18n()
const {
  state,
  HYPER_STATS,
  canIncrement,
  canDecrement,
  increment,
  decrement,
  resetAll,
  totalPoints,
  usedPoints,
  remainingPoints,
} = useHyperStat()

const PCT_KEYS_HYPER = new Set([
  'hpPct', 'mpPct', 'critRate', 'critDmg', 'ignoreDef',
  'dmgPct', 'bossDmg', 'normalMobDmg', 'bonusExp',
])

// 當下數值文字 — 若 lv=0 或無效果回傳 '0'
function currentValueText(stat) {
  const lv = state[stat.id] || 0
  if (!lv) return '0'
  const bag = stat.valueAt(lv) || {}
  const entries = Object.entries(bag)
  if (!entries.length) return '0'
  const vals = entries.map(([k, v]) => {
    const isPct = PCT_KEYS_HYPER.has(k)
    const sign = v > 0 ? '+' : ''
    return `${sign}${v}${isPct ? '%' : ''}`
  })
  // 全部相同就只顯示一個
  return vals.every((x) => x === vals[0]) ? vals[0] : vals.join(' / ')
}
</script>

<template>
  <section class="hs-panel">
    <header class="hs-panel__head">
      <span>{{ t('hyperStat.title') }}</span>
      <button class="hs-panel__reset" type="button" @click="resetAll">
        {{ t('hyperStat.reset') }}
      </button>
    </header>

    <div class="hs-panel__body">
      <div
        v-for="stat in HYPER_STATS"
        :key="stat.id"
        class="hs-row"
      >
        <span class="hs-row__name">{{ t(stat.labelKey) }}</span>
        <span class="hs-row__value" :class="{ 'hs-row__value--zero': !(state[stat.id] || 0) }">
          {{ currentValueText(stat) }}
        </span>
        <span class="hs-row__controls">
          <button
            class="hs-btn"
            type="button"
            :disabled="!canDecrement(stat.id)"
            @click="decrement(stat.id)"
          >−</button>
          <button
            class="hs-btn hs-btn--plus"
            type="button"
            :disabled="!canIncrement(stat.id)"
            @click="increment(stat.id)"
          >＋</button>
        </span>
        <span class="hs-row__lv">
          Lv.
          <span class="hs-row__num">{{ state[stat.id] || 0 }}</span>
          <span class="hs-row__cap">/ {{ stat.maxLevel }}</span>
        </span>
      </div>
    </div>

    <footer class="hs-panel__foot">
      <span class="hs-panel__point-label">{{ t('hyperStat.points') }}</span>
      <span class="hs-panel__point-val">
        <span class="hs-panel__used">{{ usedPoints }}</span>
        <span class="hs-panel__sep"> / </span>
        <span class="hs-panel__total">{{ totalPoints }}</span>
      </span>
      <span class="hs-panel__remain">
        {{ t('hyperStat.remaining', { n: remainingPoints }) }}
      </span>
    </footer>
  </section>
</template>

<style scoped>
.hs-panel {
  width: 100%;
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border: 1px solid #3d4554;
  border-radius: 14px;
  padding: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  color: #f1f3f7;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.hs-panel__head {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border: 1px solid #3d4554;
  border-radius: 8px;
  letter-spacing: 0.2em;
  font-weight: 700;
  font-size: 0.78rem;
  color: #ffc857;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.hs-panel__reset {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  padding: 3px 10px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  color: #e8edf2;
  border: 1px solid #141a22;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.72rem;
  letter-spacing: 0.08em;
}
.hs-panel__reset:hover { filter: brightness(1.15); }

.hs-panel__body {
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  padding: 6px 10px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: hidden;
  /* 撐滿剩餘高度,與左側圖鑑面板(含新套裝欄)高度對齊 */
  flex: 1 1 auto;
}

.hs-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(54px, auto) 58px 72px;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-radius: 4px;
  font-size: 0.82rem;
  min-width: 0;
}
.hs-row__value {
  color: #ffc857;
  font-weight: 700;
  text-align: right;
  font-size: 0.8rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.hs-row__value--zero { color: #6a7684; font-weight: 500; }
.hs-row:hover { background: rgba(255, 255, 255, 0.04); }
.hs-row__name {
  color: #e8edf2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hs-row__controls { display: flex; gap: 3px; justify-content: flex-end; }
.hs-row__lv {
  color: #c9d2dd;
  font-size: 0.78rem;
  white-space: nowrap;
  text-align: right;
}
.hs-row__num { color: #ffc857; font-weight: 800; margin: 0 2px; }
.hs-row__cap { color: #8ea6b8; font-size: 0.72rem; }

.hs-btn {
  width: 24px;
  height: 22px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  color: #f1f3f7;
  border: 1px solid #3d4554;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 700;
  line-height: 1;
}
.hs-btn:hover:not(:disabled) { filter: brightness(1.12); border-color: #ffc857; }
.hs-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.hs-btn--plus {
  background: linear-gradient(180deg, #5faee4 0%, #3e8ab8 100%);
  border-color: #1d5a78;
}
.hs-btn--plus:disabled { background: linear-gradient(180deg, #5b6577 0%, #49525f 100%); border-color: #3d4554; }

.hs-panel__foot {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 6px 12px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  font-size: 0.82rem;
}
.hs-panel__point-label {
  color: #c9d2dd;
  font-weight: 600;
  letter-spacing: 0.06em;
  font-size: 0.78rem;
}
.hs-panel__point-val {
  color: #f1f3f7;
  font-weight: 700;
  letter-spacing: 0.02em;
}
.hs-panel__used { color: #ffc857; }
.hs-panel__sep { color: #8ea6b8; }
.hs-panel__total { color: #e8edf2; }
.hs-panel__remain {
  color: #8ea6b8;
  font-size: 0.74rem;
  text-align: right;
}
</style>
