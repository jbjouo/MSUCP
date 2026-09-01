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
  }
  function isSkillActive(id) { return activeSkillIds.value.has(id) }

  function toggleTitle(id) {
    const isOn = activeTitleIds.value.has(id)
    activeTitleIds.value = isOn ? new Set() : new Set([id])
  }
  function isTitleActive(id) { return activeTitleIds.value.has(id) }

  return {
    activeBuffs,
    activeSkillIds,
    activeTitleIds,
    toggleBuff,
    toggleSkill,
    toggleTitle,
    isBuffActive,
    isSkillActive,
    isTitleActive,
  }
}
