// 裝備套裝 (Item Set) — 當身上同時裝備多件同套裝時給予累加加成
//
// 欄位:
//   id          — 套裝唯一 id
//   nameKey     — i18n key (套裝名稱)
//   itemIds     — 構成套裝的所有裝備 id 清單 (對應 items.json 的 id)
//   tiers[]     — 需要達到的件數門檻與加成 (累加式,套裝 7 件會同時獲得 3 / 5 / 7 件的效果)
//     { count, stats: { key: value, ... } }
//
// 新裝備加入 items.json 後,用其 id 放進此處對應套裝的 itemIds。

import itemsJson from '../data/items.json'
const ITEM_TYPE_BY_ID = Object.fromEntries(
  (itemsJson.items || []).map((it) => [it.id, it.type]),
)

export const ITEM_SETS = [
  {
    id: 'root_abyss_magician',
    nameKey: 'itemSet.root_abyss_magician.name',
    itemIds: [
      // Hat
      'hat_royal_dunwitch',
      // Top
      'top_eagle_eye_dunwitch_robe',
      // Bottom
      'bottom_trixter_dunwitch_pants',
      // Weapon — Fafnir 任一件
      'wpn_fafnir_mana_taker',
    ],
    tiers: [
      { count: 2, stats: { hp: 1000, mp: 1000, int: 20, luk: 20 } },
      { count: 3, stats: { hpPct: 10, mpPct: 10, matk: 50 } },
      { count: 4, stats: { bossDmg: 30 } },
    ],
  },
  {
    id: 'pitched_boss',
    nameKey: 'itemSet.pitched_boss.name',
    itemIds: [
      // Face Accessory
      'face_berserked',
      // Eye Accessory
      'eye_magic_eyepatch',
      // Belt
      'belt_dreamy',
    ],
    tiers: [
      { count: 2, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, bossDmg: 10 } },
      { count: 3, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, def: 250, ignoreDef: 10 } },
    ],
  },
  {
    id: 'absolab_magician',
    nameKey: 'itemSet.absolab_magician.name',
    itemIds: [
      // Hat
      'hat_absolab_mage_crown',
      // Outfit (overall)
      'top_absolab_mage_suit',
      // Shoes
      'shoes_absolab_mage_shoes',
      // Gloves
      'glove_absolab_mage_gloves',
      // Cape
      'cape_absolab_mage_cape',
      // Shoulder Accessory
      'shoulder_absolab_mage_shoulder',
      // AbsoLab Weapon — 任一件
      'wpn_absolab_mage_staff',
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
    itemIds: [
      // Medal
      'medal_seven_day_monster_parker',
      // Badge
      'badge_seven_days',
    ],
    tiers: [
      { count: 2, stats: { ignoreDef: 10 } },
    ],
  },
  {
    id: 'boss_accessory',
    nameKey: 'itemSet.boss_accessory.name',
    itemIds: [
      // Face Accessory
      'face_condensed_power_crystal',
      // Eye Accessory
      'eye_aquatic_letter',
      'eye_black_bean_mark',
      'eye_papulatus_mark',
      // Earrings
      'earring_will_o_the_wisps',
      'earring_dea_sidus',
      // Ring
      'ring_silver_blossom',
      'ring_noble_ifia',
      'ring_guardian_angel',
      // Pendant
      'pendant_horntail_necklace',
      'pendant_chaos_horntail',
      'pendant_mechanator',
      'pendant_dominator',
      // Belt
      'belt_golden_clover',
      'belt_enraged_zakum',
      // Shoulder Accessory
      'shoulder_royal_black_metal',
      // Pocket Item
      'pocket_pink_holy_cup',
      'pocket_stone_of_eternal_life',
      // Badge
      'badge_crystal_ventus',
    ],
    tiers: [
      { count: 3, stats: { allStat: 10, hpPct: 5, mpPct: 5, atk: 5, matk: 5 } },
      { count: 5, stats: { allStat: 10, hpPct: 5, mpPct: 5, atk: 5, matk: 5 } },
      { count: 7, stats: { allStat: 10, atk: 10, matk: 10, def: 80, ignoreDef: 10 } },
      { count: 9, stats: { allStat: 15, atk: 10, matk: 10, def: 100, bossDmg: 10 } },
    ],
  },
]

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

// 計算套裝生效件數(含「幸運道具」加成)
//   equippedItems: 已穿上的 item 物件陣列 (需含 id, type, luckyItem)
//   規則:
//     1) 每個 item.id 最多算 1 件 (避免同一套裝成員 id 出現在多個槽位被重複計入)
//     2) 幸運道具 (item.luckyItem === true) +1 的條件:
//        - 該 item 本身不是此套裝成員
//        - 其 slot type 必須匹配此套裝內至少一個成員的 type
//          (例:帽子幸運道具只能補「有 hat 成員」的套裝,不能補純飾品套裝)
//        - 本套裝實際成員件數 ≥ 3
export function countActiveSet(set, equippedItems) {
  const equippedIds = new Set()
  for (const it of equippedItems) if (it?.id) equippedIds.add(it.id)
  let count = 0
  for (const id of set.itemIds) if (equippedIds.has(id)) count++
  if (count >= 3) {
    const memberIds = new Set(set.itemIds)
    const memberTypes = new Set(
      set.itemIds.map((id) => ITEM_TYPE_BY_ID[id]).filter(Boolean),
    )
    const hasLucky = equippedItems.some(
      (it) => it?.luckyItem && !memberIds.has(it.id) && memberTypes.has(it.type),
    )
    if (hasLucky) count += 1
  }
  return count
}
