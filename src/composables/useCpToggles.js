import { ref, watch } from 'vue'
import { SKILLS } from '../constants/skills.js'
import { BUFFS } from '../constants/buffs.js'

function applyDefaults(set) {
  for (const s of SKILLS) {
    if (s.cp?.defaultOn && !set.has(s.id)) {
      const group = s.cp.group
      if (group) {
        const hasGroupMember = SKILLS.some((o) => o.cp?.group === group && set.has(o.id))
        if (hasGroupMember) continue
      }
      set.add(s.id)
    }
  }
  return set
}
import { charKey } from './useActiveCharacter.js'

// CP 頁面 (以及戰鬥模擬器) 共用的「啟用中」狀態
// 讓 useCpDamage 不依賴 CpCalculatorPage 便可計算 attStatsInfo

const BUFFS_KEY = charKey('cpBuffs.v1')
const SKILLS_KEY = charKey('cpSkills.v1')
const TITLES_KEY = charKey('cpTitles.v1')
const ORDER_KEY = charKey('cpToggleOrder.v1')

function loadSetFromStorage(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return new Set()
    const arr = JSON.parse(raw)
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

const activeBuffs = ref(loadSetFromStorage(BUFFS_KEY))
const activeSkillIds = ref(applyDefaults(loadSetFromStorage(SKILLS_KEY)))
const activeTitleIds = ref(loadSetFromStorage(TITLES_KEY))

// buff / skill 開關的「開啟順序」(先開的在前)— 快照型效果用
//   例:Totalling Ring 只納入比它早開啟的臨時增益(MWGB 先開 → 戒指吃得到 MWGB 主屬)
//   只保留目前開啟中的 id;載入時缺漏者補在尾端(順序未知)
function sanitizeOrder(raw) {
  const active = new Set([...activeBuffs.value, ...activeSkillIds.value])
  const seen = new Set()
  const out = []
  for (const id of Array.isArray(raw) ? raw : []) {
    if (typeof id === 'string' && active.has(id) && !seen.has(id)) { out.push(id); seen.add(id) }
  }
  for (const id of active) if (!seen.has(id)) out.push(id)
  return out
}
const activationOrder = ref(sanitizeOrder((() => {
  try { return JSON.parse(localStorage.getItem(ORDER_KEY) || '[]') } catch { return [] }
})()))
watch(activationOrder, (v) => {
  try { localStorage.setItem(ORDER_KEY, JSON.stringify(v)) } catch { /* ignore */ }
}, { deep: true })

// 開關變動後同步順序:移除已關閉者,新開啟者(本次 id)移到最後
function syncOrder(turnedOnId) {
  const base = activationOrder.value.filter((id) => id !== turnedOnId)
  if (turnedOnId) base.push(turnedOnId)
  activationOrder.value = sanitizeOrder(base)
}

watch(activeBuffs, (v) => {
  try { localStorage.setItem(BUFFS_KEY, JSON.stringify([...v])) } catch { /* ignore */ }
}, { deep: true })
watch(activeSkillIds, (v) => {
  try { localStorage.setItem(SKILLS_KEY, JSON.stringify([...v])) } catch { /* ignore */ }
}, { deep: true })
watch(activeTitleIds, (v) => {
  try { localStorage.setItem(TITLES_KEY, JSON.stringify([...v])) } catch { /* ignore */ }
}, { deep: true })

export function useCpToggles() {
  function toggleBuff(id) {
    const s = new Set(activeBuffs.value)
    if (s.has(id)) {
      s.delete(id)
    } else {
      const target = BUFFS.find((x) => x.id === id)
      const targetGroup = target?.cp?.group
      if (targetGroup) {
        for (const other of BUFFS) {
          if (other.id === id) continue
          if (other.cp?.group === targetGroup) s.delete(other.id)
        }
      }
      s.add(id)
    }
    activeBuffs.value = s
    syncOrder(s.has(id) ? id : null)
  }
  function isBuffActive(id) { return activeBuffs.value.has(id) }

  function toggleSkill(id) {
    const s = new Set(activeSkillIds.value)
    if (s.has(id)) {
      s.delete(id)
    } else {
      const target = SKILLS.find((x) => x.id === id)
      const targetGroup = target?.cp?.group
      if (targetGroup) {
        for (const other of SKILLS) {
          if (other.id === id) continue
          if (other.cp?.group === targetGroup) s.delete(other.id)
        }
      }
      s.add(id)
    }
    activeSkillIds.value = s
    syncOrder(s.has(id) ? id : null)
  }
  function isSkillActive(id) { return activeSkillIds.value.has(id) }

  function toggleTitle(id) {
    const isOn = activeTitleIds.value.has(id)
    activeTitleIds.value = isOn ? new Set() : new Set([id])
  }
  function isTitleActive(id) { return activeTitleIds.value.has(id) }

  // 開啟順序索引(0 起算);未開啟 → -1
  function activationIndexOf(id) { return activationOrder.value.indexOf(id) }

  return {
    activeBuffs,
    activeSkillIds,
    activeTitleIds,
    activationOrder,
    activationIndexOf,
    toggleBuff,
    toggleSkill,
    toggleTitle,
    isBuffActive,
    isSkillActive,
    isTitleActive,
  }
}
