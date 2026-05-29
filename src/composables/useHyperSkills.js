import { reactive, computed, watch } from 'vue'
import { HYPER_SKILLS, HYPER_SKILL_POINTS_CAP, hyperSkillGroups } from '../constants/hyperSkills.js'
import { useCharacter } from './useCharacter.js'
import { charKey } from './useActiveCharacter.js'

// 超技能 (Hyper Skills) — 5 點配點、每技能 1 點,靠 levelReq 解鎖
// 儲存:picked 陣列(保留順序僅作視覺,實際為 Set 語意)

const KEY = charKey('hyperSkills.v1')

function loadState() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { picked: [] }
    const obj = JSON.parse(raw)
    const picked = Array.isArray(obj?.picked) ? obj.picked.filter((x) => typeof x === 'string') : []
    // 去重 + 上限保護
    const uniq = [...new Set(picked)].slice(0, HYPER_SKILL_POINTS_CAP)
    return { picked: uniq }
  } catch { return { picked: [] } }
}

const state = reactive(loadState())

watch(
  () => [...state.picked],
  () => {
    try { localStorage.setItem(KEY, JSON.stringify({ picked: state.picked })) }
    catch { /* ignore */ }
  },
  { deep: true },
)

function skillById(id) { return HYPER_SKILLS.find((x) => x.id === id) || null }

export function useHyperSkills() {
  const { state: charState } = useCharacter()

  const groups = computed(() => hyperSkillGroups(charState.job))
  const applicableSkills = computed(() =>
    HYPER_SKILLS.filter((h) => !h.jobs || h.jobs.includes(charState.job)),
  )

  const pickedSet = computed(() => new Set(state.picked))
  const usedPoints = computed(() => state.picked.length)
  const remainingPoints = computed(() => Math.max(0, HYPER_SKILL_POINTS_CAP - usedPoints.value))

  function isPicked(id) { return pickedSet.value.has(id) }
  function meetsLevel(skill) { return charState.level >= (skill.levelReq || 0) }

  function canPick(id) {
    const sk = skillById(id)
    if (!sk) return false
    if (pickedSet.value.has(id)) return false
    if (usedPoints.value >= HYPER_SKILL_POINTS_CAP) return false
    if (!meetsLevel(sk)) return false
    if (sk.jobs && !sk.jobs.includes(charState.job)) return false
    return true
  }

  function toggle(id) {
    if (pickedSet.value.has(id)) {
      state.picked = state.picked.filter((x) => x !== id)
    } else if (canPick(id)) {
      state.picked = [...state.picked, id]
    }
  }

  function resetAll() {
    state.picked = []
  }

  // 針對給定的戰鬥技能 id,加總所有啟用中超技能的效果
  function effectsForSkill(skillId) {
    const bag = {
      damagePct: 0,
      burnDamagePct: 0,
      burnDurationBonusSec: 0,
      hitsPerCastBonus: 0,
      ignoreDefPct: 0,
      cooldownOwnPctRed: 0,
    }
    for (const id of state.picked) {
      const sk = skillById(id)
      if (!sk) continue
      if (sk.effect?.targetSkill !== skillId) continue
      for (const [k, v] of Object.entries(sk.effect)) {
        if (k === 'targetSkill') continue
        bag[k] = (bag[k] || 0) + (Number(v) || 0)
      }
    }
    return bag
  }

  return {
    state,
    HYPER_SKILL_POINTS_CAP,
    groups,
    applicableSkills,
    pickedSet,
    usedPoints,
    remainingPoints,
    isPicked,
    canPick,
    meetsLevel,
    toggle,
    resetAll,
    effectsForSkill,
  }
}
