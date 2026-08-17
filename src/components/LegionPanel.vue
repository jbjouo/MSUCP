<script setup>
import { useI18n } from 'vue-i18n'
import { useLegion } from '../composables/useLegion.js'
import { usePuzzle } from '../composables/usePuzzle.js'

const { t } = useI18n()
const {
  state,
  setTier,
  LEGION_BRANCHES,
  LEGION_TIER_COUNT,
  LEGION_TIER_LABELS,
} = useLegion()

const {
  state: puzzleState,
  setLevel: setPuzzleLevel,
  PUZZLE_ENTRIES,
} = usePuzzle()

const PCT_STAT_KEYS_PUZZLE = new Set([
  'critRate', 'critDmg', 'dmgPct', 'bossDmg', 'ignoreDef',
  'normalMobDmg', 'bonusExp', 'buffDuration',
])

// 當前值 (單位自動判斷)
function puzzleCurrentText(entry) {
  const lv = puzzleState[entry.id] || 0
  if (!lv) return '—'
  const [key, perLv] = Object.entries(entry.stats)[0]
  const total = Math.round(perLv * lv * 100) / 100
  const isPct = PCT_STAT_KEYS_PUZZLE.has(key)
  const sign = total > 0 ? '+' : ''
  return `${sign}${total}${isPct ? '%' : ''}`
}

function jobName(jobKey) { return t(`character.jobs.${jobKey}`) }
function branchName(branchKey) { return t(`character.branches.${branchKey}`) }

// 把 stats bag 簡單轉成一行描述 (沿用既有的 cp.stats.* i18n keys)
function effectText(effect) {
  if (!effect) return '—'
  const parts = []
  for (const [k, v] of Object.entries(effect.stats || {})) {
    parts.push(formatStatEntry(k, v))
  }
  return parts.join(', ')
}

function formatStatEntry(key, value) {
  const label = resolveStatLabel(key)
  if (PCT_STAT_KEYS.has(key) || key.endsWith('Pct') || key.endsWith('OnHit') ||
      key === 'summonDuration' || key === 'cooldownReduction') {
    const sign = value > 0 ? '+' : ''
    return `${label} ${sign}${value}%`
  }
  const sign = value > 0 ? '+' : ''
  return `${label} ${sign}${value}`
}

const PCT_STAT_KEYS = new Set([
  'hpPct', 'mpPct', 'critRate', 'critDmg', 'dmgPct', 'bossDmg',
  'summonDuration', 'cooldownReduction',
])

function resolveStatLabel(key) {
  // 嘗試 cp.stats.<key>;特殊 key 自己翻
  const specialMap = {
    hpRecoveryOnHit: t('legion.stats.hpRecoveryOnHit'),
    mpRecoveryOnHit: t('legion.stats.mpRecoveryOnHit'),
    summonDuration:  t('legion.stats.summonDuration'),
    cooldownReduction: t('legion.stats.cooldownReduction'),
    hpPct: t('legion.stats.hpPct'),
    mpPct: t('legion.stats.mpPct'),
  }
  if (specialMap[key]) return specialMap[key]
  return t(`cp.stats.${key}`, key)
}
</script>

<template>
  <section class="legion-panel">
    <header class="legion-panel__head">
      <span>{{ t('legion.title') }}</span>
    </header>

    <div class="legion-panel__body legion-panel__body--split">
      <!-- 左:戰地成員屬性 -->
      <section class="legion-section">
        <div class="legion-section__head">{{ t('legion.members') }}</div>
        <div class="legion-section__content">
          <div
            v-for="branch in LEGION_BRANCHES"
            :key="branch.key"
            class="legion-group"
          >
            <div class="legion-group__head">[ {{ branchName(branch.key) }} ]</div>
            <div
              v-for="m in branch.members"
              :key="m.id"
              class="legion-member"
            >
              <div class="legion-member__name">{{ jobName(m.jobKey) }}</div>
              <div class="legion-member__effect">
                {{ (state[m.id] || 0) ? effectText(m.effects[(state[m.id] || 0) - 1]) : '—' }}
              </div>
              <!-- ≥768px:5 個互斥按鈕(點擊已選取取消) -->
              <div class="legion-tier-btns">
                <button
                  v-for="n in LEGION_TIER_COUNT"
                  :key="n"
                  type="button"
                  class="legion-tier-btn"
                  :class="{ 'legion-tier-btn--on': (state[m.id] || 0) === n }"
                  @click="setTier(m.id, (state[m.id] || 0) === n ? 0 : n)"
                >{{ LEGION_TIER_LABELS[n] }}</button>
              </div>
              <!-- <768px:下拉選單 -->
              <select
                class="legion-tier-select"
                :class="{ 'legion-tier-select--on': (state[m.id] || 0) > 0 }"
                :value="state[m.id] || 0"
                @change="(e) => setTier(m.id, e.target.value)"
              >
                <option
                  v-for="n in LEGION_TIER_COUNT + 1"
                  :key="n"
                  :value="n - 1"
                >{{ LEGION_TIER_LABELS[n - 1] }}</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <!-- 右:拼圖屬性 -->
      <section class="legion-section">
        <div class="legion-section__head legion-section__head--row">
          <span>{{ t('puzzle.title') }}</span>
        </div>
        <div class="legion-section__content">
          <div
            v-for="entry in PUZZLE_ENTRIES"
            :key="entry.id"
            class="puzzle-row"
          >
            <span class="puzzle-row__name">{{ t(entry.labelKey) }}</span>
            <span class="puzzle-row__current">{{ puzzleCurrentText(entry) }}</span>
            <span class="puzzle-row__level">
              <input
                type="number"
                class="puzzle-input"
                :min="0"
                :max="entry.maxLevel"
                :value="puzzleState[entry.id] || 0"
                @input="(e) => setPuzzleLevel(entry.id, e.target.value)"
              />
              <span class="puzzle-row__cap">/ {{ entry.maxLevel }}</span>
            </span>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.legion-panel {
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
.legion-panel__head {
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
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.legion-panel__body { display: flex; flex-direction: column; gap: 8px; }
.legion-panel__body--split {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 8px;
}
@media (max-width: 900px) {
  .legion-panel__body--split { grid-template-columns: 1fr; }
}

/* 預設(區塊窄):下拉選單;按鈕群隱藏 */
.legion-tier-btns { display: none; }

/* 成員屬性區塊自身 ≥440px:用 5 個互斥按鈕取代下拉 */
@container legionSec (min-width: 440px) {
  .legion-member { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(200px, 240px); }
  .legion-tier-btns { display: flex; }
  .legion-tier-select { display: none; }
}

.legion-tier-btns {
  gap: 3px;
  justify-content: flex-end;
}
.legion-tier-btn {
  flex: 1 1 0;
  min-width: 40px;
  padding: 4px 2px;
  background: #1f2630;
  color: #c9d2dd;
  border: 1px solid #141a22;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  cursor: pointer;
  transition: filter 0.12s, border-color 0.12s, background 0.12s, color 0.12s;
}
.legion-tier-btn:hover { filter: brightness(1.15); border-color: #ffc857; }
.legion-tier-btn:focus { outline: none; border-color: #ffc857; }
.legion-tier-btn--on {
  background: linear-gradient(180deg, #ffc857 0%, #d79f2e 100%);
  color: #1b1f27;
  border-color: #8a6a1e;
}

.legion-section {
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 以「本區塊自身寬度」判斷要按鈕還是選單(非視窗寬度) */
  container: legionSec / inline-size;
}
.legion-section__head {
  padding: 6px 10px;
  background: linear-gradient(180deg, #4bb8d4 0%, #2e8fa8 100%);
  color: #fff;
  font-weight: 800;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.legion-section__content {
  flex: 1;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 520px;
  overflow-y: auto;
}
.legion-section__content--empty {
  align-items: center;
  justify-content: center;
}
.legion-empty {
  color: #8ea6b8;
  font-style: italic;
  text-align: center;
}

.legion-group__head {
  padding: 3px 6px;
  font-weight: 700;
  color: #ffc857;
  font-size: 0.78rem;
  letter-spacing: 0.06em;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  margin-bottom: 4px;
}

.legion-member {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr) 66px;
  align-items: center;
  gap: 6px;
  padding: 3px 4px;
  border-radius: 4px;
  font-size: 0.8rem;
  min-width: 0;
}
.legion-member:hover { background: rgba(255, 255, 255, 0.04); }
.legion-member__name {
  color: #e8edf2;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.legion-member__effect {
  color: #c9d2dd;
  font-size: 0.74rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.legion-tier-select {
  padding: 3px 6px;
  min-width: 58px;
  background: #1f2630;
  color: #c9d2dd;
  border: 1px solid #141a22;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: filter 0.12s, border-color 0.12s;
}
.legion-tier-select:hover { filter: brightness(1.12); border-color: #ffc857; }
.legion-tier-select:focus { outline: none; border-color: #ffc857; }
.legion-tier-select--on {
  background: linear-gradient(180deg, #ffc857 0%, #d79f2e 100%);
  color: #1b1f27;
  border-color: #8a6a1e;
}

.legion-section__head--row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 10px 0 10px;
  height: 28px;
}

/* 拼圖屬性列 — 緊湊 3 欄佈局:名稱 / 當前值 / input 等級 */
.puzzle-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr) 86px;
  align-items: center;
  gap: 8px;
  padding: 3px 6px;
  border-radius: 4px;
  font-size: 0.82rem;
  min-width: 0;
}
.puzzle-row:hover { background: rgba(255, 255, 255, 0.04); }
.puzzle-row__name {
  color: #e8edf2;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.puzzle-row__current {
  color: #ffc857;
  font-weight: 700;
  text-align: right;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.8rem;
}
.puzzle-row__level {
  display: flex;
  align-items: center;
  gap: 4px;
  justify-content: flex-end;
  min-width: 0;
}
.puzzle-row__cap {
  color: #8ea6b8;
  font-size: 0.72rem;
  white-space: nowrap;
  flex-shrink: 0;
}

.puzzle-input {
  width: 40px;
  min-width: 40px;
  flex-shrink: 0;
  padding: 3px 4px;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 4px;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  text-align: center;
}
.puzzle-input:focus { outline: none; border-color: #ffc857; }
.puzzle-input::-webkit-inner-spin-button,
.puzzle-input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>
