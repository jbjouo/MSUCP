<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useActiveCharacter, readForCharacter } from '../composables/useActiveCharacter.js'

const { t, te } = useI18n()
const { roster } = useActiveCharacter()

function jobLabel(jobKey) {
  if (!jobKey) return '—'
  const key = `character.jobs.${jobKey}`
  return te(key) ? t(key) : jobKey
}

function fmtNum(n) {
  if (n == null) return '—'
  return new Intl.NumberFormat('en-US').format(Math.round(n))
}

const rows = computed(() =>
  roster.list.map((c) => {
    const char = readForCharacter(c.id, 'character.v1') || {}
    const snaps = readForCharacter(c.id, 'cpCompare.v1')
    const latest = Array.isArray(snaps) && snaps.length ? snaps[0] : null
    return {
      id: c.id,
      name: c.name,
      isActive: c.id === roster.activeId,
      job: char.job || '',
      level: char.level || 1,
      cp: latest?.cp ?? null,
      bossMax: latest?.bossMax ?? null,
      bossAvg: latest?.bossAvg ?? null,
      bossMin: latest?.bossMin ?? null,
      timestamp: latest?.timestamp || null,
      hasSnap: !!latest,
    }
  }),
)

// 找出每個欄位的最大值,標 leader
const leaders = computed(() => {
  function maxOf(key) {
    let best = null
    for (const r of rows.value) {
      const v = r[key]
      if (typeof v !== 'number') continue
      if (best == null || v > best) best = v
    }
    return best
  }
  return {
    cp: maxOf('cp'),
    bossMax: maxOf('bossMax'),
    bossAvg: maxOf('bossAvg'),
    bossMin: maxOf('bossMin'),
  }
})

const activeRow = computed(() => rows.value.find((r) => r.isActive) || null)

function pctDiff(val, key) {
  const base = activeRow.value?.[key]
  if (base == null || val == null || base === 0) return null
  return ((val - base) / base) * 100
}

function fmtPct(val, key) {
  const p = pctDiff(val, key)
  if (p == null || p === 0) return ''
  const sign = p > 0 ? '+' : ''
  return `${sign}${p.toFixed(1)}%`
}

function pctClass(val, key) {
  const p = pctDiff(val, key)
  if (p == null || p === 0) return ''
  return p > 0 ? 'compare__pct--up' : 'compare__pct--down'
}

function fmtTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<template>
  <section class="compare">
    <header class="compare__head">
      <h2>{{ t('charCompare.title') }}</h2>
      <p class="compare__hint">{{ t('charCompare.hint') }}</p>
    </header>

    <div v-if="!rows.length" class="compare__empty">
      {{ t('charCompare.noChars') }}
    </div>
    <div v-else class="compare__table-wrap">
      <table class="compare__table">
        <thead>
          <tr>
            <th>{{ t('charCompare.col.name') }}</th>
            <th>{{ t('charCompare.col.job') }}</th>
            <th>{{ t('charCompare.col.level') }}</th>
            <th class="compare__th--num">{{ t('cp.attStats.cp') }}</th>
            <th class="compare__th--num">{{ t('cp.attStats.bossMax') }}</th>
            <th class="compare__th--num">{{ t('cp.attStats.bossAvg') }}</th>
            <th class="compare__th--num">{{ t('cp.attStats.bossMin') }}</th>
            <th>{{ t('charCompare.col.snapAt') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.id" :class="{ 'compare__row--active': r.isActive }">
            <td>
              <span class="compare__name">{{ r.name }}</span>
              <span v-if="r.isActive" class="compare__badge">{{ t('charManager.active') }}</span>
            </td>
            <td>{{ jobLabel(r.job) }}</td>
            <td>Lv {{ r.level }}</td>
            <td class="compare__num" :class="{ 'compare__num--leader': r.cp != null && r.cp === leaders.cp }">
              {{ fmtNum(r.cp) }}
              <span v-if="!r.isActive && fmtPct(r.cp, 'cp')" class="compare__pct" :class="pctClass(r.cp, 'cp')">{{ fmtPct(r.cp, 'cp') }}</span>
            </td>
            <td class="compare__num" :class="{ 'compare__num--leader': r.bossMax != null && r.bossMax === leaders.bossMax }">
              {{ fmtNum(r.bossMax) }}
              <span v-if="!r.isActive && fmtPct(r.bossMax, 'bossMax')" class="compare__pct" :class="pctClass(r.bossMax, 'bossMax')">{{ fmtPct(r.bossMax, 'bossMax') }}</span>
            </td>
            <td class="compare__num" :class="{ 'compare__num--leader': r.bossAvg != null && r.bossAvg === leaders.bossAvg }">
              {{ fmtNum(r.bossAvg) }}
              <span v-if="!r.isActive && fmtPct(r.bossAvg, 'bossAvg')" class="compare__pct" :class="pctClass(r.bossAvg, 'bossAvg')">{{ fmtPct(r.bossAvg, 'bossAvg') }}</span>
            </td>
            <td class="compare__num" :class="{ 'compare__num--leader': r.bossMin != null && r.bossMin === leaders.bossMin }">
              {{ fmtNum(r.bossMin) }}
              <span v-if="!r.isActive && fmtPct(r.bossMin, 'bossMin')" class="compare__pct" :class="pctClass(r.bossMin, 'bossMin')">{{ fmtPct(r.bossMin, 'bossMin') }}</span>
            </td>
            <td class="compare__time">
              <template v-if="r.hasSnap">{{ fmtTime(r.timestamp) }}</template>
              <span v-else class="compare__nosnap">{{ t('charCompare.noSnapshot') }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.compare {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.compare__head h2 {
  margin: 0 0 0.3rem;
  color: var(--ms-accent);
  font-size: 1.4rem;
  letter-spacing: 0.04em;
}
.compare__hint {
  margin: 0;
  color: var(--ms-text-dim);
  font-size: 0.85rem;
}
.compare__empty {
  padding: 2rem;
  text-align: center;
  color: var(--ms-text-weak);
}
.compare__table-wrap {
  overflow-x: auto;
  background: var(--ms-panel-bg);
  border: 1px solid var(--ms-panel-border);
  border-radius: var(--ms-panel-radius);
  box-shadow: var(--ms-panel-shadow);
}
.compare__table {
  width: 100%;
  border-collapse: collapse;
  color: var(--ms-text);
  font-size: 0.88rem;
}
.compare__table thead th {
  background: var(--ms-head-bg);
  border-bottom: 1px solid var(--ms-head-border);
  text-align: left;
  padding: 0.55rem 0.7rem;
  color: var(--ms-text);
  letter-spacing: 0.04em;
  font-weight: 700;
}
.compare__table tbody td {
  padding: 0.55rem 0.7rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.25);
}
.compare__table tbody tr:last-child td {
  border-bottom: none;
}
.compare__row--active td {
  background: rgba(255, 200, 87, 0.08);
}
.compare__name {
  font-weight: 700;
  margin-right: 0.4rem;
}
.compare__badge {
  font-size: 0.65rem;
  color: var(--ms-accent);
  border: 1px solid var(--ms-accent);
  border-radius: 4px;
  padding: 1px 5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.compare__th--num,
.compare__num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}
.compare__num--leader {
  color: var(--ms-accent);
  font-weight: 700;
}
.compare__time {
  font-size: 0.78rem;
  color: var(--ms-text-dim);
}
.compare__nosnap {
  color: var(--ms-text-weak);
  font-style: italic;
}
.compare__pct {
  display: block;
  font-size: 0.72rem;
  margin-top: 1px;
}
.compare__pct--up {
  color: #5cdb5c;
}
.compare__pct--down {
  color: #f06060;
}
</style>
