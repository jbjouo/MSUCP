<script setup>
// Link Skill 面板 — 佈局階段 (資料為 placeholder,等使用者指定實際技能再接)
//
// 結構參考遊戲內 Link Skill UI:
//   ┌───────────────────────────────────────────────────────────┐
//   │ [套用中] [P1] [P2] [P3]                [SAVE]             │  ← tab 列
//   ├─────────────┬─────────────────────┬───────────────────────┤
//   │ 我的連結技能 │ 其他角色的連結技能      │  持有的連結技能 (捲動) │
//   │  + skill    │ (grid 2 col, UNLINK)│ (grid 2 col, LINK)    │
//   │  + 傳授對象  │                     │                       │
//   │ 套用的能力值 │                     │                       │
//   └─────────────┴─────────────────────┴───────────────────────┘

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCharacter } from '../composables/useCharacter.js'
import { findBranchByJob } from '../constants/jobs.js'
import {
  LINK_SKILLS,
  LINK_SKILL_SLOT_CAP,
  getLinkSkill,
  getLinkSkillByJob,
  getLinkSkillLevelData,
  bestLinkSkillLevelDataFor,
} from '../data/linkSkills.js'
import {
  appliedSkills,
  persistApplied,
} from '../composables/useLinkSkills.js'

const { t } = useI18n()
const { currentJob } = useCharacter()

// 當前角色所屬職業群 (branch key)
const myBranch = computed(() => findBranchByJob(currentJob.value?.key) || null)

// appliedSkills / persistApplied 已從 composable 匯入 (共享給計算機使用)

// 判斷 skill 是否「同群 → 可以累加自己等級」
// 規則:只有當我的職業本身就在 skill.owners 內,連結其他 owner 才是同群加成。
// 單一 owner 的 skill (例:Heroes 各自獨立 link skill) 對非原生職業就是一般連結,佔 slot。
function isSameClassGroupSkill(skill) {
  if (!skill) return false
  const myJobKey = currentJob.value?.key
  return !!myJobKey && skill.owners.includes(myJobKey)
}

// 核心:某技能在當前設定下的有效等級
//   - 若自己擁有 → 起始 ownMaxLevel
//   - 每筆 applied 貢獻該 skill 的 ownMaxLevel
//   - 上限 maxTotalLevel
function combinedLevelFor(skillId) {
  const skill = getLinkSkill(skillId)
  if (!skill) return 0
  const myJobKey = currentJob.value?.key
  let total = skill.owners.includes(myJobKey) ? skill.ownMaxLevel : 0
  for (const a of appliedSkills.value) {
    if (a.skillId === skillId) total += skill.ownMaxLevel
  }
  return Math.min(total, skill.maxTotalLevel)
}

// ── 當前角色的 link skill (左上) ─────────────
const mySkill = computed(() => {
  const job = currentJob.value
  if (!job?.linkSkill) return null
  const skill = getLinkSkillByJob(job.key)
  if (!skill) return null
  const level = combinedLevelFor(skill.id) || skill.ownMaxLevel
  const levelData = bestLinkSkillLevelDataFor(skill, level)
  return { skill, level, levelData, ownerJob: job.key }
})

// ── 右欄:所有可選的連結技能 (以 owner 職業分開展示,每筆獨立連結) ─────
const availableSkills = computed(() => {
  const myJobKey = currentJob.value?.key
  const out = []
  for (const skill of Object.values(LINK_SKILLS)) {
    for (const ownerJob of skill.owners) {
      if (ownerJob === myJobKey) continue
      out.push({
        skill,
        ownerJob,
        level: skill.ownMaxLevel,
        levelData: bestLinkSkillLevelDataFor(skill, skill.ownMaxLevel),
      })
    }
  }
  return out
})

// ── 中欄:已套用的連結技能 — 以 skill 合併顯示 ───
// 同一支 skill 由多個 owner 連過 → 合成一張卡,等級累加,count 標示連結筆數
const othersApplied = computed(() => {
  const bySkill = new Map()
  for (const a of appliedSkills.value) {
    const skill = getLinkSkill(a.skillId)
    if (!skill) continue
    if (isSameClassGroupSkill(skill)) continue
    if (!bySkill.has(a.skillId)) {
      bySkill.set(a.skillId, { skill, owners: [] })
    }
    bySkill.get(a.skillId).owners.push(a.ownerJob)
  }
  const out = []
  for (const { skill, owners } of bySkill.values()) {
    const level = Math.min(skill.ownMaxLevel * owners.length, skill.maxTotalLevel)
    out.push({
      skillId: skill.id,
      skill,
      owners,
      count: owners.length,
      level,
      levelData: bestLinkSkillLevelDataFor(skill, level),
    })
  }
  return out
})

// 每支技能 (合併後) 佔 1 slot;同群技能不佔
const usedSlots = computed(() => othersApplied.value.length)

// 檢查右欄 entry 是否已連結 (以 skillId + ownerJob 為 key)
function isApplied(entry) {
  return appliedSkills.value.some(
    (a) => a.skillId === entry.skill.id && a.ownerJob === entry.ownerJob,
  )
}
function toggleLink(entry) {
  if (isApplied(entry)) {
    unlinkApplied({ skillId: entry.skill.id, ownerJob: entry.ownerJob })
  } else {
    linkFrom(entry)
  }
}

// ── 行動:Link / Unlink ───────────────────────
function canLink(entry) {
  if (isApplied(entry)) return false
  const sameGroup = isSameClassGroupSkill(entry.skill)
  if (sameGroup) {
    // 同群:檢查合計等級不超過 maxTotalLevel
    const currentTotal = combinedLevelFor(entry.skill.id)
    if (currentTotal + entry.level > entry.skill.maxTotalLevel) return false
  } else {
    // 非同群:若這支技能 (skillId) 已佔一格 → 再連另一位 owner 不會再消耗 slot;
    //        只有全新的 skill 要佔位才需要檢查 slot 剩餘
    const alreadyTakesSlot = appliedSkills.value.some((a) => a.skillId === entry.skill.id)
    if (!alreadyTakesSlot && usedSlots.value >= LINK_SKILL_SLOT_CAP) return false
  }
  return true
}
function linkFrom(entry) {
  if (!canLink(entry)) return
  appliedSkills.value.push({
    skillId: entry.skill.id,
    ownerJob: entry.ownerJob,
  })
  persistApplied()
}
function unlinkApplied(entry) {
  const idx = appliedSkills.value.findIndex(
    (a) => a.skillId === entry.skillId && a.ownerJob === entry.ownerJob,
  )
  if (idx !== -1) {
    appliedSkills.value.splice(idx, 1)
    persistApplied()
  }
}
// 一次解除某支 skill 下所有 owner 的連結 (用於中欄合併卡)
function unlinkAllOfSkill(skillId) {
  appliedSkills.value = appliedSkills.value.filter((a) => a.skillId !== skillId)
  persistApplied()
}

// ── 套用的能力值 — 統計 ────────────────────
// 關鍵原則:同一 skill 的合計等級 → 對應 levelData → flatten stats → 累加
//
// flatten 規則:
//   - 略過 procRate / duration / maxStacks
//   - *_PerStack × maxStacks → 去掉 PerStack 後的 key
//   - 其餘 key 直接沿用

const EXCLUDED_STAT_KEYS = new Set(['procRate', 'duration', 'maxStacks'])

function flattenStats(stats) {
  if (!stats) return {}
  const out = {}
  const maxStacks = stats.maxStacks || 1
  for (const [k, v] of Object.entries(stats)) {
    if (EXCLUDED_STAT_KEYS.has(k)) continue
    if (k.endsWith('PerStack')) {
      const base = k.replace(/PerStack$/, '')
      out[base] = (out[base] || 0) + v * maxStacks
    } else {
      out[k] = (out[k] || 0) + v
    }
  }
  return out
}

function bestLevelDataFor(skill, level) {
  if (!skill) return null
  let best = null
  for (const lv of skill.levels) {
    if (lv.level <= level && (!best || lv.level > best.level)) best = lv
  }
  return best || skill.levels[0] || null
}

const aggregateStats = computed(() => {
  const agg = {}
  const seen = new Set()
  const contribute = (skillId) => {
    if (seen.has(skillId)) return
    seen.add(skillId)
    const skill = getLinkSkill(skillId)
    if (!skill) return
    if (skill.specialEffect) return // 特殊效果類型不進統計
    const level = combinedLevelFor(skillId)
    if (!level) return
    const lvData = bestLevelDataFor(skill, level)
    if (!lvData?.stats) return
    const flat = flattenStats(lvData.stats)
    for (const [k, v] of Object.entries(flat)) {
      agg[k] = (agg[k] || 0) + v
    }
  }
  if (mySkill.value) contribute(mySkill.value.skill.id)
  for (const a of appliedSkills.value) contribute(a.skillId)
  return agg
})

// 要在統計區顯示的順序
const STAT_DISPLAY_ORDER = [
  'damage', 'ignoreDef', 'bossDmg', 'allStatPct', 'critRate',
  'damageTaken',
  'atk', 'matk',
  'str', 'dex', 'int', 'luk',
  'hp', 'mp',
]
const PCT_STATS = new Set([
  'damage', 'ignoreDef', 'bossDmg', 'allStatPct', 'critRate', 'damageTaken',
])

const aggregateList = computed(() =>
  STAT_DISPLAY_ORDER
    .filter((k) => (aggregateStats.value[k] || 0) !== 0)
    .map((k) => ({
      key: k,
      label: t(`linkSkill.stats.${k}`),
      value: aggregateStats.value[k],
      isPct: PCT_STATS.has(k),
    })),
)

// ── Helpers ─────────────────────────────────
function resolveSkillName(skill) {
  return skill?.nameKey ? t(skill.nameKey) : (skill?.id || '—')
}
function resolveSkillDesc(entry) {
  if (!entry?.skill || !entry.levelData) return ''
  // 若此技能是當前角色原生擁有 → 優先使用 selfDescKey (如 Mihile 騎士守護)
  const myJobKey = currentJob.value?.key
  const isOwn = !!myJobKey && entry.skill.owners.includes(myJobKey)
  if (isOwn && entry.skill.selfDescKey) return t(entry.skill.selfDescKey)
  if (entry.levelData.descKey) return t(entry.levelData.descKey)
  return ''
}
function resolveJobName(jobKey) {
  if (!jobKey) return '—'
  return t(`character.jobs.${jobKey}`)
}
function fmtStatValue(v, isPct) {
  const sign = v > 0 ? '+' : ''
  return isPct ? `${sign}${v.toFixed(2)}%` : `${sign}${v}`
}

// Applied Effect 區塊 — 合併相同技能,僅顯示各技能的當前等級效果
const appliedEffects = computed(() => {
  const out = []
  const seen = new Set()
  const pushSkill = (skillId) => {
    if (seen.has(skillId)) return
    seen.add(skillId)
    const skill = getLinkSkill(skillId)
    if (!skill) return
    const level = combinedLevelFor(skillId)
    if (!level) return
    out.push({
      skill,
      level,
      levelData: bestLinkSkillLevelDataFor(skill, level),
    })
  }
  if (mySkill.value) pushSkill(mySkill.value.skill.id)
  for (const a of appliedSkills.value) pushSkill(a.skillId)
  return out
})

// 取得某 skill 的連結來源職業 (不含自己)
function contributorsFor(skillId) {
  return appliedSkills.value.filter((a) => a.skillId === skillId).map((a) => a.ownerJob)
}

// ── Tooltip 狀態 ───────────────────────────
const tooltipEntry = ref(null) // { skill, level }
const tipX = ref(0)
const tipY = ref(0)

function showTip(entry, e) {
  tooltipEntry.value = entry
  tipX.value = e.clientX
  tipY.value = e.clientY
}
function moveTip(e) {
  if (!tooltipEntry.value) return
  tipX.value = e.clientX
  tipY.value = e.clientY
}
function hideTip() {
  tooltipEntry.value = null
}

const tipContext = computed(() => {
  const entry = tooltipEntry.value
  if (!entry) return null
  const skill = entry.skill
  const contributors = contributorsFor(skill.id)
  const level = entry.level || combinedLevelFor(skill.id) || skill.ownMaxLevel
  const levelData = bestLinkSkillLevelDataFor(skill, level)
  const isOwnSkill = skill.owners.includes(currentJob.value?.key)
  return { skill, level, levelData, contributors, isOwnSkill }
})

// 空槽數量 — 中欄永遠補到 12 格 (以合併卡片數 + 佔位空槽)
const placeholderSlots = computed(() =>
  Math.max(0, LINK_SKILL_SLOT_CAP - othersApplied.value.length),
)
// 補充:中欄顯示的卡片數 = 合併數,佔位補滿 12 格視覺

</script>

<template>
  <section class="link-panel">
    <!-- 標題列 -->
    <header class="link-panel__head">
      <span>{{ t('linkSkill.title') }}</span>
    </header>

    <!-- 三欄身體 -->
    <div class="link-panel__body">
      <!-- 左欄:我的連結技能 + 套用的能力值 -->
      <div class="link-col">
        <div class="link-section link-section--mine">
          <div class="link-section__head link-section__head--green">
            {{ t('linkSkill.sections.mine') }}
          </div>
          <div class="link-section__body">
            <div
              v-if="mySkill"
              class="link-skill-card"
              @mouseenter="showTip(mySkill, $event)"
              @mousemove="moveTip"
              @mouseleave="hideTip"
            >
              <img
                v-if="mySkill.skill.icon"
                class="link-skill-card__icon"
                :src="mySkill.skill.icon"
                :alt="resolveSkillName(mySkill.skill)"
              />
              <div v-else class="link-skill-card__icon link-skill-card__icon--empty" />
              <div class="link-skill-card__info">
                <div class="link-skill-card__name">{{ resolveSkillName(mySkill.skill) }}</div>
                <div class="link-skill-card__lv">
                  {{ t('linkSkill.levelLabel', { lv: mySkill.level }) }}
                  <span class="link-skill-card__sub">/ {{ mySkill.skill.maxTotalLevel }}</span>
                </div>
              </div>
            </div>
            <div v-else class="link-skill-card link-skill-card--empty">
              <div class="link-skill-card__icon link-skill-card__icon--empty" />
              <div class="link-skill-card__info">
                <div class="link-skill-card__name">—</div>
                <div class="link-skill-card__lv">{{ t('linkSkill.noLinkForJob') }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="link-section link-section--applied link-section--fill">
          <div class="link-section__head link-section__head--green">
            {{ t('linkSkill.sections.applied') }}
          </div>
          <div class="link-section__body link-section__body--desc">
            <template v-if="appliedEffects.length">
              <div
                v-for="effect in appliedEffects"
                :key="effect.skill.id"
                class="link-applied"
              >
                <div class="link-applied__title">
                  {{ resolveSkillName(effect.skill) }}
                  <span class="link-applied__lv">
                    {{ t('linkSkill.levelLabel', { lv: effect.level }) }}
                  </span>
                </div>
                <div class="link-applied__desc">{{ resolveSkillDesc(effect) }}</div>
              </div>
            </template>
            <span v-else class="link-empty-text">{{ t('linkSkill.empty') }}</span>
          </div>
        </div>
      </div>

      <!-- 中欄:其他角色的連結技能 (已套用) -->
      <div class="link-col link-col--grow">
        <div class="link-section link-section--fill">
          <div class="link-section__head link-section__head--teal">
            <span>{{ t('linkSkill.sections.others') }}</span>
            <span class="link-section__counter">
              {{ t('linkSkill.slotCounter', { used: usedSlots, cap: LINK_SKILL_SLOT_CAP }) }}
            </span>
          </div>
          <div class="link-section__body">
            <div class="link-grid">
              <button
                v-for="entry in othersApplied"
                :key="entry.skillId"
                type="button"
                class="link-card"
                @click="unlinkAllOfSkill(entry.skillId)"
                @mouseenter="showTip(entry, $event)"
                @mousemove="moveTip"
                @mouseleave="hideTip"
              >
                <img
                  v-if="entry.skill.icon"
                  class="link-card__icon"
                  :src="entry.skill.icon"
                  :alt="resolveSkillName(entry.skill)"
                />
                <span v-else class="link-card__icon link-card__icon--dashed" />
                <span class="link-card__info">
                  <span class="link-card__name">
                    {{ resolveSkillName(entry.skill) }}
                    <span v-if="entry.count > 1" class="link-card__count">×{{ entry.count }}</span>
                  </span>
                  <span class="link-card__lv">
                    {{ t('linkSkill.levelLabel', { lv: entry.level }) }}
                  </span>
                </span>
                <span class="link-card__act link-card__act--unlink">
                  {{ t('linkSkill.actions.unlink') }}
                </span>
              </button>

              <div
                v-for="i in placeholderSlots"
                :key="'p' + i"
                class="link-card link-card--empty"
              >
                <span class="link-card__icon link-card__icon--dashed" />
                <span class="link-card__info">
                  <span class="link-card__name">—</span>
                  <span class="link-card__lv">—</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Link Skill Tooltip -->
      <Teleport to="body">
        <div
          v-if="tipContext"
          class="ls-tip"
          :style="{ left: (tipX + 16) + 'px', top: (tipY + 16) + 'px' }"
        >
          <div class="ls-tip__head">
            <div class="ls-tip__icon-wrap">
              <img
                v-if="tipContext.skill.icon"
                :src="tipContext.skill.icon"
                :alt="resolveSkillName(tipContext.skill)"
                class="ls-tip__icon"
              />
              <div v-else class="ls-tip__icon ls-tip__icon--empty" />
              <span class="ls-tip__lv-badge">
                {{ t('linkSkill.levelLabel', { lv: tipContext.level }) }}
              </span>
            </div>
            <div class="ls-tip__title-wrap">
              <div class="ls-tip__name">{{ resolveSkillName(tipContext.skill) }}</div>
              <div
                v-if="tipContext.contributors.length"
                class="ls-tip__gave"
              >{{ t('linkSkill.gaveThisSkill', { jobs: tipContext.contributors.map(resolveJobName).join('、') }) }}</div>
              <div class="ls-tip__max">
                {{ t('linkSkill.maxLevelLabel', { lv: tipContext.level }) }}
              </div>
            </div>
          </div>

          <div class="ls-tip__section">
            <div v-if="tipContext.skill.flavorKey" class="ls-tip__flavor">
              {{ t(tipContext.skill.flavorKey) }}
            </div>
            <div v-if="tipContext.skill.caveatKey" class="ls-tip__caveat">
              {{ t(tipContext.skill.caveatKey) }}
            </div>
            <div
              v-if="tipContext.skill.selfOnlyKey && tipContext.isOwnSkill"
              class="ls-tip__selfonly"
            >{{ t(tipContext.skill.selfOnlyKey) }}</div>
          </div>

          <div class="ls-tip__divider" />

          <div class="ls-tip__section">
            <div class="ls-tip__cur">
              {{ t('linkSkill.currentLevelLabel', { lv: tipContext.level }) }}
            </div>
            <div class="ls-tip__effect">
              {{ resolveSkillDesc(tipContext) }}
            </div>
          </div>
        </div>
      </Teleport>

      <!-- 右欄:可選的其他職業連結技能 -->
      <div class="link-col">
        <div class="link-section link-section--fill">
          <div class="link-section__head link-section__head--orange">
            {{ t('linkSkill.sections.owned') }}
          </div>
          <div class="link-section__body link-section__body--scroll">
            <div v-if="!availableSkills.length" class="link-empty-text">
              {{ t('linkSkill.noCandidates') }}
            </div>
            <div v-else class="link-grid link-grid--single">
              <button
                v-for="entry in availableSkills"
                :key="entry.skill.id + '@' + entry.ownerJob"
                type="button"
                class="link-card link-card--row"
                :class="{
                  'link-card--disabled': !isApplied(entry) && !canLink(entry),
                  'link-card--linked': isApplied(entry),
                }"
                :disabled="!isApplied(entry) && !canLink(entry)"
                @click="toggleLink(entry)"
                @mouseenter="showTip(entry, $event)"
                @mousemove="moveTip"
                @mouseleave="hideTip"
              >
                <img
                  v-if="entry.skill.icon"
                  class="link-card__icon"
                  :src="entry.skill.icon"
                  :alt="resolveSkillName(entry.skill)"
                />
                <span v-else class="link-card__icon link-card__icon--dashed" />
                <span class="link-card__info">
                  <span class="link-card__name">{{ resolveSkillName(entry.skill) }}</span>
                  <span class="link-card__lv">
                    {{ resolveJobName(entry.ownerJob) }}
                    · {{ t('linkSkill.levelLabel', { lv: entry.level }) }}
                  </span>
                </span>
                <span
                  class="link-card__act"
                  :class="isApplied(entry) ? 'link-card__act--unlink' : 'link-card__act--link'"
                >
                  {{ isApplied(entry) ? t('linkSkill.actions.unlink') : t('linkSkill.actions.link') }}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* ── 外框 (延用計算機面板風格) ─────────────────────────── */
.link-panel {
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
  gap: 10px;
}

/* ── 標題列 (同計算機 .panel__head) ─────────────── */
.link-panel__head {
  align-self: stretch;
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
  color: #f1f3f7;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}

/* ── Body 三欄 ─────────────────────────────────────── */
/* 高度以中欄 12 個 slot 的自然高度為主 (6 列 × 54px + gap + padding + header)
   = 約 405px,取 410px 留微量 breathing room。左右欄套用此高度,內容過長則內捲。 */
.link-panel__body {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr) 280px;
  gap: 10px;
  align-items: stretch;
  height: 410px;
}
.link-col {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.link-col--grow { min-width: 0; }

/* ── 區塊 (Section) ──────────────────────────────── */
.link-section {
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.link-section--fill { flex: 1; }
.link-section__head {
  height: 28px;
  display: flex;
  align-items: center;
  padding: 0 10px;
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 0.1em;
  color: #fff;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.link-section__head--green  { background: linear-gradient(180deg, #6bb35a 0%, #4e8d42 100%); border-bottom: 1px solid #355e2a; }
.link-section__head--teal   { background: linear-gradient(180deg, #4bb8d4 0%, #2e8fa8 100%); border-bottom: 1px solid #1a5a6a; justify-content: space-between; }
.link-section__head--orange { background: linear-gradient(180deg, #e0933b 0%, #b87023 100%); border-bottom: 1px solid #7e4c15; }
.link-section__counter {
  font-size: 0.72rem;
  letter-spacing: 0.05em;
  opacity: 0.95;
}
.link-section__body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 0;
}
.link-section__body--desc {
  font-size: 0.84rem;
  line-height: 1.5;
  color: #e8edf2;
  overflow-y: auto;
  min-height: 0;
}
.link-section__body--scroll {
  overflow-y: auto;
  min-height: 0;
}
.link-empty-text { color: #99a4b4; font-style: italic; }
.link-applied {
  padding: 6px 8px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #141a22;
  border-radius: 6px;
}
.link-applied + .link-applied { margin-top: 6px; }
.link-applied__title {
  font-weight: 700;
  color: #f1f3f7;
  margin-bottom: 4px;
}
.link-applied__lv {
  color: #ffc857;
  font-weight: 700;
  font-size: 0.82rem;
  margin-left: 6px;
}
.link-applied__desc {
  white-space: pre-line;
  color: #dbe3ec;
  font-size: 0.82rem;
  line-height: 1.55;
}

/* ── 統計區 ─────────────────────────────── */
.link-stats {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.link-stats__row {
  display: flex;
  justify-content: space-between;
  padding: 3px 0;
  border-bottom: 1px dashed rgba(255, 255, 255, 0.08);
}
.link-stats__row:last-child { border-bottom: none; }
.link-stats__label { color: #dbe3ec; font-weight: 600; }
.link-stats__val   { color: #ffc857; font-weight: 700; }

.link-card--disabled {
  cursor: not-allowed;
  opacity: 0.45;
  filter: grayscale(0.4);
}
.link-card--disabled:hover { filter: grayscale(0.4); border-color: #141a22; }

.link-card--group {
  border-color: #6bb35a;
  box-shadow: 0 0 0 1px rgba(107, 179, 90, 0.25) inset;
}
.link-card--linked {
  border-color: #ffc857;
  background: linear-gradient(180deg, #3a3524 0%, #2a2618 100%);
}
.link-card--linked:hover { filter: brightness(1.08); }
.link-card__badge {
  position: absolute;
  top: 4px;
  right: 6px;
  padding: 1px 6px;
  font-size: 0.6rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  border-radius: 3px;
  background: #4e8d42;
  color: #fff;
  border: 1px solid #355e2a;
}

.link-skill-card__sub {
  color: #8ea6b8;
  font-weight: 500;
}

/* ── My skill card ─────────────────────────────── */
.link-skill-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #141a22;
  border-radius: 6px;
}
.link-skill-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 4px;
  background: linear-gradient(135deg, #8ea6b8, #3a4350);
  border: 1px solid #141a22;
  flex-shrink: 0;
  object-fit: contain;
  image-rendering: pixelated;
}
.link-skill-card__icon--empty {
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%);
  background-size: 10px 10px;
}
.link-skill-card__info { display: flex; flex-direction: column; min-width: 0; }
.link-skill-card__name {
  font-weight: 700;
  color: #f1f3f7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.link-skill-card__lv { color: #c9d2dd; font-size: 0.8rem; }

/* ── 技能格 (grid) ──────────────────────────── */
.link-grid { display: grid; gap: 6px; }
/* 中欄:2 欄,列高平均分 (卡片拉伸填滿),填滿整個 body 不留空白 */
.link-grid:not(.link-grid--single) {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: 1fr;
  flex: 1;
  min-height: 0;
}
/* 右欄:單欄,列依內容自動,使用父層 body 的捲動 */
.link-grid--single {
  grid-template-columns: 1fr;
  align-content: start;
}
.link-card--row { min-height: 48px; }

.link-card {
  position: relative;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 8px;
  align-items: center;
  padding: 6px 8px;
  min-height: 54px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #141a22;
  border-radius: 6px;
  color: #e8edf2;
  cursor: pointer;
  text-align: left;
  transition: border-color 0.12s, filter 0.12s;
}
.link-card:hover:not(.link-card--empty) {
  filter: brightness(1.08);
  border-color: #ffc857;
}
.link-card__icon {
  width: 42px;
  height: 42px;
  border-radius: 4px;
  background: linear-gradient(135deg, #8ea6b8, #3a4350);
  border: 1px solid #141a22;
  object-fit: contain;
  image-rendering: pixelated;
}
.link-card__icon--dashed {
  background:
    linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%);
  background-size: 10px 10px;
}
.link-card__info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding-right: 50px; /* 給右下 action badge 留空間 */
}
.link-card__name {
  font-weight: 700;
  font-size: 0.82rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #dce2ea;
}
.link-card__lv { color: #99a4b4; font-size: 0.76rem; }
.link-card__count {
  margin-left: 4px;
  color: #ffc857;
  font-weight: 800;
  font-size: 0.72rem;
}

.link-card--empty {
  cursor: default;
  opacity: 0.55;
}

.link-card__act {
  position: absolute;
  right: 6px;
  bottom: 6px;
  padding: 1px 8px;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.4);
  color: #fff;
}
.link-card__act--unlink { background: #3a4250; }
.link-card__act--link { background: #58a0c0; }

/* 新增 slot */
.link-card--add {
  grid-template-columns: 42px 1fr;
  border-style: dashed;
  border-color: #4a5564;
  color: #99a4b4;
}
.link-card__chain {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.4rem;
  opacity: 0.6;
}
.link-card__add-label {
  font-weight: 800;
  letter-spacing: 0.15em;
  font-size: 0.78rem;
}

/* ── 窄螢幕:三欄堆疊 ───────────────── */
@media (max-width: 960px) {
  .link-panel__body { grid-template-columns: 1fr; }
  .link-panel__head { flex-wrap: wrap; }
  .link-panel__title { position: static; inset: auto; width: 100%; order: -1; padding: 4px 0; }
}
</style>

<style>
/* Link Skill hover tooltip — teleport 到 body,不能用 scoped */
.ls-tip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  width: 360px;
  max-width: 90vw;
  padding: 10px 12px;
  background: linear-gradient(180deg, #1b2028 0%, #111418 100%);
  border: 1px solid #000;
  border-radius: 8px;
  color: #f1f3f7;
  font-size: 0.8rem;
  line-height: 1.45;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.6);
}
.ls-tip__head {
  display: grid;
  grid-template-columns: 64px 1fr;
  gap: 10px;
  align-items: start;
  margin-bottom: 6px;
}
.ls-tip__icon-wrap {
  width: 64px;
  height: 64px;
  position: relative;
  border-radius: 6px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.ls-tip__icon {
  width: 56px;
  height: 56px;
  image-rendering: pixelated;
  object-fit: contain;
}
.ls-tip__icon--empty {
  background-image:
    linear-gradient(45deg, rgba(255,255,255,0.06) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(255,255,255,0.06) 25%, transparent 25%);
  background-size: 10px 10px;
}
.ls-tip__lv-badge {
  position: absolute;
  left: 2px;
  bottom: 2px;
  padding: 1px 4px;
  font-size: 0.68rem;
  font-weight: 800;
  color: #fff;
  background: rgba(0, 0, 0, 0.75);
  border-radius: 3px;
  letter-spacing: 0.02em;
}
.ls-tip__title-wrap { display: flex; flex-direction: column; gap: 2px; }
.ls-tip__name {
  font-size: 1.05rem;
  font-weight: 800;
  color: #f1f3f7;
  letter-spacing: 0.02em;
}
.ls-tip__gave {
  font-size: 0.78rem;
  color: #ffc857;
  font-weight: 600;
}
.ls-tip__max { color: #c9d2dd; font-size: 0.78rem; }
.ls-tip__section { padding: 2px 0; }
.ls-tip__flavor { color: #e8edf2; white-space: pre-line; }
.ls-tip__caveat { color: #8ea6b8; font-size: 0.76rem; margin-top: 4px; }
.ls-tip__selfonly {
  margin-top: 6px;
  padding: 4px 6px;
  font-size: 0.76rem;
  color: #ffd375;
  background: rgba(255, 200, 87, 0.08);
  border-left: 2px solid #ffc857;
  border-radius: 3px;
}
.ls-tip__divider {
  margin: 8px -12px;
  height: 1px;
  background: rgba(255, 255, 255, 0.12);
}
.ls-tip__cur { color: #c9d2dd; font-size: 0.78rem; margin-bottom: 4px; }
.ls-tip__effect { color: #f1f3f7; white-space: pre-line; }
</style>
