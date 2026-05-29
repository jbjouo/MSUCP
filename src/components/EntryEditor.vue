<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipment, BONUS_STATS_KEYS, allowedBonusStatKeys, supportsBonusStats } from '../composables/useEquipment.js'
import { STAR_SETTABLE_CAP, maxStarsForLevel } from '../constants/starForce.js'
import {
  POTENTIAL_TIERS,
  getPotentialOptionsForLine,
  itemHasPotentialPool,
} from '../constants/potentials.js'
import {
  getBonusPotentialOptionsForLine,
  itemHasBonusPotentialPool,
} from '../constants/bonusPotentials.js'
import { weaponBonusTiersFor } from '../constants/bonusStatsTiers.js'
import StarBar from './StarBar.vue'

// Bonus Stats 欄位設定 (分三群組)
const BS_GROUPS = [
  {
    key: 'base',
    fields: [
      { key: 'str', label: 'STR' },
      { key: 'dex', label: 'DEX' },
      { key: 'int', label: 'INT' },
      { key: 'luk', label: 'LUK' },
    ],
  },
  {
    key: 'attack',
    fields: [
      { key: 'atk',  label: 'ATT' },
      { key: 'matk', label: 'Magic ATT' },
    ],
  },
  {
    key: 'percent',
    fields: [
      { key: 'bossDmg',    label: 'Boss Damage', percent: true },
      { key: 'dmgPct',     label: 'Damage',      percent: true },
      { key: 'allStatPct', label: 'All Stats',   percent: true },
    ],
  },
]

const props = defineProps({
  uid: { type: String, default: null },
})
const emit = defineEmits(['close'])

const { t } = useI18n()
const { resolveEntry, setStars, setBonusStats, setPotential, setBonusPotential } = useEquipment()

const entry = computed(() => (props.uid ? resolveEntry(props.uid) : null))
const item = computed(() => entry.value?.item || null)

// 不適用的分頁直接隱藏 (例:戒指沒有 Bonus Stats)
const tabs = computed(() => [
  { key: 'stars',      i18n: 'equipment.editor.tab.stars',      ready: (item.value?.maxStars || 0) > 0 },
  { key: 'bonusStats', i18n: 'equipment.editor.tab.bonusStats', ready: supportsBonusStats(item.value) },
  { key: 'potential',  i18n: 'equipment.editor.tab.potential',  ready: itemHasPotentialPool(item.value) },
  { key: 'bonus',      i18n: 'equipment.editor.tab.bonus',      ready: itemHasBonusPotentialPool(item.value) },
].filter((tab) => tab.ready))

const bonusSupported = computed(() => supportsBonusStats(item.value))
const allowedBsKeys = computed(() => new Set(allowedBonusStatKeys(item.value)))

// 群組時過濾掉該裝備不允許的欄位,整組都沒欄位就不顯示
const visibleBsGroups = computed(() =>
  BS_GROUPS
    .map((g) => ({ ...g, fields: g.fields.filter((f) => allowedBsKeys.value.has(f.key)) }))
    .filter((g) => g.fields.length > 0),
)
const activeTab = ref('stars')

function emptyBonusStats() {
  return Object.fromEntries(BONUS_STATS_KEYS.map((k) => [k, 0]))
}

function emptyTieredLines() {
  return { tier: 'rare', lines: [null, null, null] }
}
function cloneTieredLines(src) {
  return src
    ? { tier: src.tier, lines: [src.lines?.[0] || null, src.lines?.[1] || null, src.lines?.[2] || null] }
    : emptyTieredLines()
}

// 草稿 (編輯中的值) — 確定時才寫回
const draft = ref({
  stars: 0,
  bonusStats: emptyBonusStats(),
  potential: emptyTieredLines(),
  bonusPotential: emptyTieredLines(),
})

watch(
  () => props.uid,
  (uid) => {
    if (!uid) return
    // 選第一個可用的分頁 (通常是 stars,但若該裝備不支援就跳到下一個)
    activeTab.value = tabs.value[0]?.key || 'stars'
    const e = resolveEntry(uid)
    draft.value = {
      stars: e?.stars ?? 0,
      bonusStats: { ...emptyBonusStats(), ...(e?.bonusStats || {}) },
      potential: cloneTieredLines(e?.potential),
      bonusPotential: cloneTieredLines(e?.bonusPotential),
    }
  },
  { immediate: true },
)

const potentialSupported = computed(() => itemHasPotentialPool(item.value))
const potentialLineOptions = computed(() => [
  getPotentialOptionsForLine(item.value, draft.value.potential.tier, 0),
  getPotentialOptionsForLine(item.value, draft.value.potential.tier, 1),
  getPotentialOptionsForLine(item.value, draft.value.potential.tier, 2),
])
const anyPotentialOption = computed(() =>
  potentialLineOptions.value.some((l) => l.length > 0),
)
function setPotentialTier(tier) {
  if (!POTENTIAL_TIERS.includes(tier)) return
  if (draft.value.potential.tier === tier) return
  draft.value.potential = { tier, lines: [null, null, null] }
}
function setPotentialLine(idx, label) {
  draft.value.potential.lines[idx] = label || null
}

const bonusPotentialSupported = computed(() => itemHasBonusPotentialPool(item.value))
const bonusPotentialLineOptions = computed(() => [
  getBonusPotentialOptionsForLine(item.value, draft.value.bonusPotential.tier, 0),
  getBonusPotentialOptionsForLine(item.value, draft.value.bonusPotential.tier, 1),
  getBonusPotentialOptionsForLine(item.value, draft.value.bonusPotential.tier, 2),
])
const anyBonusPotentialOption = computed(() =>
  bonusPotentialLineOptions.value.some((l) => l.length > 0),
)
function setBonusPotentialTier(tier) {
  if (!POTENTIAL_TIERS.includes(tier)) return
  if (draft.value.bonusPotential.tier === tier) return
  draft.value.bonusPotential = { tier, lines: [null, null, null] }
}
function setBonusPotentialLine(idx, label) {
  draft.value.bonusPotential.lines[idx] = label || null
}

// 星力上限:取 item.maxStars 與依等級上限 (100→8、110→10、120→15、130→20、140+→25) 較嚴格者
const maxStars = computed(() => {
  const it = item.value
  if (!it) return 0
  const lvCap = maxStarsForLevel(it.level || 0)
  const declared = Number.isFinite(it.maxStars) ? it.maxStars : lvCap
  return Math.min(declared, lvCap)
})
// UI 可設定的實際上限 (即使 item 最大 25,24/25 不給選)
const editableMax = computed(() => Math.min(maxStars.value, STAR_SETTABLE_CAP))

function clampDraftStars(n) {
  return Math.min(Math.max(0, Math.floor(Number(n) || 0)), editableMax.value)
}

function setDraftStars(n) {
  draft.value.stars = clampDraftStars(n)
}

function incStars(delta) {
  setDraftStars(draft.value.stars + delta)
}

function setBonusField(key, value) {
  const v = Math.max(0, Math.floor(Number(value) || 0))
  draft.value.bonusStats[key] = v
}

// 武器 ATT/MATK 星火 — 若可查表,以下拉選單顯示(等級 0~7)
// 回傳:null → 顯示自由輸入;array → 對應 7 個等級值
function bonusTiersForField(key) {
  return weaponBonusTiersFor(item.value, key)
}

function onConfirm() {
  if (!entry.value) return emit('close')
  setStars(entry.value.uid, draft.value.stars)
  setBonusStats(entry.value.uid, draft.value.bonusStats)
  setPotential(entry.value.uid, draft.value.potential)
  setBonusPotential(entry.value.uid, draft.value.bonusPotential)
  emit('close')
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
  if (activeTab.value === 'stars') {
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault()
      incStars(1)
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault()
      incStars(-1)
    }
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="uid && item"
      class="editor-backdrop"
      @keydown="onKey"
      tabindex="-1"
    >
      <div class="editor" role="dialog" :aria-label="t('equipment.editor.title')">
        <!-- header: 裝備資訊 -->
        <header class="editor__head">
          <div class="editor__thumb">
            <img
              v-if="item.imageUrl || item.icon"
              :src="item.imageUrl || item.icon"
              :alt="item.name"
            />
            <span v-else class="editor__thumb-ph" aria-hidden="true" />
          </div>
          <div class="editor__title">
            <div class="editor__name">{{ item.name }}</div>
            <div class="editor__meta">
              <span>{{ t(`equipment.types.${item.type}`) }}</span>
              <span>·</span>
              <span>Lv. {{ item.level }}</span>
            </div>
          </div>
          <button class="editor__close" @click="emit('close')" aria-label="close">×</button>
        </header>

        <!-- tabs -->
        <nav class="editor__tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="editor__tab"
            :class="{ 'editor__tab--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ t(tab.i18n) }}
          </button>
        </nav>

        <!-- panels -->
        <div class="editor__body">
          <section v-if="activeTab === 'stars'" class="panel">
            <div v-if="maxStars === 0" class="panel__note">
              {{ t('equipment.editor.starNotSupported') }}
            </div>
            <template v-else>
              <div class="panel__label">
                {{ t('equipment.editor.currentStars') }}
                <strong :class="{ 'panel__max': draft.stars === editableMax }">
                  {{ draft.stars }} / {{ maxStars }}
                </strong>
              </div>
              <div class="panel__bar">
                <StarBar
                  :stars="draft.stars"
                  :max="maxStars"
                  :editable-max="editableMax"
                  size="large"
                  editable
                  @update:stars="setDraftStars"
                />
              </div>
              <div class="panel__controls">
                <button class="btn btn--small" @click="setDraftStars(0)">{{ t('equipment.editor.zero') }}</button>
                <button class="btn btn--small" @click="incStars(-5)">-5</button>
                <button class="btn btn--small" @click="incStars(-1)">-1</button>
                <input
                  type="number"
                  class="panel__input"
                  :value="draft.stars"
                  :min="0"
                  :max="editableMax"
                  @input="setDraftStars($event.target.value)"
                />
                <button class="btn btn--small" @click="incStars(1)">+1</button>
                <button class="btn btn--small" @click="incStars(5)">+5</button>
                <button class="btn btn--small" @click="setDraftStars(editableMax)">{{ t('equipment.editor.max') }}</button>
              </div>
              <p class="panel__hint">{{ t('equipment.editor.starHint') }}</p>
            </template>
          </section>

          <section v-else-if="activeTab === 'bonusStats'" class="panel panel--bs">
            <div v-if="!bonusSupported" class="panel__note">
              {{ t('equipment.editor.bsNotSupported') }}
            </div>
            <template v-else>
            <p class="bs-hint">{{ t('equipment.editor.bsHint') }}</p>
            <div class="bs-groups">
              <div
                v-for="g in visibleBsGroups"
                :key="g.key"
                class="bs-group"
              >
                <h4 class="bs-group__title">{{ t(`equipment.editor.bsGroup.${g.key}`) }}</h4>
                <div class="bs-fields">
                  <label v-for="f in g.fields" :key="f.key" class="bs-field">
                    <span class="bs-field__label">{{ f.label }}</span>
                    <div class="bs-field__input-wrap">
                      <!-- 武器 ATT/MATK:可查表 → 下拉選單 (0 + 等級1~7) -->
                      <select
                        v-if="bonusTiersForField(f.key)"
                        class="bs-field__select"
                        :value="draft.bonusStats[f.key]"
                        @change="setBonusField(f.key, $event.target.value)"
                      >
                        <option :value="0">{{ t('equipment.editor.bsTier.none') }}</option>
                        <option
                          v-for="(v, i) in bonusTiersForField(f.key)"
                          :key="i"
                          :value="v"
                        >{{ t('equipment.editor.bsTier.level', { n: i + 1 }) }} (+{{ v }})</option>
                      </select>
                      <!-- 其他欄位 / 不適用查表 → 自由輸入 -->
                      <input
                        v-else
                        type="number"
                        class="bs-field__input"
                        :class="{ 'bs-field__input--pct': f.percent }"
                        :min="0"
                        :value="draft.bonusStats[f.key]"
                        @input="setBonusField(f.key, $event.target.value)"
                      />
                      <span v-if="f.percent" class="bs-field__unit">%</span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            </template>
          </section>

          <section v-else-if="activeTab === 'potential'" class="panel panel--pt">
            <div v-if="!potentialSupported" class="panel__note">
              {{ t('equipment.editor.ptNotSupported') }}
            </div>
            <template v-else>
              <div class="pt-tiers">
                <button
                  v-for="tier in POTENTIAL_TIERS"
                  :key="tier"
                  type="button"
                  class="pt-tier"
                  :class="{
                    'pt-tier--active': draft.potential.tier === tier,
                    [`pt-tier--${tier}`]: true,
                  }"
                  @click="setPotentialTier(tier)"
                >{{ t(`equipment.editor.ptTier.${tier}`) }}</button>
              </div>

              <div v-if="!anyPotentialOption" class="panel__note">
                {{ t('equipment.editor.ptTierEmpty') }}
              </div>

              <div v-else class="pt-lines">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="pt-line"
                >
                  <span class="pt-line__no">{{ i }}</span>
                  <select
                    class="pt-line__select"
                    :value="draft.potential.lines[i - 1] || ''"
                    @change="setPotentialLine(i - 1, $event.target.value)"
                  >
                    <option value="">— {{ t('equipment.editor.ptNone') }} —</option>
                    <option
                      v-for="opt in potentialLineOptions[i - 1]"
                      :key="opt.label"
                      :value="opt.label"
                    >{{ opt.label }}</option>
                  </select>
                </div>
              </div>
            </template>
          </section>

          <section v-else-if="activeTab === 'bonus'" class="panel panel--pt">
            <div v-if="!bonusPotentialSupported" class="panel__note">
              {{ t('equipment.editor.bpNotSupported') }}
            </div>
            <template v-else>
              <div class="pt-tiers">
                <button
                  v-for="tier in POTENTIAL_TIERS"
                  :key="tier"
                  type="button"
                  class="pt-tier"
                  :class="{
                    'pt-tier--active': draft.bonusPotential.tier === tier,
                    [`pt-tier--${tier}`]: true,
                  }"
                  @click="setBonusPotentialTier(tier)"
                >{{ t(`equipment.editor.ptTier.${tier}`) }}</button>
              </div>

              <div v-if="!anyBonusPotentialOption" class="panel__note">
                {{ t('equipment.editor.ptTierEmpty') }}
              </div>

              <div v-else class="pt-lines">
                <div
                  v-for="i in 3"
                  :key="i"
                  class="pt-line"
                >
                  <span class="pt-line__no">{{ i }}</span>
                  <select
                    class="pt-line__select"
                    :value="draft.bonusPotential.lines[i - 1] || ''"
                    @change="setBonusPotentialLine(i - 1, $event.target.value)"
                  >
                    <option value="">— {{ t('equipment.editor.ptNone') }} —</option>
                    <option
                      v-for="opt in bonusPotentialLineOptions[i - 1]"
                      :key="opt.label"
                      :value="opt.label"
                    >{{ opt.label }}</option>
                  </select>
                </div>
              </div>
            </template>
          </section>
        </div>

        <footer class="editor__foot">
          <button class="btn btn--ghost" @click="emit('close')">
            {{ t('equipment.editor.cancel') }}
          </button>
          <button class="btn btn--primary" @click="onConfirm">
            {{ t('equipment.editor.confirm') }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.editor-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(5, 8, 18, 0.72);
  backdrop-filter: blur(4px);
  z-index: 950;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}
.editor {
  width: min(520px, 100%);
  max-height: min(86vh, 720px);
  background: linear-gradient(180deg, #141a2e 0%, #0f1324 100%);
  border: 1px solid #2a3152;
  border-radius: 14px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  color: #e9edf5;
}

.editor__head {
  display: grid;
  grid-template-columns: 56px 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #2a3152;
}
.editor__thumb {
  width: 56px;
  height: 56px;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.editor__thumb img {
  max-width: 100%;
  max-height: 100%;
  image-rendering: pixelated;
}
.editor__thumb-ph {
  width: 70%;
  height: 70%;
  border-radius: 4px;
  background:
    linear-gradient(135deg, rgba(126, 232, 250, 0.08), transparent 60%),
    repeating-linear-gradient(45deg, rgba(255,255,255,0.02) 0 4px, transparent 4px 8px);
}
.editor__title { min-width: 0; }
.editor__name {
  font-weight: 700;
  font-size: 1.05rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.editor__meta {
  color: #8089a3;
  font-size: 0.8rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
  margin-top: 2px;
}
.editor__close {
  background: transparent;
  border: 1px solid #2a3152;
  color: #e9edf5;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  font-size: 1.1rem;
  cursor: pointer;
}
.editor__close:hover { border-color: #7ee8fa; }

.editor__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 4px;
  padding: 0.4rem 0.5rem 0;
  background: #0f1324;
  border-bottom: 1px solid #2a3152;
}
.editor__tab {
  position: relative;
  flex: 1 1 auto;
  min-width: 0;
  background: transparent;
  color: #8089a3;
  border: none;
  border-bottom: 2px solid transparent;
  padding: 0.45rem 0.5rem;
  font-family: inherit;
  font-size: 0.82rem;
  cursor: pointer;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  text-align: center;
  transition: color 100ms ease, border-color 100ms ease;
}
.editor__tab:hover:not(.editor__tab--disabled) {
  color: #e9edf5;
}
.editor__tab--active {
  color: #ffcc33;
  border-bottom-color: #ffcc33;
}
.editor__tab--disabled {
  color: #4a5170;
  cursor: not-allowed;
}
.editor__soon {
  margin-left: 3px;
  font-size: 0.58rem;
  padding: 0 3px;
  border-radius: 3px;
  background: #1f2540;
  color: #8089a3;
  vertical-align: 1px;
}

.editor__body {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  min-height: 180px;
}

.panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.panel__label {
  font-size: 0.9rem;
  color: #c9cfe3;
  margin-bottom: 0.75rem;
}
.panel__label strong { color: #f0b429; margin-left: 0.3rem; }
.panel__max strong,
.panel__label strong.panel__max { color: #22c55e; }

.panel__bar {
  width: 100%;
  max-width: 380px;
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.75rem;
}

.panel__controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
}
.panel__input {
  width: 60px;
  background: #0a0e1c;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.3rem 0.4rem;
  font-family: inherit;
  font-size: 0.85rem;
  text-align: center;
}
.panel__input:focus { outline: none; border-color: #7ee8fa; }

.panel__hint {
  color: #8089a3;
  font-size: 0.75rem;
  margin: 0;
}
.panel__note {
  color: #8089a3;
  background: #0a0e1c;
  border: 1px dashed #2a3152;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
}
.panel__placeholder {
  color: #8089a3;
  background: #0a0e1c;
  border: 1px dashed #2a3152;
  border-radius: 8px;
  padding: 2rem 1rem;
  text-align: center;
  margin: 0;
}

/* Bonus Stats 分頁 */
.panel--bs {
  align-items: stretch;
  text-align: left;
  width: 100%;
}
.bs-hint {
  color: #8089a3;
  font-size: 0.75rem;
  margin: 0 0 0.6rem;
  text-align: center;
}
.bs-groups {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.bs-group {
  background: #0a0e1c;
  border: 1px solid #2a3152;
  border-radius: 8px;
  padding: 0.55rem 0.7rem 0.65rem;
}
.bs-group__title {
  margin: 0 0 0.4rem;
  color: #ffcc33;
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  font-weight: 700;
}
.bs-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.4rem 0.6rem;
}
.bs-field {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
}
.bs-field__label {
  color: #c9cfe3;
  font-size: 0.8rem;
  white-space: nowrap;
}
.bs-field__input-wrap {
  position: relative;
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
}
.bs-field__input {
  background: #141a2e;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  width: 80px;
  font-family: inherit;
  font-size: 0.85rem;
  text-align: right;
}
.bs-field__input:focus { outline: none; border-color: #7ee8fa; }
.bs-field__select {
  background: #141a2e;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.3rem 0.5rem;
  width: 130px;
  font-family: inherit;
  font-size: 0.8rem;
}
.bs-field__select:focus { outline: none; border-color: #7ee8fa; }
.bs-field__unit {
  position: absolute;
  right: 0.5rem;
  color: #8089a3;
  font-size: 0.8rem;
  pointer-events: none;
}
.bs-field__input--pct { padding-right: 1.3rem; }

@media (max-width: 480px) {
  .bs-fields { grid-template-columns: 1fr; }
  .bs-field__input { width: 100px; }
}

/* 潛能分頁 */
.panel--pt {
  align-items: stretch;
  text-align: left;
  width: 100%;
  gap: 0.75rem;
}
.pt-tiers {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
}
.pt-tier {
  background: #0a0e1c;
  color: #8089a3;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.4rem 0.5rem;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  transition: border-color 120ms ease, color 120ms ease;
}
.pt-tier:hover { border-color: #7ee8fa; color: #e9edf5; }
.pt-tier--active { color: #0a0e1c; }
.pt-tier--rare.pt-tier--active      { background: #4a90e2; border-color: #4a90e2; }
.pt-tier--epic.pt-tier--active      { background: #a855f7; border-color: #a855f7; }
.pt-tier--unique.pt-tier--active    { background: #f0b429; border-color: #f0b429; }
.pt-tier--legendary.pt-tier--active { background: #22c55e; border-color: #22c55e; }

.pt-lines {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.pt-line {
  display: grid;
  grid-template-columns: 24px 1fr;
  align-items: center;
  gap: 0.5rem;
}
.pt-line__no {
  color: #8089a3;
  font-size: 0.8rem;
  text-align: center;
}
.pt-line__select {
  background: #0a0e1c;
  color: #e9edf5;
  border: 1px solid #2a3152;
  border-radius: 6px;
  padding: 0.4rem 0.55rem;
  font-family: inherit;
  font-size: 0.85rem;
  min-width: 0;
  width: 100%;
}
.pt-line__select:focus { outline: none; border-color: #7ee8fa; }

.editor__foot {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-top: 1px solid #2a3152;
}
.btn {
  background: #1b2140;
  color: #e9edf5;
  border: 1px solid #2a3152;
  padding: 0.4rem 0.85rem;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.85rem;
  transition: background 100ms ease, border-color 100ms ease;
}
.btn--small { padding: 0.25rem 0.55rem; font-size: 0.78rem; }
.btn--ghost { background: transparent; }
.btn--primary {
  background: #ffcc33;
  color: #0a0e1c;
  border-color: #ffcc33;
  font-weight: 600;
}
.btn--primary:hover { background: #ffd968; border-color: #ffd968; }
.btn:hover:not(.btn--primary) {
  background: #232a4f;
  border-color: #7ee8fa;
}

@media (max-width: 520px) {
  .editor__head { grid-template-columns: 48px 1fr auto; }
  .editor__thumb { width: 48px; height: 48px; }
  .editor__name { font-size: 0.95rem; }
}
</style>
