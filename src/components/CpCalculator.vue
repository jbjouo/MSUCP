<script setup>
import { computed, reactive } from 'vue'

const stats = reactive({
  mainStat: 20000,
  subStat: 1500,
  attack: 800,
  damagePct: 80,
  bossPct: 250,
  critRate: 100,
  critDamagePct: 60,
  finalDamagePct: 20,
  iedPct: 90,
  monsterDefPct: 30,
  elementPct: 0,
  weaponConst: 1.34,
  masteryPct: 85,
})

const mainStatLabel = {
  STR: '力量',
  DEX: '敏捷',
  INT: '智力',
  LUK: '運氣',
}

const job = reactive({ mainKey: 'STR' })

const effectiveMainStat = computed(
  () => stats.mainStat * 4 + stats.subStat,
)

const damageMult = computed(() => 1 + stats.damagePct / 100)
const bossMult = computed(() => 1 + stats.bossPct / 100)
const finalMult = computed(() => 1 + stats.finalDamagePct / 100)
const elementMult = computed(() => 1 + stats.elementPct / 100)

const critMult = computed(() => {
  const rate = Math.min(Math.max(stats.critRate, 0), 100) / 100
  const bonus = stats.critDamagePct / 100
  return 1 + rate * bonus
})

const iedMult = computed(() => {
  const ied = Math.min(Math.max(stats.iedPct, 0), 100) / 100
  const def = Math.min(Math.max(stats.monsterDefPct, 0), 100) / 100
  const reduced = def * (1 - ied)
  return 1 - reduced
})

const masteryMult = computed(() => {
  const m = Math.min(Math.max(stats.masteryPct, 0), 100) / 100
  return (1 + m) / 2
})

const cp = computed(() => {
  const base =
    effectiveMainStat.value *
    stats.attack *
    stats.weaponConst *
    masteryMult.value *
    damageMult.value *
    bossMult.value *
    critMult.value *
    finalMult.value *
    iedMult.value *
    elementMult.value
  return Math.round(base)
})

const cpFormatted = computed(() => cp.value.toLocaleString())

const breakdown = computed(() => [
  { label: '有效主屬性 (主×4 + 副)', value: effectiveMainStat.value.toLocaleString() },
  { label: '攻擊力 / 魔力', value: stats.attack.toLocaleString() },
  { label: '武器常數', value: stats.weaponConst.toFixed(2) },
  { label: '熟練度倍率', value: masteryMult.value.toFixed(3) },
  { label: '傷害倍率', value: damageMult.value.toFixed(3) },
  { label: 'Boss 傷害倍率', value: bossMult.value.toFixed(3) },
  { label: '爆擊期望倍率', value: critMult.value.toFixed(3) },
  { label: '最終傷害倍率', value: finalMult.value.toFixed(3) },
  { label: '防禦穿透倍率', value: iedMult.value.toFixed(3) },
  { label: '屬性傷害倍率', value: elementMult.value.toFixed(3) },
])

function reset() {
  Object.assign(stats, {
    mainStat: 20000,
    subStat: 1500,
    attack: 800,
    damagePct: 80,
    bossPct: 250,
    critRate: 100,
    critDamagePct: 60,
    finalDamagePct: 20,
    iedPct: 90,
    monsterDefPct: 30,
    elementPct: 0,
    weaponConst: 1.34,
    masteryPct: 85,
  })
  job.mainKey = 'STR'
}
</script>

<template>
  <div class="calc">
    <header class="calc__header">
      <h1>MSU 戰鬥力 (CP) 計算機</h1>
      <p class="subtitle">MapleStory N · 冒險家戰鬥力模擬器</p>
    </header>

    <section class="cp-display">
      <span class="cp-label">預估戰鬥力</span>
      <span class="cp-value">{{ cpFormatted }}</span>
    </section>

    <section class="panel">
      <h2>主屬性</h2>
      <div class="row">
        <label>
          主屬性種類
          <select v-model="job.mainKey">
            <option v-for="(v, k) in mainStatLabel" :key="k" :value="k">
              {{ k }} ({{ v }})
            </option>
          </select>
        </label>
        <label>
          主屬性值
          <input type="number" v-model.number="stats.mainStat" min="0" />
        </label>
        <label>
          副屬性值
          <input type="number" v-model.number="stats.subStat" min="0" />
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>武器</h2>
      <div class="row">
        <label>
          攻擊力 / 魔力
          <input type="number" v-model.number="stats.attack" min="0" />
        </label>
        <label>
          武器常數
          <input type="number" v-model.number="stats.weaponConst" step="0.01" min="0" />
        </label>
        <label>
          熟練度 %
          <input type="number" v-model.number="stats.masteryPct" min="0" max="100" />
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>傷害加成</h2>
      <div class="row">
        <label>
          傷害 %
          <input type="number" v-model.number="stats.damagePct" min="0" />
        </label>
        <label>
          Boss 傷害 %
          <input type="number" v-model.number="stats.bossPct" min="0" />
        </label>
        <label>
          最終傷害 %
          <input type="number" v-model.number="stats.finalDamagePct" min="0" />
        </label>
        <label>
          屬性攻擊 %
          <input type="number" v-model.number="stats.elementPct" min="0" />
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>爆擊</h2>
      <div class="row">
        <label>
          爆擊機率 %
          <input type="number" v-model.number="stats.critRate" min="0" max="100" />
        </label>
        <label>
          爆擊傷害 %
          <input type="number" v-model.number="stats.critDamagePct" min="0" />
        </label>
      </div>
    </section>

    <section class="panel">
      <h2>防禦穿透</h2>
      <div class="row">
        <label>
          防禦穿透 (IED) %
          <input type="number" v-model.number="stats.iedPct" min="0" max="100" />
        </label>
        <label>
          怪物防禦 %
          <input type="number" v-model.number="stats.monsterDefPct" min="0" max="100" />
        </label>
      </div>
    </section>

    <section class="panel breakdown">
      <h2>倍率拆解</h2>
      <ul>
        <li v-for="item in breakdown" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </li>
      </ul>
    </section>

    <footer class="actions">
      <button type="button" @click="reset">重設</button>
      <p class="formula">
        CP = 有效主屬性 × 攻擊力 × 武器常數 × 熟練倍率 × (1 + 傷害%) × (1 + Boss%) ×
        爆擊期望 × (1 + 最終%) × 穿防倍率 × (1 + 屬性%)
      </p>
    </footer>
  </div>
</template>

<style scoped>
.calc {
  max-width: 960px;
  margin: 0 auto;
  padding: 1.5rem;
  color: #e9edf5;
}

.calc__header {
  text-align: center;
  margin-bottom: 1.5rem;
}
.calc__header h1 {
  margin: 0;
  font-size: 1.8rem;
  letter-spacing: 0.05em;
  background: linear-gradient(90deg, #ffb347, #ffcc33, #7ee8fa);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.subtitle {
  margin: 0.3rem 0 0;
  color: #9aa3b8;
  font-size: 0.9rem;
}

.cp-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
  border-radius: 14px;
  background: radial-gradient(circle at top, rgba(126, 232, 250, 0.15), transparent 70%),
    #1b2133;
  box-shadow: inset 0 0 0 1px rgba(255, 204, 51, 0.25);
}
.cp-label {
  color: #9aa3b8;
  font-size: 0.85rem;
  letter-spacing: 0.15em;
}
.cp-value {
  font-size: 2.6rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #ffcc33;
  text-shadow: 0 0 14px rgba(255, 204, 51, 0.35);
}

.panel {
  background: #181d2c;
  border: 1px solid #252b40;
  border-radius: 12px;
  padding: 1rem 1.2rem;
  margin-bottom: 1rem;
}
.panel h2 {
  margin: 0 0 0.75rem;
  font-size: 1rem;
  color: #7ee8fa;
  letter-spacing: 0.08em;
}

.row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
}
label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-size: 0.85rem;
  color: #c3c9db;
}
input, select {
  padding: 0.5rem 0.65rem;
  border-radius: 8px;
  border: 1px solid #2e3550;
  background: #0f1322;
  color: #e9edf5;
  font-size: 0.95rem;
  font-variant-numeric: tabular-nums;
  transition: border-color 120ms ease;
}
input:focus, select:focus {
  outline: none;
  border-color: #7ee8fa;
}

.breakdown ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.35rem 1rem;
}
.breakdown li {
  display: flex;
  justify-content: space-between;
  padding: 0.3rem 0;
  border-bottom: 1px dashed #252b40;
  font-size: 0.9rem;
}
.breakdown li strong {
  color: #ffcc33;
  font-variant-numeric: tabular-nums;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
  margin-top: 1rem;
}
button {
  padding: 0.55rem 1.4rem;
  border-radius: 999px;
  border: none;
  background: linear-gradient(90deg, #ffb347, #ffcc33);
  color: #1b2133;
  font-weight: 600;
  cursor: pointer;
}
button:hover {
  filter: brightness(1.05);
}
.formula {
  margin: 0;
  font-size: 0.78rem;
  color: #8089a3;
  text-align: center;
  line-height: 1.5;
}
</style>
