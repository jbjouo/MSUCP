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

export const ITEM_SETS = [
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
