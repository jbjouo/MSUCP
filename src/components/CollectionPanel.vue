<script setup>
import { useI18n } from 'vue-i18n'
import { useCollection } from '../composables/useCollection.js'
import { collectionValueAt } from '../constants/collection.js'

const { t } = useI18n()
const {
  state,
  setLevel,
  increment,
  setSetCount,
  bumpSetCount,
  resetAll,
  setBonusTotal,
  COLLECTION_STATS,
  MAX_COLLECTION_LEVEL,
  COLLECTION_SET_BONUS,
  COLLECTION_SET_MAX,
} = useCollection()

function fmtValue(stat, value) {
  if (!value) return stat.isPct ? '0%' : '0'
  return stat.isPct ? `${value}%` : `${value}`
}
function fmtDelta(stat, level) {
  // 「下一級獲得」= Lv+1 對應值 − 目前等級值
  if (level >= MAX_COLLECTION_LEVEL) return stat.isPct ? '—' : '—'
  const next = collectionValueAt(stat, level + 1) - collectionValueAt(stat, level)
  const sign = next > 0 ? '+' : ''
  return stat.isPct ? `${sign}${next}%` : `${sign}${next}`
}
</script>

<template>
  <section class="coll-panel">
    <header class="coll-panel__head">
      <span>{{ t('collection.title') }}</span>
      <button class="coll-panel__reset" type="button" @click="resetAll">
        {{ t('collection.reset') }}
      </button>
    </header>

    <!-- 套裝數量 — 每個套裝 +5 全屬性 -->
    <div class="coll-sets">
      <div class="coll-sets__label">
        {{ t('collection.setTitle') }}
        <span class="coll-sets__hint">(+{{ COLLECTION_SET_BONUS }} {{ t('collection.perSet') }})</span>
      </div>
      <div class="coll-sets__controls">
        <button
          class="coll-btn"
          type="button"
          :disabled="(state.setCount || 0) <= 0"
          @click="bumpSetCount(-1)"
        >▼</button>
        <input
          type="number"
          class="coll-input"
          :min="0"
          :max="COLLECTION_SET_MAX"
          :value="state.setCount || 0"
          @input="(e) => setSetCount(e.target.value)"
        />
        <button
          class="coll-btn"
          type="button"
          @click="bumpSetCount(1)"
        >▲</button>
        <span class="coll-sets__total">
          {{ t('collection.setBonus') }}: <strong>+{{ setBonusTotal }}</strong>
          <small>{{ t('collection.allStats') }}</small>
        </span>
      </div>
    </div>

    <div class="coll-panel__body">
      <div class="coll-row coll-row--head">
        <span class="coll-row__name">{{ t('collection.headers.stat') }}</span>
        <span class="coll-row__value">{{ t('collection.headers.current') }}</span>
        <span class="coll-row__level">{{ t('collection.headers.level') }}</span>
        <span class="coll-row__next">{{ t('collection.headers.nextGain') }}</span>
      </div>

      <div
        v-for="stat in COLLECTION_STATS"
        :key="stat.key"
        class="coll-row"
      >
        <span class="coll-row__name">{{ t(stat.labelKey) }}</span>
        <span class="coll-row__value">
          {{ fmtValue(stat, collectionValueAt(stat, state.levels[stat.key] || 0)) }}
        </span>
        <span class="coll-row__level">
          <button
            class="coll-btn coll-btn--edge"
            type="button"
            :disabled="(state.levels[stat.key] || 0) <= 0"
            :title="t('collection.tip.toMin')"
            @click="setLevel(stat.key, 0)"
          >⏬</button>
          <button
            class="coll-btn"
            type="button"
            :disabled="(state.levels[stat.key] || 0) <= 0"
            @click="increment(stat.key, -1)"
          >▼</button>
          <input
            type="number"
            class="coll-input"
            :min="0"
            :max="MAX_COLLECTION_LEVEL"
            :value="state.levels[stat.key] || 0"
            @input="(e) => setLevel(stat.key, e.target.value)"
          />
          <span class="coll-cap">/ {{ MAX_COLLECTION_LEVEL }}</span>
          <button
            class="coll-btn"
            type="button"
            :disabled="(state.levels[stat.key] || 0) >= MAX_COLLECTION_LEVEL"
            @click="increment(stat.key, 1)"
          >▲</button>
          <button
            class="coll-btn coll-btn--edge"
            type="button"
            :disabled="(state.levels[stat.key] || 0) >= MAX_COLLECTION_LEVEL"
            :title="t('collection.tip.toMax')"
            @click="setLevel(stat.key, MAX_COLLECTION_LEVEL)"
          >⏫</button>
        </span>
        <span class="coll-row__next">{{ fmtDelta(stat, state.levels[stat.key] || 0) }}</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.coll-sets {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}
.coll-sets__label {
  font-size: 0.78rem;
  font-weight: 700;
  color: #c9d2dd;
  letter-spacing: 0.04em;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.coll-sets__hint {
  font-size: 0.7rem;
  color: #8ea6b8;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.coll-sets__controls {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}
.coll-sets__total {
  margin-left: auto;
  font-size: 0.8rem;
  color: #c9d2dd;
  letter-spacing: 0.02em;
}
.coll-sets__total strong {
  color: #ffc857;
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  margin: 0 0.2rem;
}
.coll-sets__total small {
  color: #8ea6b8;
  margin-left: 0.2rem;
}

.coll-panel {
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

.coll-panel__head {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  height: 30px;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border: 1px solid #3d4554;
  border-radius: 8px;
  letter-spacing: 0.2em;
  font-weight: 700;
  font-size: 0.78rem;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.coll-panel__reset {
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
.coll-panel__reset:hover { filter: brightness(1.15); }

.coll-panel__body {
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  padding: 6px 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: hidden;
}

.coll-row {
  display: grid;
  /* 級別欄固定,其餘彈性,避免擠壓溢出 */
  grid-template-columns: minmax(0, 1fr) 54px 158px 52px;
  align-items: center;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.8rem;
  gap: 4px;
  min-width: 0;
}
.coll-row:hover:not(.coll-row--head) { background: rgba(255, 255, 255, 0.04); }
.coll-row--head {
  font-size: 0.74rem;
  color: #c9d2dd;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 2px;
}
.coll-row__name {
  color: #e8edf2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}
.coll-row__value {
  color: #ffc857;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.coll-row__level {
  display: flex;
  align-items: center;
  gap: 2px;
  justify-content: center;
  flex-wrap: nowrap;
  min-width: 0;
}
.coll-row__next {
  color: #8ea6b8;
  text-align: right;
  font-size: 0.72rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.coll-btn {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  min-width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  color: #f1f3f7;
  border: 1px solid #3d4554;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.7rem;
  padding: 0;
}
.coll-btn:hover:not(:disabled) { filter: brightness(1.12); border-color: #ffc857; }
.coll-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.coll-btn--edge {
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  color: #ffc857;
  border-color: #141a22;
  font-size: 0.65rem;
}

.coll-input {
  width: 34px;
  flex-shrink: 0;
  min-width: 34px;
  padding: 2px 2px;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.82rem;
  text-align: center;
}
.coll-input:focus { outline: none; border-color: #ffc857; }
.coll-input::-webkit-inner-spin-button,
.coll-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.coll-cap { color: #8ea6b8; font-size: 0.7rem; flex-shrink: 0; white-space: nowrap; }

@media (max-width: 720px) {
  .coll-row { grid-template-columns: minmax(0, 1fr) minmax(0, 0.6fr) minmax(0, 1.3fr) minmax(0, 0.5fr); font-size: 0.76rem; gap: 2px; }
  .coll-row--head { font-size: 0.66rem; }
  .coll-btn { width: 18px; height: 18px; }
  .coll-input { width: 32px; }
}
</style>
