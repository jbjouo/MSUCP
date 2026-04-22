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
      baseDamagePct: 0,       // 啟動中 Damage +N%(+ 進 CP Damage 桶)
      tickIntervalMs: 0,
      tickIncreasePct: 0,
      durationMs: 0,
      level: 0,
      // tick 時間點 (相對 activatedAt 的 ms;若無則 fallback 到固定 interval 計算)
      tickTimes: null,
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

// activeToggle 在指定 ctx 下當前的最終傷害 %
//   若 stack 帶 tickTimes(由伺服器延遲模擬決定) → 計算已通過的 tick 數
//   否則 fallback 到固定 interval(nowMs - activatedAt) / tickIntervalMs
function activeToggleFinalDmgPct(buff, nowMs) {
  const s = state.stacks[buff.id]
  if (!s || !s.count || nowMs >= s.expireAt) return 0
  let ticks
  if (Array.isArray(s.tickTimes) && s.tickTimes.length) {
    const elapsed = nowMs - s.activatedAt
    // tickTimes 已排序,用線性從前往後掃找已過的 tick 數
    ticks = 0
    for (const t of s.tickTimes) {
      if (elapsed >= t) ticks++
      else break
    }
  } else {
    const iv = s.tickIntervalMs || 1
    ticks = Math.max(0, Math.floor((nowMs - s.activatedAt) / iv))
  }
  return (s.baseFinalDmgPct || 0) + ticks * (s.tickIncreasePct || 0)
}

// 依「伺服器延遲率」決定單次 activate 期間的 tick 時間點
//   期望間隔 = (1 - delayRate) × fast + delayRate × slow
//   期望 tick 數 = durationMs / 期望間隔;整數為保底 tick,小數當機率多 1 次
//   分布方式:每個間隔為 fast(5s)或 slow(10s),由 delayRate 獨立隨機決定
//   累積超過 duration 時,把多餘 slow 改為 fast 平衡(確保所有 tick 都在 duration 內)
function computeDelayedTickTimes(durationMs, fastIntervalMs, slowIntervalMs, delayRate, rng = Math.random) {
  if (durationMs <= 0) return []
  const expectedMs = (1 - delayRate) * fastIntervalMs + delayRate * slowIntervalMs
  if (expectedMs <= 0) return []
  const expectedTicks = durationMs / expectedMs
  const floorTicks = Math.floor(expectedTicks)
  const frac = expectedTicks - floorTicks
  const actualTicks = floorTicks + (rng() < frac ? 1 : 0)
  if (actualTicks <= 0) return []

  // 每個間隔獨立隨機抽 fast 或 slow
  const intervals = []
  for (let i = 0; i < actualTicks; i++) {
    intervals.push(rng() < delayRate ? slowIntervalMs : fastIntervalMs)
  }
  // 累積超過 duration 時,把 slow 改為 fast 直到可接受;最差情況全 fast 若仍超過則最後 tick clamp
  let totalMs = intervals.reduce((a, b) => a + b, 0)
  let guard = intervals.length
  while (totalMs > durationMs && guard-- > 0) {
    const idx = intervals.indexOf(slowIntervalMs)
    if (idx === -1) break
    intervals[idx] = fastIntervalMs
    totalMs -= (slowIntervalMs - fastIntervalMs)
  }

  // 累積輸出 tick 時間點;最後 tick 若仍超出 duration 則 clamp 至 duration
  const times = []
  let t = 0
  for (const iv of intervals) {
    t += iv
    times.push(Math.min(t, durationMs))
  }
  return times
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
      s.baseDamagePct = 0
      s.tickIntervalMs = 0
      s.tickIncreasePct = 0
      s.durationMs = 0
      s.level = 0
      s.tickTimes = null
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

      // onceOnly:戰鬥中只能觸發一次(例:Unreliable Memory 鏡像 Infinity)
      if (buff.onceOnly && s.activatedAt > 0) continue

      const initialDelayMs = buff.initialDelayBySpeed?.[attackSpeed] ?? 450
      const threshold = s.activatedAt === 0 ? initialDelayMs : s.cooldownUntil
      if (nowMs < threshold) continue

      // triggerAfter:必須等指定 buff 啟動過且已 expire 才能觸發
      if (buff.triggerAfter) {
        const tgt = state.stacks[buff.triggerAfter]
        if (!tgt || tgt.activatedAt === 0) continue
        if (nowMs < tgt.expireAt) continue
      }

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
      //   buff.mirror 指向另一個 buff(例:Unreliable Memory → Infinity)→ 複製鏡像目標 cfg
      let cfg, cfgLevel
      if (buff.mirror) {
        const mirrorBuff = BATTLE_BUFFS.find((b) => b.id === buff.mirror)
        if (!mirrorBuff) continue
        cfgLevel = (mirrorBuff.baseLevel || 1) + (combatOrdersActive ? 1 : 0)
        cfg = resolveActiveToggleStats(mirrorBuff, cfgLevel)
      } else {
        cfgLevel = (buff.baseLevel || 1) + (combatOrdersActive ? 1 : 0)
        cfg = resolveActiveToggleStats(buff, cfgLevel)
      }
      // 不吃 Buff Duration% 的 buff(例:Epic Adventure)直接用原始秒數
      const durationMult = cfg.ignoresBuffDuration ? 1 : (1 + (buffDurationPct || 0) / 100)
      const durationMs = cfg.durationSec * 1000 * durationMult
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
      s.baseDamagePct = cfg.baseDamagePct || 0
      s.tickIntervalMs = cfg.tickIntervalSec * 1000
      s.tickIncreasePct = cfg.tickIncreasePct
      s.durationMs = durationMs
      s.level = cfg.level
      // 伺服器延遲 tick 模擬:設定了 tickDelayedIntervalSec + tickServerDelayRate 就啟用
      if (cfg.tickDelayedIntervalSec > 0 && cfg.tickServerDelayRate > 0) {
        s.tickTimes = computeDelayedTickTimes(
          durationMs,
          cfg.tickIntervalSec * 1000,
          cfg.tickDelayedIntervalSec * 1000,
          cfg.tickServerDelayRate,
        )
      } else {
        s.tickTimes = null
      }
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
      //              啟動中若有 baseDamagePct(例:Epic Adventure +10%)→ 併入 Damage% 桶
      if (buff.source === 'activeToggle') {
        const fdPct = activeToggleFinalDmgPct(buff, nowMs)
        if (fdPct > 0) total.finalDmgMult *= 1 + fdPct / 100
        const s = state.stacks[buff.id]
        if (s && s.count > 0 && nowMs < s.expireAt) {
          const dmgPct = s.baseDamagePct || 0
          if (dmgPct > 0) total.dmgPct += dmgPct
        }
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
      // hideCooldown / onceOnly 的 buff 不顯示 CD(例:Unreliable Memory)
      const onCooldown = !buff.hideCooldown
        && !buff.onceOnly
        && !isActive
        && s.activatedAt > 0
        && s.cooldownUntil > nowMs
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
