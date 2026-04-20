// CP 傷害計算 (從 CpCalculatorPage 抽出的共用 composable)
// — 提供 breakdowns、attStatsInfo、cpZones、combatPower 等核心計算,
//   讓 CpCalculatorPage 與 BattlePage (戰鬥模擬) 共用同一套公式。

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEquipment } from './useEquipment.js'
import { useCharacter } from './useCharacter.js'
import { useCollection } from './useCollection.js'
import { useLegion } from './useLegion.js'
import { usePuzzle } from './usePuzzle.js'
import { useHyperStat } from './useHyperStat.js'
import { useArcane } from './useArcane.js'
import { usePet } from './usePet.js'
import { useInnerPotential } from './useInnerPotential.js'
import { useVMatrix } from './useVMatrix.js'
import { activeSkillContributions } from './useLinkSkills.js'
import { useCpToggles } from './useCpToggles.js'
import { BUFFS } from '../constants/buffs.js'
import { SKILLS } from '../constants/skills.js'
import { TITLES } from '../constants/titles.js'
import { ITEM_SETS, countActiveSet } from '../constants/itemSets.js'
import { findPotentialOptionForLine } from '../constants/potentials.js'
import { findBonusPotentialOptionForLine } from '../constants/bonusPotentials.js'
import { LEGION_TIER_LABELS } from '../constants/legion.js'

// ─── 冷卻公式 ─────────────────────────────────────────────────────────────
// 套用順序嚴格:
//   Step 1: 技能優先扣秒 (例:Mist Eruption 爆炸 5 次 -2s)
//   Step 2a: 技能自身 %(超技能 -50% 等) — 乘法
//   Step 2b: 外部 %(聯盟 Mercedes 等) — 預設乘法;
//            若技能設 externalPctUsesBaseAsFlat:以 base CD × ext% 作為 flat 秒扣除
//            (Mist Eruption 特例:5% × 10s = -0.5s)
//   Step 3: 帽子潛能 flat 秒數 — 受「5 秒下限 + 10 秒規則」
//      - 若 Step 1-2 後 CD < 5s:帽子 flat 完全不生效 (不能低於 5s 下限的情況下扣秒)
//      - 若 Step 1-2 後 CD > 10s:直接扣秒
//      - 若 Step 1-2 後 5s ≤ CD ≤ 10s:每 1s flat 轉 5% 減免
//      - 最終結果保證 ≥ 5s (5 秒為硬下限)
// 所有輸入皆為正值 (表「減免量」)
export function computeEffectiveCooldown(baseCd, {
  skillPriorityRedSec = 0,
  skillOwnPctRed = 0,
  externalPctRed = 0,
  hatFlatRedSec = 0,
  externalPctUsesBaseAsFlat = false, // Mist Eruption 特例:外部 % 以 baseCd 為基準
} = {}) {
  const base = Math.max(0, Number(baseCd) || 0)
  if (base <= 0) return 0

  // Step 1
  let cd = Math.max(0, base - Math.max(0, Number(skillPriorityRedSec) || 0))

  // Step 2a — 技能自身 %
  const own = Math.max(0, Math.min(100, Number(skillOwnPctRed) || 0))
  cd = cd * (1 - own / 100)

  // Step 2b — 外部 %
  const ext = Math.max(0, Math.min(100, Number(externalPctRed) || 0))
  if (externalPctUsesBaseAsFlat) {
    // 特例:外部 % 以 baseCd 為基準轉為 flat 秒扣除
    cd = Math.max(0, cd - base * (ext / 100))
  } else {
    cd = cd * (1 - ext / 100)
  }

  // Step 3 — 帽子 flat
  const flat = Math.max(0, Number(hatFlatRedSec) || 0)
  if (flat > 0 && cd >= 5) {
    if (cd > 10) cd = cd - flat
    else {
      const extraPct = Math.min(100, flat * 5)
      cd = cd * (1 - extraPct / 100)
    }
    cd = Math.max(5, cd)
  }
  return Math.max(0, cd)
}

// ─── 常數 ──────────────────────────────────────────────────────────────────

export const MULTIPLICATIVE_KEYS = new Set(['ignoreDef', 'damageTaken'])

export const PCT_KEYS = new Set([
  'bossDmg', 'ignoreDef', 'allStatPct', 'dmgPct',
  'atkPct', 'matkPct', 'hpPct', 'mpPct',
  'strPct', 'dexPct', 'intPct', 'lukPct',
  'critRate', 'critDmg', 'finalDmg', 'buffDuration',
  'damageTaken', 'elementalResist',
  'summonDuration', 'cooldownReduction',
  'normalMobDmg', 'bonusExp',
])

export const CP_SKILL_ALLOWLIST = new Set([
  'blessing_of_the_fairy',
  'empress_blessing',
])

export const JOB_ATT_META = {
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
}

export const SECONDARY_STAT = { str: 'dex', dex: 'str', int: 'luk', luk: 'dex' }
export const WEAPON_COEFFICIENT_DELTA = 69

const PER_LV10_MAP = {
  strPerLv10: 'str', dexPerLv10: 'dex', intPerLv10: 'int', lukPerLv10: 'luk',
  atkPerLv10: 'atk', matkPerLv10: 'matk',
}

// ─── composable ────────────────────────────────────────────────────────────

export function useCpDamage() {
  const { t } = useI18n()
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
  const {
    state: petState,
    countBonus: petCountBonus,
    equippedCount: petEquipCount,
    equipmentBonus: petEquipBonus,
  } = usePet()
  const { activeBuffs, activeSkillIds, activeTitleIds } = useCpToggles()

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

  const totalStarForce = computed(() => {
    let s = 0
    for (const uid of Object.values(equipState.equipped)) {
      const e = resolveEntry(uid)
      if (e) s += e.stars || 0
    }
    return s
  })

  // 每個 statKey → { flat: [{label,value,fixed,cpExclude}], pct: [{label,value,cpExclude}] }
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
    addPct('critRate', t('cp.tip.characterBase'), 5)

    // 2) 裝備 (base + star + bonus + potentials)
    const charLv10 = Math.floor((charState.level || 0) / 10)
    for (const uid of Object.values(equipState.equipped)) {
      const entry = resolveEntry(uid)
      if (!entry) continue
      const name = entry.item.name || ''
      const itemFlatBag = {}
      const itemPctBag = {}
      const accumulate = (k, v) => {
        if (!v) return
        if (PER_LV10_MAP[k]) {
          const baseKey = PER_LV10_MAP[k]
          const total = v * charLv10
          if (!total) return
          itemFlatBag[baseKey] = (itemFlatBag[baseKey] || 0) + total
          return
        }
        if (PCT_KEYS.has(k)) {
          if (MULTIPLICATIVE_KEYS.has(k)) {
            const prev = itemPctBag[k] || 0
            const merged = 1 - (1 - Math.abs(prev) / 100) * (1 - Math.abs(v) / 100)
            const val = Math.round(merged * 10000) / 100
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

    // 3) Buff
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
      const buffLabel = t('cp.tip.buffPrefix', { name: buff.name })
      for (const [k, v] of Object.entries(buff.stats || {})) {
        if (PCT_KEYS.has(k)) addPct(k, buffLabel, v, cpExc)
        else addFlat(k, buffLabel, v, false, cpExc)
      }
      if (typeof buff.contribute === 'function') {
        ctx.effectiveLevel = (buff.baseLevel || 0) + skillLevelBonus
        const contribs = buff.contribute(ctx) || []
        for (const c of contribs) {
          if (c.isPct) addPct(c.key, c.label, c.value, cpExc)
          else addFlat(c.key, c.label, c.value, false, cpExc)
        }
      }
    }

    // 裝備套裝
    const equippedItems = []
    for (const uid of Object.values(equipState.equipped)) {
      const ent = resolveEntry(uid)
      if (ent?.item?.id) equippedItems.push(ent.item)
    }
    for (const set of ITEM_SETS) {
      const count = countActiveSet(set, equippedItems)
      if (!count) continue
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

    // 稱號
    for (const title of TITLES) {
      if (!activeTitleIds.value.has(title.id)) continue
      if (title.jobs && !title.jobs.includes(currentJob.value?.key)) continue
      const label = t('cp.tip.titlePrefix', { name: title.name })
      for (const [k, v] of Object.entries(title.stats || {})) {
        if (PCT_KEYS.has(k)) addPct(k, label, v)
        else addFlat(k, label, v)
      }
    }

    // 技能 (被動 + toggle)
    const myJobKey = currentJob.value?.key || null
    const weaponUid = equipState.equipped.weapon
    const weaponEntry = weaponUid ? resolveEntry(weaponUid) : null
    const skillCtx = {
      jobKey: myJobKey,
      weaponSubType: weaponEntry?.item?.subType || null,
      characterLevel: charState.level,
      skillLevelBonus,
    }
    for (const skill of SKILLS) {
      let bag = null
      if (skill.passive) {
        if (skill.jobs && !skill.jobs.includes(myJobKey)) continue
        bag = typeof skill.contribute === 'function'
          ? skill.contribute(skillCtx)
          : skill.stats
      } else {
        if (!activeSkillIds.value.has(skill.id)) continue
        bag = skill.stats
      }
      if (!bag) continue
      const cpExc = !CP_SKILL_ALLOWLIST.has(skill.id)
      const skillLabel = t('cp.tip.skillPrefix', { name: skill.name })
      for (const [k, v] of Object.entries(bag)) {
        if (PCT_KEYS.has(k)) addPct(k, skillLabel, v, cpExc)
        else addFlat(k, skillLabel, v, false, cpExc)
      }
    }

    // 圖鑑
    for (const contrib of collectionContribs.value) {
      const addFn = PCT_KEYS.has(contrib.stat.key) ? addPct : addFlat
      const label = t('cp.tip.collectionPrefix', { name: t(contrib.stat.labelKey), lv: contrib.level })
      addFn(contrib.stat.key, label, contrib.value)
    }
    if (collectionSetBonus.value) {
      const label = t('cp.tip.collectionSetPrefix', { n: collectionState.setCount || 0 })
      addFlat('str', label, collectionSetBonus.value)
      addFlat('dex', label, collectionSetBonus.value)
      addFlat('int', label, collectionSetBonus.value)
      addFlat('luk', label, collectionSetBonus.value)
    }

    // 聯盟拼圖
    for (const pc of puzzleContribs.value) {
      const entryName = t(pc.entry.labelKey)
      const label = t('cp.tip.puzzlePrefix', { name: entryName, lv: pc.level })
      for (const [k, v] of Object.entries(pc.stats)) {
        const addFn = PCT_KEYS.has(k) ? addPct : addFlat
        addFn(k, label, v)
      }
    }

    // Hyper Stat
    for (const hc of hyperStatContribs.value) {
      const statName = t(hc.stat.labelKey)
      const label = t('cp.tip.hyperPrefix', { name: statName, lv: hc.level })
      for (const [k, v] of Object.entries(hc.stats)) {
        if (PCT_KEYS.has(k)) addPct(k, label, v)
        else addFlat(k, label, v, !!hc.fixed)
      }
    }

    // 寵物
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

    // ARC
    const primaryKey = currentJob.value?.primary || 'str'
    for (const ac of arcaneContribs.value) {
      if (!ac.level || !ac.mainStat) continue
      const symbolName = t(ac.nameKey)
      const label = t('cp.tip.arcanePrefix', { name: symbolName, lv: ac.level })
      addFlat(primaryKey, label, ac.mainStat, true)
    }

    // 內潛
    for (const ab of abilityContribs.value) {
      const optName = t(ab.nameKey)
      const label = t('cp.tip.abilityPrefix', { n: ab.line, name: optName })
      for (const [k, v] of Object.entries(ab.stats)) {
        if (k === 'allStat') {
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

    // V 矩陣
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

    // 聯盟
    for (const lc of legionContribs.value) {
      if (lc.specialEffect) continue
      const memberName = t(`character.jobs.${lc.member.jobKey}`)
      const tierLabel = LEGION_TIER_LABELS[lc.tier] || lc.tier
      const label = t('cp.tip.legionPrefix', { name: memberName, tier: tierLabel })
      for (const [k, v] of Object.entries(lc.stats)) {
        if (PCT_KEYS.has(k)) addPct(k, label, v)
        else addFlat(k, label, v, !!lc.fixed)
      }
    }

    // Link Skill
    const linkContribs = activeSkillContributions(
      currentJob.value?.key || null,
      currentJob.value?.linkSkill || null,
    )
    for (const contrib of linkContribs) {
      const skillName = contrib.skill.nameKey ? t(contrib.skill.nameKey) : contrib.skill.id
      const label = `Link: ${skillName} Lv.${contrib.level}`
      for (const [k, v] of Object.entries(contrib.stats)) {
        if (PCT_KEYS.has(k)) addPct(k, label, v, true)
        else addFlat(k, label, v, false, true)
      }
    }
    return out
  })

  function breakdownFor(key) {
    const b = breakdowns.value[key] || { flat: [], pct: [] }
    const flat = [...b.flat]
    const pct = [...b.pct]
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
    const fixedFlatTotal = flat.reduce((s, x) => s + (x.fixed ? x.value : 0), 0)
    const normalFlatTotal = flatTotal - fixedFlatTotal

    let final
    const isMultiplicative = MULTIPLICATIVE_KEYS.has(key)
    if (isMultiplicative) {
      let survival = 1
      for (const s of pct) survival *= (1 - Math.abs(s.value) / 100)
      for (const s of flat) survival *= (1 - Math.abs(s.value) / 100)
      const base = (1 - survival) * 100
      final = key === 'damageTaken' ? -base : base
    } else if (PCT_KEYS.has(key)) {
      final = pctTotal + flatTotal
    } else {
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

  function statTotal(key) { return breakdownFor(key).final }

  function flatTotalForCp(key) {
    const b = breakdowns.value[key] || { flat: [], pct: [] }
    return b.flat.filter((x) => !x.cpExclude).reduce((s, x) => s + x.value, 0)
  }
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
  function statTotalForCp(key) {
    const b = breakdowns.value[key] || { flat: [], pct: [] }
    const flat = b.flat.filter((x) => !x.cpExclude)
    const pct = b.pct.filter((x) => !x.cpExclude)
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

  // ─── ATT STATS (含實際傷害 bossMax/Min/Avg) ────────────────────────────
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
    const ignoreDef = statTotal('ignoreDef')  // 多來源已用相乘疊加合併
    // 冷卻 — 正值表「減少量」(convention: 潛能 / 聯盟 存入負值,這裡取絕對值)
    const cooldownReductionSec = Math.abs(statTotal('cooldownReductionSec') || 0)
    const cooldownReductionPct = Math.abs(statTotal('cooldownReduction') || 0)
    let mastery = meta.mastery
    for (const buff of BUFFS) {
      if (activeBuffs.value.has(buff.id)) mastery += buff.mastery || 0
    }
    const statFactor = primaryVal * 4 + secondaryVal
    const base = statFactor * (attVal / 100) * meta.weaponConst
    const fm = 1 + finalDmg / 100
    const basic = base * (1 + dmgPct / 100) * fm
    const normal = base * (1 + (dmgPct + normalMobDmg) / 100) * fm
    const boss = base * (1 + (dmgPct + bossDmg) / 100) * fm
    const critDmg = statTotal('critDmg')
    const bossMax = boss * (1.5 + critDmg / 100)
    const bossMin = boss * (1.2 + critDmg / 100) * (mastery / 100)
    const bossAvg = (bossMax + bossMin) / 2
    return {
      weapons: meta.weapons,
      weaponConst: meta.weaponConst,
      mastery,
      usesMatk: meta.usesMatk,
      base: Math.round(base),
      baseRaw: base,
      fm,
      dmgPct,
      bossDmg,
      normalMobDmg,
      finalDmg,
      ignoreDef,
      cooldownReductionSec,
      cooldownReductionPct,
      critDmg,
      primaryStat: primary,
      primaryVal,
      secondaryVal,
      attVal,
      basic: Math.round(basic),
      basicRaw: basic,
      normal: Math.round(normal),
      boss: Math.round(boss),
      bossRaw: boss,
      bossMax: Math.round(bossMax),
      bossMaxRaw: bossMax,
      bossMin: Math.round(bossMin),
      bossMinRaw: bossMin,
      bossAvg: Math.round(bossAvg),
      bossAvgRaw: bossAvg,
    }
  })

  // ─── CP ZONES / COMBAT POWER ───────────────────────────────────────────
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
    const z2A = Math.round(flatAtt * attMul * 100) / 100
    const z2B = Math.floor((flatAtt - WEAPON_COEFFICIENT_DELTA) * attMul)
    const z2Diff = z2A - z2B
    const z1 = (4 * primary + secondary) / 100
    const z2 = flatAtt
    const z3 = attMul
    const z4 = (135 + critDmg) / 100
    const z5 = (100 + dmgPct + bossDmg) / 100
    const z6 = 1
    const z2z3 = z2 * z3 - z2Diff
    return {
      z1, z2, z3, z4, z5, z6, z2z3,
      attKey,
      inputs: { primary, secondary, flatAtt, pctAtt, critDmg, dmgPct, bossDmg, z2A, z2B, z2Diff },
      total: z1 * z2z3 * z4 * z5 * z6,
    }
  })
  const combatPower = computed(() => Math.floor(cpZones.value.total))

  return {
    // 常數 / 資訊
    PCT_KEYS,
    MULTIPLICATIVE_KEYS,
    CP_SKILL_ALLOWLIST,
    JOB_ATT_META,
    SECONDARY_STAT,
    WEAPON_COEFFICIENT_DELTA,
    // 衍生狀態
    baseStats,
    totals,
    totalStarForce,
    // 計算 API
    breakdowns,
    breakdownFor,
    statTotal,
    statTotalForCp,
    flatTotalForCp,
    pctTotalForCp,
    // 重點輸出
    attStatsInfo,
    cpZones,
    combatPower,
  }
}
