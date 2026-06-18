// 裝備套裝 (Item Set) — 當身上同時裝備多件同套裝時給予累加加成
//
// 欄位:
//   id          — 套裝唯一 id
//   nameKey     — i18n key (套裝名稱)
//   members[]   — 套裝成員 { id, name, type }
//                 id 對應 items.json;name/type 作為 fallback 顯示
//   tiers[]     — 需要達到的件數門檻與加成 (累加式,套裝 7 件會同時獲得 3 / 5 / 7 件的效果)
//     { count, stats: { key: value, ... } }
//
// 新裝備加入 items.json 後,只要 id 對應即自動配對。

import itemsJson from '../data/items.json'
const ITEMS_MAP = Object.fromEntries(
  (itemsJson.items || []).map((it) => [it.id, it]),
)

export const ITEM_SETS = [
  {
    id: 'root_abyss_magician',
    nameKey: 'itemSet.root_abyss_magician.name',
    members: [
      { id: 'hat_royal_dunwitch', name: 'Royal Dunwitch Hat', type: 'hat' },
      { id: 'top_eagle_eye_dunwitch_robe', name: 'Eagle Eye Dunwitch Robe', type: 'top' },
      { id: 'bottom_trixter_dunwitch_pants', name: 'Trixter Dunwitch Pants', type: 'bottom' },
      { id: 'wpn_fafnir_mana_taker', name: 'Fafnir Mana Taker', type: 'weapon' },
      { id: 'wpn_fafnir_mana_crown', name: 'Fafnir Mana Crown', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { hp: 1000, mp: 1000, int: 20, luk: 20 } },
      { count: 3, stats: { hpPct: 10, mpPct: 10, matk: 50 } },
      { count: 4, stats: { bossDmg: 30 } },
    ],
  },
  {
    id: 'root_abyss_thief',
    nameKey: 'itemSet.root_abyss_thief.name',
    members: [
      { id: 'hat_royal_assassin_hood', name: 'Royal Assassin Hood', type: 'hat' },
      { id: 'top_eagle_eye_assassin_shirt', name: 'Eagle Eye Assassin Shirt', type: 'top' },
      { id: 'bottom_trixter_assassin_pants', name: 'Trixter Assassin Pants', type: 'bottom' },
      { id: 'wpn_fafnir_risk_holder', name: 'Fafnir Risk Holder', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { hp: 1000, mp: 1000, dex: 20, luk: 20 } },
      { count: 3, stats: { hpPct: 10, mpPct: 10, atk: 50 } },
      { count: 4, stats: { bossDmg: 30 } },
    ],
  },
  {
    id: 'pitched_boss',
    nameKey: 'itemSet.pitched_boss.name',
    members: [
      { id: 'face_berserked', name: 'Berserked', type: 'face' },
      { id: 'belt_dreamy_belt', name: 'Dreamy Belt', type: 'belt' },
      { id: 'eye_magic_eyepatch', name: 'Magic Eyepatch', type: 'eye' },
    ],
    tiers: [
      { count: 2, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, bossDmg: 10 } },
      { count: 3, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, def: 250, ignoreDef: 10 } },
    ],
  },
  {
    id: 'absolab_magician',
    nameKey: 'itemSet.absolab_magician.name',
    members: [
      { id: 'hat_absolab_mage_crown', name: 'AbsoLab Mage Crown', type: 'hat' },
      { id: 'top_absolab_mage_suit', name: 'AbsoLab Mage Suit', type: 'top' },
      { id: 'shoes_absolab_mage_shoes', name: 'AbsoLab Mage Shoes', type: 'shoes' },
      { id: 'glove_absolab_mage_gloves', name: 'AbsoLab Mage Gloves', type: 'glove' },
      { id: 'cape_absolab_mage_cape', name: 'AbsoLab Mage Cape', type: 'cape' },
      { id: 'shoulder_absolab_mage_shoulder', name: 'AbsoLab Mage Shoulder', type: 'shoulder' },
      { id: 'wpn_absolab_mage_staff', name: 'AbsoLab Mage Staff', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { hp: 1500, mp: 1500, atk: 20, matk: 20, bossDmg: 10 } },
      { count: 3, stats: { allStat: 30, atk: 20, matk: 20, bossDmg: 10 } },
      { count: 4, stats: { atk: 25, matk: 25, def: 200, ignoreDef: 10 } },
      { count: 5, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 20, mpPct: 20, atk: 20, matk: 20 } },
      { count: 7, stats: { atk: 20, matk: 20, ignoreDef: 10 } },
    ],
  },
  {
    id: 'absolab_thief',
    nameKey: 'itemSet.absolab_thief.name',
    members: [
      { id: 'hat_absolab_bandit_cap', name: 'AbsoLab Bandit Cap', type: 'hat' },
      { id: 'top_absolab_bandit_suit', name: 'AbsoLab Bandit Suit', type: 'top' },
      { id: 'shoes_absolab_bandit_shoes', name: 'AbsoLab Bandit Shoes', type: 'shoes' },
      { id: 'glove_absolab_bandit_gloves', name: 'AbsoLab Bandit Gloves', type: 'glove' },
      { id: 'cape_absolab_bandit_cape', name: 'AbsoLab Bandit Cape', type: 'cape' },
      { id: 'shoulder_absolab_thief_shoulder', name: 'AbsoLab Thief Shoulder', type: 'shoulder' },
      { id: 'wpn_absolab_bandit_dagger', name: 'AbsoLab Bandit Dagger', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { hp: 1500, mp: 1500, atk: 20, matk: 20, bossDmg: 10 } },
      { count: 3, stats: { allStat: 30, atk: 20, matk: 20, bossDmg: 10 } },
      { count: 4, stats: { atk: 25, matk: 25, def: 200, ignoreDef: 10 } },
      { count: 5, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 20, mpPct: 20, atk: 20, matk: 20 } },
      { count: 7, stats: { atk: 20, matk: 20, ignoreDef: 10 } },
    ],
  },
  {
    id: 'seven_days',
    nameKey: 'itemSet.seven_days.name',
    members: [
      { id: 'medal_seven_day_monster_parker', name: 'Seven Day Monster Parker Medal', type: 'medal' },
      { id: 'badge_seven_days', name: 'Seven Days Badge', type: 'badge' },
    ],
    tiers: [
      { count: 2, stats: { ignoreDef: 10 } },
    ],
  },
  {
    id: 'boss_accessory',
    nameKey: 'itemSet.boss_accessory.name',
    members: [
      { id: 'face_condensed_power_crystal', name: 'Condensed Power Crystal', type: 'face' },
      { id: 'eye_aquatic_letter', name: 'Aquatic Letter Eye Accessory', type: 'eye' },
      { id: 'eye_black_bean_mark', name: 'Black Bean Mark', type: 'eye' },
      { id: 'eye_papulatus_mark', name: 'Papulatus Mark', type: 'eye' },
      { id: 'earring_will_o_the_wisps', name: "Will o' the Wisps", type: 'earring' },
      { id: 'earring_dea_sidus', name: 'Dea Sidus Earrings', type: 'earring' },
      { id: 'ring_silver_blossom', name: 'Silver Blossom Ring', type: 'ring' },
      { id: 'ring_noble_ifia', name: 'Noble Ifia Ring', type: 'ring' },
      { id: 'ring_guardian_angel', name: 'Guardian Angel Ring', type: 'ring' },
      { id: 'pendant_horntail_necklace', name: 'Horntail Necklace', type: 'pendant' },
      { id: 'pendant_chaos_horntail', name: 'Chaos Horntail Necklace', type: 'pendant' },
      { id: 'pendant_mechanator', name: 'Mechanator Pendant', type: 'pendant' },
      { id: 'pendant_dominator', name: 'Dominator Pendant', type: 'pendant' },
      { id: 'belt_golden_clover', name: 'Golden Clover Belt', type: 'belt' },
      { id: 'belt_enraged_zakum', name: 'Enraged Zakum Belt', type: 'belt' },
      { id: 'shoulder_royal_black_metal', name: 'Royal Black Metal Shoulder', type: 'shoulder' },
      { id: 'pocket_pink_holy_cup', name: 'Pink Holy Cup', type: 'pocket' },
      { id: 'pocket_stone_of_eternal_life', name: 'Stone of Eternal Life', type: 'pocket' },
      { id: 'badge_crystal_ventus', name: 'Crystal Ventus Badge', type: 'badge' },
    ],
    tiers: [
      { count: 3, stats: { allStat: 10, hpPct: 5, mpPct: 5, atk: 5, matk: 5 } },
      { count: 5, stats: { allStat: 10, hpPct: 5, mpPct: 5, atk: 5, matk: 5 } },
      { count: 7, stats: { allStat: 10, atk: 10, matk: 10, def: 80, ignoreDef: 10 } },
      { count: 9, stats: { allStat: 15, atk: 10, matk: 10, def: 100, bossDmg: 10 } },
    ],
  },
  {
    id: 'ifias_treasure',
    nameKey: 'itemSet.ifias_treasure.name',
    members: [
      { id: 'ring_ifias', name: "Ifia's Ring", type: 'ring' },
      { id: 'earring_ifias', name: "Ifia's Earrings", type: 'earring' },
      { id: 'pendant_ifias_necklace', name: "Ifia's Necklace", type: 'pendant' },
    ],
    tiers: [
      { count: 2, stats: { allStat: 5, atk: 2, matk: 2 } },
      { count: 3, stats: { hpPct: 5, mpPct: 5, atk: 3, matk: 3 } },
    ],
  },
  {
    id: 'arcane_umbra_magician',
    nameKey: 'itemSet.arcane_umbra_magician.name',
    members: [
      { id: 'shoes_arcane_umbra_mage_shoes', name: 'Arcane Umbra Mage Shoes', type: 'shoes' },
      { id: 'glove_arcane_umbra_mage_gloves', name: 'Arcane Umbra Mage Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_mage_cape', name: 'Arcane Umbra Mage Cape', type: 'cape' },
      { id: 'wpn_arcane_umbra_staff', name: 'Arcane Umbra Staff', type: 'weapon' },
      { id: 'wpn_arcane_umbra_wand', name: 'Arcane Umbra Wand', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
    ],
  },
  {
    id: 'arcane_umbra_thief',
    nameKey: 'itemSet.arcane_umbra_thief.name',
    members: [
      { id: 'shoes_arcane_umbra_thief_shoes', name: 'Arcane Umbra Thief Shoes', type: 'shoes' },
      { id: 'glove_arcane_umbra_thief_gloves', name: 'Arcane Umbra Thief Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_thief_cape', name: 'Arcane Umbra Thief Cape', type: 'cape' },
      { id: 'wpn_arcane_umbra_dagger', name: 'Arcane Umbra Dagger', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
    ],
  },
]

// 向後相容:產生 itemIds 供現有邏輯使用
for (const set of ITEM_SETS) {
  set.itemIds = set.members.map((m) => m.id)
}

export const ITEM_SETS_BY_ID = Object.fromEntries(ITEM_SETS.map((s) => [s.id, s]))

// 反向索引 — 某 item.id 屬於哪幾個套裝
const SET_BY_ITEM = new Map()
for (const set of ITEM_SETS) {
  for (const id of set.itemIds) {
    if (!SET_BY_ITEM.has(id)) SET_BY_ITEM.set(id, [])
    SET_BY_ITEM.get(id).push(set)
  }
}
export function setsForItem(itemId) {
  return SET_BY_ITEM.get(itemId) || []
}

// 取得套裝成員的顯示名稱與類型 (優先 items.json,fallback 到 members 定義)
export function getMemberDisplay(member) {
  const item = ITEMS_MAP[member.id]
  return {
    id: member.id,
    name: item?.name || member.name,
    type: item?.type || member.type,
    exists: !!item,
  }
}

// 計算套裝生效件數(含「幸運道具」加成)
export function countActiveSet(set, equippedItems) {
  const equippedIds = new Set()
  for (const it of equippedItems) if (it?.id) equippedIds.add(it.id)
  let count = 0
  for (const id of set.itemIds) if (equippedIds.has(id)) count++
  if (count >= 3) {
    const memberIds = new Set(set.itemIds)
    const memberTypes = new Set(
      set.members.map((m) => m.type).filter(Boolean),
    )
    const hasLucky = equippedItems.some(
      (it) => it?.luckyItem && !memberIds.has(it.id) && memberTypes.has(it.type),
    )
    if (hasLucky) count += 1
  }
  return count
}
