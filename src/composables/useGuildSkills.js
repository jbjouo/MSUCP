import { reactive, watch } from 'vue'
import { charKey } from './useActiveCharacter.js'
import { GUILD_SKILLS, GUILD_SKILLS_BY_ID, GUILD_VISIBLE_GROUPS, guildSkillBag } from '../constants/guildSkills.js'

const STORAGE_KEY = charKey('guildSkills.v1')

function clampLevel(skill, val) {
  return Math.max(0, Math.min(skill.maxLevel, Math.floor(Number(val) || 0)))
}

function loadState() {
  const out = {}
  let parsed = null
  try { parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { parsed = null }
  for (const s of GUILD_SKILLS) out[s.id] = clampLevel(s, parsed?.[s.id])
  return out
}

const state = reactive(loadState())

watch(state, (v) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(v)) } catch { /* ignore */ }
}, { deep: true })

function setLevel(id, val) {
  const skill = GUILD_SKILLS_BY_ID[id]
  if (!skill) return
  state[id] = clampLevel(skill, val)
}

function guildLevel(id) {
  return state[id] || 0
}

// 普通技能(被動)— 依等級回傳 [{ skill, bag }],供 CP breakdown 使用
function guildPassiveBags() {
  const out = []
  for (const s of GUILD_SKILLS) {
    if (s.group !== 'normal' || !GUILD_VISIBLE_GROUPS.includes('normal')) continue
    const bag = guildSkillBag(s, guildLevel(s.id))
    if (bag) out.push({ skill: s, bag })
  }
  return out
}

export function useGuildSkills() {
  return { state, setLevel, guildLevel, guildPassiveBags, GUILD_SKILLS }
}
