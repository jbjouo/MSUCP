// Inner Ability (內潛) — 3 排屬性
//
// 每個選項可有多個欄位 (fields):
//   - 單屬: STR / DEX / INT / LUK / 全屬 → 1 個欄位
//   - 雙屬 (12 種排列): STR·DEX, STR·INT, ... LUK·INT → 2 個欄位 (各別填寫)
//   - STR·DEX·INT·LUK 四屬合一 → 4 個欄位
//   - HP·MP / 物攻·魔攻 / 跳躍·移動速度 → 2 個欄位
//   - specialEffect: 無數值 (條件型 / 機率型) → 不顯示輸入框,不進計算機
//
// fixed: true 表示加成屬於固定來源,不吃 % 加成 (主屬性 / 全屬性)。

export const INNER_POTENTIAL_LINES = 3

const f = (statKey, max, opts = {}) => ({ statKey, max, ...opts })

export const INNER_POTENTIAL_OPTIONS = [
  // ── 單屬 (主屬性 fixed) ──
  { id: 'str',     nameKey: 'innerPotential.opts.str',     fixed: true, fields: [f('str', 99)] },
  { id: 'dex',     nameKey: 'innerPotential.opts.dex',     fixed: true, fields: [f('dex', 99)] },
  { id: 'int',     nameKey: 'innerPotential.opts.int',     fixed: true, fields: [f('int', 99)] },
  { id: 'luk',     nameKey: 'innerPotential.opts.luk',     fixed: true, fields: [f('luk', 99)] },
  { id: 'allStat', nameKey: 'innerPotential.opts.allStat', fixed: true, fields: [f('allStat', 50)] },

  // ── 四屬合一 ──
  { id: 'str_dex_int_luk', nameKey: 'innerPotential.opts.str_dex_int_luk', fixed: true,
    fields: [f('str', 99), f('dex', 99), f('int', 99), f('luk', 99)] },

  // ── 雙屬 (12 種排列,主+副,分開填寫) ──
  { id: 'str_dex', nameKey: 'innerPotential.opts.str_dex', fixed: true, fields: [f('str', 99), f('dex', 99)] },
  { id: 'str_int', nameKey: 'innerPotential.opts.str_int', fixed: true, fields: [f('str', 99), f('int', 99)] },
  { id: 'str_luk', nameKey: 'innerPotential.opts.str_luk', fixed: true, fields: [f('str', 99), f('luk', 99)] },
  { id: 'dex_str', nameKey: 'innerPotential.opts.dex_str', fixed: true, fields: [f('dex', 99), f('str', 99)] },
  { id: 'dex_int', nameKey: 'innerPotential.opts.dex_int', fixed: true, fields: [f('dex', 99), f('int', 99)] },
  { id: 'dex_luk', nameKey: 'innerPotential.opts.dex_luk', fixed: true, fields: [f('dex', 99), f('luk', 99)] },
  { id: 'int_str', nameKey: 'innerPotential.opts.int_str', fixed: true, fields: [f('int', 99), f('str', 99)] },
  { id: 'int_dex', nameKey: 'innerPotential.opts.int_dex', fixed: true, fields: [f('int', 99), f('dex', 99)] },
  { id: 'int_luk', nameKey: 'innerPotential.opts.int_luk', fixed: true, fields: [f('int', 99), f('luk', 99)] },
  { id: 'luk_str', nameKey: 'innerPotential.opts.luk_str', fixed: true, fields: [f('luk', 99), f('str', 99)] },
  { id: 'luk_dex', nameKey: 'innerPotential.opts.luk_dex', fixed: true, fields: [f('luk', 99), f('dex', 99)] },
  { id: 'luk_int', nameKey: 'innerPotential.opts.luk_int', fixed: true, fields: [f('luk', 99), f('int', 99)] },

  // ── HP / MP ──
  { id: 'maxHp',     nameKey: 'innerPotential.opts.maxHp',     fields: [f('hp', 9999)] },
  { id: 'maxMp',     nameKey: 'innerPotential.opts.maxMp',     fields: [f('mp', 9999)] },
  { id: 'maxHpMp',   nameKey: 'innerPotential.opts.maxHpMp',   fields: [f('hp', 9999), f('mp', 9999)] },
  { id: 'maxHpPct',  nameKey: 'innerPotential.opts.maxHpPct',  fields: [f('hpPct', 100, { isPct: true })] },
  { id: 'maxMpPct',  nameKey: 'innerPotential.opts.maxMpPct',  fields: [f('mpPct', 100, { isPct: true })] },

  // ── 攻擊力 / 防禦力 (flat) ──
  { id: 'atk',       nameKey: 'innerPotential.opts.atk',     fields: [f('atk', 99)] },
  { id: 'matk',      nameKey: 'innerPotential.opts.matk',    fields: [f('matk', 99)] },
  { id: 'atkMatk',   nameKey: 'innerPotential.opts.atkMatk', fields: [f('atk', 99), f('matk', 99)] },
  { id: 'def',       nameKey: 'innerPotential.opts.def',     fields: [f('def', 999)] },

  // ── 跳躍 / 移動速度 ──
  { id: 'jumpMoveSpeed', nameKey: 'innerPotential.opts.jumpMoveSpeed',
    fields: [f('jump', 50), f('moveSpeed', 50)] },

  // ── 每一定等級 +1 ──
  { id: 'atkPerLv',  nameKey: 'innerPotential.opts.atkPerLv',  fields: [f('atkPerLv10', 20)] },
  { id: 'matkPerLv', nameKey: 'innerPotential.opts.matkPerLv', fields: [f('matkPerLv10', 20)] },

  // ── % 戰鬥屬性 ──
  { id: 'defPct',         nameKey: 'innerPotential.opts.defPct',         fields: [f('defPct', 100, { isPct: true })] },
  { id: 'critRate',       nameKey: 'innerPotential.opts.critRate',       fields: [f('critRate', 100, { isPct: true })] },
  { id: 'atkSpeed',       nameKey: 'innerPotential.opts.atkSpeed',       fields: [f('atkSpeed', 10)] },
  { id: 'bossDmg',        nameKey: 'innerPotential.opts.bossDmg',        fields: [f('bossDmg', 100, { isPct: true })] },
  { id: 'normalMobDmg',   nameKey: 'innerPotential.opts.normalMobDmg',   fields: [f('normalMobDmg', 100, { isPct: true })] },
  { id: 'abnormalMobDmg', nameKey: 'innerPotential.opts.abnormalMobDmg', fields: [f('abnormalMobDmg', 100, { isPct: true })] },
  { id: 'extraDefDmg',    nameKey: 'innerPotential.opts.extraDefDmg',    fields: [f('extraDefDmg', 100, { isPct: true })] },
  { id: 'buffDuration',   nameKey: 'innerPotential.opts.buffDuration',   fields: [f('buffDuration', 100, { isPct: true })] },
  { id: 'dropRate',       nameKey: 'innerPotential.opts.dropRate',       fields: [f('dropRate', 100, { isPct: true })] },
  { id: 'mesoRate',       nameKey: 'innerPotential.opts.mesoRate',       fields: [f('mesoRate', 100, { isPct: true })] },

  // ── 雜項 (固定 +1) ──
  { id: 'passiveSkillLevel', nameKey: 'innerPotential.opts.passiveSkillLevel', fields: [f('passiveSkillLevel', 1)] },
  { id: 'attackTarget',      nameKey: 'innerPotential.opts.attackTarget',      fields: [f('attackTarget', 1)] },

  // ── 按照投入的 X% 增加 Y (條件轉換,不進計算機) ──
  { id: 'dexFromStrPct', nameKey: 'innerPotential.opts.dexFromStrPct', specialEffect: true },
  { id: 'strFromDexPct', nameKey: 'innerPotential.opts.strFromDexPct', specialEffect: true },
  { id: 'lukFromIntPct', nameKey: 'innerPotential.opts.lukFromIntPct', specialEffect: true },
  { id: 'dexFromLukPct', nameKey: 'innerPotential.opts.dexFromLukPct', specialEffect: true },

  // ── 特殊效果 ──
  { id: 'skillCooldownChance', nameKey: 'innerPotential.opts.skillCooldownChance', specialEffect: true },
]

const OPTION_BY_ID = Object.fromEntries(INNER_POTENTIAL_OPTIONS.map((o) => [o.id, o]))

export function getInnerPotentialOption(id) {
  return id ? OPTION_BY_ID[id] || null : null
}

export function optionFields(option) {
  if (!option || option.specialEffect) return []
  return option.fields || []
}

export function optionHasInput(option) {
  return !!(option && !option.specialEffect && (option.fields || []).length > 0)
}
