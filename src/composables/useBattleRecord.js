import { reactive, computed } from 'vue'
import { charKey } from './useActiveCharacter.js'
import { useBattleBuffs } from './useBattleBuffs.js'
import { useCharacter } from './useCharacter.js'

const STORAGE_KEY = charKey('battleRecord.v1')

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY.value)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return null
}

function persist(data) {
  if (data) {
    localStorage.setItem(STORAGE_KEY.value, JSON.stringify(data))
  } else {
    localStorage.removeItem(STORAGE_KEY.value)
  }
}

// 所有影響 ATT STATS boss 傷害公式的 stat key
// boss = (4×主屬+副屬) × ATT/100 × weaponConst × (1+(Dmg%+BossDmg%)/100) × (1+FinalDmg%/100)
// bossMax = boss × (1.5 + CritDmg%/100)
// bossMin = boss × (1.2 + CritDmg%/100) × mastery/100
const RECORD_KEYS = [
  'str', 'dex', 'int', 'luk',
  'atk', 'matk',
  'dmgPct', 'bossDmg', 'finalDmgPct',
  'ignoreDef', 'critRate', 'critDmg',
]

function emptySnapshot() {
  return Object.fromEntries(RECORD_KEYS.map(k => [k, 0]))
}

const state = reactive({
  recording: false,
  snapshots: [],
  savedRecord: loadState(),
})

let lastSnapshotSec = -1

function startRecording() {
  state.recording = true
  state.snapshots = []
  lastSnapshotSec = -1
}

function onTick(elapsedMs, _result) {
  if (!state.recording) return
  const sec = Math.floor(elapsedMs / 1000)
  if (sec <= lastSnapshotSec) return
  lastSnapshotSec = sec

  const { state: charState } = useCharacter()
  const jobKey = charState.job || ''
  const bonuses = useBattleBuffs().currentBonuses(jobKey, elapsedMs)

  const snap = emptySnapshot()
  snap.dmgPct = bonuses.dmgPct || 0
  snap.ignoreDef = bonuses.ignoreDefPct || 0
  snap.finalDmgPct = Math.round(((bonuses.finalDmgMult || 1) - 1) * 10000) / 100

  state.snapshots.push(snap)
}

function stopRecording(result) {
  state.recording = false
  if (!result || !state.snapshots.length) return

  const n = state.snapshots.length
  const avg = emptySnapshot()
  for (const key of RECORD_KEYS) {
    const sum = state.snapshots.reduce((acc, s) => acc + (s[key] || 0), 0)
    avg[key] = Math.round((sum / n) * 100) / 100
  }

  const record = {
    durationSec: result.durationSec,
    totalDmg: result.totalDmg,
    snapshotCount: n,
    avg,
    recordedAt: new Date().toISOString(),
  }
  state.savedRecord = record
  persist(record)
}

function clearRecord() {
  state.savedRecord = null
  persist(null)
}

const hasRecord = computed(() => !!state.savedRecord)

const recordAvg = computed(() => {
  const r = state.savedRecord
  if (!r?.avg) return emptySnapshot()
  return r.avg
})

export function useBattleRecord() {
  return {
    state,
    RECORD_KEYS,
    startRecording,
    onTick,
    stopRecording,
    clearRecord,
    hasRecord,
    recordAvg,
  }
}
