<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBattleSim } from '../composables/useBattleSim.js'
import { fmtClock, SIM_SKILLS } from '../constants/battleSim.js'
import { useEnemySettings } from '../composables/useEnemySettings.js'
import { ENEMY_TYPES, ELEMENTAL_DMG_OPTIONS } from '../constants/enemySettings.js'

const { t } = useI18n()
import { useVMatrix } from '../composables/useVMatrix.js'
import { maxLevelOf as vmMaxLevelOf } from '../constants/vmatrix.js'
import { useBattleBuffs } from '../composables/useBattleBuffs.js'
import { visibleBuffsForJob, BATTLE_BUFFS } from '../constants/battleBuffs.js'
import { useCharacter } from '../composables/useCharacter.js'

const {
  state,
  sortedSkills,
  setDuration,
  start,
  stop,
  reset,
  simulateSingleCast,
} = useBattleSim()

const { state: vmState } = useVMatrix()
const { state: charStateBattle } = useCharacter()
const { state: buffState, buffInfo } = useBattleBuffs()

// 觸發新疊層時的短暫閃光(420ms)
const flashingBuffs = ref({})
const prevCounts = {}
watch(
  () => ({ ...Object.fromEntries(Object.entries(buffState.stacks).map(([k, v]) => [k, v.count])) }),
  (now) => {
    for (const [id, count] of Object.entries(now)) {
      if (count > (prevCounts[id] || 0)) {
        flashingBuffs.value = { ...flashingBuffs.value, [id]: true }
        setTimeout(() => {
          const next = { ...flashingBuffs.value }
          delete next[id]
          flashingBuffs.value = next
        }, 420)
      }
      prevCounts[id] = count
    }
  },
  { deep: true },
)
function isBuffFlashing(id) { return !!flashingBuffs.value[id] }

// 只保留 (1) 對當前職業可見 (2) 該 link skill 等級 > 0 的 buff
const visibleBuffs = computed(() =>
  visibleBuffsForJob(charStateBattle.job)
    .map((b) => ({ buff: b, info: buffInfo(b, charStateBattle.job, state.elapsedMs) }))
    .filter((x) => x.info.level > 0 && x.info.stats),
)


const singleCastResult = ref(null)
function runTestCast() {
  singleCastResult.value = simulateSingleCast('flame_sweep')
}
function clearTestCast() { singleCastResult.value = null }

// 技能詳情分頁
const SKILLS_PER_PAGE = 6
const skillsPage = ref(0)
const skillsPageCount = computed(() =>
  Math.max(1, Math.ceil(sortedSkills.value.length / SKILLS_PER_PAGE)),
)
const pagedSkills = computed(() => {
  const p = Math.max(0, Math.min(skillsPage.value, skillsPageCount.value - 1))
  return sortedSkills.value.slice(p * SKILLS_PER_PAGE, (p + 1) * SKILLS_PER_PAGE)
})
function skillsPrev() {
  skillsPage.value = Math.max(0, skillsPage.value - 1)
}
function skillsNext() {
  skillsPage.value = Math.min(skillsPageCount.value - 1, skillsPage.value + 1)
}

const flameSweep = SIM_SKILLS.find((s) => s.id === 'flame_sweep')
const flameSweepVmMax = computed(() => {
  // 優先以 useVMatrix 常數庫定義的技能 maxLevel (60) 為準
  // 透過 SIM_SKILLS 上 `vmatrix.maxLevel` 或 vmatrix.js 常數皆可,這裡保留顯示用
  return flameSweep?.vmatrix?.maxLevel || 0
})
const flameSweepVmLevel = computed(() => vmState.levels?.flame_sweep ?? 0)
const {
  state: enemy,
  arcInfo,
  setType: setEnemyType,
  setLevel: setEnemyLevel,
  setDefense: setEnemyDefense,
  setElementalDmg: setEnemyElementalDmg,
  setBossArc,
} = useEnemySettings()

onMounted(() => document.body.classList.add('page-battle'))
onUnmounted(() => document.body.classList.remove('page-battle'))

function fmtNum(n) { return Number(n || 0).toLocaleString('en-US') }
function fmtPct(n) { return `${Number(n || 0).toFixed(2)}%` }

const result = computed(() => state.result)

const battleClock = computed(() => {
  if (state.running || state.elapsedMs > 0) return fmtClock(state.elapsedMs)
  return fmtClock(state.durationSec * 1000)
})

// 時間軸事件 — 將 ms 對應到 % 寬度,用顏色標出技能
const timelineRows = computed(() => {
  if (!result.value) return []
  const totalMs = result.value.durationSec * 1000
  // 取每個事件 (時間排序後),在「使用紀錄」面板中顯示
  return result.value.events.slice(0, 200).map((e, i) => {
    const skill = SIM_SKILLS.find((s) => s.id === e.skillId)
    const isDot = e.type === 'dot'
    return {
      i,
      time: fmtClock(e.time),
      skillId: e.skillId,
      isDot,
      skillName: (skill?.nameKey ? t(skill.nameKey) : (skill?.name || e.skillId))
        + (isDot ? ' · DoT' : ''),
      color: skill?.color || '#5cd1ea',
      pct: totalMs > 0 ? (e.time / totalMs) * 100 : 0,
    }
  })
})
</script>

<template>
  <section class="bp-page">
    <!-- 左:戰鬥分析系統 -->
    <div class="bp-main">
      <header class="bp-main__head">
        <span class="bp-main__title">{{ t('battle.title') }}</span>
        <span class="bp-main__subtitle">BATTLE STATISTICS</span>
      </header>

      <!-- 目標對象屬性設定 -->
      <div class="bp-enemy">
        <header class="bp-enemy__head">{{ t('battle.enemy.title') }}</header>
        <div class="bp-enemy__body">
          <div class="bp-enemy__fields">
            <label class="bp-enemy__row">
              <span class="bp-enemy__label">{{ t('battle.enemy.type') }}</span>
              <select
                class="bp-enemy__field"
                :value="enemy.type"
                @change="(e) => setEnemyType(e.target.value)"
              >
                <option v-for="v in ENEMY_TYPES" :key="v" :value="v">
                  {{ t(`battle.enemy.types.${v}`) }}
                </option>
              </select>
            </label>
            <label class="bp-enemy__row">
              <span class="bp-enemy__label">{{ t('battle.enemy.level') }}</span>
              <input
                class="bp-enemy__field"
                type="number"
                min="1"
                max="300"
                :value="enemy.level"
                @input="(e) => setEnemyLevel(e.target.value)"
              />
            </label>
            <label class="bp-enemy__row">
              <span class="bp-enemy__label">{{ t('battle.enemy.defense') }}</span>
              <input
                class="bp-enemy__field"
                type="number"
                min="0"
                max="100000"
                :value="enemy.defense"
                @input="(e) => setEnemyDefense(e.target.value)"
              />
            </label>
            <label class="bp-enemy__row">
              <span class="bp-enemy__label">{{ t('battle.enemy.elementalDmg') }}</span>
              <select
                class="bp-enemy__field"
                :value="enemy.elementalDmg"
                @change="(e) => setEnemyElementalDmg(e.target.value)"
              >
                <option v-for="v in ELEMENTAL_DMG_OPTIONS" :key="v" :value="v">
                  {{ t(`battle.enemy.elementalOptions.${v}`) }}
                </option>
              </select>
            </label>
            <label class="bp-enemy__row">
              <span class="bp-enemy__label">{{ t('battle.enemy.bossArc') }}</span>
              <input
                class="bp-enemy__field"
                type="number"
                min="0"
                max="100000"
                :value="enemy.bossArc"
                @input="(e) => setBossArc(e.target.value)"
              />
            </label>
          </div>
          <div class="bp-enemy__info">
            <div class="bp-enemy__info-row">
              <span>{{ t('battle.enemy.playerArc') }}</span>
              <span class="bp-enemy__info-val">{{ arcInfo.playerArc }}</span>
            </div>
            <div class="bp-enemy__info-row">
              <span>{{ t('battle.enemy.arcRatio') }}</span>
              <span class="bp-enemy__info-val">{{ arcInfo.ratioPct }}%</span>
            </div>
            <div class="bp-enemy__info-row bp-enemy__info-row--accent">
              <span>{{ t('battle.enemy.finalDmg') }}</span>
              <span class="bp-enemy__info-val">{{ arcInfo.finalDmg }}%</span>
            </div>
            <div class="bp-enemy__info-row bp-enemy__info-row--danger">
              <span>{{ t('battle.enemy.damageTaken') }}</span>
              <span class="bp-enemy__info-val">{{ arcInfo.damageTaken }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 實戰觸發 Buff — 僅圖示;未觸發 → 灰階;≥2 層 → 右下角黃字黑框層數 -->
      <div v-if="visibleBuffs.length" class="bp-buffs">
        <div
          v-for="{ buff, info } in visibleBuffs"
          :key="buff.id"
          class="bp-buffs__icon-wrap"
          :class="{
            'bp-buffs__icon-wrap--dim': info.count === 0,
            'bp-buffs__icon-wrap--flash': isBuffFlashing(buff.id),
          }"
          :title="`${t(buff.nameKey)} Lv.${info.level} · ${t(buff.descriptionKey)}`"
        >
          <img
            class="bp-buffs__icon"
            :src="buff.imageUrl"
            :alt="t(buff.nameKey)"
            loading="lazy"
          />
          <span v-if="info.count >= 2" class="bp-buffs__badge">{{ info.count }}</span>
        </div>
      </div>

      <!-- 上方統計列 -->
      <div class="bp-summary">
        <div class="bp-summary__grid">
          <div class="bp-summary__cell">
            <span class="bp-summary__label">⏱ {{ t('battle.summary.time') }}</span>
            <span class="bp-summary__val">{{ battleClock }}</span>
          </div>
          <div class="bp-summary__cell">
            <span class="bp-summary__label">⚔ {{ t('battle.summary.totalDmg') }}</span>
            <span class="bp-summary__val">{{ result ? fmtNum(result.totalDmg) : '0' }}</span>
          </div>
          <div class="bp-summary__cell">
            <span class="bp-summary__label">⚔ {{ t('battle.summary.avgDmg') }}</span>
            <span class="bp-summary__val">
              {{ result ? fmtNum(result.avgDmgPerSec) : '0' }}
              <small>{{ t('battle.summary.perSec') }}</small>
            </span>
          </div>
          <div class="bp-summary__cell">
            <span class="bp-summary__label">🐾 {{ t('battle.summary.kills') }}</span>
            <span class="bp-summary__val">0</span>
          </div>
          <div class="bp-summary__cell">
            <span class="bp-summary__label">EXP {{ t('battle.summary.exp') }}</span>
            <span class="bp-summary__val">0</span>
          </div>
          <div class="bp-summary__cell">
            <span class="bp-summary__label">EXP {{ t('battle.summary.expAvg') }}</span>
            <span class="bp-summary__val">0 <small>{{ t('battle.summary.perSec') }}</small></span>
          </div>
        </div>

        <div class="bp-summary__controls">
          <label class="bp-summary__duration">
            <span>{{ t('battle.controls.duration') }}</span>
            <input
              type="number"
              min="1"
              max="3600"
              :value="state.durationSec"
              :disabled="state.running"
              @input="(e) => setDuration(e.target.value)"
            />
            <span class="bp-summary__unit">{{ t('battle.controls.sec') }}</span>
          </label>
          <button
            v-if="!state.running"
            class="bp-start"
            type="button"
            @click="start"
          >
            ⏵ {{ t('battle.controls.start') }}
          </button>
          <button
            v-else
            class="bp-stop"
            type="button"
            @click="stop"
          >
            ⏸ {{ t('battle.controls.stop') }}
          </button>
          <button v-if="result && !state.running" class="bp-reset" type="button" @click="reset">
            {{ t('battle.controls.reset') }}
          </button>
        </div>
      </div>

      <!-- 技能詳情表格 -->
      <div class="bp-skills">
        <header class="bp-skills__head">
          <span>| {{ t('battle.skills.title') }}</span>
          <div v-if="skillsPageCount > 1" class="bp-skills__pager">
            <button type="button" class="bp-skills__pager-btn" :disabled="skillsPage === 0" @click="skillsPrev">‹</button>
            <span class="bp-skills__pager-info">{{ skillsPage + 1 }} / {{ skillsPageCount }}</span>
            <button type="button" class="bp-skills__pager-btn" :disabled="skillsPage >= skillsPageCount - 1" @click="skillsNext">›</button>
          </div>
        </header>
        <div class="bp-skills__table-wrap">
          <table class="bp-skills__table">
            <colgroup>
              <col class="bp-skills__col-group--label" />
              <col v-for="skill in pagedSkills" :key="skill.id" class="bp-skills__col-group--skill" />
            </colgroup>
            <thead>
              <tr>
                <th class="bp-skills__col-label"></th>
                <th v-for="skill in pagedSkills" :key="skill.id" class="bp-skills__col">
                  <img :src="skill.imageUrl" :alt="t(skill.nameKey)" class="bp-skills__icon" />
                  <div class="bp-skills__name">{{ t(skill.nameKey) }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.total') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? fmtNum(result.perSkill[skill.id]?.total || 0) : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.share') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? fmtPct(result.perSkill[skill.id]?.share || 0) : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.avgPerSec') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? fmtNum(result.perSkill[skill.id]?.avgPerSec || 0) : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.useCount') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? `${result.perSkill[skill.id]?.useCount || 0}${t('battle.skills.times')}` : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.avgPerCast') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? fmtNum(result.perSkill[skill.id]?.avgPerCast || 0) : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.attackCount') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? `${result.perSkill[skill.id]?.attackCount || 0}${t('battle.skills.times')}` : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.maxHit') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? fmtNum(result.perSkill[skill.id]?.maxHit || 0) : '—' }}
                </td>
              </tr>
              <tr>
                <td class="bp-skills__col-label">{{ t('battle.skills.minHit') }}</td>
                <td v-for="skill in pagedSkills" :key="skill.id">
                  {{ result ? fmtNum(result.perSkill[skill.id]?.minHit || 0) : '—' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 測試按鈕 + 單次施放明細 -->
      <div class="bp-test">
        <header class="bp-test__head">
          <span>| {{ t('battle.test.title') }}</span>
          <div class="bp-test__actions">
            <span class="bp-test__vm-display">
              <span>{{ t('battle.test.vmLevel') }}</span>
              <b>{{ flameSweepVmLevel }}</b>
              <small>/ {{ flameSweepVmMax }}</small>
              <em>{{ t('battle.test.vmHint') }}</em>
            </span>
            <button class="bp-test__btn" type="button" @click="runTestCast">
              {{ t('battle.test.run') }}
            </button>
            <button
              v-if="singleCastResult"
              class="bp-test__btn bp-test__btn--ghost"
              type="button"
              @click="clearTestCast"
            >
              {{ t('battle.test.clear') }}
            </button>
          </div>
        </header>
        <div v-if="!singleCastResult" class="bp-test__empty">
          {{ t('battle.test.empty') }}
        </div>
        <div v-else class="bp-test__body">
          <!-- 技能標頭 -->
          <div class="bp-test__skill">
            <img :src="singleCastResult.skill.imageUrl" :alt="t(singleCastResult.skill.nameKey)" class="bp-test__icon" />
            <div>
              <div class="bp-test__skill-name">{{ t(singleCastResult.skill.nameKey) }}</div>
              <div class="bp-test__skill-sub">
                Lv. {{ singleCastResult.level }} · {{ singleCastResult.mults.mainPct }}% × {{ singleCastResult.skill.hitsPerCast }} hits
                + DoT {{ singleCastResult.mults.dotPct }}% / tick × {{ singleCastResult.dotTicks.length }}
              </div>
            </div>
          </div>

          <!-- 輸入值 (來自 CP 計算頁) -->
          <div class="bp-test__inputs">
            <div class="bp-test__inputs-title">{{ t('battle.test.inputsFromCp') }}</div>
            <div class="bp-test__grid">
              <div><span>basic</span><b>{{ fmtNum(singleCastResult.cpInputs.basic) }}</b></div>
              <div><span>boss min</span><b>{{ fmtNum(singleCastResult.cpInputs.bossMin) }}</b></div>
              <div><span>boss max</span><b>{{ fmtNum(singleCastResult.cpInputs.bossMax) }}</b></div>
              <div><span>Damage%</span><b>{{ singleCastResult.cpInputs.dmgPct?.toFixed?.(2) ?? 0 }}%</b></div>
              <div><span>Boss Dmg%</span><b>{{ singleCastResult.cpInputs.bossDmg?.toFixed?.(2) ?? 0 }}%</b></div>
              <div><span>Final Damage%</span><b>{{ singleCastResult.cpInputs.finalDmg?.toFixed?.(2) ?? 0 }}%</b></div>
              <div><span>Crit Damage%</span><b>{{ singleCastResult.cpInputs.critDmg?.toFixed?.(2) ?? 0 }}%</b></div>
              <div><span>Mastery</span><b>{{ singleCastResult.cpInputs.mastery }}%</b></div>
            </div>
          </div>

          <!-- 乘區 -->
          <div class="bp-test__mults">
            <div class="bp-test__inputs-title">{{ t('battle.test.multipliers') }}</div>
            <div class="bp-test__grid bp-test__grid--4">
              <div><span>屬性 (elemMult)</span><b>× {{ singleCastResult.mults.elemMult.toFixed(4) }}</b></div>
              <div>
                <span>怪物屬性耐性 / 無視</span>
                <b>{{ singleCastResult.mults.elemResistPct }}% / {{ singleCastResult.mults.elemIgnorePct }}%</b>
              </div>
              <div><span>ARC 終傷</span><b>{{ singleCastResult.mults.arcFinalPct }}%</b></div>
              <div>
                <span>Buff Damage 疊加</span>
                <b>+{{ singleCastResult.mults.buffDmgPct }}% → 總 Damage {{ singleCastResult.mults.totalDmgPct.toFixed(2) }}%</b>
              </div>
              <div>
                <span>Buff 無視防禦</span>
                <b>+{{ singleCastResult.mults.buffIgnoreDefPct }}%</b>
              </div>
              <div>
                <span>Buff 最終傷害乘區</span>
                <b>× {{ singleCastResult.mults.buffFinalDmgMult.toFixed(4) }} (+{{ singleCastResult.mults.buffFinalDmgPct.toFixed(2) }}%)</b>
              </div>
              <div>
                <span>測試用 DoT 數</span>
                <b>{{ singleCastResult.mults.testDotCount }}</b>
              </div>
              <div>
                <span>VM Lv {{ singleCastResult.mults.vmLevel }}/{{ singleCastResult.mults.vmMaxLevel }}</span>
                <b>終傷 +{{ singleCastResult.mults.vmFinalDmgPct }}% · 無視 +{{ singleCastResult.mults.vmIgnoreDefPct }}%</b>
              </div>
              <div><span>VM 終傷乘數</span><b>× {{ singleCastResult.mults.skillFinalMult.toFixed(4) }}</b></div>
              <div><span>怪物 DEF</span><b>{{ singleCastResult.mults.enemyDef }}</b></div>
              <div>
                <span>合併無視 (CP × VM)</span>
                <b>{{ singleCastResult.mults.cpIgnoreDefPct.toFixed(2) }}% → {{ singleCastResult.mults.totalIgnoreDefPct.toFixed(2) }}%</b>
              </div>
              <div><span>有效防禦</span><b>{{ singleCastResult.mults.effectiveDef.toFixed(2) }}</b></div>
              <div><span>defMult</span><b>× {{ singleCastResult.mults.defMult.toFixed(4) }}</b></div>
            </div>
          </div>

          <!-- 公式 -->
          <div class="bp-test__formula">
            <div class="bp-test__inputs-title">{{ t('battle.test.formula') }}</div>
            <code class="bp-test__code bp-test__code--vm">{{ singleCastResult.formulas.vmatrix }}</code>
            <code class="bp-test__code bp-test__code--buff">{{ singleCastResult.formulas.buff }}</code>
            <code class="bp-test__code bp-test__code--rebuild">{{ singleCastResult.formulas.rebuild }}</code>
            <code class="bp-test__code">{{ singleCastResult.formulas.main }}</code>
            <code class="bp-test__code bp-test__code--def">{{ singleCastResult.formulas.defense }}</code>
            <code class="bp-test__code bp-test__code--dot">{{ singleCastResult.formulas.dot }}</code>
          </div>

          <!-- 每一擊 -->
          <div class="bp-test__hits">
            <div class="bp-test__hit-group">
              <div class="bp-test__hit-title">
                {{ t('battle.test.mainHits') }}
                <span class="bp-test__hit-sum">∑ {{ fmtNum(singleCastResult.mainSum) }}</span>
              </div>
              <ol class="bp-test__hit-list">
                <li v-for="(dmg, idx) in singleCastResult.mainHits" :key="idx">
                  <span class="bp-test__hit-i">#{{ idx + 1 }}</span>
                  <span class="bp-test__hit-val">{{ fmtNum(dmg) }}</span>
                </li>
              </ol>
            </div>
            <div class="bp-test__hit-group">
              <div class="bp-test__hit-title">
                {{ t('battle.test.dotTicks') }}
                <span class="bp-test__hit-sum">∑ {{ fmtNum(singleCastResult.dotSum) }}</span>
              </div>
              <ol class="bp-test__hit-list">
                <li v-for="(tick, idx) in singleCastResult.dotTicks" :key="idx">
                  <span class="bp-test__hit-i">{{ (tick.time / 1000).toFixed(0) }}s</span>
                  <span class="bp-test__hit-val">{{ fmtNum(tick.dmg) }}</span>
                </li>
              </ol>
            </div>
          </div>

          <!-- 總和 -->
          <div class="bp-test__total">
            <span>{{ t('battle.test.total') }}</span>
            <b>{{ fmtNum(singleCastResult.total) }}</b>
          </div>
        </div>
      </div>
    </div>

    <!-- 右:技能時間軸 -->
    <aside class="bp-timeline">
      <header class="bp-timeline__head">
        <span>{{ t('battle.timeline.title') }}</span>
        <span class="bp-timeline__count" v-if="result">
          {{ result.events.length }} {{ t('battle.timeline.events') }}
        </span>
      </header>
      <div v-if="!result" class="bp-timeline__empty">
        {{ t('battle.timeline.empty') }}
      </div>
      <ol v-else class="bp-timeline__list">
        <li
          v-for="row in timelineRows"
          :key="row.i"
          class="bp-timeline__row"
          :class="{ 'bp-timeline__row--dot': row.isDot }"
        >
          <span class="bp-timeline__t">{{ row.time }}</span>
          <span
            class="bp-timeline__dot"
            :class="{ 'bp-timeline__dot--tick': row.isDot }"
            :style="{ background: row.color }"
          />
          <span class="bp-timeline__skill">{{ row.skillName }}</span>
        </li>
      </ol>
      <div v-if="result && result.events.length > 200" class="bp-timeline__more">
        … +{{ result.events.length - 200 }} {{ t('battle.timeline.more') }}
      </div>
    </aside>
  </section>
</template>

<style scoped>
.bp-page {
  padding: 0.5rem 0 2rem;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

/* 測試按鈕 + 單次施放明細 */
.bp-test {
  background: linear-gradient(180deg, #2f3642 0%, #262d38 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bp-test__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffc857;
}
.bp-test__actions { display: flex; gap: 6px; }
.bp-test__btn {
  background: linear-gradient(180deg, #5cd1ea 0%, #3b9fb4 100%);
  color: #0c2833;
  border: 1px solid #1a4550;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.8rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  padding: 0.35rem 0.7rem;
  cursor: pointer;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}
.bp-test__btn:hover { filter: brightness(1.1); }
.bp-test__btn--ghost {
  background: transparent;
  color: #c9d2dd;
  border-color: #3d4554;
  text-shadow: none;
  font-weight: 600;
}
.bp-test__empty {
  padding: 16px 8px;
  font-size: 0.8rem;
  color: #8ea6b8;
  text-align: center;
  letter-spacing: 0.04em;
}
.bp-test__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bp-test__skill {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: linear-gradient(180deg, #4f7585 0%, #3a5867 100%);
  border: 1px solid #1a2a32;
  border-radius: 6px;
}
.bp-test__icon {
  width: 40px; height: 40px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
}
.bp-test__skill-name {
  font-weight: 800;
  color: #ffc857;
  letter-spacing: 0.02em;
}
.bp-test__skill-sub {
  font-size: 0.74rem;
  color: #c9d2dd;
  margin-top: 2px;
}
.bp-test__inputs,
.bp-test__mults,
.bp-test__formula,
.bp-test__hits,
.bp-test__total {
  padding: 8px 10px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid #1a1f27;
  border-radius: 6px;
}
.bp-test__inputs-title {
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #ffc857;
  margin-bottom: 6px;
  text-transform: uppercase;
}
.bp-test__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px 14px;
  font-size: 0.78rem;
}
.bp-test__grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.bp-test__grid div {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.bp-test__grid span {
  color: #8ea6b8;
  font-size: 0.7rem;
  letter-spacing: 0.04em;
}
.bp-test__grid b {
  color: #e8edf2;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.bp-test__code {
  display: block;
  padding: 6px 8px;
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: 0.74rem;
  color: #d7e3ef;
  background: #0f1419;
  border: 1px solid #0a0d11;
  border-radius: 4px;
  margin-top: 4px;
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.45;
}
.bp-test__code--dot { color: #ffa477; }
.bp-test__code--def { color: #8fe09d; }
.bp-test__code--vm { color: #c29bff; }
.bp-test__vm-display {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: #c9d2dd;
  padding: 0.25rem 0.55rem;
  background: rgba(194, 155, 255, 0.08);
  border: 1px solid rgba(194, 155, 255, 0.35);
  border-radius: 5px;
}
.bp-test__vm-display b {
  color: #c29bff;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
}
.bp-test__vm-display small { color: #8ea6b8; font-size: 0.7rem; }
.bp-test__vm-display em {
  font-style: normal;
  color: #8ea6b8;
  font-size: 0.68rem;
  margin-left: 6px;
}
.bp-test__buff-cell b { color: #8ea6b8 !important; font-weight: 600 !important; font-size: 0.72rem !important; font-style: italic; }
.bp-test__code--buff { color: #ffa477; }
.bp-test__code--rebuild { color: #8fe09d; font-size: 0.72rem; }
.bp-test__hits {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 10px;
}
.bp-test__hit-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.bp-test__hit-title {
  display: flex;
  justify-content: space-between;
  font-size: 0.76rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #5cd1ea;
}
.bp-test__hit-sum {
  color: #ffc857;
  font-variant-numeric: tabular-nums;
}
.bp-test__hit-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.bp-test__hit-list li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  padding: 3px 4px;
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
}
.bp-test__hit-list li:nth-child(odd) { background: rgba(255, 255, 255, 0.04); }
.bp-test__hit-i { color: #8ea6b8; }
.bp-test__hit-val { color: #e8edf2; text-align: right; }
.bp-test__total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.9rem;
}
.bp-test__total span {
  color: #c9d2dd;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.bp-test__total b {
  color: #ffc857;
  font-variant-numeric: tabular-nums;
  font-size: 1.3rem;
  font-weight: 800;
}
@media (max-width: 780px) {
  .bp-test__grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bp-test__hits { grid-template-columns: minmax(0, 1fr); }
}

/* 右側時間軸 */
.bp-timeline {
  flex: 0 0 280px;
  width: 280px;
  background: linear-gradient(180deg, #2b3441 0%, #232b36 100%);
  border: 1px solid #1a1f27;
  border-radius: 10px;
  padding: 8px 10px 10px;
  color: #e8edf2;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-self: flex-start;
  max-height: 720px;
  overflow: hidden;
}
.bp-timeline__head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 4px 4px 6px;
  border-bottom: 1px solid #1a1f27;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #ffc857;
  text-transform: uppercase;
}
.bp-timeline__count {
  font-size: 0.66rem;
  color: #8ea6b8;
  text-transform: none;
  letter-spacing: 0.04em;
}
.bp-timeline__empty {
  padding: 18px 6px;
  font-size: 0.78rem;
  color: #8ea6b8;
  text-align: center;
  letter-spacing: 0.04em;
}
.bp-timeline__list {
  list-style: none;
  margin: 0;
  padding: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow-y: auto;
  max-height: 640px;
}
.bp-timeline__row {
  display: grid;
  grid-template-columns: 70px 10px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
  padding: 2px 4px;
  font-size: 0.74rem;
}
.bp-timeline__row:nth-child(odd) { background: rgba(255, 255, 255, 0.03); }
.bp-timeline__t {
  color: #5cd1ea;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
.bp-timeline__dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 1px solid #1a1f27;
}
.bp-timeline__dot--tick {
  width: 6px;
  height: 6px;
  opacity: 0.65;
  margin-left: 2px;
}
.bp-timeline__row--dot .bp-timeline__t,
.bp-timeline__row--dot .bp-timeline__skill {
  opacity: 0.6;
  font-style: italic;
}
.bp-timeline__skill {
  color: #e8edf2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.bp-timeline__more {
  text-align: center;
  font-size: 0.7rem;
  color: #8ea6b8;
  padding: 4px;
}

/* 中央主面板 */
.bp-main {
  flex: 1 1 0;
  min-width: 0;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border: 1px solid #2f3642;
  border-radius: 14px;
  padding: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.18);
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #f1f3f7;
}
.bp-main__head {
  display: flex;
  align-items: baseline;
  gap: 14px;
  padding: 6px 10px;
  background: linear-gradient(180deg, #3d4554 0%, #2f3642 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
}
.bp-main__title {
  color: #ffc857;
  font-weight: 800;
  letter-spacing: 0.1em;
  font-size: 1rem;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.5);
}
.bp-main__subtitle {
  color: #c9d2dd;
  font-weight: 700;
  letter-spacing: 0.16em;
  font-size: 0.74rem;
}

/* 實戰 Buff 面板 — 單排高度,僅顯示圖示;置右 */
.bp-buffs {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: linear-gradient(180deg, #2f3642 0%, #262d38 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  min-height: 50px;
}
.bp-buffs__icon-wrap {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}
.bp-buffs__icon {
  width: 40px;
  height: 40px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
  display: block;
  transition: filter 120ms ease, opacity 120ms ease;
}
.bp-buffs__icon-wrap--dim .bp-buffs__icon {
  filter: grayscale(1) brightness(0.55);
  opacity: 0.75;
}
@keyframes bpBuffFlash {
  0%   { box-shadow: 0 0 0 0 rgba(255, 200, 87, 0.9), 0 0 0 0 rgba(255, 200, 87, 0.6); transform: scale(1); }
  45%  { box-shadow: 0 0 10px 4px rgba(255, 200, 87, 0.9), 0 0 22px 10px rgba(255, 200, 87, 0.4); transform: scale(1.08); }
  100% { box-shadow: 0 0 0 0 rgba(255, 200, 87, 0), 0 0 0 0 rgba(255, 200, 87, 0); transform: scale(1); }
}
.bp-buffs__icon-wrap--flash .bp-buffs__icon {
  border-color: #ffc857;
  animation: bpBuffFlash 420ms ease-out;
}
.bp-buffs__badge {
  position: absolute;
  right: -3px;
  bottom: -4px;
  color: #ffc857;
  font-size: 0.95rem;
  font-weight: 900;
  font-family: inherit;
  line-height: 1;
  pointer-events: none;
  letter-spacing: 0;
  /* 黑色外匡 (多方向 text-shadow 模擬描邊) */
  text-shadow:
    -1px -1px 0 #000, 0 -1px 0 #000, 1px -1px 0 #000,
    -1px  0   0 #000,               1px  0   0 #000,
    -1px  1px 0 #000, 0  1px 0 #000, 1px  1px 0 #000,
    -2px  0   0 #000, 2px 0 0 #000, 0 -2px 0 #000, 0 2px 0 #000;
}

/* 上方統計列 */
.bp-summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 200px;
  gap: 10px;
  padding: 10px 12px;
  background: linear-gradient(180deg, #2f3642 0%, #262d38 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
}
.bp-summary__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 14px;
}
.bp-summary__cell {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.bp-summary__label {
  font-size: 0.7rem;
  color: #c9d2dd;
  letter-spacing: 0.04em;
}
.bp-summary__val {
  color: #ffc857;
  font-size: 0.95rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.bp-summary__val small {
  font-size: 0.66rem;
  color: #8ea6b8;
  font-weight: 600;
  margin-left: 2px;
}
.bp-summary__controls {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: stretch;
}
.bp-summary__duration {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.74rem;
  color: #c9d2dd;
}
.bp-summary__duration input {
  flex: 1;
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 5px;
  padding: 0.25rem 0.4rem;
  font-family: inherit;
  font-size: 0.85rem;
  text-align: right;
  font-variant-numeric: tabular-nums;
  width: 60px;
}
.bp-summary__duration input:focus { outline: none; border-color: #ffc857; }
.bp-summary__unit { color: #8ea6b8; font-size: 0.7rem; }

.bp-start {
  background: linear-gradient(180deg, #6fbf45 0%, #4a8f30 100%);
  color: #1f2a14;
  border: 1px solid #2a4f1c;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.5rem 0.6rem;
  cursor: pointer;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}
.bp-start:hover { filter: brightness(1.1); }
.bp-stop {
  background: linear-gradient(180deg, #d9563a 0%, #9b3522 100%);
  color: #2a110a;
  border: 1px solid #5a1d0f;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.95rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  padding: 0.5rem 0.6rem;
  cursor: pointer;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.2);
}
.bp-stop:hover { filter: brightness(1.1); }
.bp-reset {
  background: transparent;
  border: 1px solid #2f3642;
  color: #c9d2dd;
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.74rem;
  letter-spacing: 0.06em;
  padding: 0.3rem 0.6rem;
  cursor: pointer;
}
.bp-reset:hover { color: #ffc857; border-color: #ffc857; }

/* 技能詳情表格 */
.bp-skills {
  background: linear-gradient(180deg, #2f3642 0%, #262d38 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bp-skills__head {
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffc857;
  padding: 0 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.bp-skills__table-wrap {
  overflow-x: auto;
}
.bp-skills__table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 6px 4px;
  table-layout: fixed;
}
.bp-skills__col-group--label { width: 160px; }
.bp-skills__col-group--skill { width: auto; }
.bp-skills__table th,
.bp-skills__table td {
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border: 1px solid #2f3642;
  border-radius: 5px;
  padding: 6px 8px;
  text-align: center;
  font-size: 0.82rem;
  color: #e8edf2;
  font-variant-numeric: tabular-nums;
}
.bp-skills__col-label {
  background: transparent !important;
  border: none !important;
  text-align: right !important;
  color: #c9d2dd !important;
  font-weight: 600;
  letter-spacing: 0.04em;
  font-size: 0.74rem !important;
  white-space: normal;
  word-break: keep-all;
  line-height: 1.25;
  padding-right: 10px !important;
}
.bp-skills__pager {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.74rem;
  color: #c9d2dd;
  font-variant-numeric: tabular-nums;
}
.bp-skills__pager-btn {
  background: transparent;
  color: #c9d2dd;
  border: 1px solid #2f3642;
  border-radius: 4px;
  padding: 0.15rem 0.55rem;
  font-family: inherit;
  font-size: 0.85rem;
  cursor: pointer;
  line-height: 1;
}
.bp-skills__pager-btn:hover:not(:disabled) { color: #ffc857; border-color: #ffc857; }
.bp-skills__pager-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.bp-skills__pager-info { color: #ffc857; font-weight: 700; }
.bp-skills__col {
  background: linear-gradient(180deg, #4f7585 0%, #3a5867 100%) !important;
  border: 1px solid #1a2a32 !important;
  padding: 8px !important;
}
.bp-skills__icon {
  width: 36px;
  height: 36px;
  object-fit: contain;
  background: #1f2630;
  border: 1px solid #141a22;
  border-radius: 5px;
  margin: 0 auto;
}
.bp-skills__name {
  margin-top: 4px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #ffc857;
  letter-spacing: 0.02em;
}

/* Enemy Settings (主面板內) */
.bp-enemy {
  background: linear-gradient(180deg, #2f3642 0%, #262d38 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.bp-enemy__head {
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #ffc857;
  padding: 0 4px;
}
.bp-enemy__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 220px;
  gap: 10px;
  align-items: start;
}
.bp-enemy__fields {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px 14px;
}
.bp-enemy__row {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}
.bp-enemy__label {
  font-size: 0.74rem;
  color: #c9d2dd;
  letter-spacing: 0.04em;
  font-weight: 700;
}
.bp-enemy__field {
  background: #1f2630;
  color: #f1f3f7;
  border: 1px solid #141a22;
  border-radius: 5px;
  padding: 0.28rem 0.4rem;
  font-family: inherit;
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
  width: 100%;
  box-sizing: border-box;
}
.bp-enemy__field:focus { outline: none; border-color: #ffc857; }
input.bp-enemy__field { text-align: right; }
.bp-enemy__info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 6px 8px;
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid #1a1f27;
  border-radius: 6px;
}
.bp-enemy__info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.76rem;
  color: #c9d2dd;
  letter-spacing: 0.04em;
  font-weight: 600;
}
.bp-enemy__info-val {
  font-variant-numeric: tabular-nums;
  color: #e8edf2;
  font-weight: 800;
}
.bp-enemy__info-row--accent .bp-enemy__info-val { color: #ffc857; }
.bp-enemy__info-row--danger .bp-enemy__info-val { color: #ff7b6b; }
@media (max-width: 780px) {
  .bp-enemy__body { grid-template-columns: minmax(0, 1fr); }
  .bp-enemy__fields { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>

<!-- 放寬 .layout__main 上限 (只在 battle 頁生效) -->
<style>
body.page-battle .layout__main {
  max-width: 1600px;
  padding-left: 0.75rem;
  padding-right: 0.75rem;
}
</style>
