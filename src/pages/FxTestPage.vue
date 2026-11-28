<script setup>
// 技能動畫測試頁(不在選單,只能打網址 /fx-test 進入)— 素材由 ../msu-wz/tools/export_skill.py / export_avatar.py 匯出到 ../msu-wz/web/,
//   再複製到 public/fx-assets/:rsync -a --exclude summary.json ../msu-wz/web/luminous ../msu-wz/web/avatar public/fx-assets/
//   <job>/index.json                 技能清單 [{ skillId, name, img, nodes: { <node>: { frames, durationMs, props } }, actions }]
//   <job>/<skillId>/<node>/meta.json 逐格 { file, w, h, origin, delay, z, a0?, a1? }
//   avatar/index.json                角色(export_avatar.py 預先合成)  { poses: { <姿勢>: [{ delay, file, origin }] } };缺少 → 佔位人形
// 操控(參考 meaegi 遊樂場 / 楓之谷原版數值):
//   ←→ 走(最高 200px/s,加速 1400、減速 1300)、Space/Alt 跳(初速 682.65,重力 2000,最大落速 670)、↓ 趴下
//   Shift 瞬移(Light Speed 27001002;距離 = common x = 110+8x,滿等 190px;冷卻 300ms 暫定);搭配 ←→ 決定方向,否則朝面向
//     ↑ + Shift 垂直瞬移(僅跳躍中可用;common y = 270+5x,滿等 320px,推測)
//   快捷鍵 Q W E R T / A S D F G 放技能(預設 A 光反射 / S 暗黑烈焰 / D 絕對擊殺),按住連發;地面施放期間不能移動(動作總長 = 依攻速換算)
// 播放規則(暫定,非最終):
//   施放類節點畫在「施放當下」的角色腳底;hit / mob 畫在假怪物中心
//   ball / shootobj 出手點才出現,路徑 = 發射點(BALL_EMIT;Reflection 為鏡子中心)→ 目標中心(MISS 時不播放):
//     寬 ≥ 300 的長光束(Reflection)旋轉 + 依距離裁切 / 拉伸;小型飛行物在播放期間線性飛過去
//   攻速:角色動作每格 × (20 − Stage)/16,最後一格最低 30ms,總和進位到 30ms(masonym.dev,夜光 Stage 8 實測吻合)
//     技能特效依分類開關乘上同一倍率(不取整)
//   命中:hitAfter = 命中動畫「內」的傷害時點,命中動畫與施放同時開始(Ender 實測);
//     delayedTime(推測)= 命中動畫延後開始;皆無 → 命中動畫從出手點開始
//   hit.N 為隨機變體(onlyOnce)→ 每組隨機取 1 個;素材預設角色面向左,面向右時以錨點水平鏡像
// hitbox:技能 common 的 lt / rb(相對腳底、面向左;面向右時水平翻轉),與假怪物框有重疊才命中(不播 hit 特效 = MISS)
//   info.chainAttack(Reflection「光箭命中後分裂濺射」):判定 = 前方 range;lt / rb = 以命中目標為中心的濺射範圍(藍虛線)
//   只有 range 的技能 → 前方 range × 100 的近似框(虛線);都沒有 → 不判定(一律命中)
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const BASE = `${import.meta.env.BASE_URL}fx-assets`
const JOBS = ['luminous']

const job = ref(JOBS[0])
const skills = ref([])
const loadError = ref('')
const activeSkill = ref(null)
const activeNodes = ref([])
const loop = ref(false)
const speed = ref(1)
const showGuide = ref(true)
const loading = ref(false)
const delayHits = ref(true)
const cursorMs = ref(0)
const cycleMs = ref(0)
const hitMarks = ref([])
const stage = ref(8)
const STAGES = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1]
const scaleCast = ref(true)
const scaleHit = ref(true)
const scaleOther = ref(false)
const asMult = computed(() => (20 - stage.value) / 16)

function nodeCategory(node) {
  const head = node.split('.')[0]
  if (head === 'hit' || head === 'mob' || head === 'specialAffected') return 'hit'
  if (['ball', 'shootobj', 'tile', 'screen'].includes(head)) return 'other'
  return 'cast'
}
function nodeScaled(node) {
  const c = nodeCategory(node)
  return c === 'cast' ? scaleCast.value : c === 'hit' ? scaleHit.value : scaleOther.value
}
function nodeProp(skill, node, key) {
  const v = skill?.nodes?.[node]?.props?.[key]
  return typeof v === 'number' ? v : null
}
function nodeHitDelay(skill, node) {
  return nodeProp(skill, node, 'hitAfter') ?? nodeProp(skill, node, 'delayedTime')
}
function isHitNode(node) {
  const head = node.split('.')[0]
  return head === 'hit' || head === 'mob'
}
function primaryAction(skill) {
  return skill?.actions?.find((a) => a.frames) || null
}

// 依攻速換算角色動作 → { frames: [{ pose, frame, base, scaled, pre, floored }], rawTotal, total, preHit }
function scaleAction(act, st) {
  if (!act?.frames) return null
  const mult = (20 - st) / 16
  const n = act.frames.length
  const frames = act.frames.map(([pose, frame, d], i) => {
    const base = Math.abs(d)
    let scaled = base * mult
    let floored = false
    if (i === n - 1 && base > 0 && scaled < 30) { scaled = 30; floored = true }
    return { pose, frame, base, scaled, pre: d <= 0, floored }
  })
  const rawTotal = frames.reduce((sum, f) => sum + f.scaled, 0)
  let preHit = 0
  for (const f of frames) {
    if (!f.pre) break
    preHit += f.scaled
  }
  return { frames, rawTotal, total: Math.ceil(rawTotal / 30 - 1e-9) * 30, preHit }
}

// ── 舞台 ─────────────────────────────────────────────────────────────────
const STAGE_W = 960
const STAGE_H = 540
const GROUND_Y = 400
const MOB_X = 260
const MOB_W = 90
const MOB_H = 110
const SPAWN_X = 620
const MOB_RECT = { x1: MOB_X - MOB_W / 2, y1: GROUND_Y - MOB_H, x2: MOB_X + MOB_W / 2, y2: GROUND_Y }
const showHitbox = ref(true)

// 技能範圍 → 畫面座標矩形 { x1, y1, x2, y2, approx };無資料回 null
function hitboxRect(skill, cx, cy, facing) {
  const hb = skill?.hitbox
  if (!hb) return null
  let lt = hb.lt
  let rb = hb.rb
  let approx = false
  // chainAttack(Reflection):判定 = 前方 range;lt / rb 是命中後以目標為中心的濺射範圍(見 splashRect)
  if (!lt || !rb || (hb.chainAttack && hb.range)) {
    if (!hb.range) return null
    lt = [-hb.range, -100]
    rb = [0, 0]
    approx = true
  }
  const [x1, x2] = facing === 'right' ? [cx - rb[0], cx - lt[0]] : [cx + lt[0], cx + rb[0]]
  return { x1, y1: cy + lt[1], x2, y2: cy + rb[1], approx }
}
// 連鎖攻擊的濺射範圍:以第一個命中目標(假怪物中心)為原點
function splashRect(skill, facing) {
  const hb = skill?.hitbox
  if (!hb?.chainAttack || !hb.lt || !hb.rb) return null
  const cx = MOB_X
  const cy = GROUND_Y - MOB_H / 2
  const [x1, x2] = facing === 'right' ? [cx - hb.rb[0], cx - hb.lt[0]] : [cx + hb.lt[0], cx + hb.rb[0]]
  return { x1, y1: cy + hb.lt[1], x2, y2: cy + hb.rb[1] }
}
const overlaps = (a, b) => a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1
function hitboxLabel(skill) {
  const hb = skill?.hitbox
  if (!hb) return t('fxTest.noHitbox')
  const parts = []
  if (hb.chainAttack && hb.range) {
    parts.push(`range ${hb.range}`)
    if (hb.lt && hb.rb) parts.push(`${t('fxTest.splash')} ${hb.rb[0] - hb.lt[0]}×${hb.rb[1] - hb.lt[1]}`)
  } else if (hb.lt && hb.rb) parts.push(`${hb.rb[0] - hb.lt[0]}×${hb.rb[1] - hb.lt[1]}`)
  else if (hb.range) parts.push(`range ${hb.range}`)
  if (hb.mobCount) parts.push(`${hb.mobCount} mob`)
  if (hb.attackCount) parts.push(`×${hb.attackCount}`)
  return parts.join(' · ') || t('fxTest.noHitbox')
}

const GROUPS = [
  { key: 'adv1', test: (img) => img === '2700.img' },
  { key: 'adv2', test: (img) => img === '2710.img' },
  { key: 'adv3', test: (img) => img === '2711.img' },
  { key: 'adv4', test: (img) => img === '2712.img' },
  { key: 'v', test: (img) => img.startsWith('4000') },
]
const grouped = computed(() => GROUPS.map((g) => ({
  key: g.key,
  skills: skills.value.filter((s) => g.test(s.img)),
})).filter((g) => g.skills.length))

async function loadJob() {
  loadError.value = ''
  skills.value = []
  try {
    const res = await fetch(`${BASE}/${job.value}/index.json`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    skills.value = await res.json()
  } catch (e) {
    loadError.value = String(e.message || e)
  }
}

// ── 素材快取 ──────────────────────────────────────────────────────────────
const metaCache = new Map()
const imgCache = new Map()
function loadImage(url) {
  if (imgCache.has(url)) return imgCache.get(url)
  const p = new Promise((resolve) => {
    const im = new Image()
    im.onload = () => resolve(im)
    im.onerror = () => resolve(null)
    im.src = url
  })
  imgCache.set(url, p)
  return p
}
async function loadNode(skillId, node) {
  const key = `${job.value}/${skillId}/${node}`
  if (metaCache.has(key)) return metaCache.get(key)
  const p = (async () => {
    const dir = `${BASE}/${key}`
    const meta = await (await fetch(`${dir}/meta.json`)).json()
    const frames = await Promise.all(meta.frames.map(async (f) => ({
      ...f,
      img: f.file ? await loadImage(`${dir}/${f.file}`) : null,
    })))
    const total = frames.reduce((s, f) => s + f.delay, 0)
    return { node, frames, total, z: Number(frames[0]?.z) || 0 }
  })()
  metaCache.set(key, p)
  return p
}

// 角色:每格一張預先合成的圖(origin = 腳底);沒有資料 → 佔位人形
const body = ref(null)
const bodyImgs = new Map()
const bodyReady = ref(false)
async function loadBody() {
  try {
    const res = await fetch(`${BASE}/avatar/index.json`)
    if (!res.ok) return
    const data = await res.json()
    const files = new Set()
    for (const frames of Object.values(data.poses || {})) for (const f of frames) if (f.file) files.add(f.file)
    await Promise.all([...files].map(async (f) => bodyImgs.set(f, await loadImage(`${BASE}/avatar/${f}`))))
    body.value = data
    bodyReady.value = files.size > 0
  } catch { /* 無角色資料 → 佔位 */ }
}

// ── 角色控制(平地版 stepBody)──────────────────────────────────────────
const WALK_MAX = 200
const WALK_ACC = 1400
const WALK_DEC = 1300
const AIR_ACC = 200
const JUMP_V = 682.65
const GRAVITY = 2000
const FALL_MAX = 670

const player = {
  x: SPAWN_X, y: 0, vx: 0, vy: 0, facing: 'left', prone: false,
  act: null, actStart: 0, actUntil: 0,
}
const keys = { left: false, right: false, up: false, down: false, jumpPressed: false, shift: false }
const TELEPORT_ID = 27001002
// 距離:common x = 110+8x 滿等 190;垂直 common y = 270+5x 滿等 320(推測)
// 連發間隔 = common time 720ms(使用者比對遊戲手感選定;300 太快)
const teleportDist = ref(190)
const teleportUp = ref(320)
const teleportCooldown = ref(720)
let lastTeleport = -Infinity

// 瞬移:施放硬直中也可用(硬直照算);effect 跟著角色(follow),角色移到目的地(空中:上升速度歸零直接下墜,已在下墜則保留)
function teleport() {
  if (gameNow - lastTeleport < teleportCooldown.value) return   // 施放硬直中也能瞬移(硬直不中斷,仍不能走路)
  const airborne = player.y < 0 || player.vy < 0
  if (keys.up && !airborne) return   // 垂直瞬移只能在跳躍中使用
  lastTeleport = gameNow
  if (keys.up) {
    // ↑ + Shift:垂直瞬移(僅空中;往上 TELEPORT_UP,之後自由落下)
    player.y = Math.max(-(GROUND_Y - 80), player.y - teleportUp.value)
  } else {
    const dir = keys.right && !keys.left ? 1 : keys.left && !keys.right ? -1 : player.facing === 'right' ? 1 : -1
    if (gameNow >= player.actUntil) player.facing = dir > 0 ? 'right' : 'left'   // 硬直中瞬移不轉向
    player.x = Math.max(30, Math.min(STAGE_W - 30, player.x + dir * teleportDist.value))
  }
  player.vx = 0
  if (player.vy < 0) player.vy = 0   // 空中瞬移:上升動能歸零,直接開始下墜
  const skill = skillById(TELEPORT_ID)
  if (!skill) return
  loadNode(TELEPORT_ID, 'effect').then((tr) => {
    casts.push({
      skill, start: gameNow, facing: player.facing, cycle: tr.total, onlyNode: 'effect', hb: null, inRange: true, fx: true,
      tracks: [{ ...tr, anchor: null, follow: true, offset: 0, dmgAt: null }],
    })
  })
}
const approach = (v, target, d) => (v < target ? Math.min(v + d, target) : Math.max(v - d, target))

function stepPlayer(dt) {
  const p = player
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
  const locked = gameNow < p.actUntil
  const onGround = p.y >= 0 && p.vy >= 0
  p.prone = false
  if (!locked && dir) p.facing = dir > 0 ? 'right' : 'left'
  if (onGround) {
    if (locked) p.vx = 0
    else if (keys.jumpPressed) {
      p.vy = -JUMP_V
      p.y = -0.01
      if (dir && dir * p.vx < 160) p.vx = Math.max(-WALK_MAX, Math.min(WALK_MAX, p.vx + 0.8 * dir * WALK_MAX))
    } else if (keys.down && !dir) {
      p.vx = 0
      p.prone = true
    } else {
      let v = p.vx
      if (Math.abs(v) > WALK_MAX) v = Math.sign(v) * Math.max(WALK_MAX, Math.abs(v) - WALK_DEC * dt)
      if (!dir) v = approach(v, 0, WALK_DEC * dt)
      else if (dir * v < WALK_MAX) v = dir * Math.min(WALK_MAX, dir * v + WALK_ACC * dt)
      p.vx = v
    }
  }
  keys.jumpPressed = false
  const vx0 = p.vx
  const vy0 = p.vy
  if (p.y < 0 || p.vy < 0) {
    if (!locked && dir && dir * p.vx < WALK_MAX) p.vx = approach(p.vx, dir * WALK_MAX, AIR_ACC * dt)
    p.vy = p.vy > FALL_MAX ? Math.max(FALL_MAX, p.vy - 100 * dt) : Math.min(FALL_MAX, p.vy + GRAVITY * dt)
  }
  p.x += ((vx0 + p.vx) / 2) * dt
  p.y += ((vy0 + p.vy) / 2) * dt
  if (p.y >= 0) { p.y = 0; p.vy = 0 }
  if (p.x < 30) { p.x = 30; p.vx = 0 }
  if (p.x > STAGE_W - 30) { p.x = STAGE_W - 30; p.vx = 0 }
}

// 目前姿勢 → [pose, frame]
function poseCycle(name, fallbackDelay) {
  const frames = body.value?.poses?.[name]
  if (!frames?.length) return [name, 0]
  const total = frames.reduce((s, f) => s + (f.delay || fallbackDelay), 0)
  let tt = gameNow % total
  for (let i = 0; i < frames.length; i++) {
    tt -= frames[i].delay || fallbackDelay
    if (tt < 0) return [name, i]
  }
  return [name, 0]
}
function currentPose() {
  const p = player
  if (p.act && gameNow < p.actUntil) {
    let tt = gameNow - p.actStart
    const fr = p.act.frames
    for (const f of fr) {
      if (tt < f.scaled) return [f.pose, f.frame, true]
      tt -= f.scaled
    }
    const last = fr[fr.length - 1]
    return [last.pose, last.frame, true]
  }
  if (p.y < 0) return ['jump', 0]
  if (p.prone) return ['prone', 0]
  if (Math.abs(p.vx) > 1) return poseCycle('walk1', 180)
  return poseCycle('stand1', 500)
}

// ── 快捷欄 ────────────────────────────────────────────────────────────────
const SLOT_CODES = ['KeyQ', 'KeyW', 'KeyE', 'KeyR', 'KeyT', 'KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG']
const SLOT_LABEL = (code) => code.replace('Key', '')
// 預設只放光暗基本攻擊:A 光反射 Reflection / S 暗黑烈焰 Apocalypse / D 絕對擊殺 Ender
const DEFAULT_SLOTS = [null, null, null, null, null, 27121100, 27121202, 27121303, null, null]
const SLOT_STORE = 'msucp.fxTest.slots.v2'
function loadSlots() {
  try {
    const v = JSON.parse(localStorage.getItem(SLOT_STORE) || 'null')
    if (Array.isArray(v) && v.length === SLOT_CODES.length) return v
  } catch { /* 忽略 */ }
  return [...DEFAULT_SLOTS]
}
const slots = ref(loadSlots())
const selectingSlot = ref(null)
function saveSlots() {
  try { localStorage.setItem(SLOT_STORE, JSON.stringify(slots.value)) } catch { /* 忽略 */ }
}
const skillById = (id) => skills.value.find((s) => s.skillId === id) || null
function clickSlot(i) {
  selectingSlot.value = selectingSlot.value === i ? null : i
}
function clearSlot(i) {
  slots.value[i] = null
  saveSlots()
}
const heldSlots = []   // 按住中的快捷鍵(後按的優先)

// ── 施放 ─────────────────────────────────────────────────────────────────
let casts = []          // [{ skill, start, facing, tracks, cycle, onlyNode }]
let lastCast = null
let castPending = false

// ball.front / ball.rear = 光束頭尾的淡出遮罩(黑色 + alpha 漸層),不是特效本身 → 不直接播放
const MASK_NODE = /^(ball|shootobj)\.(front|rear)$/
function pickVariants(names) {
  const groups = new Map()
  const out = []
  for (const n of names) {
    if (MASK_NODE.test(n)) continue
    const m = n.match(/^(hit\d*|mob\d*)\.(\d+)$/)
    if (!m) { out.push(n); continue }
    if (!groups.has(m[1])) groups.set(m[1], [])
    groups.get(m[1]).push(n)
  }
  for (const list of groups.values()) out.push(list[Math.floor(Math.random() * list.length)])
  return out
}

function anchorFor(node, cx, cy) {
  const head = node.split('.')[0]
  if (head === 'hit' || head === 'mob' || head === 'specialAffected') return { x: MOB_X, y: GROUND_Y - MOB_H / 2 }
  if (head === 'ball' || head === 'shootobj') return { x: cx, y: cy }
  if (head === 'screen') return { x: STAGE_W / 2, y: STAGE_H / 2 }
  return { x: cx, y: cy }
}

// 技能按鈕 / 節點按鈕 / 快捷鍵共用入口
function onSkillButton(skill, onlyNode = null) {
  if (selectingSlot.value != null && !onlyNode) {
    slots.value[selectingSlot.value] = skill.skillId
    saveSlots()
    selectingSlot.value = null
    return
  }
  cast(skill, onlyNode, true)
}

async function cast(skill, onlyNode = null, force = false) {
  if (castPending) return
  if (!force && gameNow < player.actUntil) return
  castPending = true
  const names = onlyNode ? [onlyNode] : pickVariants(Object.keys(skill.nodes))
  loading.value = true
  const loaded = await Promise.all(names.map((n) => loadNode(skill.skillId, n)))
  loading.value = false
  castPending = false
  const sc = scaleAction(primaryAction(skill), stage.value)
  const hitAt = delayHits.value ? (sc?.preHit || 0) : 0
  const cx = player.x
  const cy = GROUND_Y + player.y
  const hb = hitboxRect(skill, cx, cy, player.facing)
  const inRange = !hb || overlaps(hb, MOB_RECT)
  // 飛行路徑:發射點 → 目標中心
  const [emitX, emitY] = BALL_EMIT[skill.skillId] || BALL_EMIT.default
  const from = { x: cx + (player.facing === 'right' ? -emitX : emitX), y: cy + emitY }
  const to = { x: MOB_X, y: GROUND_Y - MOB_H / 2 }
  // MISS:不播 hit / mob,也不播 ball / shootobj
  const tracks = loaded.filter((tr) => inRange || !(isHitNode(tr.node) || /^(ball|shootobj)(\.|$)/.test(tr.node))).map((tr) => {
    const f = nodeScaled(tr.node) ? asMult.value : 1
    const frames = f === 1 ? tr.frames : tr.frames.map((fr) => ({ ...fr, delay: fr.delay * f }))
    const total = frames.reduce((sum, fr) => sum + fr.delay, 0)
    let offset = 0
    let dmgAt = null
    // 光束 / 飛行物:出手點才發射(出手前不顯示)
    if (/^(ball|shootobj)(\.|$)/.test(tr.node) && delayHits.value) offset = hitAt
    if (isHitNode(tr.node)) {
      const ha = nodeProp(skill, tr.node, 'hitAfter')
      const dt = nodeProp(skill, tr.node, 'delayedTime')
      if (ha != null) { offset = 0; dmgAt = ha * f }
      else {
        offset = !delayHits.value ? 0 : dt != null ? dt * f : hitAt
        dmgAt = offset
      }
    }
    const z = nodeProp(skill, tr.node, 'z') ?? tr.z
    const travel = /^(ball|shootobj)(\.|$)/.test(tr.node)
      ? { from, to, beam: (tr.frames[0]?.w || 0) >= 300 }
      : null
    return { ...tr, frames, total, z, anchor: anchorFor(tr.node, cx, cy), offset, dmgAt, travel }
  }).sort((a, b) => a.z - b.z)
  const cycle = Math.max(sc?.total || 0, ...tracks.map((tr) => tr.offset + tr.total))
  // 角色動作:地面施放期間鎖定移動
  player.act = sc
  player.actStart = gameNow
  player.actUntil = gameNow + (sc?.total || 0)
  const splash = hb && inRange ? splashRect(skill, player.facing) : null
  const c = { skill, start: gameNow, facing: player.facing, tracks, cycle, onlyNode, hb, inRange, splash }
  casts.push(c)
  lastCast = c
  activeSkill.value = skill
  activeNodes.value = names
  cycleMs.value = cycle
  hitMarks.value = tracks.filter((tr) => tr.dmgAt != null).map((tr) => ({ node: tr.node, at: tr.dmgAt }))
}

function stop() {
  casts = []
  lastCast = null
  player.act = null
  player.actUntil = 0
  activeNodes.value = []
}

// ── 繪製 ─────────────────────────────────────────────────────────────────
const canvasRef = ref(null)
const focused = ref(false)

function frameAt(track, elapsed) {
  if (elapsed < 0) return null   // 尚未開始(延後播放的 hit / ball)
  let t0 = 0
  for (const f of track.frames) {
    if (elapsed < t0 + f.delay) return { f, p: (elapsed - t0) / f.delay }
    t0 += f.delay
  }
  return null
}

function drawSprite(ctx, img, ax, ay, ox, oy, mirror) {
  if (mirror) {
    ctx.save()
    ctx.translate(ax, 0)
    ctx.scale(-1, 1)
    ctx.drawImage(img, -ox, ay - oy)
    ctx.restore()
  } else {
    ctx.drawImage(img, ax - ox, ay - oy)
  }
}

// 飛行物發射點(相對腳底、面向左):Reflection = 鏡子中心(出手點第 6 格白光位置);其他 = 手的位置(meaegi 預設 [-30, -40])
const BALL_EMIT = {
  27121100: [-90, -40],
  default: [-30, -40],
}

// 長光束:素材朝左、origin 在發射端 → 旋轉到 from→to 方向,依距離裁切(不足時拉伸)
function drawBeam(ctx, f, from, to) {
  const img = f.img
  const D = Math.hypot(to.x - from.x, to.y - from.y)
  if (D < 1) return
  const ox = f.origin[0]
  const oy = f.origin[1]
  const k = D > ox ? D / ox : 1
  const sx = Math.max(0, ox - D)
  ctx.save()
  ctx.translate(from.x, from.y)
  ctx.rotate(Math.atan2(to.y - from.y, to.x - from.x) - Math.PI)
  ctx.drawImage(img, sx, 0, img.width - sx, img.height, -(ox - sx) * k, -oy, (img.width - sx) * k, img.height)
  ctx.restore()
}

function drawTracks(ctx, behind) {
  for (const c of casts) {
    const elapsed = gameNow - c.start
    for (const tr of c.tracks) {
      if ((tr.z < 0) !== behind) continue
      const hit = frameAt(tr, elapsed - tr.offset)
      if (!hit?.f.img) continue
      const { f, p } = hit
      const a0 = f.a0 ?? 255
      const a1 = f.a1 ?? a0
      ctx.globalAlpha = Math.max(0, Math.min(1, (a0 + (a1 - a0) * p) / 255))
      if (tr.travel?.beam) {
        drawBeam(ctx, f, tr.travel.from, tr.travel.to)
        ctx.globalAlpha = 1
        continue
      }
      if (tr.travel) {
        // 小型飛行物:播放期間由角色飛向目標
        const k = Math.min(1, (elapsed - tr.offset) / Math.max(1, tr.total))
        const px = tr.travel.from.x + (tr.travel.to.x - tr.travel.from.x) * k
        const py = tr.travel.from.y + (tr.travel.to.y - tr.travel.from.y) * k
        drawSprite(ctx, f.img, px, py, f.origin[0], f.origin[1], tr.travel.to.x > tr.travel.from.x)
        ctx.globalAlpha = 1
        continue
      }
      const ax = tr.follow ? player.x : tr.anchor.x
      const ay = tr.follow ? GROUND_Y + player.y : tr.anchor.y
      const fc = tr.follow ? player.facing : c.facing
      drawSprite(ctx, f.img, ax, ay, f.origin[0], f.origin[1], fc === 'right')
      ctx.globalAlpha = 1
    }
  }
}

function drawPlayer(ctx) {
  const x = player.x
  const y = GROUND_Y + player.y
  const mirror = player.facing === 'right'
  const [pose, frame, casting] = currentPose()
  const fr = body.value?.poses?.[pose]?.[frame]
  const im = fr?.file && bodyImgs.get(fr.file)
  if (bodyReady.value && im) {
    drawSprite(ctx, im, x, y, fr.origin[0], fr.origin[1], mirror)
    return
  }
  // 佔位人形(素材面向左;dir = 面向)
  const dir = mirror ? 1 : -1
  const h = player.prone ? 26 : 64
  ctx.save()
  ctx.fillStyle = casting ? 'rgba(255,200,87,0.85)' : 'rgba(220,228,240,0.85)'
  ctx.strokeStyle = 'rgba(20,24,34,0.9)'
  ctx.lineWidth = 1.5
  if (player.prone) {
    ctx.fillRect(x - 28, y - 14, 44, 14)
    ctx.beginPath(); ctx.arc(x + dir * 22, y - 10, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
  } else {
    ctx.fillRect(x - 10, y - 34, 20, 34)
    ctx.strokeRect(x - 10, y - 34, 20, 34)
    ctx.beginPath(); ctx.arc(x, y - h + 15, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke()
    // 眼睛 = 面向
    ctx.fillStyle = '#1a1f2c'
    ctx.fillRect(x + dir * 8 - 2, y - h + 13, 4, 4)
    // 施放中:手臂前伸
    ctx.strokeStyle = casting ? 'rgba(255,200,87,0.95)' : 'rgba(220,228,240,0.85)'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(x, y - 28)
    if (casting) ctx.lineTo(x + dir * 26, y - 36)
    else ctx.lineTo(x + dir * 6, y - 10)
    ctx.stroke()
  }
  ctx.restore()
}

function drawStage(ctx) {
  ctx.clearRect(0, 0, STAGE_W, STAGE_H)
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.moveTo(0, GROUND_Y); ctx.lineTo(STAGE_W, GROUND_Y)
  ctx.stroke()
  // 假怪物(命中特效對齊其中心)
  ctx.fillStyle = 'rgba(255,120,120,0.08)'
  ctx.fillRect(MOB_X - MOB_W / 2, GROUND_Y - MOB_H, MOB_W, MOB_H)
  ctx.strokeStyle = 'rgba(255,120,120,0.35)'
  ctx.strokeRect(MOB_X - MOB_W / 2, GROUND_Y - MOB_H, MOB_W, MOB_H)
  if (showHitbox.value) drawHitboxes(ctx)
  if (showGuide.value) {
    ctx.fillStyle = 'rgba(255,255,255,0.35)'
    ctx.font = '12px sans-serif'
    ctx.fillText(t('fxTest.target'), MOB_X - 14, GROUND_Y + 22)
    ctx.fillText(t('fxTest.controlHint'), 12, STAGE_H - 14)
  }
}

function rectPath(ctx, r) {
  ctx.beginPath()
  ctx.rect(r.x1, r.y1, r.x2 - r.x1, r.y2 - r.y1)
}
function drawHitboxes(ctx) {
  ctx.save()
  // 預覽:目前選取技能的範圍(跟著角色)
  const cur = activeSkill.value
  const busy = casts.some((c) => c.skill === cur && gameNow - c.start < c.cycle)
  const pv = !busy && hitboxRect(cur, player.x, GROUND_Y + player.y, player.facing)
  if (pv) {
    const hitNow = overlaps(pv, MOB_RECT)
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = hitNow ? 'rgba(120,230,140,0.45)' : 'rgba(255,255,255,0.25)'
    rectPath(ctx, pv)
    ctx.stroke()
  }
  // 施放中:實際判定框(綠 = 命中、紅 = 範圍外),隨時間淡出
  for (const c of casts) {
    if (!c.hb) continue
    const k = 1 - Math.min(1, (gameNow - c.start) / Math.max(1, c.cycle))
    const rgb = c.inRange ? '120,230,140' : '255,90,110'
    ctx.setLineDash(c.hb.approx ? [6, 4] : [])
    ctx.fillStyle = `rgba(${rgb},${0.12 * k})`
    ctx.strokeStyle = `rgba(${rgb},${0.8 * k})`
    rectPath(ctx, c.hb)
    ctx.fill()
    ctx.stroke()
    if (c.splash) {
      ctx.setLineDash([2, 3])
      ctx.fillStyle = `rgba(110,200,255,${0.06 * k})`
      ctx.strokeStyle = `rgba(110,200,255,${0.6 * k})`
      rectPath(ctx, c.splash)
      ctx.fill()
      ctx.stroke()
    }
    if (!c.inRange && gameNow - c.start < 800) {
      ctx.setLineDash([])
      ctx.fillStyle = `rgba(${rgb},${k})`
      ctx.font = 'bold 16px sans-serif'
      ctx.fillText('MISS', MOB_X - 20, GROUND_Y - MOB_H - 10)
    }
  }
  ctx.restore()
}

// ── 遊戲迴圈(遊戲時間 = 實際時間 × 速度)────────────────────────────────
let gameNow = 0
let lastFrame = 0
let raf = 0
function tick(now) {
  raf = requestAnimationFrame(tick)
  const real = lastFrame ? Math.min(50, now - lastFrame) : 0
  lastFrame = now
  const dt = real * speed.value
  gameNow += dt
  if (keys.shift) teleport()
  stepPlayer(dt / 1000)
  // 按住快捷鍵 → 動作結束後連發
  if (gameNow >= player.actUntil && !castPending && heldSlots.length) {
    const s = skillById(slots.value[heldSlots[heldSlots.length - 1]])
    if (s) cast(s)
  } else if (loop.value && lastCast && !castPending && !heldSlots.length && gameNow >= lastCast.start + lastCast.cycle) {
    cast(lastCast.skill, lastCast.onlyNode, true)
  }
  casts = casts.filter((c) => gameNow - c.start < c.cycle + 50)
  if (lastCast) cursorMs.value = Math.min(gameNow - lastCast.start, lastCast.cycle)
  if (!casts.length && activeNodes.value.length) activeNodes.value = []
  const ctx = canvasRef.value?.getContext('2d')
  if (!ctx) return
  drawStage(ctx)
  drawTracks(ctx, true)
  drawPlayer(ctx)
  drawTracks(ctx, false)
}

// ── 鍵盤(只在畫面取得焦點時)──────────────────────────────────────────
function onKey(e, down) {
  const code = e.code
  let handled = true
  if (code === 'ArrowLeft') keys.left = down
  else if (code === 'ArrowRight') keys.right = down
  else if (code === 'ArrowDown') keys.down = down
  else if (code === 'Space' || code === 'AltLeft' || code === 'AltRight') { if (down && !e.repeat) keys.jumpPressed = true }
  else if (code === 'ShiftLeft' || code === 'ShiftRight') keys.shift = down
  else if (code === 'ArrowUp') keys.up = down
  else {
    const i = SLOT_CODES.indexOf(code)
    if (i < 0) handled = false
    else if (!down) {
      const k = heldSlots.indexOf(i)
      if (k >= 0) heldSlots.splice(k, 1)
    } else if (!e.repeat) {
      if (!heldSlots.includes(i)) heldSlots.push(i)
      const s = skillById(slots.value[i])
      if (s) cast(s)
    }
  }
  if (handled) e.preventDefault()
}
function onBlur() {
  focused.value = false
  keys.left = keys.right = keys.up = keys.down = keys.jumpPressed = keys.shift = false
  heldSlots.length = 0
}

// 時間軸:角色動作各格(負值 = 出手前),已依攻速換算
const timeline = computed(() => {
  const act = primaryAction(activeSkill.value)
  const sc = scaleAction(act, stage.value)
  const total = Math.max(cycleMs.value, sc?.total || 0) || 1
  const segs = (sc?.frames || []).map((f, i) => ({
    key: i, ...f, pct: (f.scaled / total) * 100,
  }))
  return { act, sc, total, segs }
})
const fmtMs = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(2))
const cursorPct = computed(() => Math.min(100, (cursorMs.value / (timeline.value.total || 1)) * 100))

function skillLabel(s) {
  return s.name || String(s.skillId)
}

onMounted(() => {
  loadJob()
  loadBody()
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <section class="fx-page">
    <header class="fx-head">
      <h1>{{ t('fxTest.title') }}</h1>
      <span class="fx-badge">DEV</span>
      <select v-model="job" class="fx-select">
        <option v-for="j in JOBS" :key="j" :value="j">{{ j }}</option>
      </select>
    </header>

    <div class="fx-stage-wrap">
      <div class="fx-stage-box">
        <canvas
          ref="canvasRef"
          class="fx-stage"
          tabindex="0"
          :width="STAGE_W"
          :height="STAGE_H"
          @keydown="onKey($event, true)"
          @keyup="onKey($event, false)"
          @focus="focused = true"
          @blur="onBlur"
        />
        <div v-if="!focused" class="fx-focus-hint">{{ t('fxTest.focusHint') }}</div>
      </div>
      <p v-if="body && !bodyReady" class="fx-note">{{ t('fxTest.bodyMissing') }}</p>

      <div class="fx-slots">
        <span class="fx-slots__title">{{ t('fxTest.slots') }}</span>
        <button
          v-for="(code, i) in SLOT_CODES"
          :key="code"
          type="button"
          class="fx-slot"
          :class="{ 'fx-slot--sel': selectingSlot === i }"
          :title="skillById(slots[i])?.name || ''"
          @click="clickSlot(i)"
          @contextmenu.prevent="clearSlot(i)"
        >
          <b>{{ SLOT_LABEL(code) }}</b>
          <span>{{ skillById(slots[i]) ? skillLabel(skillById(slots[i])) : '—' }}</span>
        </button>
        <span class="fx-muted fx-slots__hint">
          {{ selectingSlot != null ? t('fxTest.slotAssigning', { key: SLOT_LABEL(SLOT_CODES[selectingSlot]) }) : t('fxTest.slotHint') }}
        </span>
      </div>

      <div class="fx-controls">
        <label><input v-model="loop" type="checkbox"> {{ t('fxTest.loop') }}</label>
        <label><input v-model="showGuide" type="checkbox"> {{ t('fxTest.guide') }}</label>
        <label><input v-model="delayHits" type="checkbox"> {{ t('fxTest.delayHits') }}</label>
        <label><input v-model="showHitbox" type="checkbox"> {{ t('fxTest.hitbox') }}</label>
        <label>
          {{ t('fxTest.attackSpeed') }}
          <select v-model.number="stage" class="fx-select">
            <option v-for="st in STAGES" :key="st" :value="st">Stage {{ st }} (AS{{ 10 - st }}) ×{{ ((20 - st) / 16).toFixed(4).replace(/0+$/, '').replace(/\.$/, '') }}</option>
          </select>
        </label>
        <span class="fx-scale">
          {{ t('fxTest.scaleFx') }}:
          <label><input v-model="scaleCast" type="checkbox"> {{ t('fxTest.cat.cast') }}</label>
          <label><input v-model="scaleHit" type="checkbox"> {{ t('fxTest.cat.hit') }}</label>
          <label><input v-model="scaleOther" type="checkbox"> {{ t('fxTest.cat.other') }}</label>
        </span>
        <label>
          {{ t('fxTest.speed') }}
          <select v-model.number="speed" class="fx-select">
            <option :value="0.25">0.25×</option>
            <option :value="0.5">0.5×</option>
            <option :value="1">1×</option>
            <option :value="2">2×</option>
          </select>
        </label>
        <span class="fx-scale">
          {{ t('fxTest.teleport') }}:
          <label>{{ t('fxTest.tpInterval') }} <input v-model.number="teleportCooldown" type="number" min="0" step="30" class="fx-num">ms</label>
          <label>{{ t('fxTest.tpDist') }} <input v-model.number="teleportDist" type="number" min="0" step="10" class="fx-num">px</label>
          <label>{{ t('fxTest.tpUp') }} <input v-model.number="teleportUp" type="number" min="0" step="10" class="fx-num">px</label>
        </span>
        <button type="button" class="fx-btn" @click="stop">{{ t('fxTest.stop') }}</button>
        <span v-if="loading" class="fx-muted">{{ t('fxTest.loading') }}</span>
      </div>

      <div v-if="activeSkill" class="fx-timeline">
        <div class="fx-timeline__head">
          <template v-if="timeline.act && timeline.sc">
            <span>{{ t('fxTest.action') }}: <b>{{ timeline.act.name }}</b></span>
            <span>{{ t('fxTest.baseTotal') }} {{ timeline.act.totalMs }}ms</span>
            <span>
              Stage {{ stage }}: <b>{{ timeline.sc.total }}ms</b>
              <span v-if="timeline.sc.total !== timeline.sc.rawTotal" class="fx-muted">({{ fmtMs(timeline.sc.rawTotal) }})</span>
            </span>
            <span class="fx-pre">{{ t('fxTest.preHit') }} {{ fmtMs(timeline.sc.preHit) }}ms</span>
          </template>
          <span v-else class="fx-muted">{{ t('fxTest.noAction') }}</span>
          <span class="fx-hb">{{ t('fxTest.hitbox') }} {{ hitboxLabel(activeSkill) }}</span>
          <span v-if="activeSkill.attackDelay">attackDelay {{ activeSkill.attackDelay.atMax ?? activeSkill.attackDelay.raw }}ms</span>
          <span v-for="m in hitMarks" :key="m.node" class="fx-dmg-label">{{ t('fxTest.dmgAt') }} {{ m.node }} {{ fmtMs(m.at) }}ms</span>
          <span class="fx-muted">{{ Math.round(cursorMs) }} / {{ Math.round(timeline.total) }}ms</span>
        </div>
        <div class="fx-timeline__bar">
          <div
            v-for="seg in timeline.segs"
            :key="seg.key"
            class="fx-seg"
            :class="[seg.pre ? 'fx-seg--pre' : 'fx-seg--post', { 'fx-seg--floor': seg.floored }]"
            :style="{ width: seg.pct + '%' }"
            :title="`${seg.pose}[${seg.frame}] ${seg.base}ms → ${fmtMs(seg.scaled)}ms`"
          >{{ fmtMs(seg.scaled) }}</div>
          <div
            v-for="m in hitMarks"
            :key="m.node"
            class="fx-dmg"
            :style="{ left: Math.min(100, (m.at / (timeline.total || 1)) * 100) + '%' }"
            :title="`${m.node} ${fmtMs(m.at)}ms`"
          />
          <div class="fx-cursor" :style="{ left: cursorPct + '%' }" />
        </div>
        <p class="fx-note">{{ t('fxTest.timelineNote') }}</p>
      </div>

      <div v-if="activeSkill" class="fx-nodes">
        <span class="fx-nodes__title">{{ skillLabel(activeSkill) }} · {{ activeSkill.skillId }}</span>
        <button type="button" class="fx-chip" @click="onSkillButton(activeSkill)">{{ t('fxTest.playAll') }}</button>
        <button
          v-for="(info, node) in activeSkill.nodes"
          :key="node"
          type="button"
          class="fx-chip"
          :class="{ 'fx-chip--on': activeNodes.includes(node) }"
          @click="onSkillButton(activeSkill, node)"
        >
          {{ node }}
          <small>
            {{ info.frames }}f · {{ nodeScaled(node) ? fmtMs(info.durationMs * asMult) : info.durationMs }}ms
            <template v-if="nodeHitDelay(activeSkill, node) != null"> · {{ nodeScaled(node) ? fmtMs(nodeHitDelay(activeSkill, node) * asMult) : nodeHitDelay(activeSkill, node) }}</template>
          </small>
        </button>
      </div>
    </div>

    <p v-if="loadError" class="fx-error">{{ t('fxTest.loadError', { msg: loadError }) }}</p>

    <div v-for="g in grouped" :key="g.key" class="fx-group">
      <h2>{{ t(`fxTest.groups.${g.key}`) }}</h2>
      <div class="fx-grid">
        <button
          v-for="s in g.skills"
          :key="s.skillId"
          type="button"
          class="fx-skill"
          :class="{ 'fx-skill--on': activeSkill?.skillId === s.skillId, 'fx-skill--assign': selectingSlot != null }"
          @click="onSkillButton(s)"
        >
          <span>{{ skillLabel(s) }}</span>
          <small>{{ s.skillId }} · {{ Object.keys(s.nodes).length }}</small>
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.fx-page { padding: 1rem 1.25rem 3rem; color: #e8edf2; }
.fx-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
.fx-head h1 { font-size: 1.2rem; margin: 0; }
.fx-badge { font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; background: #ff8a3d; color: #1a1a1a; font-weight: 800; }
.fx-select { background: #232838; color: #e8edf2; border: 1px solid #3d4554; border-radius: 4px; padding: 2px 6px; }
.fx-stage-wrap { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1rem; }
.fx-stage {
  width: 100%; max-width: 960px; aspect-ratio: 16 / 9;
  background: radial-gradient(ellipse at 50% 80%, #1d2233 0%, #0e1018 70%);
  border: 1px solid #2f3642; border-radius: 8px;
}
.fx-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-size: 0.85rem; }
.fx-btn { background: #3e8ab8; color: #fff; border: 0; border-radius: 4px; padding: 0.25rem 0.8rem; cursor: pointer; }
.fx-muted { color: #8ea6b8; }
.fx-nodes { display: flex; flex-wrap: wrap; align-items: center; gap: 0.4rem; max-width: 960px; }
.fx-nodes__title { font-weight: 700; color: #ffc857; margin-right: 0.4rem; }
.fx-chip {
  background: #232838; color: #c9d2dd; border: 1px solid #3d4554; border-radius: 999px;
  padding: 0.15rem 0.6rem; font-size: 0.75rem; cursor: pointer;
}
.fx-chip small { color: #6b7393; }
.fx-chip--on { border-color: #ffc857; color: #ffc857; }
.fx-error { color: #ff8a8a; }
.fx-timeline { max-width: 960px; display: flex; flex-direction: column; gap: 4px; }
.fx-timeline__head { display: flex; flex-wrap: wrap; gap: 1rem; font-size: 0.8rem; color: #c9d2dd; }
.fx-timeline__head b { color: #ffc857; }
.fx-pre { color: #ff9d6b; }
.fx-timeline__bar { position: relative; display: flex; height: 22px; background: #151924; border: 1px solid #2f3642; border-radius: 4px; overflow: hidden; }
.fx-seg { display: flex; align-items: center; justify-content: center; font-size: 0.65rem; color: rgba(0,0,0,0.75); border-right: 1px solid rgba(0,0,0,0.35); overflow: hidden; white-space: nowrap; }
.fx-seg--pre { background: #ff9d6b; }
.fx-seg--post { background: #5faee4; }
.fx-scale { display: inline-flex; gap: 0.6rem; align-items: center; }
.fx-seg--floor { box-shadow: inset 0 0 0 2px #ffe14d; }
.fx-dmg { position: absolute; top: -2px; bottom: -2px; width: 2px; background: #ff4d6d; }
.fx-dmg-label { color: #ff6b85; }
.fx-hb { color: #7fe08f; }
.fx-num { width: 4.2em; background: #232838; color: #e8edf2; border: 1px solid #3d4554; border-radius: 4px; padding: 1px 4px; }
.fx-cursor { position: absolute; top: 0; bottom: 0; width: 2px; background: #fff; box-shadow: 0 0 4px #fff; }
.fx-note { margin: 0; font-size: 0.7rem; color: #6b7393; }
.fx-group h2 { font-size: 0.9rem; color: #8ea6b8; margin: 1rem 0 0.4rem; }
.fx-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 0.5rem; }
.fx-skill {
  display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
  background: #1a1f2c; color: #e8edf2; border: 1px solid #2f3642; border-radius: 6px;
  padding: 0.5rem 0.65rem; cursor: pointer; text-align: left; font-size: 0.85rem;
}
.fx-skill small { color: #6b7393; font-size: 0.7rem; }
.fx-skill:hover { border-color: #5faee4; }
.fx-skill--on { border-color: #ffc857; background: #262b3a; }
.fx-stage-box { position: relative; max-width: 960px; }
.fx-stage:focus { outline: 2px solid #ffc857; outline-offset: 1px; }
.fx-focus-hint {
  position: absolute; top: 10px; left: 50%; transform: translateX(-50%); pointer-events: none;
  background: rgba(0,0,0,0.55); color: #ffc857; font-size: 0.8rem; padding: 0.2rem 0.7rem; border-radius: 999px;
}
.fx-slots { display: flex; flex-wrap: wrap; align-items: center; gap: 0.35rem; max-width: 960px; }
.fx-slots__title { font-size: 0.8rem; color: #8ea6b8; margin-right: 0.25rem; }
.fx-slots__hint { font-size: 0.72rem; }
.fx-slot {
  display: flex; flex-direction: column; align-items: flex-start; width: 84px; padding: 0.2rem 0.4rem;
  background: #1a1f2c; color: #c9d2dd; border: 1px solid #2f3642; border-radius: 6px; cursor: pointer; font-size: 0.68rem;
}
.fx-slot b { color: #ffc857; font-size: 0.75rem; }
.fx-slot span { width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }
.fx-slot--sel { border-color: #ffc857; box-shadow: 0 0 0 1px #ffc857; }
.fx-skill--assign { border-style: dashed; }
</style>
