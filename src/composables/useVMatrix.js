import { reactive, computed, watch } from 'vue'
import { VMATRIX_SKILLS, VMATRIX_MAX_LEVEL, passiveValueAt, skillAvailableForJob, maxLevelOf } from '../constants/vmatrix.js'
import { useCharacter } from './useCharacter.js'
import { charKey } from './useActiveCharacter.js'

const STORAGE_KEY = charKey('vmatrix.v1')

const SKILL_BY_ID = Object.fromEntries(VMATRIX_SKILLS.map((s) => [s.id, s]))

function defaultLevels() {
  const map = {}
  for (const s of VMATRIX_SKILLS) map[s.id] = 0
  return map
}

function clampForSkill(id, n) {
  const cap = maxLevelOf(SKILL_BY_ID[id])
  return Math.max(0, Math.min(cap, Math.floor(Number(n) || 0)))
}

// 共用 V 矩陣 core 的技能分組:skill.vmatrix.coreGroupId
// (例:Teleport Mastery ↔ Creeping Toxin 共用同一個 core)
const CORE_GROUPS = (() => {
  const map = {}
  for (const s of VMATRIX_SKILLS) {
    const gid = s.vmatrix?.coreGroupId
    if (!gid) continue
    if (!map[gid]) map[gid] = []
    map[gid].push(s.id)
  }
  return map
})()

// 取得與 id 共用 core 的其他技能 id(不含自己);無共用回傳空陣列
function coreGroupPeers(id) {
  const gid = SKILL_BY_ID[id]?.vmatrix?.coreGroupId
  if (!gid) return []
  return (CORE_GROUPS[gid] || []).filter((x) => x !== id)
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      const levels = defaultLevels()
      for (const s of VMATRIX_SKILLS) {
        levels[s.id] = clampForSkill(s.id, parsed?.levels?.[s.id])
      }
      // 同步 coreGroupId 共用組 — 取該組最高等作為共用等級(修正舊檔不一致狀態)
      for (const ids of Object.values(CORE_GROUPS)) {
        let best = 0
        for (const id of ids) if (levels[id] > best) best = levels[id]
        for (const id of ids) levels[id] = clampForSkill(id, best)
      }
      return { levels }
    }
  } catch { /* fall through */ }
  return { levels: defaultLevels() }
}

const state = reactive(loadState())

watch(state, (s) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)) } catch { /* ignore */ }
}, { deep: true })

export function useVMatrix() {
  const { state: charState, currentJob } = useCharacter()

  function setLevel(id, lv) {
    if (!(id in state.levels)) return
    const val = clampForSkill(id, lv)
    state.levels[id] = val
    // 同步共用 core 組的其他技能 — 等級完全一致
    for (const peerId of coreGroupPeers(id)) {
      if (peerId in state.levels) state.levels[peerId] = clampForSkill(peerId, val)
    }
  }
  function reset() {
    for (const s of VMATRIX_SKILLS) state.levels[s.id] = 0
  }

  // 依目前職業可見的技能 (含通用 + 該職業專屬)
  const visibleSkills = computed(() => {
    const jobKey = charState.job
    const branchKey = currentJob.value?.branch || charState.branch
    return VMATRIX_SKILLS.filter((s) => skillAvailableForJob(s, jobKey, branchKey))
  })

  // CP 計算機用 — 只有 kind:'skill' 且帶 passive 的 VM 才貢獻 CP 屬性;
  // boost core(增強 1-4 轉技能)不貢獻 CP,等級只影響戰鬥模擬。
  const statContributions = computed(() => {
    const jobKey = charState.job
    const branchKey = currentJob.value?.branch || charState.branch
    const out = []
    for (const s of VMATRIX_SKILLS) {
      const passive = s.vmatrix?.passive
      if (!passive || s.vmatrix?.kind !== 'skill') continue
      if (!skillAvailableForJob(s, jobKey, branchKey)) continue
      const lv = state.levels[s.id] || 0
      if (lv <= 0) continue
      const v = passiveValueAt(s, lv)
      if (v <= 0) continue
      let stats = null
      if (passive.type === 'allStat') stats = { allStat: v }
      else if (passive.type === 'attMatk') stats = { atk: v, matk: v }
      else if (passive.type === 'stat' && passive.statKey) stats = { [passive.statKey]: v }
      if (!stats) continue
      out.push({
        id: s.id,
        nameKey: s.vmatrix?.nameKey || s.nameKey,
        level: lv,
        fixed: !!passive.fixed,
        stats,
      })
    }
    return out
  })

  return {
    state,
    setLevel,
    reset,
    visibleSkills,
    statContributions,
    MAX_LEVEL: VMATRIX_MAX_LEVEL,
  }
}
