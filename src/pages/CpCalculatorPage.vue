<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipment } from '../composables/useEquipment.js'
import { useCharacter } from '../composables/useCharacter.js'
import { findPotentialOptionForLine } from '../constants/potentials.js'
import { findBonusPotentialOptionForLine } from '../constants/bonusPotentials.js'
import { ITEM_SETS, countActiveSet } from '../constants/itemSets.js'
import { BUFFS } from '../constants/buffs.js'
import { SKILLS } from '../constants/skills.js'
import { TITLES } from '../constants/titles.js'
import { activeSkillContributions } from '../composables/useLinkSkills.js'
import { useCollection } from '../composables/useCollection.js'
import { useLegion } from '../composables/useLegion.js'
import { LEGION_TIER_LABELS } from '../constants/legion.js'
import { usePuzzle } from '../composables/usePuzzle.js'
import { useHyperStat } from '../composables/useHyperStat.js'
import { useArcane } from '../composables/useArcane.js'
import { usePet } from '../composables/usePet.js'
import { useInnerPotential } from '../composables/useInnerPotential.js'
import { useVMatrix } from '../composables/useVMatrix.js'
import { useEvent } from '../composables/useEvent.js'
import { useCpToggles } from '../composables/useCpToggles.js'
import { charKey } from '../composables/useActiveCharacter.js'
import {
  weaponBonusTierIndex,
  jobCpReferenceWeapon,
  universalBowReference,
  referenceBonusAttAtTier,
} from '../constants/bonusStatsTiers.js'
import { computeStarStats } from '../constants/starForce.js'

const { t, te } = useI18n()

// 統一從技能/buff/title entry 取顯示文字:優先 i18n(nameKey / descriptionKey),
// 否則 fallback 到 entry.name。所有側欄與 tooltip 相關顯示都走這兩個 helper。
function displayName(entry) {
  if (!entry) return ''
  if (entry.nameKey && te(entry.nameKey)) return t(entry.nameKey)
  return entry.name || entry.id || ''
}
function displayDescription(entry) {
  if (entry?.descriptionKey && te(entry.descriptionKey)) return t(entry.descriptionKey)
  return ''
}
function tooltipText(entry) {
  const n = displayName(entry)
  const d = displayDescription(entry)
  return d ? `${n} — ${d}` : n
}
const {
  activeBuffs,
  activeSkillIds,
  activeTitleIds,
  toggleBuff,
  toggleSkill,
  toggleTitle,
  isBuffActive,
  isSkillActive,
  isTitleActive,
} = useCpToggles()
const { state: equipState, totalStats, resolveEntry } = useEquipment()
const { state: charState, primaryStat, currentJob } = useCharacter()
const {
  statContributions: collectionContribs,
  setBonusTotal: collectionSetBonus,
  state: collectionState,
} = useCollection()
const { statContributions: legionContribs } = useLegion()
const { statContributions: puzzleContribs } = usePuzzle()
const { statContributions: hyperStatContribs } = useHyperStat()
const { contributions: arcaneContribs } = useArcane()
const { statContributions: abilityContribs } = useInnerPotential()
const { statContributions: vmatrixContribs } = useVMatrix()
const { statContributions: eventContribs } = useEvent()
const {
  state: petState,
  countBonus: petCountBonus,
  equippedCount: petEquipCount,
  equipmentBonus: petEquipBonus,
} = usePet()

const page = ref(1)
const cpHelpOpen = ref(false)

// ── 比較欄 (snapshots) ───────────────────────────────
const COMPARE_KEY = charKey('cpCompare.v1')
const compareSnaps = ref(loadCompareSnaps())
function loadCompareSnaps() {
  try {
    const raw = localStorage.getItem(COMPARE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}
function saveCompareSnaps() {
  try { localStorage.setItem(COMPARE_KEY, JSON.stringify(compareSnaps.value)) } catch { /* ignore */ }
}
function saveSnapshot() {
  const info = attStatsInfo.value
  compareSnaps.value.unshift({
    id: Date.now(),
    timestamp: new Date().toISOString(),
    cp: combatPower.value,
    bossMax: info.bossMax,
    bossAvg: info.bossAvg,
    bossMin: info.bossMin,
  })
  saveCompareSnaps()
}
function removeSnapshot(id) {
  compareSnaps.value = compareSnaps.value.filter((s) => s.id !== id)
  saveCompareSnaps()
}
function clearSnapshots() {
  if (!compareSnaps.value.length) return
  if (!confirm(t('cp.compare.confirmClear'))) return
  compareSnaps.value = []
  saveCompareSnaps()
}
// 與當前數值差異百分比 (current vs snap)
function deltaPct(current, snap) {
  if (!snap) return 0
  return ((current - snap) / snap) * 100
}
function fmtDelta(d) {
  const sign = d > 0 ? '+' : ''
  return `${sign}${d.toFixed(2)}%`
}

function fmtSnapTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const visibleTitles = computed(() => {
  const jobKey = currentJob.value?.key || null
  return TITLES.filter((t) => !t.jobs || t.jobs.includes(jobKey))
})

// 側欄只列出「可切換」的共通技能 — 依 cp.role 判斷,不再依技能本體的 passive 欄位
const toggleableSkills = computed(() => SKILLS.filter((s) => s.cp?.role === 'toggle'))

// BUFF 側欄只顯示符合當前職業的 buff
const visibleBuffs = computed(() => {
  const jobKey = currentJob.value?.key || null
  return BUFFS.filter((b) => !b.jobs || b.jobs.includes(jobKey))
})

// 需要以「相乘疊加」合併的 % 屬性 (1 - Π(1 - Xᵢ/100))
const MULTIPLICATIVE_KEYS = new Set(['ignoreDef', 'damageTaken'])

// % 類 stat key 集合 (與 ItemTooltip 對齊)
const PCT_KEYS = new Set([
  'bossDmg', 'ignoreDef', 'allStatPct', 'dmgPct',
  'atkPct', 'matkPct', 'hpPct', 'mpPct',
  'strPct', 'dexPct', 'intPct', 'lukPct',
  // Link skill / 技能 / 聯盟 衍生的 % 屬性
  'critRate', 'critDmg', 'finalDmg', 'buffDuration',
  'damageTaken', 'elementalResist',
  'summonDuration', 'cooldownReduction',
  'normalMobDmg', 'abnormalMobDmg', 'bonusExp',
])

// 全裝備星數總和 (顯示在 Star Force 欄)
const totalStarForce = computed(() => {
  let s = 0
  for (const uid of Object.values(equipState.equipped)) {
    const e = resolveEntry(uid)
    if (e) s += e.stars || 0
  }
  return s
})

// 主屬性 base 值:Lv1 = 13,每升一級 +5;Lv60、Lv100 里程碑各額外 +5 (預設配在主屬)
function baseStatFor(key) {
  if (key !== primaryStat.value) return 4
  const lv = charState.level
  let val = (lv - 1) * 5 + 13
  if (lv >= 60) val += 5
  if (lv >= 100) val += 5
  return val
}
const baseStats = computed(() => ({
  str: baseStatFor('str'),
  dex: baseStatFor('dex'),
  int: baseStatFor('int'),
  luk: baseStatFor('luk'),
}))

// Stat 合計 (角色 base + 裝備合計)
const totals = computed(() => {
  const s = totalStats.value
  return {
    str: baseStats.value.str + (s.str || 0),
    dex: baseStats.value.dex + (s.dex || 0),
    int: baseStats.value.int + (s.int || 0),
    luk: baseStats.value.luk + (s.luk || 0),
    hp: (charState.level * 50 + 50) + (s.hp || 0),
    mp: (charState.level * 50 + 50) + (s.mp || 0),
    atk: s.atk || 0,
    matk: s.matk || 0,
    def: s.def || 0,
    bossDmg: s.bossDmg || 0,
    dmgPct: s.dmgPct || 0,
    allStatPct: s.allStatPct || 0,
  }
})

// 武器替換 + 差值 — Zone 2 ATT/MATK 以「職業 canonical」(法師=wand) 模板取代使用者武器
//   actualW    = 我方武器實際 ATT/MATK 貢獻(base + star + T 星火)
//   canonicalW = canonical 模板(同 stars/T)的 ATT/MATK
//   bowW       = 通用 Bow 模板(同 stars/T)的 ATK
//   weaponDelta = canonicalW − bowW       (顯示用,Z2×Z3 套用)
//   replacement = canonicalW − actualW    (Zone 2 加總:flatAtt + replacement)
//   面板實際傷害 / ATT STATS 不受影響(走 statTotal 直接讀)
function computeWeaponContribsForCp(attKey) {
  const weaponUid = equipState.equipped?.weapon
  if (!weaponUid) return null
  const entry = resolveEntry(weaponUid)
  const item = entry?.item
  if (!item || item.type !== 'weapon') return null
  const canonical = jobCpReferenceWeapon(charState.job, item.level)
  if (!canonical) return null
  const bow = universalBowReference(item.level)
  if (!bow) return null
  const stars = entry.stars || 0
  const bonusVal = Number(entry.bonusStats?.[attKey]) || 0
  const tierIdx = weaponBonusTierIndex(item, attKey, bonusVal)
  const actualBase = Number(item.stats?.[attKey]) || 0
  const actualStarBonus = Number(entry.starStats?.[attKey]) || 0
  const actualW = actualBase + actualStarBonus + bonusVal
  const fakeCanonical = {
    type: 'weapon', subType: canonical.subType, level: canonical.level,
    classes: [], stats: canonical.stats, attackSpeed: 4,
  }
  const canonicalStarBonus = Number(computeStarStats(fakeCanonical, stars)?.[canonical.attKey]) || 0
  const canonicalBonusVal = referenceBonusAttAtTier(canonical, tierIdx)
  const canonicalW = canonical.base + canonicalStarBonus + canonicalBonusVal
  const fakeBow = {
    type: 'weapon', subType: bow.subType, level: bow.level,
    classes: [], stats: bow.stats, attackSpeed: 4,
  }
  const bowStarBonus = Number(computeStarStats(fakeBow, stars)?.[bow.attKey]) || 0
  const bowBonusVal = referenceBonusAttAtTier(bow, tierIdx)
  const bowW = bow.base + bowStarBonus + bowBonusVal
  return {
    actualW,
    canonicalW,
    bowW,
    weaponDelta: canonicalW - bowW,
  }
}

// CP 公式 — 共 6 個乘區,Zone 6 暫以 1 替代:
//   Zone 1 : (4 × 主屬 + 副屬) / 100
//   Zone 2 : ATT (僅 flat,不吃 % 加成)
//   Zone 3 : 1 + 攻擊力 % / 100
//   Zone 4 : (135 + 爆擊傷害%) / 100
//   Zone 5 : (100 + Damage% + Boss Damage%) / 100
//   Zone 6 : 終傷乘區 (目前終傷僅 skill 來源,已排除;裝備來源未實作)  → 1
//
// 武器係數差值 — 在 Zone 2 × Zone 3 完成後扣除:
//   差值 = round(ATT × (1 + ATT%/100), 2dp) − floor((ATT − 69) × (1 + ATT%/100))
//   Z2Z3 = Zone 2 × Zone 3 − 差值
//   CP   = Zone 1 × Z2Z3 × Zone 4 × Zone 5 × Zone 6
//
// 來源排除規則:不計入 SKILL / BUFF / V Matrix / Link Skill 任何屬性
//   例外 (仍計入):寵物、Blessing of the Fairy、Empress's Blessing
const cpZones = computed(() => {
  const primaryKey = primaryStat.value
  const secondaryKey = SECONDARY_STAT[primaryKey] || 'dex'
  const primary = statTotalForCp(primaryKey)
  const secondary = statTotalForCp(secondaryKey)

  const meta = JOB_ATT_META[charState.job] || JOB_ATT_META.beginner
  const attKey = meta.usesMatk ? 'matk' : 'atk'

  const flatAtt = flatTotalForCp(attKey)
  const pctAtt = pctTotalForCp(attKey)
  const critDmg = statTotalForCp('critDmg')
  const dmgPct = statTotalForCp('dmgPct')
  const bossDmg = statTotalForCp('bossDmg')

  const attMul = 1 + pctAtt / 100
  // 武器替換 — Zone 2 用 canonical 模板取代實際武器
  const contribs = computeWeaponContribsForCp(attKey)
  const replacement = contribs ? (contribs.canonicalW - contribs.actualW) : 0
  const delta = contribs?.weaponDelta || 0
  const flatAttForCp = flatAtt + replacement
  const z2A = Math.round(flatAttForCp * attMul * 100) / 100
  const z2B = Math.floor((flatAttForCp - delta) * attMul)
  const z2Diff = z2A - z2B

  const z1 = (4 * primary + secondary) / 100
  const z2 = flatAttForCp
  const z3 = attMul
  const z4 = (135 + critDmg) / 100
  const z5 = (100 + dmgPct + bossDmg) / 100
  const z6 = 1
  const z2z3 = z2 * z3 - z2Diff

  return {
    z1, z2, z3, z4, z5, z6, z2z3,
    attKey,
    inputs: {
      primary, secondary, flatAtt, flatAttForCp, pctAtt, critDmg, dmgPct, bossDmg,
      z2A, z2B, z2Diff,
      weaponDelta: delta,
      actualW: contribs?.actualW || 0,
      canonicalW: contribs?.canonicalW || 0,
      bowW: contribs?.bowW || 0,
    },
    total: z1 * z2z3 * z4 * z5 * z6,
  }
})
const combatPower = computed(() => Math.floor(cpZones.value.total))

function fmtNum(n) {
  return Number(n || 0).toLocaleString('en-US')
}
function fmtStat(totalVal, base, added) {
  if (added <= 0) return fmtNum(totalVal)
  return `${fmtNum(totalVal)} (${fmtNum(base)}+${fmtNum(added)})`
}
function fmtCooldownReduction() {
  const sec = Math.abs(statTotal('cooldownReductionSec') || 0)
  const pct = Math.abs(statTotal('cooldownReduction') || 0)
  return `${sec}s / ${pct.toFixed(0)}%`
}
function fmtPct(n) {
  return `${Number(n || 0).toFixed(2)}%`
}

// ────────────────────────────────────────────────────────────────
// Stat 來源明細 — hover tooltip 顯示用
//
// 每個 statKey → { flat: [{label,value}], pct: [{label,value}] }
// flat  = 直接加在該 stat 上的絕對值
// pct   = 直接加在該 stat 上的百分比;主屬性另外會吸收 allStatPct
// ────────────────────────────────────────────────────────────────
// Combat Power 不計入「skill 來源」: SKILL / BUFF / V Matrix / Link Skill。
// 但下列 toggle 仍視為基礎 buff,計入 CP:
const CP_SKILL_ALLOWLIST = new Set([
  'blessing_of_the_fairy',
  'empress_blessing',
])

const breakdowns = computed(() => {
  const out = {}
  const ensure = (k) => (out[k] ||= { flat: [], pct: [] })
  const addFlat = (k, label, v, fixed = false, cpExclude = false) => {
    if (v) ensure(k).flat.push({ label, value: v, fixed, cpExclude })
  }
  const addPct = (k, label, v, cpExclude = false) => {
    if (v) ensure(k).pct.push({ label, value: v, cpExclude })
  }

  // 1) 角色 base
  const lv = charState.level
  const pKey = primaryStat.value
  const charLvLabel = t('cp.tip.characterLv', { lv })
  addFlat(pKey, charLvLabel, baseStats.value[pKey])
  for (const k of ['str', 'dex', 'int', 'luk']) {
    if (k !== pKey) addFlat(k, t('cp.tip.characterBase'), 4)
  }
  addFlat('hp', charLvLabel, lv * 50 + 50)
  addFlat('mp', charLvLabel, lv * 50 + 50)
  // 全職業內建 5% Critical Rate (保底值)
  addPct('critRate', t('cp.tip.characterBase'), 5)

  // 2) 每件已裝備的裝備 — 同一件裝備的 base / 星力 / 星火 / 潛能 / 附加潛能
  //    依 stat key 先在內部合計,最後只顯示一條「{裝備名稱} +N」的來源
  //
  // 潛能中「每 10 等」類的 stat (strPerLv10 / atkPerLv10 等) 會換算成對應主屬的
  // 固定值加成 (floor(角色等級/10) × 該值),合併入該件裝備的 flat 合計。
  const PER_LV10_MAP = {
    strPerLv10: 'str', dexPerLv10: 'dex', intPerLv10: 'int', lukPerLv10: 'luk',
    atkPerLv10: 'atk', matkPerLv10: 'matk',
  }
  const charLv10 = Math.floor((charState.level || 0) / 10)

  for (const [slotKey, uid] of Object.entries(equipState.equipped)) {
    const entry = resolveEntry(uid)
    if (!entry) continue
    const name = entry.item.name || slotKey

    const itemFlatBag = {}
    const itemPctBag = {}
    const accumulate = (k, v) => {
      if (!v) return
      // 每 10 等類 → 按當前等級展開為固定值,併入對應主屬的 flat bag
      if (PER_LV10_MAP[k]) {
        const baseKey = PER_LV10_MAP[k]
        const total = v * charLv10
        if (!total) return
        itemFlatBag[baseKey] = (itemFlatBag[baseKey] || 0) + total
        return
      }
      if (PCT_KEYS.has(k)) {
        if (MULTIPLICATIVE_KEYS.has(k)) {
          // 單件裝備內多個來源 → 套用相乘疊加,合併為一個代表值
          //   combined = 1 - (1 - a/100)(1 - b/100)
          const prev = itemPctBag[k] || 0
          const merged = 1 - (1 - Math.abs(prev) / 100) * (1 - Math.abs(v) / 100)
          const val = Math.round(merged * 10000) / 100 // 2 位小數 %
          itemPctBag[k] = k === 'damageTaken' && (prev < 0 || v < 0) ? -val : val
        } else {
          itemPctBag[k] = (itemPctBag[k] || 0) + v
        }
      } else {
        itemFlatBag[k] = (itemFlatBag[k] || 0) + v
      }
    }

    for (const [k, v] of Object.entries(entry.item.stats || {})) accumulate(k, v)
    for (const [k, v] of Object.entries(entry.starStats || {})) accumulate(k, v)
    for (const [k, v] of Object.entries(entry.bonusStats || {})) accumulate(k, v)

    const potSources = [
      { data: entry.potential,       find: findPotentialOptionForLine },
      { data: entry.bonusPotential,  find: findBonusPotentialOptionForLine },
    ]
    for (const { data, find } of potSources) {
      if (!data) continue
      for (let i = 0; i < 3; i++) {
        const line = data.lines?.[i]
        if (!line) continue
        const opt = find(entry.item, data.tier, i, line)
        if (!opt?.stats) continue
        for (const [k, v] of Object.entries(opt.stats)) accumulate(k, v)
      }
    }

    for (const [k, v] of Object.entries(itemFlatBag)) addFlat(k, name, v)
    for (const [k, v] of Object.entries(itemPctBag)) addPct(k, name, v)
  }

  // 3) Buff (啟用中)
  let skillLevelBonus = 0
  for (const b of BUFFS) {
    if (activeBuffs.value.has(b.id)) skillLevelBonus += b.skillLevelBonus || 0
  }
  const primary = primaryStat.value
  const ctx = {
    charState,
    baseStats: baseStats.value,
    primary,
    effectiveLevel: 0,
    t,
  }
  for (const buff of BUFFS) {
    if (!activeBuffs.value.has(buff.id)) continue
    if (buff.jobs && !buff.jobs.includes(currentJob.value?.key)) continue
    const cpExc = !CP_SKILL_ALLOWLIST.has(buff.id)
    const buffLabel = t('cp.tip.buffPrefix', { name: displayName(buff) })
    // 靜態 stats
    for (const [k, v] of Object.entries(buff.stats || {})) {
      if (PCT_KEYS.has(k)) addPct(k, buffLabel, v, cpExc)
      else addFlat(k, buffLabel, v, false, cpExc)
    }
    // 動態 contribute (依技能等級)
    if (typeof buff.contribute === 'function') {
      ctx.effectiveLevel = (buff.baseLevel || 0) + skillLevelBonus
      const contribs = buff.contribute(ctx) || []
      for (const c of contribs) {
        if (c.isPct) addPct(c.key, c.label, c.value, cpExc)
        else addFlat(c.key, c.label, c.value, false, cpExc)
      }
    }
  }

  // 3-set) 裝備套裝 — 同一套裝所有已觸發階層的屬性合計為「一條來源」,避免多階重複列
  // countActiveSet 會處理「幸運道具」規則:持有 luckyItem 且本套裝已達 ≥3 件 → 再 +1
  const equippedItems = []
  for (const uid of Object.values(equipState.equipped)) {
    const ent = resolveEntry(uid)
    if (ent?.item?.id) equippedItems.push(ent.item)
  }
  for (const set of ITEM_SETS) {
    const count = countActiveSet(set, equippedItems)
    if (!count) continue
    // 累加該套裝所有已觸發 tier 的 stats
    const setBag = {}
    for (const tier of set.tiers) {
      if (count < tier.count) break
      for (const [k, v] of Object.entries(tier.stats || {})) {
        setBag[k] = (setBag[k] || 0) + v
      }
    }
    if (!Object.keys(setBag).length) continue
    const label = t('cp.tip.setPrefix', { name: t(set.nameKey) })
    for (const [k, v] of Object.entries(setBag)) {
      if (PCT_KEYS.has(k)) addPct(k, label, v)
      else addFlat(k, label, v)
    }
  }

  // 3-title) 稱號 (Title) — 啟用中的每個稱號累加其 stats
  for (const title of TITLES) {
    if (!activeTitleIds.value.has(title.id)) continue
    if (title.jobs && !title.jobs.includes(currentJob.value?.key)) continue
    const label = t('cp.tip.titlePrefix', { name: displayName(title) })
    for (const [k, v] of Object.entries(title.stats || {})) {
      if (PCT_KEYS.has(k)) addPct(k, label, v)
      else addFlat(k, label, v)
    }
  }

  // 3b) 技能 — 兩條路:
  //   (a) 玩家在側欄開啟的共通技能 (stats)
  //   (b) 被動職業技能 passive:true — 依職業 + 條件自動生效
  const myJobKey = currentJob.value?.key || null
  const weaponUid = equipState.equipped.weapon
  const weaponEntry = weaponUid ? resolveEntry(weaponUid) : null
  const skillCtx = {
    jobKey: myJobKey,
    weaponSubType: weaponEntry?.item?.subType || null,
    characterLevel: charState.level,
    skillLevelBonus, // Combat Orders 等會影響被動技能等級
  }
  for (const skill of SKILLS) {
    const role = skill.cp?.role
    let bag = null
    if (role === 'passive') {
      if (skill.jobs && !skill.jobs.includes(myJobKey)) continue
      bag = typeof skill.contribute === 'function'
        ? skill.contribute(skillCtx)
        : skill.stats
    } else if (role === 'toggle') {
      if (!activeSkillIds.value.has(skill.id)) continue
      bag = skill.stats
    } else {
      continue // 沒 CP 角色
    }
    if (!bag) continue
    const cpExc = !CP_SKILL_ALLOWLIST.has(skill.id)
    const skillLabel = t('cp.tip.skillPrefix', { name: displayName(skill) })
    for (const [k, v] of Object.entries(bag)) {
      if (PCT_KEYS.has(k)) addPct(k, skillLabel, v, cpExc)
      else addFlat(k, skillLabel, v, false, cpExc)
    }
  }

  // 3c) NFT 圖鑑
  for (const contrib of collectionContribs.value) {
    const addFn = PCT_KEYS.has(contrib.stat.key) ? addPct : addFlat
    const label = t('cp.tip.collectionPrefix', { name: t(contrib.stat.labelKey), lv: contrib.level })
    addFn(contrib.stat.key, label, contrib.value)
  }
  // 圖鑑套裝效果 — 每套 +5 全屬性 (flat,吃 % 加成)
  if (collectionSetBonus.value) {
    const label = t('cp.tip.collectionSetPrefix', { n: collectionState.setCount || 0 })
    addFlat('str', label, collectionSetBonus.value)
    addFlat('dex', label, collectionSetBonus.value)
    addFlat('int', label, collectionSetBonus.value)
    addFlat('luk', label, collectionSetBonus.value)
  }

  // 3d-) 聯盟拼圖屬性 (吃 % 加成,無 fixed)
  for (const pc of puzzleContribs.value) {
    const entryName = t(pc.entry.labelKey)
    const label = t('cp.tip.puzzlePrefix', { name: entryName, lv: pc.level })
    for (const [k, v] of Object.entries(pc.stats)) {
      const addFn = PCT_KEYS.has(k) ? addPct : addFlat
      addFn(k, label, v)
    }
  }

  // 3e) Hyper Stat (STR/DEX/INT/LUK 為 fixed,不吃 % 加成)
  for (const hc of hyperStatContribs.value) {
    const statName = t(hc.stat.labelKey)
    const label = t('cp.tip.hyperPrefix', { name: statName, lv: hc.level })
    for (const [k, v] of Object.entries(hc.stats)) {
      if (PCT_KEYS.has(k)) addPct(k, label, v)
      else addFlat(k, label, v, !!hc.fixed)
    }
  }

  // 3e-pet) 寵物 — Multi Pet 隻數加成 + 寵物裝備加成 (ATT / Magic ATT flat,吃 % 加成)
  if (petCountBonus.value) {
    const label = t('cp.tip.petCountPrefix', { n: petState.count })
    addFlat('atk', label, petCountBonus.value)
    addFlat('matk', label, petCountBonus.value)
  }
  if (petEquipBonus.value) {
    const label = t('cp.tip.petEquipPrefix', { n: petEquipCount.value })
    addFlat('atk', label, petEquipBonus.value)
    addFlat('matk', label, petEquipBonus.value)
  }

  // 3e-arc) 秘法符文 — 主屬性為 fixed flat (不吃 % 加成),每個符文單獨列出一條來源
  const primaryKey = currentJob.value?.primary || 'str'
  for (const ac of arcaneContribs.value) {
    if (!ac.level || !ac.mainStat) continue
    const symbolName = t(ac.nameKey)
    const label = t('cp.tip.arcanePrefix', { name: symbolName, lv: ac.level })
    addFlat(primaryKey, label, ac.mainStat, true)
  }

  // 3e-ability) 內潛 — STR/DEX/INT/LUK/全屬性 為 fixed flat,其他依 PCT_KEYS 判斷
  for (const ab of abilityContribs.value) {
    const optName = t(ab.nameKey)
    const label = t('cp.tip.abilityPrefix', { n: ab.line, name: optName })
    for (const [k, v] of Object.entries(ab.stats)) {
      if (k === 'allStat') {
        // 全屬性 → 同時加到 STR/DEX/INT/LUK,固定來源
        addFlat('str', label, v, true)
        addFlat('dex', label, v, true)
        addFlat('int', label, v, true)
        addFlat('luk', label, v, true)
      } else if (PCT_KEYS.has(k)) {
        addPct(k, label, v)
      } else {
        addFlat(k, label, v, !!ab.fixed)
      }
    }
  }

  // 3e-vmatrix) V 矩陣被動 — 全屬 / ATT・MATK 皆吃 % 加成 (非 fixed),不計入 CP
  for (const vm of vmatrixContribs.value) {
    const skillName = t(vm.nameKey)
    const label = t('cp.tip.vmatrixPrefix', { name: skillName, lv: vm.level })
    for (const [k, v] of Object.entries(vm.stats)) {
      if (k === 'allStat') {
        addFlat('str', label, v, !!vm.fixed, true)
        addFlat('dex', label, v, !!vm.fixed, true)
        addFlat('int', label, v, !!vm.fixed, true)
        addFlat('luk', label, v, !!vm.fixed, true)
      } else if (PCT_KEYS.has(k)) {
        addPct(k, label, v, true)
      } else {
        addFlat(k, label, v, !!vm.fixed, true)
      }
    }
  }

  // 3e-event) 活動 EVENT — 同技能多 stat 一條來源,非 fixed (吃 % 加成)
  for (const ec of eventContribs.value) {
    const skillName = t(ec.skill.labelKey)
    const label = t('cp.tip.eventPrefix', { name: skillName, lv: ec.level })
    for (const [k, v] of Object.entries(ec.stats)) {
      if (PCT_KEYS.has(k)) addPct(k, label, v)
      else addFlat(k, label, v)
    }
  }

  // 3d) 聯盟戰地成員
  for (const lc of legionContribs.value) {
    if (lc.specialEffect) continue // 條件型效果 (Aran / Evan) 不進統計
    const memberName = t(`character.jobs.${lc.member.jobKey}`)
    const tierLabel = LEGION_TIER_LABELS[lc.tier] || lc.tier
    const label = t('cp.tip.legionPrefix', { name: memberName, tier: tierLabel })
    for (const [k, v] of Object.entries(lc.stats)) {
      if (PCT_KEYS.has(k)) {
        addPct(k, label, v)
      } else {
        // STR/DEX/INT/LUK 等 fixed flag → 不吃 % 加成
        addFlat(k, label, v, !!lc.fixed)
      }
    }
  }

  // 4) Link Skills (套用中的連結技能 — 僅非 specialEffect 會貢獻數值)
  const linkContribs = activeSkillContributions(
    currentJob.value?.key || null,
    currentJob.value?.linkSkill || null,
  )
  for (const contrib of linkContribs) {
    const skillName = contrib.skill.nameKey ? t(contrib.skill.nameKey) : contrib.skill.id
    const label = `Link: ${skillName} Lv.${contrib.level}`
    for (const [k, v] of Object.entries(contrib.stats)) {
      // Link Skill 為 skill 來源,不計入 CP
      if (PCT_KEYS.has(k)) addPct(k, label, v, true)
      else addFlat(k, label, v, false, true)
    }
  }
  return out
})

// 取得某 stat 的展示資料 (含 final 計算)
// 主屬性會把 allStatPct 與 xxxPct 一起納入百分比列表
function breakdownFor(key) {
  const b = breakdowns.value[key] || { flat: [], pct: [] }
  const flat = [...b.flat]
  const pct = [...b.pct]

  // 主屬性額外納入 (str|dex|int|luk)Pct 與 allStatPct 兩池
  //   來自同一件裝備 (label 相同) 的 % 會合併為一條,避免像 "INT +6%" + "全屬 +3%" 分開顯示
  if (['str', 'dex', 'int', 'luk'].includes(key)) {
    const extras = breakdowns.value[`${key}Pct`]?.pct || []
    const all = breakdowns.value.allStatPct?.pct || []
    const byLabel = new Map()
    for (const s of [...extras, ...all]) {
      byLabel.set(s.label, (byLabel.get(s.label) || 0) + s.value)
    }
    for (const [label, value] of byLabel) pct.push({ label, value })
    const allFlat = breakdowns.value.allStat?.flat || []
    flat.push(...allFlat)
  }
  if (key === 'atk') pct.push(...(breakdowns.value.atkPct?.pct || []))
  if (key === 'matk') pct.push(...(breakdowns.value.matkPct?.pct || []))

  const flatTotal = flat.reduce((s, x) => s + x.value, 0)
  const pctTotal = pct.reduce((s, x) => s + x.value, 0)
  // 固定來源 (聯盟四大主屬等) 不吃 % 加成,分開累加於後
  const fixedFlatTotal = flat.reduce((s, x) => s + (x.fixed ? x.value : 0), 0)
  const normalFlatTotal = flatTotal - fixedFlatTotal

  // 無視防禦 / 受到傷害減免 採相乘疊加:
  //   Total = 1 - Π(1 - Xᵢ/100)
  // (MapleStory 正式公式,多來源不是單純相加)
  // 範例:30% + 40% 實際 = 58%,而非 70%
  let final
  const isMultiplicative = MULTIPLICATIVE_KEYS.has(key)
  if (isMultiplicative) {
    let survival = 1
    for (const s of pct) {
      survival *= (1 - Math.abs(s.value) / 100)
    }
    for (const s of flat) {
      survival *= (1 - Math.abs(s.value) / 100)
    }
    const base = (1 - survival) * 100
    final = key === 'damageTaken' ? -base : base
  } else if (PCT_KEYS.has(key)) {
    final = pctTotal + flatTotal
  } else {
    // 非 % stat:normal 部分吃 %,fixed 部分直接加
    final = Math.floor(normalFlatTotal * (1 + pctTotal / 100)) + fixedFlatTotal
  }

  const fixedSources = flat.filter((x) => x.fixed)
  const normalSources = flat.filter((x) => !x.fixed)

  return {
    flat: normalSources,
    fixedSources,
    pct,
    flatTotal: normalFlatTotal,
    fixedFlatTotal,
    pctTotal,
    final,
    isPct: PCT_KEYS.has(key),
    isMultiplicative,
  }
}

// ────────────────────────────────────────────────────────────────
// Hover tooltip 狀態 + 邊緣翻轉,避免超出可視範圍
// ────────────────────────────────────────────────────────────────
const hovered = ref(null) // { key, label } | null
const tipX = ref(0)
const tipY = ref(0)
const tipStyle = ref({ left: '0px', top: '0px', visibility: 'hidden' })
const tipRef = ref(null)

const TIP_MARGIN = 16
const VIEWPORT_PAD = 6

function clampTipPosition() {
  const el = tipRef.value
  if (!el) return
  const w = el.offsetWidth || 0
  const h = el.offsetHeight || 0
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cx = tipX.value
  const cy = tipY.value

  // 預設右下;右/下不夠就翻到對邊;仍超出則緊貼邊緣
  let left = cx + TIP_MARGIN
  let top = cy + TIP_MARGIN
  if (left + w > vw - VIEWPORT_PAD) left = cx - TIP_MARGIN - w
  if (left < VIEWPORT_PAD) left = Math.max(VIEWPORT_PAD, vw - VIEWPORT_PAD - w)
  if (left < VIEWPORT_PAD) left = VIEWPORT_PAD
  if (top + h > vh - VIEWPORT_PAD) top = cy - TIP_MARGIN - h
  if (top < VIEWPORT_PAD) top = VIEWPORT_PAD
  tipStyle.value = { left: `${left}px`, top: `${top}px`, visibility: 'visible' }
}

function onEnter(key, label, e) {
  hovered.value = { key, label }
  tipX.value = e.clientX
  tipY.value = e.clientY
  // 先藏起、下一個 tick 量測後定位
  tipStyle.value = { left: '0px', top: '0px', visibility: 'hidden' }
  nextTick(clampTipPosition)
}

// 每欄最多顯示的來源列數 — 超過會自動切成多欄
// 基本數值 (flat) 容量較大 → 15 / 欄;Fixed / % Sources 用較小的 10 / 欄
const SOURCES_PER_COLUMN_DEFAULT = 10
const SOURCES_PER_COLUMN_FLAT = 15
const SOURCES_MAX_COLUMNS = 4
const SOURCES_COL_WIDTH = 240 // px
const SOURCES_COL_GAP = 14    // px
function sourcesStyle(count, perColumn = SOURCES_PER_COLUMN_DEFAULT) {
  if (!count) return null
  const cols = Math.min(
    SOURCES_MAX_COLUMNS,
    Math.max(1, Math.ceil(count / perColumn)),
  )
  const style = { columnCount: cols }
  if (cols > 1) {
    style.minWidth = `${cols * SOURCES_COL_WIDTH + (cols - 1) * SOURCES_COL_GAP}px`
  }
  return style
}
function onMove(e) {
  if (!hovered.value) return
  tipX.value = e.clientX
  tipY.value = e.clientY
  clampTipPosition()
}
function onLeave() { hovered.value = null }

const hoveredBreakdown = computed(() =>
  hovered.value ? breakdownFor(hovered.value.key) : null,
)

// 顯示用 final 值 (套用 % 後的總和)
function statTotal(key) { return breakdownFor(key).final }

// CP 專用:flat 合計 (排除 cpExclude)
function flatTotalForCp(key) {
  const b = breakdowns.value[key] || { flat: [], pct: [] }
  return b.flat.filter((x) => !x.cpExclude).reduce((s, x) => s + x.value, 0)
}

// CP 專用:% 合計 (排除 cpExclude;atk/matk 會吸收 atkPct/matkPct 子池)
function pctTotalForCp(key) {
  const b = breakdowns.value[key] || { flat: [], pct: [] }
  let pct = b.pct.filter((x) => !x.cpExclude).reduce((s, x) => s + x.value, 0)
  if (key === 'atk') {
    pct += (breakdowns.value.atkPct?.pct || [])
      .filter((x) => !x.cpExclude).reduce((s, x) => s + x.value, 0)
  }
  if (key === 'matk') {
    pct += (breakdowns.value.matkPct?.pct || [])
      .filter((x) => !x.cpExclude).reduce((s, x) => s + x.value, 0)
  }
  return pct
}

// CP 專用:filter 掉 cpExclude 的來源,重新計算 final
function statTotalForCp(key) {
  const b = breakdowns.value[key] || { flat: [], pct: [] }
  const flat = b.flat.filter((x) => !x.cpExclude)
  const pct = b.pct.filter((x) => !x.cpExclude)
  // 主屬性吸收 (str|dex|int|luk)Pct + allStatPct + allStat flat (與 breakdownFor 邏輯一致)
  if (['str', 'dex', 'int', 'luk'].includes(key)) {
    const extras = (breakdowns.value[`${key}Pct`]?.pct || []).filter((x) => !x.cpExclude)
    const all = (breakdowns.value.allStatPct?.pct || []).filter((x) => !x.cpExclude)
    pct.push(...extras, ...all)
    const allFlat = (breakdowns.value.allStat?.flat || []).filter((x) => !x.cpExclude)
    flat.push(...allFlat)
  }
  if (key === 'atk') pct.push(...(breakdowns.value.atkPct?.pct || []).filter((x) => !x.cpExclude))
  if (key === 'matk') pct.push(...(breakdowns.value.matkPct?.pct || []).filter((x) => !x.cpExclude))

  const flatTotal = flat.reduce((s, x) => s + x.value, 0)
  const pctTotal = pct.reduce((s, x) => s + x.value, 0)
  const fixedFlatTotal = flat.reduce((s, x) => s + (x.fixed ? x.value : 0), 0)
  const normalFlatTotal = flatTotal - fixedFlatTotal
  if (PCT_KEYS.has(key)) return pctTotal + flatTotal
  return Math.floor(normalFlatTotal * (1 + pctTotal / 100)) + fixedFlatTotal
}

// ────────────────────────────────────────────────────────────────
// ATT STATS 專用資訊 (職業 → 武器 / 武器常數 / 熟練度)
// ────────────────────────────────────────────────────────────────
// 基礎熟練度皆為 95%;Combat Orders 開啟時 +1% → 96%
const JOB_ATT_META = {
  beginner:   { weapons: ['Sword', 'Axe', 'Blunt'], weaponConst: 1.20, mastery: 50, usesMatk: false },
  hero:       { weapons: ['Sword', 'Axe'],           weaponConst: 1.34, mastery: 95, usesMatk: false },
  paladin:    { weapons: ['Sword', 'Blunt'],         weaponConst: 1.34, mastery: 95, usesMatk: false },
  darkKnight: { weapons: ['Spear', 'Polearm'],       weaponConst: 1.49, mastery: 95, usesMatk: false },
  archmageFP: { weapons: ['Wand', 'Staff'],          weaponConst: 1.20, mastery: 95, usesMatk: true },
  archmageIL: { weapons: ['Wand', 'Staff'],          weaponConst: 1.20, mastery: 95, usesMatk: true },
  bishop:     { weapons: ['Wand', 'Staff'],          weaponConst: 1.20, mastery: 95, usesMatk: true },
  bowmaster:  { weapons: ['Bow'],                    weaponConst: 1.30, mastery: 95, usesMatk: false },
  marksman:   { weapons: ['Crossbow'],               weaponConst: 1.30, mastery: 95, usesMatk: false },
  pathfinder: { weapons: ['Crossbow'],               weaponConst: 1.30, mastery: 95, usesMatk: false },
  nightlord:  { weapons: ['Claw'],                   weaponConst: 1.75, mastery: 95, usesMatk: false },
  shadower:   { weapons: ['Dagger'],                 weaponConst: 1.30, mastery: 95, usesMatk: false },
  dualblade:  { weapons: ['Dagger', 'Katara'],       weaponConst: 1.25, mastery: 95, usesMatk: false },
  buccaneer:  { weapons: ['Knuckle'],                weaponConst: 1.70, mastery: 95, usesMatk: false },
  corsair:    { weapons: ['Gun'],                    weaponConst: 1.50, mastery: 95, usesMatk: false },
  cannoneer:  { weapons: ['Hand Cannon'],            weaponConst: 1.49, mastery: 95, usesMatk: false },
  dawnwarrior:     { weapons: ['Two-Handed Sword'],   weaponConst: 1.34, mastery: 95, usesMatk: false },
  blazewizard:     { weapons: ['Wand', 'Staff'],      weaponConst: 1.20, mastery: 95, usesMatk: true },
  windarcher:      { weapons: ['Bow'],                weaponConst: 1.30, mastery: 95, usesMatk: false },
  nightwalker:     { weapons: ['Claw'],               weaponConst: 1.75, mastery: 95, usesMatk: false },
  thunderbreaker:  { weapons: ['Knuckle'],            weaponConst: 1.70, mastery: 95, usesMatk: false },
  mihile:          { weapons: ['One-Handed Sword'],   weaponConst: 1.34, mastery: 95, usesMatk: false },
  aran:            { weapons: ['Polearm'],            weaponConst: 1.49, mastery: 95, usesMatk: false },
  evan:            { weapons: ['Wand', 'Staff'],      weaponConst: 1.20, mastery: 95, usesMatk: true },
  mercedes:        { weapons: ['Dual Bowgun'],        weaponConst: 1.35, mastery: 95, usesMatk: false },
  phantom:         { weapons: ['Cane'],               weaponConst: 1.34, mastery: 95, usesMatk: false },
  luminous:        { weapons: ['Shining Rod'],        weaponConst: 1.20, mastery: 95, usesMatk: true },
  shade:           { weapons: ['Knuckle'],            weaponConst: 1.70, mastery: 95, usesMatk: false },
  ark:             { weapons: ['Knuckle'],            weaponConst: 1.70, mastery: 95, usesMatk: false },
}

// 主屬 → 副屬 對照 (用於傷害公式)
const SECONDARY_STAT = { str: 'dex', dex: 'str', int: 'luk', luk: 'dex' }

const attStatsInfo = computed(() => {
  const meta = JOB_ATT_META[charState.job] || JOB_ATT_META.beginner
  const primary = primaryStat.value
  const secondary = SECONDARY_STAT[primary] || 'dex'
  const primaryVal = statTotal(primary)
  const secondaryVal = statTotal(secondary)
  const attVal = meta.usesMatk ? statTotal('matk') : statTotal('atk')
  const dmgPct = statTotal('dmgPct')
  const bossDmg = statTotal('bossDmg')
  const normalMobDmg = statTotal('normalMobDmg')
  const finalDmg = statTotal('finalDmg')

  // 顯示用的熟練度 (僅供 tooltip,**不再進入傷害公式**)
  let mastery = meta.mastery
  for (const buff of BUFFS) {
    if (activeBuffs.value.has(buff.id)) mastery += buff.mastery || 0
  }

  // 傷害公式:
  //   base   = (主屬 × 4 + 副屬) × ATT/100 × 武器常數
  //   fm     = 1 + Final Damage% / 100        ← 獨立乘區
  //   basic  = base × (1 + Damage% / 100)                                × fm
  //   normal = base × (1 + (Damage% + Normal Mob Damage%) / 100)         × fm
  //   boss   = base × (1 + (Damage% + Boss Damage%) / 100)               × fm
  // (一般 / 首領 與 Damage% 為**相加**;Final Damage 為獨立乘區,**相乘**)
  const statFactor = primaryVal * 4 + secondaryVal
  const base = statFactor * (attVal / 100) * meta.weaponConst
  const fm = 1 + finalDmg / 100
  const basic = base * (1 + dmgPct / 100) * fm
  const normal = base * (1 + (dmgPct + normalMobDmg) / 100) * fm
  const boss = base * (1 + (dmgPct + bossDmg) / 100) * fm

  // 實際傷害 (boss) — 套用爆擊傷害區間 + 熟練度 (僅 min)
  //   crit_max = (1.50 + 爆擊傷害% / 100)
  //   crit_min = (1.20 + 爆擊傷害% / 100) × 熟練度/100
  //   max = boss × crit_max
  //   min = boss × crit_min
  //   avg = (max + min) / 2
  // 首領屬性耐性不在此處套用,改由戰鬥模擬器依怪物屬性耐性設定計算
  const critDmg = statTotal('critDmg')
  const bossMax = boss * (1.5 + critDmg / 100)
  const bossMin = boss * (1.2 + critDmg / 100) * (mastery / 100)
  const bossAvg = (bossMax + bossMin) / 2

  return {
    weapons: meta.weapons,
    weaponConst: meta.weaponConst,
    mastery,
    usesMatk: meta.usesMatk,
    basic: Math.round(basic),
    normal: Math.round(normal),
    boss: Math.round(boss),
    bossMax: Math.round(bossMax),
    bossMin: Math.round(bossMin),
    bossAvg: Math.round(bossAvg),
    critDmg,
  }
})


function fmtSourceValue(v, isPctRow) {
  if (isPctRow) return `+${Number(v).toFixed(2)}%`
  return `+${fmtNum(v)}`
}

// 事件委派:由 panel 處理 hover,找到最近帶 data-stat 的元素
function onPanelOver(e) {
  const el = e.target.closest?.('[data-stat]')
  if (!el) return
  onEnter(el.dataset.stat, el.dataset.label || el.dataset.stat.toUpperCase(), e)
}
function onPanelOut(e) {
  const el = e.target.closest?.('[data-stat]')
  if (!el) return
  const to = e.relatedTarget
  if (to && to.closest?.('[data-stat]') === el) return
  onLeave()
}
</script>

<template>
  <section class="cp-page">
    <!-- 比較欄 (左側) — 儲存當前實際傷害快照,可累積多個 -->
    <aside class="cp-compare">
      <header class="cp-compare__head">
        <span>{{ t('cp.compare.title') }}</span>
        <button
          v-if="compareSnaps.length"
          class="cp-compare__clear"
          type="button"
          @click="clearSnapshots"
        >{{ t('cp.compare.clear') }}</button>
      </header>
      <div v-if="!compareSnaps.length" class="cp-compare__empty">
        {{ t('cp.compare.empty') }}
      </div>
      <ul v-else class="cp-compare__list">
        <li v-for="snap in compareSnaps" :key="snap.id" class="cp-compare__row">
          <div class="cp-compare__row-head">
            <span class="cp-compare__time">{{ fmtSnapTime(snap.timestamp) }}</span>
            <button
              class="cp-compare__remove"
              type="button"
              :aria-label="t('cp.compare.remove')"
              @click="removeSnapshot(snap.id)"
            >×</button>
          </div>
          <div class="cp-compare__values">
            <div v-if="snap.cp != null" class="cp-compare__line">
              <span class="cp-compare__label">{{ t('cp.attStats.cp') }}</span>
              <span class="cp-compare__val">{{ fmtNum(snap.cp) }}</span>
              <span
                class="cp-compare__delta"
                :class="{ 'cp-compare__delta--up': deltaPct(combatPower, snap.cp) > 0, 'cp-compare__delta--down': deltaPct(combatPower, snap.cp) < 0 }"
              >{{ fmtDelta(deltaPct(combatPower, snap.cp)) }}</span>
            </div>
            <div class="cp-compare__line">
              <span class="cp-compare__label">{{ t('cp.attStats.bossMax') }}</span>
              <span class="cp-compare__val">{{ fmtNum(snap.bossMax) }}</span>
              <span
                class="cp-compare__delta"
                :class="{ 'cp-compare__delta--up': deltaPct(attStatsInfo.bossMax, snap.bossMax) > 0, 'cp-compare__delta--down': deltaPct(attStatsInfo.bossMax, snap.bossMax) < 0 }"
              >{{ fmtDelta(deltaPct(attStatsInfo.bossMax, snap.bossMax)) }}</span>
            </div>
            <div class="cp-compare__line">
              <span class="cp-compare__label">{{ t('cp.attStats.bossAvg') }}</span>
              <span class="cp-compare__val">{{ fmtNum(snap.bossAvg) }}</span>
              <span
                class="cp-compare__delta"
                :class="{ 'cp-compare__delta--up': deltaPct(attStatsInfo.bossAvg, snap.bossAvg) > 0, 'cp-compare__delta--down': deltaPct(attStatsInfo.bossAvg, snap.bossAvg) < 0 }"
              >{{ fmtDelta(deltaPct(attStatsInfo.bossAvg, snap.bossAvg)) }}</span>
            </div>
            <div class="cp-compare__line">
              <span class="cp-compare__label">{{ t('cp.attStats.bossMin') }}</span>
              <span class="cp-compare__val">{{ fmtNum(snap.bossMin) }}</span>
              <span
                class="cp-compare__delta"
                :class="{ 'cp-compare__delta--up': deltaPct(attStatsInfo.bossMin, snap.bossMin) > 0, 'cp-compare__delta--down': deltaPct(attStatsInfo.bossMin, snap.bossMin) < 0 }"
              >{{ fmtDelta(deltaPct(attStatsInfo.bossMin, snap.bossMin)) }}</span>
            </div>
          </div>
        </li>
      </ul>
    </aside>

    <div
      class="panel"
      @mouseover="onPanelOver"
      @mouseout="onPanelOut"
      @mousemove="onMove"
    >
      <!-- 標題 -->
      <header class="panel__head">
        <span>STAT</span>
      </header>

      <!-- Combat Power 橫幅 -->
      <div class="cp-banner">
        <span class="cp-banner__label">COMBAT POWER</span>
        <span class="cp-banner__value">{{ fmtNum(combatPower) }}</span>
        <button
          class="cp-banner__save"
          type="button"
          :title="t('cp.compare.save')"
          @click="saveSnapshot"
        >{{ t('cp.compare.save') }}</button>
        <button
          class="cp-banner__help"
          type="button"
          aria-label="CP zone breakdown"
          @click="cpHelpOpen = !cpHelpOpen"
        >?</button>

        <div v-if="cpHelpOpen" class="cp-zones" @click.stop>
          <div class="cp-zones__head">
            <span>CP Zone Breakdown</span>
            <button class="cp-zones__close" type="button" @click="cpHelpOpen = false">×</button>
          </div>
          <ul class="cp-zones__list">
            <li class="cp-zones__row">
              <span class="cp-zones__label">Zone 1</span>
              <span class="cp-zones__formula">(4 × {{ fmtNum(cpZones.inputs.primary) }} + {{ fmtNum(cpZones.inputs.secondary) }}) / 100</span>
              <span class="cp-zones__val">{{ cpZones.z1.toFixed(2) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">Zone 2</span>
              <span class="cp-zones__formula">{{ cpZones.attKey.toUpperCase() }} {{ fmtNum(cpZones.inputs.flatAttForCp) }}({{ cpZones.attKey.toUpperCase() }} 完整 {{ fmtNum(cpZones.inputs.flatAtt) }} − 我方武器 {{ fmtNum(cpZones.inputs.actualW) }} + canonical 模板 {{ fmtNum(cpZones.inputs.canonicalW) }})</span>
              <span class="cp-zones__val">{{ cpZones.z2.toFixed(2) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">Zone 3</span>
              <span class="cp-zones__formula">1 + {{ cpZones.inputs.pctAtt.toFixed(2) }}% / 100</span>
              <span class="cp-zones__val">{{ cpZones.z3.toFixed(4) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">武器差值</span>
              <span class="cp-zones__formula">canonical − bow(僅攻擊力差,未乘 ATT%)</span>
              <span class="cp-zones__val">{{ (cpZones.inputs.weaponDelta || 0).toFixed(2) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">Z2×Z3</span>
              <span class="cp-zones__formula">{{ (cpZones.z2 * cpZones.z3).toFixed(2) }} − {{ cpZones.inputs.z2Diff.toFixed(2) }} (差值×Z3)</span>
              <span class="cp-zones__val">{{ cpZones.z2z3.toFixed(2) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">Zone 4</span>
              <span class="cp-zones__formula">(135 + {{ cpZones.inputs.critDmg.toFixed(2) }}%) / 100</span>
              <span class="cp-zones__val">{{ cpZones.z4.toFixed(4) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">Zone 5</span>
              <span class="cp-zones__formula">(100 + {{ cpZones.inputs.dmgPct.toFixed(2) }}% + {{ cpZones.inputs.bossDmg.toFixed(2) }}%) / 100</span>
              <span class="cp-zones__val">{{ cpZones.z5.toFixed(4) }}</span>
            </li>
            <li class="cp-zones__row">
              <span class="cp-zones__label">Zone 6</span>
              <span class="cp-zones__formula">終傷乘區 (待裝備來源)</span>
              <span class="cp-zones__val">{{ cpZones.z6.toFixed(2) }}</span>
            </li>
          </ul>
          <div class="cp-zones__total">
            <span>Total</span>
            <span>{{ fmtNum(combatPower) }}</span>
          </div>
        </div>
      </div>

      <!-- 基礎屬性區 -->
      <section class="stat-block">
        <div class="stat-row">
          <div class="stat-cell" data-stat="hp" data-label="HP">
            <span class="k">HP</span>
            <span class="v">{{ fmtNum(statTotal('hp')) }}</span>
          </div>
          <div class="stat-cell" data-stat="mp" data-label="MP">
            <span class="k">MP</span>
            <span class="v">{{ fmtNum(statTotal('mp')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="str" data-label="STR">
            <span class="k">STR <span class="k-arrow">▲</span></span>
            <span class="v">{{ fmtStat(statTotal('str'), baseStats.str, statTotal('str') - baseStats.str) }}</span>
          </div>
          <div class="stat-cell" data-stat="dex" data-label="DEX">
            <span class="k">DEX <span class="k-arrow">▲</span></span>
            <span class="v">{{ fmtStat(statTotal('dex'), baseStats.dex, statTotal('dex') - baseStats.dex) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="int" data-label="INT">
            <span class="k">INT <span class="k-arrow">▲</span></span>
            <span class="v">{{ fmtStat(statTotal('int'), baseStats.int, statTotal('int') - baseStats.int) }}</span>
          </div>
          <div class="stat-cell" data-stat="luk" data-label="LUK">
            <span class="k">LUK <span class="k-arrow">▲</span></span>
            <span class="v">{{ fmtStat(statTotal('luk'), baseStats.luk, statTotal('luk') - baseStats.luk) }}</span>
          </div>
        </div>
      </section>

      <!-- 攻擊/傷害區 -->
      <section class="stat-block">
        <div class="stat-row">
          <div class="stat-cell" data-stat="attStats" data-label="ATT STATS">
            <span class="k">ATT STATS</span>
            <span class="v v--hl"><span class="tri">▲</span> {{ fmtNum(attStatsInfo.basic) }}</span>
          </div>
          <div class="stat-cell" data-stat="dmgPct" data-label="Damage">
            <span class="k">Damage</span>
            <span class="v">{{ fmtPct(statTotal('dmgPct')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="finalDmg" data-label="Final Damage">
            <span class="k">Final Damage</span>
            <span class="v">{{ fmtPct(statTotal('finalDmg')) }}</span>
          </div>
          <div class="stat-cell" data-stat="bossDmg" data-label="Boss Damage">
            <span class="k">Boss Damage</span>
            <span class="v">{{ fmtPct(statTotal('bossDmg')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="ignoreDef" data-label="Ignore Defense">
            <span class="k">Ignore Defense</span>
            <span class="v">{{ fmtPct(statTotal('ignoreDef')) }}</span>
          </div>
          <div class="stat-cell" data-stat="normalMobDmg" data-label="Normal Enemy Damage">
            <span class="k">Normal Enemy Damage</span>
            <span class="v">{{ fmtPct(statTotal('normalMobDmg')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="atk" data-label="ATT">
            <span class="k">ATT</span>
            <span class="v">{{ fmtNum(statTotal('atk')) }}</span>
          </div>
          <div class="stat-cell" data-stat="critRate" data-label="Critical Rate">
            <span class="k">Critical Rate</span>
            <span class="v">{{ fmtPct(statTotal('critRate')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="matk" data-label="Magic ATT">
            <span class="k">Magic ATT</span>
            <span class="v v--hl"><span class="tri">▲</span> {{ fmtNum(statTotal('matk')) }}</span>
          </div>
          <div class="stat-cell" data-stat="critDmg" data-label="Critical Damage">
            <span class="k">Critical Damage</span>
            <span class="v">{{ fmtPct(statTotal('critDmg')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="cooldownReductionSec" data-label="Cooldown Reduction">
            <span class="k">Cooldown Reduction</span>
            <span class="v">{{ fmtCooldownReduction() }}</span>
          </div>
          <div class="stat-cell" data-stat="buffDuration" data-label="Buff Duration">
            <span class="k">Buff Duration</span>
            <span class="v">{{ fmtPct(statTotal('buffDuration')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell">
            <span class="k">Cooldown Not Applied</span>
            <span class="v">0%</span>
          </div>
          <div class="stat-cell">
            <span class="k">Ignore Elemental Resistance</span>
            <span class="v">0%</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell">
            <span class="k">Additional Status Damage</span>
            <span class="v">{{ fmtPct(statTotal('abnormalMobDmg')) }}</span>
          </div>
          <div class="stat-cell">
            <span class="k">Summon Duration Increase</span>
            <span class="v">0%</span>
          </div>
        </div>
      </section>

      <!-- 其他 (可切換頁面) -->
      <section v-if="page === 1" class="stat-block">
        <div class="stat-row">
          <div class="stat-cell">
            <span class="k">Star Force</span>
            <span class="v">{{ fmtNum(totalStarForce) }}</span>
          </div>
          <div class="stat-cell">
            <span class="k">Arcane Power</span>
            <span class="v">0</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="bonusExp" data-label="Bonus EXP">
            <span class="k">Bonus EXP</span>
            <span class="v">{{ fmtPct(statTotal('bonusExp')) }}</span>
          </div>
          <div class="stat-cell" data-stat="def" data-label="DEF">
            <span class="k">DEF</span>
            <span class="v">{{ fmtNum(statTotal('def')) }}</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell" data-stat="abnormalResist" data-label="Abnormal Status Resistance">
            <span class="k">Abnormal Status Resistance</span>
            <span class="v">{{ fmtNum(statTotal('abnormalResist')) }}</span>
          </div>
          <div class="stat-cell">
            <span class="k">Movement Speed</span>
            <span class="v">100%</span>
          </div>
        </div>
      </section>

      <section v-else class="stat-block">
        <div class="stat-row">
          <div class="stat-cell">
            <span class="k">Jump</span>
            <span class="v">123%</span>
          </div>
          <div class="stat-cell">
            <span class="k">Knockback Resistance</span>
            <span class="v">100%</span>
          </div>
        </div>
        <div class="stat-row">
          <div class="stat-cell">
            <span class="k">Attack Speed</span>
            <span class="v">8 Level</span>
          </div>
          <div class="stat-cell" />
        </div>
      </section>

      <div class="pager">
        <button
          type="button"
          class="dot"
          :class="{ 'dot--on': page === 1 }"
          aria-label="Page 1"
          @click="page = 1"
        />
        <button
          type="button"
          class="dot"
          :class="{ 'dot--on': page === 2 }"
          aria-label="Page 2"
          @click="page = 2"
        />
      </div>
    </div>

    <!-- 側欄 (Skill + Buff 雙面板) -->
    <aside class="side-panel">
      <section class="buff-panel">
        <header class="buff-panel__head">{{ t('cp.skillHeader') }}</header>
        <div class="buff-grid">
          <button
            v-for="skill in toggleableSkills"
            :key="skill.id"
            type="button"
            class="buff-cell"
            :class="{ 'buff-cell--on': isSkillActive(skill.id) }"
            :title="tooltipText(skill)"
            @click="toggleSkill(skill.id)"
          >
            <img :src="skill.icon" :alt="displayName(skill)" />
          </button>
        </div>
      </section>

      <section class="buff-panel">
        <header class="buff-panel__head">{{ t('cp.buffHeader') }}</header>
        <div class="buff-grid">
          <button
            v-for="buff in visibleBuffs"
            :key="buff.id"
            type="button"
            class="buff-cell"
            :class="{ 'buff-cell--on': isBuffActive(buff.id) }"
            :title="tooltipText(buff)"
            @click="toggleBuff(buff.id)"
          >
            <img :src="buff.icon" :alt="displayName(buff)" />
          </button>
        </div>
      </section>

      <section class="buff-panel">
        <header class="buff-panel__head">{{ t('cp.titleHeader') }}</header>
        <div class="buff-grid">
          <button
            v-for="title in visibleTitles"
            :key="title.id"
            type="button"
            class="buff-cell"
            :class="{ 'buff-cell--on': isTitleActive(title.id) }"
            :title="tooltipText(title)"
            @click="toggleTitle(title.id)"
          >
            <img :src="title.icon" :alt="displayName(title)" />
          </button>
        </div>
      </section>
    </aside>

    <!-- Stat 來源明細 tooltip -->
    <Teleport to="body">
      <!-- ATT STATS 專用 tooltip -->
      <div
        v-if="hovered && hovered.key === 'attStats'"
        ref="tipRef"
        class="stat-tip stat-tip--att"
        :style="tipStyle"
      >
        <div class="stat-tip__head">{{ hovered.label }}</div>
        <div class="stat-tip__desc">{{ t('cp.attStats.desc') }}</div>

        <div class="stat-tip__section">{{ t('cp.attStats.equippableWeapons') }}</div>
        <div class="stat-tip__block">{{ attStatsInfo.weapons.join(', ') }}</div>

        <div class="stat-tip__section">{{ t('cp.attStats.weaponConst') }}</div>
        <div class="stat-tip__block">{{ attStatsInfo.weaponConst.toFixed(2) }}</div>

        <div class="stat-tip__section">{{ t('cp.attStats.mastery') }}</div>
        <div class="stat-tip__block">{{ attStatsInfo.mastery }}%</div>

        <div class="stat-tip__dmg">
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.attStats.basic') }}</span>
            <span class="stat-tip__val">{{ fmtNum(attStatsInfo.basic) }}</span>
          </div>
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.attStats.normalEnemy') }}</span>
            <span class="stat-tip__val">{{ fmtNum(attStatsInfo.normal) }}</span>
          </div>
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.attStats.boss') }}</span>
            <span class="stat-tip__val">{{ fmtNum(attStatsInfo.boss) }}</span>
          </div>
        </div>

        <div class="stat-tip__section">{{ t('cp.attStats.bossActual') }}</div>
        <div class="stat-tip__dmg">
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.attStats.bossMax') }}</span>
            <span class="stat-tip__val">{{ fmtNum(attStatsInfo.bossMax) }}</span>
          </div>
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.attStats.bossAvg') }}</span>
            <span class="stat-tip__val">{{ fmtNum(attStatsInfo.bossAvg) }}</span>
          </div>
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.attStats.bossMin') }}</span>
            <span class="stat-tip__val">{{ fmtNum(attStatsInfo.bossMin) }}</span>
          </div>
        </div>
      </div>

      <!-- 一般 stat 明細 tooltip -->
      <div
        v-else-if="hovered && hoveredBreakdown"
        ref="tipRef"
        class="stat-tip"
        :style="tipStyle"
      >
        <div class="stat-tip__head">{{ hovered.label }}</div>

        <!-- 統計摘要 — 純 % 屬性 (Damage / Boss Damage / Critical Rate / Ignore DEF 等)
             Total 本身就是統計結果,不需再顯示 flat/pct 分列 -->
        <div v-if="!hoveredBreakdown.isPct" class="stat-tip__summary">
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.tip.flatTotal') }}</span>
            <span class="stat-tip__val">{{ fmtNum(hoveredBreakdown.flatTotal) }}</span>
          </div>
          <div
            v-if="hoveredBreakdown.fixedFlatTotal"
            class="stat-tip__row"
          >
            <span class="stat-tip__label">{{ t('cp.tip.fixedTotal') }}</span>
            <span class="stat-tip__val">{{ fmtNum(hoveredBreakdown.fixedFlatTotal) }}</span>
          </div>
          <div class="stat-tip__row">
            <span class="stat-tip__label">{{ t('cp.tip.pctTotal') }}</span>
            <span class="stat-tip__val">+{{ Number(hoveredBreakdown.pctTotal).toFixed(2) }}%</span>
          </div>
        </div>

        <template v-if="hoveredBreakdown.flat.length">
          <div class="stat-tip__section">{{ t('cp.tip.baseSources') }}</div>
          <div class="stat-tip__sources" :style="sourcesStyle(hoveredBreakdown.flat.length, 15)">
            <div
              v-for="(s, i) in hoveredBreakdown.flat"
              :key="'f' + i"
              class="stat-tip__row"
            >
              <span class="stat-tip__label">{{ s.label }}</span>
              <span class="stat-tip__val">{{ fmtSourceValue(s.value, hoveredBreakdown.isPct) }}</span>
            </div>
          </div>
        </template>

        <template v-if="hoveredBreakdown.fixedSources?.length">
          <div class="stat-tip__section">{{ t('cp.tip.fixedSources') }}</div>
          <div class="stat-tip__sources" :style="sourcesStyle(hoveredBreakdown.fixedSources.length)">
            <div
              v-for="(s, i) in hoveredBreakdown.fixedSources"
              :key="'x' + i"
              class="stat-tip__row"
            >
              <span class="stat-tip__label">{{ s.label }}</span>
              <span class="stat-tip__val">{{ fmtSourceValue(s.value, hoveredBreakdown.isPct) }}</span>
            </div>
          </div>
        </template>

        <template v-if="hoveredBreakdown.pct.length">
          <div class="stat-tip__section">{{ t('cp.tip.pctSources') }}</div>
          <div class="stat-tip__sources" :style="sourcesStyle(hoveredBreakdown.pct.length)">
            <div
              v-for="(s, i) in hoveredBreakdown.pct"
              :key="'p' + i"
              class="stat-tip__row"
            >
              <span class="stat-tip__label">{{ s.label }}</span>
              <span class="stat-tip__val">{{ fmtSourceValue(s.value, true) }}</span>
            </div>
          </div>
        </template>

        <div
          v-if="!hoveredBreakdown.flat.length && !hoveredBreakdown.fixedSources?.length && !hoveredBreakdown.pct.length"
          class="stat-tip__empty"
        >{{ t('cp.tip.noSources') }}</div>

        <div class="stat-tip__total">
          <span>{{ t('cp.tip.total') }}</span>
          <span class="stat-tip__total-val">
            {{ hoveredBreakdown.isPct
              ? fmtPct(hoveredBreakdown.final)
              : fmtNum(hoveredBreakdown.final) }}
          </span>
        </div>
      </div>
    </Teleport>
  </section>
</template>

<style scoped>
/* 仿遊戲內 STAT 面板配色 */
.cp-page {
  padding: 0.5rem 0 2rem;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.panel {
  flex: 1;
  min-width: 320px;
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border: 1px solid #3d4554;
  border-radius: 14px;
  padding: 10px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #f1f3f7;
  font-family: inherit;
}

.panel__head {
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

.cp-banner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 12px 14px;
  background: linear-gradient(180deg, #3d5666 0%, #2f4654 100%);
  border: 1px solid #22323c;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}
.cp-banner__label {
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #e8edf2;
  font-size: 1.05rem;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.45);
}
.cp-banner__value {
  flex: 1;
  text-align: right;
  padding-right: 44px;
  color: #ffc857;
  font-weight: 800;
  font-size: 1.55rem;
  letter-spacing: 0.02em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.55);
}
.cp-banner__help {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 26px;
  height: 26px;
  border-radius: 6px;
  background: #4d6a7c;
  border: 1px solid #2a3a44;
  color: #e8edf2;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 700;
}
.cp-banner__help:hover { background: #577a8d; }
.cp-banner__save {
  position: absolute;
  right: 44px;
  top: 50%;
  transform: translateY(-50%);
  height: 26px;
  padding: 0 0.6rem;
  border-radius: 6px;
  background: #4d6a7c;
  border: 1px solid #2a3a44;
  color: #ffc857;
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.06em;
}
.cp-banner__save:hover { background: #577a8d; border-color: #ffc857; }
.cp-banner__value { padding-right: 110px !important; }

.cp-compare {
  width: 100%;
  max-width: 280px;
  background: linear-gradient(180deg, #2b3441 0%, #232b36 100%);
  border: 1px solid #1a1f27;
  border-radius: 10px;
  padding: 8px 10px 10px;
  color: #e8edf2;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-self: flex-start;
}
.cp-compare__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 6px;
  border-bottom: 1px solid #1a1f27;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  color: #ffc857;
  text-transform: uppercase;
}
.cp-compare__clear {
  background: transparent;
  border: 1px solid #2f3642;
  border-radius: 4px;
  color: #c9d2dd;
  cursor: pointer;
  font-family: inherit;
  font-size: 0.66rem;
  letter-spacing: 0.06em;
  padding: 2px 6px;
  text-transform: uppercase;
}
.cp-compare__clear:hover { color: #ffc857; border-color: #ffc857; }
.cp-compare__empty {
  padding: 10px 6px;
  font-size: 0.74rem;
  color: #8ea6b8;
  text-align: center;
  letter-spacing: 0.04em;
}
.cp-compare__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.cp-compare__row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid #1a1f27;
  border-radius: 6px;
}
.cp-compare__row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}
.cp-compare__time {
  font-size: 0.7rem;
  color: #5cd1ea;
  font-weight: 700;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
}
.cp-compare__remove {
  background: transparent;
  border: none;
  color: #8ea6b8;
  cursor: pointer;
  font-size: 0.95rem;
  line-height: 1;
  padding: 0 4px;
}
.cp-compare__remove:hover { color: #c2566c; }
.cp-compare__values {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.cp-compare__line {
  display: grid;
  grid-template-columns: 50px minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 6px;
}
.cp-compare__label {
  font-size: 0.7rem;
  color: #c9d2dd;
  letter-spacing: 0.04em;
}
.cp-compare__val {
  font-size: 0.85rem;
  color: #ffc857;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  text-align: right;
}
.cp-compare__delta {
  font-size: 0.7rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.02em;
  color: #8ea6b8;
  min-width: 56px;
  text-align: right;
}
.cp-compare__delta--up { color: #8fe09d; }
.cp-compare__delta--down { color: #c2566c; }

.cp-zones {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 50;
  min-width: 320px;
  background: linear-gradient(180deg, #2b3441 0%, #232b36 100%);
  border: 1px solid #1a1f27;
  border-radius: 8px;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.55);
  padding: 8px 10px 10px;
  color: #e8edf2;
}
.cp-zones__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 4px 8px;
  border-bottom: 1px solid #1a1f27;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: #ffc857;
  text-transform: uppercase;
}
.cp-zones__close {
  background: transparent;
  border: none;
  color: #c9d2dd;
  cursor: pointer;
  font-size: 1.05rem;
  line-height: 1;
  padding: 0 4px;
}
.cp-zones__close:hover { color: #ffc857; }
.cp-zones__list {
  list-style: none;
  margin: 0;
  padding: 6px 0 4px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.cp-zones__row {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto;
  align-items: baseline;
  gap: 6px;
  padding: 3px 4px;
  font-size: 0.78rem;
}
.cp-zones__row:nth-child(odd) { background: rgba(255, 255, 255, 0.03); }
.cp-zones__label {
  color: #5cd1ea;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.cp-zones__formula {
  color: #c9d2dd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cp-zones__val {
  color: #ffc857;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  text-align: right;
  min-width: 60px;
}
.cp-zones__total {
  display: flex;
  justify-content: space-between;
  padding: 6px 4px 0;
  margin-top: 4px;
  border-top: 1px solid #1a1f27;
  font-size: 0.85rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: #ffc857;
}

.stat-block {
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  padding: 10px 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.stat-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  min-width: 0;
  padding: 2px 4px;
  margin: 0 -4px;
  border-radius: 4px;
  font-size: 0.86rem;
  line-height: 1.25rem;
  transition: background 0.12s;
}
.stat-cell[data-stat]:hover {
  background: rgba(255, 255, 255, 0.08);
  cursor: help;
}

.k {
  color: #dde2eb;
  font-weight: 500;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.k-arrow {
  display: inline-block;
  margin-left: 3px;
  padding: 0 4px;
  font-size: 0.6rem;
  line-height: 1rem;
  color: #c9cfd9;
  border: 1px solid rgba(0, 0, 0, 0.35);
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.06);
  vertical-align: middle;
}

.v {
  color: #f7f9fc;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-align: right;
  white-space: nowrap;
}
.v--hl { color: #ffc857; }
.tri {
  color: #ffc857;
  font-size: 0.65rem;
  margin-right: 2px;
}

.pager {
  display: flex;
  justify-content: center;
  gap: 6px;
  padding: 4px 0 2px;
}
.dot {
  width: 9px;
  height: 9px;
  padding: 0;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(0, 0, 0, 0.45);
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}
.dot:hover { transform: scale(1.15); }
.dot--on { background: #f1f3f7; }

@media (max-width: 520px) {
  .stat-row { grid-template-columns: 1fr; gap: 2px; }
  .cp-banner__value { font-size: 1.2rem; padding-right: 38px; }
}

/* 側欄容器:上為 SKILL、下為 BUFF */
.side-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 212px;
  align-self: flex-start;
}

/* Buff / Skill 子面板 (共用樣式) */
.buff-panel {
  width: 212px;
  background: linear-gradient(180deg, #8b96a8 0%, #6b7689 100%);
  border: 1px solid #3d4554;
  border-radius: 14px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow:
    0 10px 28px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
}
.buff-panel__head {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 30px;
  background: linear-gradient(180deg, #5b6577 0%, #49525f 100%);
  border: 1px solid #3d4554;
  border-radius: 8px;
  color: #f1f3f7;
  font-weight: 700;
  font-size: 0.78rem;
  letter-spacing: 0.2em;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.4);
}
.buff-grid {
  display: grid;
  grid-template-columns: repeat(4, 40px);
  justify-content: center;
  gap: 8px;
  padding: 8px;
  background: linear-gradient(180deg, #4f5867 0%, #434c59 100%);
  border: 1px solid #2f3642;
  border-radius: 8px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  min-height: 56px;
}
.buff-cell {
  width: 40px;
  height: 40px;
  padding: 2px;
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid #2a3240;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.12s, border-color 0.12s, background 0.12s;
  filter: grayscale(0.7) brightness(0.7);
}
.buff-cell img {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
  pointer-events: none;
}
.buff-cell:hover { transform: scale(1.07); }
.buff-cell--on {
  filter: none;
  border-color: #ffc857;
  background: rgba(255, 200, 87, 0.18);
  box-shadow: 0 0 0 2px rgba(255, 200, 87, 0.35);
}
</style>

<style>
/* Stat tooltip — Teleport 到 body,所以不能用 scoped */
.stat-tip {
  position: fixed;
  z-index: 9999;
  pointer-events: none;
  min-width: 260px;
  /* 寬度可隨來源列數自動放大,最多到 96vw */
  max-width: min(1100px, 96vw);
  padding: 8px 10px;
  background: linear-gradient(180deg, #2b3441 0%, #1f2630 100%);
  border: 1px solid #0f1419;
  border-radius: 6px;
  color: #e8edf2;
  font-size: 0.78rem;
  line-height: 1.3;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.55);
}
/* 來源清單 — 超過 10 列時動態切成多欄 (columnCount 由 script 決定) */
.stat-tip__sources {
  column-gap: 14px;
  column-fill: balance;
}
.stat-tip__sources > .stat-tip__row {
  break-inside: avoid;
  -webkit-column-break-inside: avoid;
  page-break-inside: avoid;
}
.stat-tip__head {
  font-weight: 700;
  letter-spacing: 0.04em;
  color: #ffc857;
  padding-bottom: 4px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.stat-tip__section {
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  font-size: 0.72rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8ea6b8;
}
/* 第一個 section (Base) 不需要上邊框 — 因為前面就是 summary 的底線 */
.stat-tip__summary + .stat-tip__section,
.stat-tip__head + .stat-tip__section {
  border-top: none;
  padding-top: 0;
  margin-top: 4px;
}
.stat-tip__summary {
  padding: 4px 0 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
.stat-tip__summary .stat-tip__label { color: #e8edf2; font-weight: 600; }
.stat-tip__summary .stat-tip__val { color: #ffc857; }
.stat-tip__row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 1px 0;
}
.stat-tip__label {
  color: #c9d2dd;
  /* 長來源名稱允許自動換行,避免被截斷 */
  white-space: normal;
  word-break: break-word;
  flex: 1 1 auto;
  min-width: 0;
}
.stat-tip__val {
  color: #5cd1ea;
  font-weight: 600;
  white-space: nowrap;
  flex-shrink: 0;
}
.stat-tip__empty {
  color: #8ea6b8;
  font-style: italic;
  padding: 2px 0;
}
.stat-tip__total {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
  padding-top: 4px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  color: #e8edf2;
  font-weight: 700;
}
.stat-tip__total-val {
  color: #ffc857;
}

.stat-tip--att { min-width: 260px; max-width: 360px; }
.stat-tip__desc {
  color: #dbe3ec;
  line-height: 1.5;
  padding-bottom: 6px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.stat-tip__block {
  color: #f1f3f7;
  padding: 0 0 4px 2px;
  font-weight: 600;
}
.stat-tip__dmg {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
</style>
