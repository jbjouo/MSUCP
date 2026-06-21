<script setup>
import { useI18n } from 'vue-i18n'
import { useHyperStat } from '../composables/useHyperStat.js'
import { useCharacter } from '../composables/useCharacter.js'
import { useCpDamage } from '../composables/useCpDamage.js'

const { t } = useI18n()
const {
  state,
  HYPER_STATS,
  canIncrement,
  canDecrement,
  increment,
  decrement,
  resetAll,
  autoAllocate,
  totalPoints,
  usedPoints,
  remainingPoints,
} = useHyperStat()

const { state: charState, primaryStat } = useCharacter()
const { statTotal } = useCpDamage()

const JOB_ATT_META = {
  beginner: { weaponConst: 1.20, mastery: 50, usesMatk: false },
  hero: { weaponConst: 1.34, mastery: 95, usesMatk: false },
  paladin: { weaponConst: 1.34, mastery: 95, usesMatk: false },
  darkKnight: { weaponConst: 1.49, mastery: 95, usesMatk: false },
  archmageFP: { weaponConst: 1.20, mastery: 95, usesMatk: true },
  archmageIL: { weaponConst: 1.20, mastery: 95, usesMatk: true },
  bishop: { weaponConst: 1.20, mastery: 95, usesMatk: true },
  bowmaster: { weaponConst: 1.30, mastery: 95, usesMatk: false },
  marksman: { weaponConst: 1.30, mastery: 95, usesMatk: false },
  pathfinder: { weaponConst: 1.30, mastery: 95, usesMatk: false },
  nightlord: { weaponConst: 1.75, mastery: 95, usesMatk: false },
  shadower: { weaponConst: 1.30, mastery: 95, usesMatk: false },
  dualblade: { weaponConst: 1.25, mastery: 95, usesMatk: false },
  buccaneer: { weaponConst: 1.70, mastery: 95, usesMatk: false },
  corsair: { weaponConst: 1.50, mastery: 95, usesMatk: false },
  cannoneer: { weaponConst: 1.49, mastery: 95, usesMatk: false },
  dawnwarrior: { weaponConst: 1.34, mastery: 95, usesMatk: false },
  blazewizard: { weaponConst: 1.20, mastery: 95, usesMatk: true },
  windarcher: { weaponConst: 1.30, mastery: 95, usesMatk: false },
  nightwalker: { weaponConst: 1.75, mastery: 95, usesMatk: false },
  thunderbreaker: { weaponConst: 1.70, mastery: 95, usesMatk: false },
  mihile: { weaponConst: 1.34, mastery: 95, usesMatk: false },
  aran: { weaponConst: 1.49, mastery: 95, usesMatk: false },
  evan: { weaponConst: 1.20, mastery: 95, usesMatk: true },
  mercedes: { weaponConst: 1.35, mastery: 95, usesMatk: false },
  phantom: { weaponConst: 1.34, mastery: 95, usesMatk: false },
  luminous: { weaponConst: 1.20, mastery: 95, usesMatk: true },
  shade: { weaponConst: 1.70, mastery: 95, usesMatk: false },
  ark: { weaponConst: 1.70, mastery: 95, usesMatk: false },
}

function onReset() {
  resetAll()
}

function onAutoAllocate() {
  const meta = JOB_ATT_META[charState.job] || JOB_ATT_META.beginner
  autoAllocate({
    primaryStat: primaryStat.value,
    statTotal,
    mastery: meta.mastery,
    weaponConst: meta.weaponConst,
    usesMatk: meta.usesMatk,
  })
}

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
      <div class="hs-panel__head-actions">
        <button class="hs-head-btn" type="button" @click="onReset">{{ t('hyperStat.reset') }}</button>
        <button class="hs-head-btn hs-head-btn--auto" type="button" @click="onAutoAllocate">{{ t('hyperStat.autoAllocate') }}</button>
      </div>
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
.hs-panel__head-actions {
  position: absolute;
  right: 6px;
  display: flex;
  gap: 4px;
}
.hs-head-btn {
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.3);
  color: #c9d2dd;
  border: 1px solid #3d4554;
  border-radius: 4px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.04em;
}
.hs-head-btn:hover { border-color: #ffc857; color: #ffc857; }
.hs-head-btn--auto {
  color: #7ee8fa;
}
.hs-head-btn--auto:hover { border-color: #7ee8fa; }
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
