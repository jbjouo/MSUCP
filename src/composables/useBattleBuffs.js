import { reactive } from 'vue'
import { BATTLE_BUFFS, resolveActiveToggleStats } from '../constants/battleBuffs.js'
import { combinedLevelFor, bestLevelDataFor } from './useLinkSkills.js'
import { getLinkSkill } from '../data/linkSkills.js'
import { useDotTracker } from './useDotTracker.js'
import { computeEffectiveCooldown } from './useCpDamage.js'

function defaultStacks() {
  const out = {}
  for (const b of BATTLE_BUFFS) {
    out[b.id] = {
      count: 0,
      expireAt: 0,
      // activeToggle 專屬欄位(其他 source 類型忽略)
      activatedAt: 0,
      cooldownUntil: 0,
      baseFinalDmgPct: 0,
      tickIntervalMs: 0,
      tickIncreasePct: 0,
      durationMs: 0,
      level: 0,
    }
  }
  return out
}

const state = reactive({
  stacks: defaultStacks(),
})

function applicableForJob(buff, jobKey) {
  return !buff.jobs || !jobKey || buff.jobs.includes(jobKey)
}

// 依 buff 來源取得「當前等級的 stats 規則」
//   linkSkill / linkCycle → 依連結結果動態查;passive → 直接從 buff 定義讀
function currentLevelStats(buff, jobKey) {
  if (buff.source === 'linkSkill' || buff.source === 'linkCycle') {
    const skill = getLinkSkill(buff.id)
    if (!skill) return null
    const level = combinedLevelFor(buff.id, jobKey)
    if (level <= 0) return { level: 0, stats: null }
    const data = bestLevelDataFor(skill, level)
    return { level, stats: data?.stats || null }
  }
  if (buff.source === 'passive') {
    return {
      level: 1,
      stats: {
        // procOnHit 型會用到 procRate / duration(每次施放時 rollTriggers 抽層)
        procRate: buff.procRate || 0,
        maxStacks: buff.maxStacks || 0,
        duration: buff.durationSec || 0,
        // Damage%(與 CP Damage% 相加後併入 basic/boss):每層 perStackDamagePct
        damagePerStack: buff.perStackDamagePct || 0,
        ignoreDefPerStack: buff.perStackIgnoreDefPct || 0,
        // Final Damage 獨立乘區(此技能不用,Arcane Aim 提升的是 Damage,非 Final):每層 perStackFinalDmgPct
        finalDmgPerStack: buff.perStackFinalDmgPct || 0,
      },
    }
  }
  return null
}

// 取得單一 buff 當前層數
//   roll 型 (linkSkill / 其他有 state 的) → 存於 state.stacks[id].count
//   passive 型 (dotCount) → 計算 min(maxStacks, activeDotCount)
function stacksOf(buff, dotCountOverride) {
  if (buff.source === 'passive' && buff.passiveType === 'dotCount') {
    const count = dotCountOverride != null
      ? dotCountOverride
      : useDotTracker().state.activeDotCount
    return Math.min(buff.maxStacks || 0, Math.max(0, count))
  }
  return state.stacks[buff.id]?.count || 0
}

function syncExpire(nowMs) {
  if (!Number.isFinite(nowMs)) return
  for (const id of Object.keys(state.stacks)) {
    const s = state.stacks[id]
    if (s.count > 0 && nowMs >= s.expireAt) {
      s.count = 0
      // activeToggle / linkCycle:保留 activatedAt / cooldownUntil(用於 CD 判斷與下次自動施放)
      const buff = BATTLE_BUFFS.find((b) => b.id === id)
      const preserveCycle = buff?.source === 'activeToggle' || buff?.source === 'linkCycle'
      if (!preserveCycle) s.expireAt = 0
    }
  }
}

// activeToggle 在指定 ctx 下當前的最終傷害 %(elapsed 內的層級 3% 相加)
function activeToggleFinalDmgPct(buff, nowMs) {
  const s = state.stacks[buff.id]
  if (!s || !s.count || nowMs >= s.expireAt) return 0
  const iv = s.tickIntervalMs || 1
  const ticks = Math.max(0, Math.floor((nowMs - s.activatedAt) / iv))
  return (s.baseFinalDmgPct || 0) + ticks * (s.tickIncreasePct || 0)
}

export function useBattleBuffs() {
  function reset() {
    for (const id of Object.keys(state.stacks)) {
      const s = state.stacks[id]
      s.count = 0
      s.expireAt = 0
      s.activatedAt = 0
      s.cooldownUntil = 0
      s.baseFinalDmgPct = 0
      s.tickIntervalMs = 0
      s.tickIncreasePct = 0
      s.durationMs = 0
      s.level = 0
    }
  }

  // 戰鬥模擬 tick 呼叫 — 依 sim elapsed 自動觸發 activeToggle buff
  //   首次:等 initialDelayMs 後啟動
  //   之後:expire 後等 cooldown 滿了再啟動
  // 回傳:本次 tick 內新啟動的 buff 陣列,讓 sim 可加入 timeline
  function autoTick(nowMs, jobKey, ctx = {}) {
    syncExpire(nowMs)
    const {
      attackSpeed = 8,
      combatOrdersActive = false,
      buffDurationPct = 0,
      cooldownReductionPct = 0,
      cooldownReductionSec = 0,
    } = ctx
    const activated = []
    for (const buff of BATTLE_BUFFS) {
      const isActiveToggle = buff.source === 'activeToggle'
      const isLinkCycle = buff.source === 'linkCycle'
      if (!isActiveToggle && !isLinkCycle) continue
      // triggerOn 指定為事件驅動(例:debuffApplied)→ 不在 autoTick 自動啟動,交由 rollTriggers 處理
      if (isLinkCycle && buff.triggerOn) continue
      if (!applicableForJob(buff, jobKey)) continue
      const s = state.stacks[buff.id]
      const isActive = s.count > 0 && nowMs < s.expireAt
      if (isActive) continue

      const initialDelayMs = buff.initialDelayBySpeed?.[attackSpeed] ?? 450
      const threshold = s.activatedAt === 0 ? initialDelayMs : s.cooldownUntil
      if (nowMs < threshold) continue

      if (isLinkCycle) {
        // linkCycle:level + stats 從 LinkSkill 系統取得,未連結則跳過
        const info = currentLevelStats(buff, jobKey)
        if (!info?.stats || info.level <= 0) continue
        const durationSec = Number(info.stats.duration) || 0
        const cooldownSec = Number(info.stats.cooldown) || 0
        if (durationSec <= 0 || cooldownSec <= 0) continue
        // 不吃 Buff Duration% 與 CD 減免 → 直接使用 link skill 原始數值
        const durationMs = durationSec * 1000
        s.count = 1
        s.activatedAt = nowMs
        s.expireAt = nowMs + durationMs
        s.cooldownUntil = nowMs + cooldownSec * 1000
        s.durationMs = durationMs
        s.level = info.level
        activated.push({ id: buff.id, at: nowMs, buff, level: info.level })
        continue
      }

      // activeToggle:level + stats 由 baseLevel + Combat Orders 計算
      const level = (buff.baseLevel || 1) + (combatOrdersActive ? 1 : 0)
      const cfg = resolveActiveToggleStats(buff, level)
      const durationMs = cfg.durationSec * 1000 * (1 + (buffDurationPct || 0) / 100)
      // CD 吃一般 CD 減免(% + 帽子 flat);走與一般技能相同的 computeEffectiveCooldown
      const effCdSec = cfg.cooldownSec > 0
        ? computeEffectiveCooldown(cfg.cooldownSec, {
            externalPctRed: cooldownReductionPct,
            hatFlatRedSec: cooldownReductionSec,
          })
        : 0
      s.count = 1
      s.activatedAt = nowMs
      s.expireAt = nowMs + durationMs
      s.cooldownUntil = nowMs + effCdSec * 1000
      s.baseFinalDmgPct = cfg.baseFinalDmgPct
      s.tickIntervalMs = cfg.tickIntervalSec * 1000
      s.tickIncreasePct = cfg.tickIncreasePct
      s.durationMs = durationMs
      s.level = cfg.level
      activated.push({ id: buff.id, at: nowMs, buff, level: cfg.level })
    }
    return activated
  }

  // 每次施放時呼叫 — 對 trigger-based buff 抽層
  //   linkSkill        → 依 link skill stats procRate 抽(例:法師傳授 25%)
  //   passive/procOnHit → 依 buff 自帶 procRate 抽(例:Arcane Aim Lv30 100%)
  //
  // 若 proc 成功的 buff 帶 appliesDebuff,視為「對怪物上 debuff」事件,
  // 觸發所有 source='linkCycle' && triggerOn='debuffApplied' 的 buff(若 off-CD)。
  // 回傳:本次被 proc 觸發啟動的 linkCycle buff 陣列,供 sim 寫入 timeline。
  function rollTriggers(rng, jobKey, nowMs) {
    syncExpire(nowMs)
    let debuffApplied = false
    for (const buff of BATTLE_BUFFS) {
      if (!applicableForJob(buff, jobKey)) continue
      const isLinkSkill = buff.source === 'linkSkill'
      const isProcOnHit = buff.source === 'passive' && buff.passiveType === 'procOnHit'
      if (!isLinkSkill && !isProcOnHit) continue
      const info = currentLevelStats(buff, jobKey)
      if (!info?.stats) continue
      const { procRate = 0, maxStacks = 0, duration = 0 } = info.stats
      if (!procRate) continue
      const s = state.stacks[buff.id]
      const roll = rng() * 100 < procRate
      if (s.count >= maxStacks) {
        if (roll) s.expireAt = nowMs + duration * 1000
      } else if (roll) {
        s.count += 1
        s.expireAt = nowMs + duration * 1000
      }
      if (roll && buff.appliesDebuff) debuffApplied = true
    }

    const activated = []
    if (!debuffApplied) return activated
    for (const buff of BATTLE_BUFFS) {
      if (buff.source !== 'linkCycle' || buff.triggerOn !== 'debuffApplied') continue
      if (!applicableForJob(buff, jobKey)) continue
      const s = state.stacks[buff.id]
      const isActive = s.count > 0 && nowMs < s.expireAt
      if (isActive) continue
      if (s.activatedAt > 0 && nowMs < s.cooldownUntil) continue
      const info = currentLevelStats(buff, jobKey)
      if (!info?.stats || info.level <= 0) continue
      const durationSec = Number(info.stats.duration) || 0
      const cooldownSec = Number(info.stats.cooldown) || 0
      if (durationSec <= 0 || cooldownSec <= 0) continue
      const durationMs = durationSec * 1000
      s.count = 1
      s.activatedAt = nowMs
      s.expireAt = nowMs + durationMs
      s.cooldownUntil = nowMs + cooldownSec * 1000
      s.durationMs = durationMs
      s.level = info.level
      activated.push({ id: buff.id, at: nowMs, buff, level: info.level })
    }
    return activated
  }

  // 當前全部 buff 彙總:
  //   dmgPct / ignoreDefPct 同技能層線性相加,不同 buff 再累加
  //   finalDmgMult 同技能層「相加」成一個乘區,不同 buff 之間「互乘」
  //     (即:buff_A_mult × buff_B_mult × ...)
  function currentBonuses(jobKey, nowMs, { dotCountOverride } = {}) {
    syncExpire(nowMs)
    const total = { dmgPct: 0, ignoreDefPct: 0, finalDmgMult: 1 }
    for (const buff of BATTLE_BUFFS) {
      if (!applicableForJob(buff, jobKey)) continue
      // activeToggle:時間階梯式終傷 → 組成單一乘區後與其他 buff 互乘
      if (buff.source === 'activeToggle') {
        const fdPct = activeToggleFinalDmgPct(buff, nowMs)
        if (fdPct > 0) total.finalDmgMult *= 1 + fdPct / 100
        continue
      }
      // linkCycle:啟動中以 stats.damage 併入 Damage%(與 CP Damage 相加後進 basic/boss 桶)
      if (buff.source === 'linkCycle') {
        const s = state.stacks[buff.id]
        if (!s || s.count <= 0 || nowMs >= s.expireAt) continue
        const info = currentLevelStats(buff, jobKey)
        const dmg = Number(info?.stats?.damage) || 0
        if (dmg > 0) total.dmgPct += dmg
        continue
      }
      const info = currentLevelStats(buff, jobKey)
      if (!info?.stats) continue
      const stacks = stacksOf(buff, dotCountOverride)
      if (stacks <= 0) continue
      total.dmgPct += stacks * (info.stats.damagePerStack || 0)
      total.ignoreDefPct += stacks * (info.stats.ignoreDefPerStack || 0)
      const fdPerStack = info.stats.finalDmgPerStack || 0
      if (fdPerStack > 0) {
        // 同技能層 → 相加 (例:5 層 × 5% = 25%);轉乘區 × (1 + 25/100)
        const selfMult = 1 + (stacks * fdPerStack) / 100
        total.finalDmgMult *= selfMult
      }
    }
    return total
  }

  // DoT 專用「特殊終傷」乘區 — 僅少數 buff 會作用於 DoT,其餘(面板終傷 / Infinity
  // 等 activeToggle / Arcane Aim 的 Damage 疊層)DoT 都不吃。
  //   目前唯一來源:Fervent Drain (passive/dotCount, perStackFinalDmgPct)
  //   回傳:{ mult, stacks, perStack } 供 sim 與測試面板使用
  function dotSpecialFinalMult(jobKey, nowMs, { dotCountOverride } = {}) {
    syncExpire(nowMs)
    let mult = 1
    let stacks = 0
    let perStack = 0
    for (const buff of BATTLE_BUFFS) {
      if (!applicableForJob(buff, jobKey)) continue
      if (buff.id !== 'fervent_drain') continue
      const s = stacksOf(buff, dotCountOverride)
      const p = buff.perStackFinalDmgPct || 0
      stacks = s
      perStack = p
      if (s > 0 && p > 0) mult *= 1 + (s * p) / 100
    }
    return { mult, stacks, perStack }
  }

  function buffInfo(buff, jobKey, nowMs, { dotCountOverride } = {}) {
    syncExpire(nowMs)
    if (buff.source === 'activeToggle') {
      const s = state.stacks[buff.id] || {}
      const isActive = s.count > 0 && nowMs < s.expireAt
      const remainingMs = isActive ? Math.max(0, s.expireAt - nowMs) : 0
      const currentFdPct = isActive ? activeToggleFinalDmgPct(buff, nowMs) : 0
      const onCooldown = !isActive && s.activatedAt > 0 && s.cooldownUntil > nowMs
      return {
        level: s.level || buff.baseLevel || 0,
        stats: null,
        count: isActive ? 1 : 0,
        expireAt: s.expireAt || 0,
        active: isActive,
        // activeToggle 專屬
        source: 'activeToggle',
        remainingMs,
        currentFdPct,
        onCooldown,
        cooldownRemainingMs: onCooldown ? s.cooldownUntil - nowMs : 0,
        durationMs: s.durationMs || 0,
      }
    }
    if (buff.source === 'linkCycle') {
      const s = state.stacks[buff.id] || {}
      const info = currentLevelStats(buff, jobKey)
      const isActive = s.count > 0 && nowMs < s.expireAt
      const remainingMs = isActive ? Math.max(0, s.expireAt - nowMs) : 0
      const onCooldown = !isActive && s.activatedAt > 0 && s.cooldownUntil > nowMs
      return {
        level: info?.level || 0,
        stats: info?.stats || null,
        count: isActive ? 1 : 0,
        expireAt: s.expireAt || 0,
        active: isActive,
        source: 'linkCycle',
        remainingMs,
        onCooldown,
        cooldownRemainingMs: onCooldown ? s.cooldownUntil - nowMs : 0,
        durationMs: s.durationMs || 0,
      }
    }
    const info = currentLevelStats(buff, jobKey)
    const count = stacksOf(buff, dotCountOverride)
    const s = state.stacks[buff.id] || { count: 0, expireAt: 0 }
    const stacksActive = count > 0 && nowMs < (s.expireAt || 0)
    const remainingMs = stacksActive ? Math.max(0, s.expireAt - nowMs) : 0
    return {
      level: info?.level || 0,
      stats: info?.stats || null,
      count,
      expireAt: s.expireAt,
      active: !!info?.stats,
      source: buff.source,
      remainingMs,
    }
  }

  return {
    state,
    reset,
    rollTriggers,
    autoTick,
    currentBonuses,
    dotSpecialFinalMult,
    buffInfo,
  }
}
