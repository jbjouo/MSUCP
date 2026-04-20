// 數值工具 — 消除 IEEE 浮點誤差 (例:0.1 + 0.2 = 0.30000000000000004)。
//
// 策略:所有「加總 / 乘積 / 百分比運算」經過 `clean()`,
// 把極小誤差 (< 1e-10) 吃掉,不影響真實小數值。
// 顯示時再用 `roundTo(x, decimals)` 截到指定位數。
//
// 不處理:
//   - 跨 1e10 的極端大數(MSU 不會出現)
//   - 要求 bit-exact 比較 (例:加密簽章、定點貨幣) — 不適用此模組
//
// 使用慣例:
//   - 計算式每一層輸入可能已 clean 過也可能沒有;輸出務必 clean
//   - 顯示端一律以 `roundTo(x, 2)` / `roundTo(x, 4)` 截
//   - 百分比以「相對值」儲存(例:70% → 70),轉比例時用 `/ 100`

// 內部精度 — 10 位小數足以吸收所有累積誤差,不會影響真實數值 (MSU 不超過 6 位有效小數)
const CLEAN_SCALE = 1e10

// 把浮點誤差截回合理精度
export function clean(x) {
  if (!Number.isFinite(x)) return 0
  return Math.round(x * CLEAN_SCALE) / CLEAN_SCALE
}

// 顯示用 — 截到指定小數位(四捨五入)
export function roundTo(x, decimals = 2) {
  if (!Number.isFinite(x)) return 0
  const m = Math.pow(10, Math.max(0, decimals | 0))
  return Math.round(x * m) / m
}

// 加總 — variadic
export function add(...values) {
  let sum = 0
  for (const v of values) sum += Number(v) || 0
  return clean(sum)
}

export function sub(a, b) { return clean((Number(a) || 0) - (Number(b) || 0)) }

// 乘積 — variadic(逐步 clean 避免累積誤差)
export function mul(...values) {
  let p = 1
  for (const v of values) p = clean(p * (Number(v) || 0))
  return p
}

export function div(a, b) {
  const d = Number(b) || 0
  if (d === 0) return 0
  return clean((Number(a) || 0) / d)
}

// 陣列加總:sumBy(arr, x => x.value)
export function sumBy(arr, fn) {
  if (!Array.isArray(arr)) return 0
  let sum = 0
  for (const x of arr) sum += Number(fn(x)) || 0
  return clean(sum)
}

// base × (1 + pct/100)  — 百分比加成(百分比以相對值儲存)
export function applyPct(base, pct) {
  const b = Number(base) || 0
  const p = Number(pct) || 0
  return clean(b * (1 + p / 100))
}

// 相乘疊加式無視/減傷:  final% = 1 − Π(1 − xᵢ/100),回傳相對 %(0~100)
//   ex: combineIgnorePct(30, 20) = 44  (1 - 0.7*0.8 = 0.44)
export function combineIgnorePct(...pcts) {
  let survive = 1
  for (const p of pcts) {
    const v = Math.max(0, Math.min(100, Number(p) || 0))
    survive = clean(survive * (1 - v / 100))
  }
  return clean((1 - survive) * 100)
}

// 多區相乘並 clean:一次吃完整條乘區鏈
//   multChain(1, 1.2, 0.95, 0.88) → 1.0032 (精確無誤差)
export function mulChain(...values) {
  return mul(...values)
}

// floor(x) — 保留語意 (floor 會吸收 1e-10 誤差,但顯式包裝讓意圖清楚)
export function floor(x) { return Math.floor(clean(x)) }
export function ceil(x) { return Math.ceil(clean(x)) }
