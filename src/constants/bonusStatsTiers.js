// 星火(Bonus Stats) — 武器 ATT/MATK 依「武器基礎攻擊力」查表得到 7 個等級的值
// 資料來源:
//   Lv150 深淵武器 https://truth.bahamut.com.tw/s01/202202/56710077da50bab46e8027b3176433ac.PNG
//   Lv200 神秘武器(Arcane Umbra)— 玩家提供
//   Lv160~170 武器百分比 — 玩家提供星火表(航海師武器列)
//
// Key 規則
//   物理武器 → 查 item.stats.atk(武器基礎攻擊力)
//   法師武器 → 查 item.stats.matk(魔法攻擊力)
// 若 key 不在表中 → 用公式自動計算;公式也失敗才 fallback 為自由輸入

// 星火公式 — ceil(base × %) , 依等級區間使用不同百分比
// Normal Weapons: T1~T7 百分比
const FLAME_FORMULA = {
  '120-159': [4, 8, 12, 17.6, 24.2, 31.944, 40.9948],
  '160-170': [5, 10, 15, 22, 30.25, 39.93, 51.2435],
}

function computeFlameByFormula(base, level) {
  let pcts = null
  if (level >= 120 && level <= 159) pcts = FLAME_FORMULA['120-159']
  if (level >= 160 && level <= 170) pcts = FLAME_FORMULA['160-170']
  if (!pcts || base <= 0) return null
  // toFixed 去除浮點誤差(如 200 × 15% = 30.000000000000004 → ceil 誤進位成 31)
  return pcts.map(p => Math.ceil(Number((base * p / 100).toFixed(6))))
}

// Lv140 武器 — base ATT/MATK → [等級1..等級7] (由公式產生)
export const LV140_WEAPON_BONUS_TIERS = {
  69: computeFlameByFormula(69, 140),  // Raven Horn Metal Fist (Claw)
}

// Lv150 武器 — base ATT/MATK → [等級1..等級7]
export const LV150_WEAPON_BONUS_TIERS = {
  88:  [4, 8, 11, 16, 22, 29, 37],   // 種類1
  125: [5, 10, 15, 22, 31, 40, 52],  // 種類2
  128: [6, 11, 16, 23, 31, 41, 53],  // 種類3
  153: [7, 13, 19, 27, 38, 49, 63],  // 種類4
  160: [7, 13, 20, 29, 39, 52, 66],  // 種類5
  164: [7, 14, 20, 29, 40, 53, 68],  // 種類6
  171: [7, 14, 21, 31, 42, 55, 71],  // 種類7
  175: [7, 14, 21, 31, 43, 56, 72],  // 種類8
  201: [9, 17, 25, 36, 49, 65, 83],  // 種類9
  204: [9, 17, 25, 36, 50, 66, 84],  // 種類10
}

// Lv160 武器 (AbsoLab) — base ATT/MATK → [等級1..等級7](玩家提供,與 160-170 公式一致)
export const LV160_WEAPON_BONUS_TIERS = {
  103: [6,  11, 16, 23, 32, 42, 53],   // 種類1
  150: [8,  15, 23, 33, 46, 60, 77],   // 種類2
  154: [8,  16, 24, 34, 47, 62, 79],   // 種類3
  184: [10, 19, 28, 41, 56, 74, 95],   // 種類4
  192: [10, 20, 29, 43, 59, 77, 99],   // 種類5 — AbsoLab Sureshot Bow
  197: [10, 20, 30, 44, 60, 79, 101],  // 種類6
  205: [11, 21, 31, 46, 63, 82, 106],  // 種類7
  210: [11, 21, 32, 47, 64, 84, 108],  // 種類8
  241: [13, 25, 37, 54, 73, 97, 124],  // 種類9 — AbsoLab Spellsong Wand / Shining Rod (MATK)
  245: [13, 25, 37, 54, 75, 98, 126],  // 種類10 — AbsoLab Spellsong Staff (MATK)
}

// Lv200 神秘武器 (Arcane Umbra) — base ATT/MATK → [等級1..等級7]
export const LV200_WEAPON_BONUS_TIERS = {
  149: [9,  18, 27, 40, 55,  72,  92],   // 種類1
  216: [13, 26, 39, 58, 79,  104, 133],  // 種類2
  221: [14, 27, 40, 59, 81,  106, 136],  // 種類3
  264: [16, 32, 48, 70, 96,  127, 163],  // 種類4
  276: [17, 34, 50, 73, 101, 133, 170],  // 種類5
  283: [17, 34, 51, 75, 103, 136, 175],  // 種類6
  295: [18, 36, 54, 78, 108, 142, 182],  // 種類7
  302: [19, 37, 55, 80, 110, 145, 186],  // 種類8
  347: [21, 42, 63, 92, 126, 167, 214],  // 種類9
  353: [22, 43, 64, 94, 129, 170, 218],  // 種類10
}

// Lv200 創世武器 (Genesis) — base ATT/MATK → [等級1..等級7]
export const LV200_GENESIS_WEAPON_BONUS_TIERS = {
  172: [11, 21, 31, 46,  63,  83,  106],  // 種類1
  249: [15, 30, 45, 66,  91,  120, 154],  // 種類2
  255: [16, 31, 46, 68,  93,  123, 157],  // 種類3
  304: [19, 37, 55, 81,  111, 146, 187],  // 種類4
  318: [20, 39, 58, 84,  116, 153, 196],  // 種類5
  326: [20, 40, 59, 87,  119, 157, 201],  // 種類6
  340: [21, 41, 62, 90,  124, 163, 210],  // 種類7
  348: [21, 42, 63, 92,  127, 167, 214],  // 種類8
  400: [24, 48, 72, 106, 146, 192, 246],  // 種類9
  406: [25, 49, 74, 108, 148, 195, 250],  // 種類10
}

// 依等級索引各 Lv 的表,之後擴充直接加入即可
export const WEAPON_BONUS_TIERS_BY_LEVEL = {
  140: LV140_WEAPON_BONUS_TIERS,
  150: LV150_WEAPON_BONUS_TIERS,
  160: LV160_WEAPON_BONUS_TIERS,
  200: LV200_WEAPON_BONUS_TIERS,
}

// 具名星火表 — item.bonusTiersTable 指定時優先使用
const NAMED_BONUS_TIERS = {
  genesis: LV200_GENESIS_WEAPON_BONUS_TIERS,
}

// 回傳此武器在指定 bonus stat key (atk / matk) 下可選的等級值
//   - 非武器、或 statKey 不是 atk/matk → null
//   - 等級不在表中、公式也未涵蓋(例如 Lv250)→ null
//   - base 值不在對應 Lv 的表中 → null
//   回 null 時 UI 應 fallback 為自由輸入
export function weaponBonusTiersFor(item, statKey) {
  if (!item || item.type !== 'weapon') return null
  if (statKey !== 'atk' && statKey !== 'matk') return null
  const base = Number(item.stats?.[statKey]) || 0
  if (base <= 0) return null
  if (item.bonusTiersTable) {
    const named = NAMED_BONUS_TIERS[item.bonusTiersTable]
    if (named?.[base]) return named[base]
  }
  const table = WEAPON_BONUS_TIERS_BY_LEVEL[item.level]
  if (table?.[base]) return table[base]
  return computeFlameByFormula(base, item.level)
}

// 反查 — 依武器 + 已選 bonus stat 值找出對應 tier index (1..7);0 = 未套用或非表中值
export function weaponBonusTierIndex(item, statKey, value) {
  const tiers = weaponBonusTiersFor(item, statKey)
  const v = Math.floor(Number(value) || 0)
  if (!tiers || v <= 0) return 0
  const idx = tiers.indexOf(v)
  return idx >= 0 ? idx + 1 : 0
}

// ─── 戰鬥力基準武器 ──────────────────────────────────────────────────────────
// CP 差值計算 — 每個職業有自己的「基準武器」(Zone 2 的 ATT/MATK 來源)
//   冒險家法師三職業 → wand(主屬 MATK)— Lv150: 201、Lv200: 347
//   未設定的職業       → 以「穿戴武器自身」為基準(delta = 0,不標準化)
//
// 面板實際傷害(ATT STATS / bossMin/Avg/Max / DoT / 戰鬥模擬)不受此 delta 影響 —
// delta 只作用於 CP 的 Z2Z3 = Zone2 × Zone3 − 差值。

// Reference weapon stats per subType + level(用於 computeStarStats 算星等加成)
//   Lv98/100 檔 (unmintable 商店武器):wand = Dimon Wand (Lv98)、bow = White Nisrock (Lv100)
//   兩者為同一檔次 — bow 表同時以 98 與 100 為 key,讓 Lv98 wand 穿戴者能查到同檔的 1.3 基準弓
export const REFERENCE_WEAPON_DATA = {
  wand:  {
    98:  { atk: 69, matk: 113 },   // Dimon Wand (unmintable)
    150: { atk: 119, matk: 201 },  // Fafnir Mana Taker
    160: { atk: 143, matk: 241 },  // AbsoLab Spellsong Wand
    200: { atk: 206, matk: 347 },  // Arcane Umbra Wand
  },
  staff: {
    150: { atk: 128, matk: 204 },
    160: { atk: 151, matk: 245 },  // AbsoLab Spellsong Staff
    200: { atk: 218, matk: 353 },  // Arcane Umbra Staff
  },
  bow: {
    98:  { atk: 90 },               // Lv98 檔基準弓 (使用者指定 90 ATK;White Nisrock Lv100 = 95 等比對應)
    100: { atk: 95 },               // White Nisrock (unmintable)
    120: { atk: 105 },              // Necro Longbow
    150: { atk: 160 },              // Fafnir Wind Chaser
    160: { atk: 192 },              // AbsoLab Sureshot Bow
    200: { atk: 276 },              // Arcane Umbra Bow
  },
  dagger: {
    200: { atk: 276 },              // Arcane Umbra Dagger
  },
  claw: {
    200: { atk: 149 },              // Arcane Umbra Guards
  },
  shining_rod: {
    120: { atk: 81, matk: 133 },    // Necro Shining Rod
    160: { atk: 143, matk: 241 },   // AbsoLab Shining Rod
    200: { atk: 206, matk: 347 },   // Arcane Umbra Shining Rod
  },
}

// 具名星火表武器的基準(item.bonusTiersTable 對應)— 創世武器改比創世模板,星火查同一張具名表
//   genesis:Lv200 創世武器(1452266 Genesis Bow = 跨職業通用基準 318)
export const NAMED_REFERENCE_WEAPON_DATA = {
  genesis: {
    wand:        { atk: 237, matk: 400 },  // Genesis Wand (1372237)
    staff:       { atk: 251, matk: 406 },  // Genesis Staff (1382274)
    shining_rod: { atk: 237, matk: 400 },  // Genesis Shining Rod (1212129)
    bow:         { atk: 318 },             // Genesis Bow (1452266)
    dagger:      { atk: 318 },             // Genesis Dagger (1332289)
    claw:        { atk: 172 },             // Genesis Guards (1472275)
  },
}

function referenceStats(subType, level, table) {
  if (table) {
    const named = NAMED_REFERENCE_WEAPON_DATA[table]?.[subType]
    if (named) return { stats: named, tierTable: table }
  }
  const stats = REFERENCE_WEAPON_DATA[subType]?.[level]
  return stats ? { stats, tierTable: null } : null
}

// 職業 → CP 基準武器(subType + 主要 attKey)
//   attKey 對應 JOB_ATT_META.usesMatk(法師 → matk、其他 → atk)
export const JOB_CP_REFERENCE_WEAPON = {
  // Adventurer Mage(冒險家法師三職業)
  archmageFP: { subType: 'wand', attKey: 'matk' },
  archmageIL: { subType: 'wand', attKey: 'matk' },
  bishop:     { subType: 'wand', attKey: 'matk' },
  // Cygnus Thief
  nightwalker: { subType: 'claw', attKey: 'atk' },
  // Adventurer Thief
  nightlord:   { subType: 'claw', attKey: 'atk' },
  shadower:    { subType: 'dagger', attKey: 'atk' },
  // Bowman
  bowmaster:   { subType: 'bow', attKey: 'atk' },
  windarcher:  { subType: 'bow', attKey: 'atk' },
  // Heroes (Magician)
  luminous:    { subType: 'shining_rod', attKey: 'matk' },
}

// 取得某職業在指定等級下的基準武器資料(模板,與實際穿戴無關)
//   回傳:{ subType, level, attKey, stats, base }
//   若職業未設定 / 等級未定義 → null(delta = 0 fallback)
//   table:穿戴武器的 bonusTiersTable(如 'genesis')→ 優先取具名模板,沒有則退回等級模板
export function jobCpReferenceWeapon(jobKey, level, table = null) {
  const cfg = JOB_CP_REFERENCE_WEAPON[jobKey]
  if (!cfg) return null
  const ref = referenceStats(cfg.subType, level, table)
  if (!ref) return null
  const base = Number(ref.stats[cfg.attKey]) || 0
  if (base <= 0) return null
  return { subType: cfg.subType, level, attKey: cfg.attKey, stats: ref.stats, base, tierTable: ref.tierTable }
}

// 通用 Bow 基準(跨職業 CP 比較的標準尺度)
//   每個 level 提供 bow 的 base ATK 與 stats(供 computeStarStats)
//   table = 'genesis' → 創世弓 (318)
export function universalBowReference(level, table = null) {
  const ref = referenceStats('bow', level, table)
  if (!ref) return null
  const base = Number(ref.stats.atk) || 0
  if (base <= 0) return null
  return { subType: 'bow', level, attKey: 'atk', stats: ref.stats, base, tierTable: ref.tierTable }
}

// 給定基準武器 + tier index → 該 tier 的 bonus ATT 值(用基準 base 查表)
export function referenceBonusAttAtTier(refWeapon, tierIndex) {
  if (!refWeapon || tierIndex <= 0) return 0
  const table = (refWeapon.tierTable && NAMED_BONUS_TIERS[refWeapon.tierTable])
    || WEAPON_BONUS_TIERS_BY_LEVEL[refWeapon.level]
  const tiers = table?.[refWeapon.base]
  return Number(tiers?.[tierIndex - 1]) || 0
}
