<script setup>
import { computed, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import StarBar from './StarBar.vue'
import { setsForItem, countActiveSet } from '../constants/itemSets.js'
import { ITEMS_BY_ID, useEquipment } from '../composables/useEquipment.js'

const { state: equipState, resolveEntry } = useEquipment()
// 當前穿在身上的 item id 集合 (供套裝面板判斷點亮狀態用)
const equippedIds = computed(() => {
  const s = new Set()
  for (const uid of Object.values(equipState.equipped)) {
    const e = resolveEntry(uid)
    if (e?.item?.id) s.add(e.item.id)
  }
  return s
})
// 已穿上的 item 物件 (供 countActiveSet 判斷幸運道具)
const equippedItems = computed(() => {
  const arr = []
  for (const uid of Object.values(equipState.equipped)) {
    const e = resolveEntry(uid)
    if (e?.item?.id) arr.push(e.item)
  }
  return arr
})
function activeSetCount(set) {
  return countActiveSet(set, equippedItems.value)
}

const props = defineProps({
  // 可傳 entry ({ uid, item, stars, ...future: bonusStats, starStats, potential, bonusPotential })
  entry: { type: Object, default: null },
  x: { type: Number, default: 0 },
  y: { type: Number, default: 0 },
})

const { t } = useI18n()

const item = computed(() => props.entry?.item || null)
const stars = computed(() => props.entry?.stars ?? 0)
const bonusStats = computed(() => props.entry?.bonusStats || null)
const starStats = computed(() => props.entry?.starStats || null)
const potential = computed(() => props.entry?.potential || null)
const bonusPotential = computed(() => props.entry?.bonusPotential || null)
const potentialLines = computed(() =>
  (potential.value?.lines || []).filter((l) => !!l),
)
const bonusPotentialLines = computed(() =>
  (bonusPotential.value?.lines || []).filter((l) => !!l),
)

// 武器 subType → 職業
const WEAPON_CLASS_MAP = {
  sword: ['warrior'],
  axe: ['warrior'],
  blunt: ['warrior'],
  spear: ['warrior'],
  polearm: ['warrior'],
  wand: ['magician'],
  staff: ['magician'],
  shining_rod: ['magician'],
  bow: ['bowman'],
  crossbow: ['bowman'],
  dagger: ['thief'],
  claw: ['thief'],
  katara: ['thief'],
  gun: ['pirate'],
  knuckle: ['pirate'],
  totem: ['magician'],
  shield: ['warrior'],
}

const JOB_CLASSES = ['warrior', 'magician', 'bowman', 'thief', 'pirate']

const matchedClasses = computed(() => {
  if (!item.value) return []
  if (Array.isArray(item.value.classes)) return item.value.classes
  return WEAPON_CLASS_MAP[item.value.subType] || []
})

const showClassBar = computed(() => {
  // 只有武器 / 副手會顯示職業列
  return item.value?.type === 'weapon' || item.value?.type === 'secondary'
})

// 顯示 stat 的順序與要轉 % 的 key
const PCT_KEYS = new Set([
  'bossDmg', 'ignoreDef', 'allStatPct', 'dmgPct',
  'atkPct', 'matkPct', 'hpPct', 'mpPct',
  'strPct', 'dexPct', 'intPct', 'lukPct',
])
const STAT_ORDER = [
  'bossDmg', 'ignoreDef', 'dmgPct', 'allStatPct',
  'atk', 'matk',
  'str', 'dex', 'int', 'luk',
  'hp', 'mp', 'def',
]

// 逐 stat 合併:base + star + bonusStats。
// breakdown 以 { value, kind } 陣列呈現,kind 決定該段顏色 (base/star = 青;bonus = 綠)
function rowFor(key) {
  const base = item.value?.stats?.[key] || 0
  const star = starStats.value?.[key] || 0
  const bonus = bonusStats.value?.[key] || 0
  const total = base + star + bonus
  const hasExtra = !!(star || bonus)
  if (!total && !hasExtra) return null
  let breakdown = null
  if (hasExtra) {
    // 顯示順序:基礎 + Bonus Stats (星火) + 星力
    breakdown = [{ value: base, kind: 'base' }]
    if (bonus) breakdown.push({ value: bonus, kind: 'bonus' })
    if (star)  breakdown.push({ value: star,  kind: 'star' })
  }
  return {
    key,
    label: t(`equipment.stats.${key}`, key),
    total,
    breakdown,
    hasBonus: !!bonus,
    percent: PCT_KEYS.has(key),
  }
}

const statRows = computed(() => {
  if (!item.value?.stats) return []
  const out = []
  const seen = new Set()
  for (const k of STAT_ORDER) {
    const r = rowFor(k)
    if (r) out.push(r)
    seen.add(k)
  }
  // 其餘未列在 STAT_ORDER 的屬性 (例如 bossDmg, ignoreDef 等 %)
  const all = new Set([
    ...Object.keys(item.value.stats || {}),
    ...Object.keys(bonusStats.value || {}),
    ...Object.keys(starStats.value || {}),
  ])
  for (const k of all) {
    if (seen.has(k)) continue
    const r = rowFor(k)
    if (r) out.push(r)
  }
  return out
})

const imgUrl = computed(() => item.value?.imageUrl || item.value?.icon || null)

const rootRef = ref(null)
const pos = ref({ left: 0, top: 0 })
const OFFSET = 16

async function reposition() {
  await nextTick()
  const el = rootRef.value
  if (!el) return
  const w = el.offsetWidth || 280
  const h = el.offsetHeight || 200
  const vw = window.innerWidth
  const vh = window.innerHeight
  let left = props.x + OFFSET
  let top = props.y + OFFSET
  if (left + w > vw - 8) left = Math.max(8, props.x - w - OFFSET)
  if (top + h > vh - 8) top = Math.max(8, vh - h - 8)
  pos.value = { left, top }
}

watch(() => [props.entry, props.x, props.y], reposition, { immediate: true })

// ── 套裝資訊 ────────────────────────────────────
//   顯示該物件所屬套裝的成員清單 (僅列出 items.json 已登錄的) 與各件數加成
const itemSets = computed(() => (item.value ? setsForItem(item.value.id) : []))

// 顯示用 stat 組:拆成單一 string 陣列
const SET_STAT_DISPLAY = [
  { key: 'allStat',     label: 'All Stats',           suffix: '' },
  { key: 'allStatPct',  label: 'All Stats',           suffix: '%' },
  { key: 'hpPct',       label: 'MaxHP / MaxMP',       suffix: '%', pairedWith: 'mpPct' },
  { key: 'str',         label: 'STR',                 suffix: '' },
  { key: 'dex',         label: 'DEX',                 suffix: '' },
  { key: 'int',         label: 'INT',                 suffix: '' },
  { key: 'luk',         label: 'LUK',                 suffix: '' },
  { key: 'hp',          label: 'Max HP',              suffix: '' },
  { key: 'mp',          label: 'Max MP',              suffix: '' },
  { key: 'atk',         label: 'Attack Power',        suffix: '', pairedWith: 'matk', pairLabel: 'Attack Power & Magic ATT' },
  { key: 'matk',        label: 'Magic ATT',           suffix: '' },
  { key: 'def',         label: 'Defense',             suffix: '' },
  { key: 'ignoreDef',   label: 'DEF Ignored',         suffix: '%' },
  { key: 'bossDmg',     label: 'Boss Damage',         suffix: '%' },
  { key: 'dmgPct',      label: 'Damage',              suffix: '%' },
  { key: 'critRate',    label: 'Critical Rate',       suffix: '%' },
  { key: 'critDmg',     label: 'Critical Damage',     suffix: '%' },
]

function formatTierStats(stats) {
  if (!stats) return []
  const used = new Set()
  const out = []
  // Pair hp/mp together, atk/matk together
  if (stats.hpPct && stats.mpPct && stats.hpPct === stats.mpPct) {
    out.push(`MaxHP / MaxMP: +${stats.hpPct}%`)
    used.add('hpPct'); used.add('mpPct')
  }
  if (stats.atk && stats.matk && stats.atk === stats.matk) {
    out.push(`Attack Power & Magic ATT: +${stats.atk}`)
    used.add('atk'); used.add('matk')
  }
  for (const { key, label, suffix } of SET_STAT_DISPLAY) {
    if (used.has(key)) continue
    const v = stats[key]
    if (!v) continue
    out.push(`${label}: +${v}${suffix}`)
    used.add(key)
  }
  // Catch any remaining keys
  for (const [k, v] of Object.entries(stats)) {
    if (used.has(k) || !v) continue
    out.push(`${k}: +${v}`)
  }
  return out
}
</script>

<template>
  <div
    v-if="item"
    ref="rootRef"
    class="tip-wrap"
    :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
    role="tooltip"
  >
  <div class="tip">
    <!-- 星力條 -->
    <div v-if="item.maxStars > 0" class="tip__stars">
      <StarBar :stars="stars" :max="item.maxStars" size="large" />
    </div>

    <!-- 名稱 + 副標 -->
    <div class="tip__header">
      <div class="tip__name">{{ item.name }}</div>
      <div v-if="item.nameEn && item.nameEn !== item.name" class="tip__name-en">{{ item.nameEn }}</div>
    </div>

    <!-- REQ 區塊 -->
    <div class="tip__req-block">
      <div class="tip__img">
        <img v-if="imgUrl" :src="imgUrl" :alt="item.name" />
        <span v-else class="tip__img-ph" aria-hidden="true">IMG</span>
      </div>
      <div class="tip__req">
        <div class="tip__req-lev">
          <span class="tip__req-label">REQ LEV</span>
          <span class="tip__req-lev-val">: {{ item.level }}</span>
        </div>
        <div class="tip__req-grid">
          <div><span class="tip__req-label">REQ STR</span> <span>{{ item.req?.str || 0 }}</span></div>
          <div><span class="tip__req-label">REQ LUK</span> <span>{{ item.req?.luk || 0 }}</span></div>
          <div><span class="tip__req-label">REQ DEX</span> <span>{{ item.req?.dex || 0 }}</span></div>
          <div><span class="tip__req-label">REQ INT</span> <span>{{ item.req?.int || 0 }}</span></div>
        </div>
      </div>
    </div>

    <!-- 職業列 (僅武器/副手) -->
    <nav v-if="showClassBar" class="tip__classes">
      <span
        v-for="c in JOB_CLASSES"
        :key="c"
        class="tip__class"
        :class="{ 'tip__class--active': matchedClasses.includes(c) }"
      >{{ t(`character.branches.${c}`) }}</span>
    </nav>

    <!-- 主屬性列表 -->
    <ul class="tip__stats">
      <li v-if="item.subType" class="tip__row tip__row--plain">
        <span class="k">{{ t('equipment.tip.weaponType') }}</span>
        <span class="sep">:</span>
        <span class="v">{{ item.subType }}</span>
      </li>
      <li
        v-for="row in statRows"
        :key="row.key"
        class="tip__row"
        :class="{ 'tip__row--enhanced': !!row.breakdown }"
      >
        <span class="k">{{ row.label }}</span>
        <span class="sep">:</span>
        <span class="v">+{{ row.total }}{{ row.percent ? '%' : '' }}</span>
        <span v-if="row.breakdown" class="v-break">
          <span class="v-break-paren">(</span>
          <template v-for="(p, i) in row.breakdown" :key="i">
            <span v-if="i > 0" class="v-break-plus"> + </span>
            <span :class="`v-break-part v-break-part--${p.kind}`">
              {{ p.value }}{{ row.percent ? '%' : '' }}
            </span>
          </template>
          <span class="v-break-paren">)</span>
        </span>
      </li>
      <li v-if="item.attackSpeed" class="tip__row tip__row--plain">
        <span class="k">{{ t('equipment.stats.attackSpeed') }}</span>
        <span class="sep">:</span>
        <span class="v">{{ item.attackSpeed }} {{ t('equipment.tip.speedUnit') }}</span>
      </li>
      <li v-if="!statRows.length && !item.subType" class="tip__row tip__row--empty">—</li>
    </ul>

    <!-- 潛能 -->
    <section v-if="potentialLines.length" class="tip__section">
      <header class="tip__section-head">
        <span class="tag-l" :class="`tag-l--${potential.tier}`">L</span>
        <span class="tip__section-title">{{ t('equipment.tip.potential') }}</span>
      </header>
      <ul class="tip__section-list">
        <li v-for="(line, i) in potentialLines" :key="i">{{ line }}</li>
      </ul>
    </section>

    <!-- 附加潛能 -->
    <section v-if="bonusPotentialLines.length" class="tip__section">
      <header class="tip__section-head">
        <span class="tag-l" :class="`tag-l--${bonusPotential.tier}`">L</span>
        <span class="tip__section-title">{{ t('equipment.tip.bonusPotential') }}</span>
      </header>
      <ul class="tip__section-list">
        <li v-for="(line, i) in bonusPotentialLines" :key="i">{{ line }}</li>
      </ul>
    </section>

    <p v-if="item.description" class="tip__desc">{{ item.description }}</p>
  </div>

  <!-- 套裝面板 (右側,多個套裝各一欄)
       已穿上 = 白字亮、未穿 = 灰字;觸發的階層屬性也用白色亮起,未觸發為灰字 -->
  <aside
    v-for="set in itemSets"
    :key="set.id"
    class="tip-set"
  >
    <header class="tip-set__head">{{ t(set.nameKey) }}</header>
    <ul class="tip-set__members">
      <li
        v-for="id in set.itemIds.filter((i) => ITEMS_BY_ID[i])"
        :key="id"
        class="tip-set__member"
        :class="{ 'tip-set__member--active': equippedIds.has(id) }"
      >
        <span class="tip-set__name">{{ ITEMS_BY_ID[id].name }}</span>
        <span class="tip-set__slot">({{ t(`equipment.types.${ITEMS_BY_ID[id].type}`) }})</span>
      </li>
    </ul>
    <div class="tip-set__tiers">
      <div
        v-for="tier in set.tiers"
        :key="tier.count"
        class="tip-set__tier"
        :class="{ 'tip-set__tier--active': activeSetCount(set) >= tier.count }"
      >
        <div class="tip-set__tier-head">{{ tier.count }} Set Items Equipped</div>
        <ul class="tip-set__tier-list">
          <li v-for="(line, i) in formatTierStats(tier.stats)" :key="i">{{ line }}</li>
        </ul>
      </div>
    </div>
  </aside>
  </div>
</template>

<style scoped>
.tip-wrap {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  gap: 8px;
}
.tip {
  width: 280px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(20, 26, 46, 0.98) 0%, rgba(10, 14, 28, 0.98) 100%);
  border: 1px solid #3a4270;
  border-radius: 10px;
  padding: 0.65rem 0.75rem 0.75rem;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  color: #e9edf5;
  font-size: 0.8rem;
  line-height: 1.35;
}

/* 套裝面板 */
.tip-set {
  width: 280px;
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(20, 26, 46, 0.98) 0%, rgba(10, 14, 28, 0.98) 100%);
  border: 1px solid #3a4270;
  border-radius: 10px;
  padding: 0.55rem 0.75rem 0.65rem;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.65);
  color: #e9edf5;
  font-size: 0.8rem;
  line-height: 1.35;
}
.tip-set__head {
  text-align: center;
  color: #8fe09d;
  font-weight: 800;
  letter-spacing: 0.04em;
  font-size: 0.9rem;
  padding-bottom: 0.4rem;
  margin-bottom: 0.4rem;
  border-bottom: 1px solid #1f2540;
}
.tip-set__members {
  list-style: none;
  margin: 0 0 0.5rem;
  padding: 0;
}
.tip-set__member {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 2px 0;
  color: #5a6280; /* 未穿:灰字 */
  font-size: 0.76rem;
}
.tip-set__member--active {
  color: #e9edf5; /* 穿上:白字亮起 */
  font-weight: 600;
}
.tip-set__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tip-set__slot {
  color: #5a6280;
  font-size: 0.72rem;
  flex-shrink: 0;
}

.tip-set__tiers {
  border-top: 1px solid #1f2540;
  padding-top: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.tip-set__tier { opacity: 0.45; }
.tip-set__tier--active { opacity: 1; }
.tip-set__tier-head {
  color: #ffcc33;
  font-weight: 700;
  font-size: 0.78rem;
  margin-bottom: 2px;
}
.tip-set__tier:not(.tip-set__tier--active) .tip-set__tier-head {
  color: #6f6a47; /* 未觸發:暗黃 */
}
.tip-set__tier-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.76rem;
  color: #5a6280; /* 未觸發:灰字 */
}
.tip-set__tier--active .tip-set__tier-list {
  color: #e9edf5; /* 觸發:白字 */
}
.tip-set__tier-list li { padding: 1px 0; }

/* 星力 */
.tip__stars {
  margin-bottom: 0.45rem;
  padding: 0.15rem 0.2rem 0.35rem;
  border-bottom: 1px solid #1f2540;
}

/* 名稱 */
.tip__header {
  text-align: center;
  padding: 0.2rem 0 0.45rem;
}
.tip__name {
  font-weight: 800;
  font-size: 1rem;
  color: #ff3d78;
  letter-spacing: 0.02em;
  text-shadow: 0 0 6px rgba(255, 61, 120, 0.35);
}
.tip__name-en {
  margin-top: 2px;
  color: #8089a3;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
}

/* REQ */
.tip__req-block {
  display: grid;
  grid-template-columns: 52px 1fr;
  gap: 0.55rem;
  align-items: center;
  padding: 0.45rem 0;
  border-top: 1px solid #1f2540;
  border-bottom: 1px solid #1f2540;
}
.tip__img {
  width: 52px;
  height: 52px;
  border: 1px solid #2a3152;
  border-radius: 6px;
  background:
    linear-gradient(135deg, rgba(126, 232, 250, 0.06), transparent 60%),
    #0a0e1c;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.tip__img img { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
.tip__img-ph {
  color: #4a5170;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
}

.tip__req { display: flex; flex-direction: column; gap: 3px; }
.tip__req-lev { font-size: 0.82rem; font-weight: 700; }
.tip__req-lev-val { color: #ffb347; margin-left: 2px; }
.tip__req-label { color: #8089a3; font-size: 0.72rem; }
.tip__req-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2px 0.5rem;
  font-size: 0.75rem;
}
.tip__req-grid > div { display: flex; justify-content: space-between; }
.tip__req-grid > div > span:last-child { font-weight: 600; color: #c9cfe3; }

/* 職業列 */
.tip__classes {
  display: flex;
  justify-content: space-between;
  gap: 4px;
  background: #0a0e1c;
  border: 1px solid #1f2540;
  border-radius: 6px;
  padding: 5px 8px;
  margin: 0.45rem 0;
  font-size: 0.72rem;
}
.tip__class {
  color: #4a5170;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.tip__class--active {
  color: #e9edf5;
  font-weight: 700;
  text-shadow: 0 0 4px rgba(255, 255, 255, 0.3);
}

/* 屬性列表 */
.tip__stats {
  list-style: none;
  margin: 0.2rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 0.78rem;
}
.tip__row { display: flex; gap: 4px; align-items: baseline; flex-wrap: wrap; }
.tip__row .k { color: #e9edf5; font-weight: 500; }
.tip__row .sep { color: #e9edf5; }
.tip__row .v { color: #e9edf5; font-weight: 500; }
.tip__row .v-break { font-size: 0.72rem; }
/* 有強化 (星力 / Bonus Stats) 時整行轉青色 */
.tip__row--enhanced .k,
.tip__row--enhanced .sep,
.tip__row--enhanced .v { color: #5cd1ea; font-weight: 600; }
.tip__row--enhanced .v-break-paren,
.tip__row--enhanced .v-break-plus { color: #5cd1ea; opacity: 0.8; }
/* breakdown 分段顏色:base → 白,star → 青,bonus → 綠 */
.v-break-part--base  { color: #e9edf5; font-weight: 500; }
.v-break-part--star  { color: #5cd1ea; font-weight: 600; }
.v-break-part--bonus { color: #22c55e; font-weight: 700; }
.tip__row--plain .k,
.tip__row--plain .v { color: #e9edf5; font-weight: 400; }
.tip__row--plain .sep { color: #8089a3; }
.tip__row--empty { color: #4a5170; justify-content: center; }

/* 分區 (潛能 / 附加潛能) */
.tip__section {
  margin-top: 0.6rem;
  padding-top: 0.45rem;
  border-top: 1px dashed #2a3152;
}
.tip__section-head {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 4px;
}
.tag-l {
  background: #a3e635;
  color: #1b2133;
  font-weight: 800;
  padding: 0 5px;
  border-radius: 3px;
  font-size: 0.72rem;
  line-height: 1.1;
}
.tag-l--rare      { background: #4a90e2; color: #fff; }
.tag-l--epic      { background: #a855f7; color: #fff; }
.tag-l--unique    { background: #f0b429; color: #1b2133; }
.tag-l--legendary { background: #22c55e; color: #1b2133; }
.tip__section-title { color: #e9edf5; font-weight: 700; font-size: 0.82rem; }
.tip__section-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: #c9cfe3;
  font-size: 0.76rem;
}

/* 敘述 */
.tip__desc {
  margin: 0.6rem 0 0;
  padding-top: 0.4rem;
  border-top: 1px dashed #2a3152;
  color: #8089a3;
  font-size: 0.72rem;
  line-height: 1.4;
  text-align: center;
}
</style>
