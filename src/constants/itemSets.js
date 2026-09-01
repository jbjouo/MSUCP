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

// ── 新增裝備 dialog 的套裝快捷篩選分組 ──────────────────────────────────────
//   label 走 i18n `itemSet.filter.<key>`(中文用俗稱、英文用套裝名稱)
//   同系列的職業分版合併為一顆按鈕;「女皇」= Lv140 套裝總稱
//   (Dragon Tail / Raven Horn;未來新增的 140 等 set 也歸此組)
export const SET_FILTER_GROUPS = [
  { key: 'root_abyss',     setIds: ['root_abyss_magician', 'root_abyss_thief', 'root_abyss_warrior', 'root_abyss_bowman'] },
  { key: 'absolab',        setIds: ['absolab_magician', 'absolab_thief', 'absolab_warrior'] },
  { key: 'arcane_umbra',   setIds: ['arcane_umbra_magician', 'arcane_umbra_thief', 'arcane_umbra_warrior', 'arcane_umbra_bowman', 'arcane_umbra_pirate'] },
  { key: 'pitched_boss',   setIds: ['pitched_boss'] },
  { key: 'boss_of_dawn',   setIds: ['boss_of_dawn'] },
  { key: 'boss_accessory', setIds: ['boss_accessory'] },
  { key: 'seven_days',     setIds: ['seven_days'] },
  { key: 'ifias_treasure', setIds: ['ifias_treasure'] },
  { key: 'von_leon',       setIds: ['royal_von_leon_magician', 'royal_von_leon_warrior'] },
  { key: 'empress',        setIds: ['dragon_tail_magician', 'raven_horn', 'lionheart', 'falcon_wing'] },
  { key: 'unchained',       setIds: ['unchained_magician'] },
  { key: 'fourth_magician', setIds: ['fourth_magician', 'fourth_bowman'] },
]

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
    id: 'root_abyss_warrior',
    nameKey: 'itemSet.root_abyss_warrior.name',
    members: [
      { id: 'hat_royal_warrior_helm', name: 'Royal Warrior Helm', type: 'hat' },
      { id: 'top_eagle_eye_warrior_armor', name: 'Eagle Eye Warrior Armor', type: 'top' },
      { id: 'btm_trixter_warrior_pants', name: 'Trixter Warrior Pants', type: 'bottom' },
      { id: 'wpn_fafnir_brionak', name: 'Fafnir Brionak', type: 'weapon' },
      { id: 'wpn_fafnir_moon_glaive', name: 'Fafnir Moon Glaive', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { hp: 1000, mp: 1000, str: 20, dex: 20 } },
      { count: 3, stats: { hpPct: 10, mpPct: 10, atk: 50 } },
      { count: 4, stats: { bossDmg: 30 } },
    ],
  },
  {
    id: 'root_abyss_bowman',
    nameKey: 'itemSet.root_abyss_bowman.name',
    members: [
      { id: 'hat_royal_ranger_beret', name: 'Royal Ranger Beret', type: 'hat' },
      { id: 'top_eagle_eye_ranger_cowl', name: 'Eagle Eye Ranger Cowl', type: 'top' },
      { id: 'btm_trixter_ranger_pants', name: 'Trixter Ranger Pants', type: 'bottom' },
      { id: 'wpn_fafnir_wind_chaser', name: 'Fafnir Wind Chaser', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { hp: 1000, mp: 1000, str: 20, dex: 20 } },
      { count: 3, stats: { hpPct: 10, mpPct: 10, atk: 50 } },
      { count: 4, stats: { bossDmg: 30 } },
    ],
  },
  {
    id: 'boss_of_dawn',
    nameKey: 'itemSet.boss_of_dawn.name',
    members: [
      { id: 'face_twilight_mark', name: 'Twilight Mark', type: 'face' },
      { id: 'ring_dawn_guardian_angel_ring', name: 'Dawn Guardian Angel Ring', type: 'ring' },
      { id: 'earrings_estella_earrings', name: 'Estella Earrings', type: 'earring' },
      { id: 'pendant_daybreak_pendant', name: 'Daybreak Pendant', type: 'pendant' },
    ],
    tiers: [
      { count: 2, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, bossDmg: 10 } },
      { count: 3, stats: { allStat: 10, hp: 250, atk: 10, matk: 10 } },
      { count: 4, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, def: 100, ignoreDef: 10 } },
    ],
  },
  {
    id: 'pitched_boss',
    nameKey: 'itemSet.pitched_boss.name',
    members: [
      { id: 'face_berserked', name: 'Berserked', type: 'face' },
      { id: 'ring_endless_terror', name: 'Endless Terror', type: 'ring' },
      { id: 'earrings_commanding_force_earring', name: 'Commanding Force Earring', type: 'earring' },
      { id: 'pendant_source_of_suffering', name: 'Source of Suffering', type: 'pendant' },
      {
        group: true,
        nameKey: 'itemSet.pitched_boss.cursed_spellbook',
        type: 'pocket',
        ids: [
          'pocket_cursed_red_spellbook',
          'pocket_cursed_blue_spellbook',
          'pocket_cursed_green_spellbook',
          'pocket_cursed_yellow_spellbook',
        ],
      },
      { id: 'belt_dreamy_belt', name: 'Dreamy Belt', type: 'belt' },
      { id: 'eye_magic_eyepatch', name: 'Magic Eyepatch', type: 'eye' },
    ],
    tiers: [
      { count: 2, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, bossDmg: 10 } },
      { count: 3, stats: { allStat: 10, hp: 250, atk: 10, matk: 10, def: 250, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 15, hp: 375, atk: 15, matk: 15, critDmg: 5 } },
      { count: 5, stats: { allStat: 15, hp: 375, atk: 15, matk: 15, bossDmg: 10 } },
      { count: 6, stats: { allStat: 15, hp: 375, atk: 15, matk: 15 } },
      { count: 7, stats: { allStat: 15, hp: 375, atk: 15, matk: 15, critDmg: 5 } },
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
    id: 'absolab_warrior',
    nameKey: 'itemSet.absolab_warrior.name',
    members: [
      { id: 'hat_absolab_knight_helm', name: 'AbsoLab Knight Helm', type: 'hat' },
      { id: 'overall_absolab_knight_suit', name: 'AbsoLab Knight Suit', type: 'overall' },
      { id: 'shoes_absolab_knight_shoes', name: 'AbsoLab Knight Shoes', type: 'shoes' },
      { id: 'glove_absolab_knight_gloves', name: 'AbsoLab Knight Gloves', type: 'glove' },
      { id: 'cape_absolab_knight_cape', name: 'AbsoLab Knight Cape', type: 'cape' },
      { id: 'shoulder_absolab_knight_shoulder', name: 'AbsoLab Knight Shoulder', type: 'shoulder' },
      { id: 'wpn_absolab_piercing_spear', name: 'AbsoLab Piercing Spear', type: 'weapon' },
      { id: 'wpn_absolab_hellslayer', name: 'AbsoLab Hellslayer', type: 'weapon' },
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
  // 4th Magician Set (API setId 368) — unmintable 法師裝 (Blue Varr 系列)
  //   2 件 DEF+100 不影響 CP → 不建模;Blue Bazura (褲子) 尚未收錄,先預留成員
  {
    id: 'fourth_magician',
    nameKey: 'itemSet.fourth_magician.name',
    members: [
      { id: 'hat_blue_varr_hat', name: 'Blue Varr Hat', type: 'hat' },
      { id: 'overall_blue_varuna', name: 'Blue Varuna', type: 'overall' },
      { id: 'glove_blue_ciara', name: 'Blue Ciara', type: 'glove' },
      { id: 'shoes_blue_varr_shoes', name: 'Blue Varr Shoes', type: 'shoes' },
      { id: 'bottom_blue_bazura', name: 'Blue Bazura', type: 'bottom' },
    ],
    tiers: [
      { count: 3, stats: { hpPct: 5, mpPct: 5 } },
      { count: 4, stats: { matk: 5, int: 5 } },
    ],
  },
  {
    id: 'fourth_bowman',
    nameKey: 'itemSet.fourth_bowman.name',
    members: [
      { id: 'hat_green_arnah_cap', name: 'Green Arnah Cap', type: 'hat' },
      { id: 'overall_green_arzuna', name: 'Green Arzuna', type: 'overall' },
      { id: 'glove_green_arcina', name: 'Green Arcina', type: 'glove' },
      { id: 'shoes_green_arnah_shoes', name: 'Green Arnah Shoes', type: 'shoes' },
      { id: 'overall_green_armis', name: 'Green Armis', type: 'overall' },
    ],
    tiers: [
      { count: 3, stats: { hpPct: 5, mpPct: 5 } },
      { count: 4, stats: { atk: 5, dex: 5 } },
    ],
  },
  {
    id: 'boss_accessory',
    nameKey: 'itemSet.boss_accessory.name',
    members: [
      { id: 'face_condensed_power_crystal', name: 'Condensed Power Crystal', type: 'face' },
      { id: 'belt_enraged_zakum_belt', name: 'Enraged Zakum Belt', type: 'belt' },
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
      { id: 'wpn_arcane_umbra_shining_rod', name: 'Arcane Umbra Shining Rod', type: 'weapon' },
      { id: 'shoulder_arcane_umbra_mage_shoulder', name: 'Arcane Umbra Mage Shoulder', type: 'shoulder' },
      { id: 'glove_arcane_umbra_mage_gloves', name: 'Arcane Umbra Mage Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_mage_cape', name: 'Arcane Umbra Mage Cape', type: 'cape' },
      { id: 'hat_arcane_umbra_mage_hat', name: 'Arcane Umbra Mage Hat', type: 'hat' },
      { id: 'overall_arcane_umbra_mage_suit', name: 'Arcane Umbra Mage Suit', type: 'overall' },
      { id: 'wpn_arcane_umbra_staff', name: 'Arcane Umbra Staff', type: 'weapon' },
      { id: 'wpn_arcane_umbra_wand', name: 'Arcane Umbra Wand', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
      { count: 5, stats: { hp: 2000, mp: 2000, atk: 40, matk: 40, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 30, mpPct: 30, atk: 30, matk: 30 } },
      { count: 7, stats: { atk: 30, matk: 30, ignoreDef: 10 } },
    ],
  },
  {
    id: 'arcane_umbra_thief',
    nameKey: 'itemSet.arcane_umbra_thief.name',
    members: [
      { id: 'shoes_arcane_umbra_thief_shoes', name: 'Arcane Umbra Thief Shoes', type: 'shoes' },
      { id: 'shoulder_arcane_umbra_thief_shoulder', name: 'Arcane Umbra Thief Shoulder', type: 'shoulder' },
      { id: 'wpn_arcane_umbra_guards', name: 'Arcane Umbra Guards', type: 'weapon' },
      { id: 'glove_arcane_umbra_thief_gloves', name: 'Arcane Umbra Thief Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_thief_cape', name: 'Arcane Umbra Thief Cape', type: 'cape' },
      { id: 'hat_arcane_umbra_thief_hat', name: 'Arcane Umbra Thief Hat', type: 'hat' },
      { id: 'overall_arcane_umbra_thief_suit', name: 'Arcane Umbra Thief Suit', type: 'overall' },
      { id: 'wpn_arcane_umbra_dagger', name: 'Arcane Umbra Dagger', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
      { count: 5, stats: { hp: 2000, mp: 2000, atk: 40, matk: 40, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 30, mpPct: 30, atk: 30, matk: 30 } },
      { count: 7, stats: { atk: 30, matk: 30, ignoreDef: 10 } },
    ],
  },
  {
    id: 'arcane_umbra_warrior',
    nameKey: 'itemSet.arcane_umbra_warrior.name',
    members: [
      { id: 'shoes_arcane_umbra_knight_shoes', name: 'Arcane Umbra Knight Shoes', type: 'shoes' },
      { id: 'wpn_arcane_umbra_polearm', name: 'Arcane Umbra Polearm', type: 'weapon' },
      { id: 'wpn_arcane_umbra_spear', name: 'Arcane Umbra Spear', type: 'weapon' },
      { id: 'shoulder_arcane_umbra_knight_shoulder', name: 'Arcane Umbra Knight Shoulder', type: 'shoulder' },
      { id: 'glove_arcane_umbra_knight_gloves', name: 'Arcane Umbra Knight Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_knight_cape', name: 'Arcane Umbra Knight Cape', type: 'cape' },
      { id: 'hat_arcane_umbra_knight_hat', name: 'Arcane Umbra Knight Hat', type: 'hat' },
      { id: 'overall_arcane_umbra_knight_suit', name: 'Arcane Umbra Knight Suit', type: 'overall' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
      { count: 5, stats: { hp: 2000, mp: 2000, atk: 40, matk: 40, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 30, mpPct: 30, atk: 30, matk: 30 } },
      { count: 7, stats: { atk: 30, matk: 30, ignoreDef: 10 } },
    ],
  },
  {
    id: 'arcane_umbra_bowman',
    nameKey: 'itemSet.arcane_umbra_bowman.name',
    members: [
      { id: 'shoes_arcane_umbra_archer_shoes', name: 'Arcane Umbra Archer Shoes', type: 'shoes' },
      { id: 'shoulder_arcane_umbra_archer_shoulder', name: 'Arcane Umbra Archer Shoulder', type: 'shoulder' },
      { id: 'glove_arcane_umbra_archer_gloves', name: 'Arcane Umbra Archer Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_archer_cape', name: 'Arcane Umbra Archer Cape', type: 'cape' },
      { id: 'hat_arcane_umbra_archer_hat', name: 'Arcane Umbra Archer Hat', type: 'hat' },
      { id: 'overall_arcane_umbra_archer_suit', name: 'Arcane Umbra Archer Suit', type: 'overall' },
      { id: 'wpn_arcane_umbra_bow', name: 'Arcane Umbra Bow', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
      { count: 5, stats: { hp: 2000, mp: 2000, atk: 40, matk: 40, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 30, mpPct: 30, atk: 30, matk: 30 } },
      { count: 7, stats: { atk: 30, matk: 30, ignoreDef: 10 } },
    ],
  },
  {
    id: 'arcane_umbra_pirate',
    nameKey: 'itemSet.arcane_umbra_pirate.name',
    members: [
      { id: 'shoes_arcane_umbra_pirate_shoes', name: 'Arcane Umbra Pirate Shoes', type: 'shoes' },
      { id: 'shoulder_arcane_umbra_pirate_shoulder', name: 'Arcane Umbra Pirate Shoulder', type: 'shoulder' },
      { id: 'glove_arcane_umbra_pirate_gloves', name: 'Arcane Umbra Pirate Gloves', type: 'glove' },
      { id: 'cape_arcane_umbra_pirate_cape', name: 'Arcane Umbra Pirate Cape', type: 'cape' },
      { id: 'hat_arcane_umbra_pirate_hat', name: 'Arcane Umbra Pirate Hat', type: 'hat' },
      { id: 'overall_arcane_umbra_pirate_suit', name: 'Arcane Umbra Pirate Suit', type: 'overall' },
      { id: 'wpn_arcane_umbra_knuckle', name: 'Arcane Umbra Knuckle', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { atk: 30, matk: 30, bossDmg: 10 } },
      { count: 3, stats: { atk: 30, matk: 30, def: 400, ignoreDef: 10 } },
      { count: 4, stats: { allStat: 50, atk: 35, matk: 35, bossDmg: 10 } },
      { count: 5, stats: { hp: 2000, mp: 2000, atk: 40, matk: 40, bossDmg: 10 } },
      { count: 6, stats: { hpPct: 30, mpPct: 30, atk: 30, matk: 30 } },
      { count: 7, stats: { atk: 30, matk: 30, ignoreDef: 10 } },
    ],
  },
  {
    id: 'royal_von_leon_magician',
    nameKey: 'itemSet.royal_von_leon_magician.name',
    members: [
      { id: 'hat_royal_von_leon_magician_helm', name: 'Royal Von Leon Magician Helm', type: 'hat' },
      { id: 'overall_royal_von_leon_mage_suit', name: 'Royal Von Leon Mage Suit', type: 'overall' },
      { id: 'shoes_royal_von_leon_mage_boots', name: 'Royal Von Leon Mage Boots', type: 'shoes' },
      { id: 'glove_royal_von_leon_mage_hands', name: 'Royal Von Leon Mage Hands', type: 'glove' },
      { id: 'cape_royal_von_leon_mage_cape', name: 'Royal Von Leon Mage Cape', type: 'cape' },
    ],
    tiers: [
      { count: 4, stats: { allStat: 6, def: 150, bossDmg: 10 } },
      { count: 5, stats: { allStat: 9, atk: 10, matk: 10, def: 225 } },
      { count: 6, stats: { allStat: 15, hpPct: 15, mpPct: 15, atk: 20, matk: 20, int: 10, luk: 10, def: 300, bossDmg: 10 } },
    ],
  },
  {
    id: 'royal_von_leon_warrior',
    nameKey: 'itemSet.royal_von_leon_warrior.name',
    members: [
      { id: 'hat_royal_von_leon_warrior_helm', name: 'Royal Von Leon Warrior Helm', type: 'hat' },
      { id: 'overall_royal_von_leon_warrior_suit', name: 'Royal Von Leon Warrior Suit', type: 'overall' },
      { id: 'shoes_royal_von_leon_warrior_boots', name: 'Royal Von Leon Warrior Boots', type: 'shoes' },
      { id: 'glove_royal_von_leon_warrior_hands', name: 'Royal Von Leon Warrior Hands', type: 'glove' },
      { id: 'cape_royal_von_leon_warrior_cape', name: 'Royal Von Leon Warrior Cape', type: 'cape' },
      { id: 'wpn_royal_von_leon_spear', name: 'Royal Von Leon Spear', type: 'weapon' },
      { id: 'wpn_royal_von_leon_hellslayer', name: 'Royal Von Leon Hellslayer', type: 'weapon' },
    ],
    tiers: [
      { count: 4, stats: { allStat: 6, def: 150, bossDmg: 10 } },
      { count: 5, stats: { allStat: 9, atk: 10, matk: 10, def: 225 } },
      { count: 6, stats: { allStat: 15, hpPct: 15, mpPct: 15, atk: 20, matk: 20, str: 10, dex: 10, def: 300, bossDmg: 10 } },
    ],
  },
  {
    id: 'dragon_tail_magician',
    nameKey: 'itemSet.dragon_tail_magician.name',
    members: [
      { id: 'hat_dragon_tail_mage_sallet', name: 'Dragon Tail Mage Sallet', type: 'hat' },
      { id: 'overall_dragon_tail_mage_robe', name: 'Dragon Tail Mage Robe', type: 'overall' },
      { id: 'shoes_dragon_tail_mage_shoes', name: 'Dragon Tail Mage Shoes', type: 'shoes' },
      { id: 'glove_dragon_tail_mage_gloves', name: 'Dragon Tail Mage Gloves', type: 'glove' },
      { id: 'cape_dragon_tail_mage_cape', name: 'Dragon Tail Mage Cape', type: 'cape' },
      { id: 'shoulder_dragon_tail_mage_shoulder', name: 'Dragon Tail Mage Shoulder', type: 'shoulder' },
    ],
    tiers: [
      { count: 2, stats: { def: 300 } },
      { count: 3, stats: { hpPct: 15, mpPct: 15 } },
      { count: 4, stats: { matk: 15 } },
      { count: 5, stats: { allStat: 20 } },
      { count: 6, stats: { matk: 30, bossDmg: 30 } },
      { count: 7, stats: { hpPct: 15, mpPct: 15, matk: 10 } },
    ],
  },
  {
    id: 'raven_horn',
    nameKey: 'itemSet.raven_horn.name',
    members: [
      { id: 'hat_raven_horn_chaser_hat', name: 'Raven Horn Chaser Hat', type: 'hat' },
      { id: 'wpn_raven_horn_metal_fist', name: 'Raven Horn Metal Fist', type: 'weapon' },
      { id: 'cape_raven_horn_chaser_cape', name: 'Raven Horn Chaser Cape', type: 'cape' },
      { id: 'glove_raven_horn_chaser_gloves', name: 'Raven Horn Chaser Gloves', type: 'glove' },
      { id: 'overall_raven_horn_chaser_armor', name: 'Raven Horn Chaser Armor', type: 'overall' },
      { id: 'shoes_raven_horn_chaser_boots', name: 'Raven Horn Chaser Boots', type: 'shoes' },
      { id: 'shoulder_raven_horn_chaser_shoulder', name: 'Raven Horn Chaser Shoulder', type: 'shoulder' },
    ],
    tiers: [
      { count: 2, stats: { def: 300 } },
      { count: 3, stats: { hpPct: 15, mpPct: 15 } },
      { count: 4, stats: { atk: 15, matk: 15 } },
      { count: 5, stats: { allStat: 20 } },
      { count: 6, stats: { atk: 30, matk: 30, bossDmg: 30 } },
      { count: 7, stats: { hpPct: 15, mpPct: 15, atk: 10, matk: 10 } },
    ],
  },
  {
    id: 'lionheart',
    nameKey: 'itemSet.lionheart.name',
    members: [
      { id: 'hat_lionheart_battle_helm', name: 'Lionheart Battle Helm', type: 'hat' },
      { id: 'overall_lionheart_battle_mail', name: 'Lionheart Battle Mail', type: 'overall' },
      { id: 'shoes_lionheart_battle_boots', name: 'Lionheart Battle Boots', type: 'shoes' },
      { id: 'glove_lionheart_battle_bracers', name: 'Lionheart Battle Bracers', type: 'glove' },
      { id: 'cape_lionheart_battle_cape', name: 'Lionheart Battle Cape', type: 'cape' },
      { id: 'shoulder_lionheart_battle_shoulder', name: 'Lionheart Battle Shoulder', type: 'shoulder' },
      { id: 'wpn_lionheart_fuscina', name: 'Lionheart Fuscina', type: 'weapon' },
      { id: 'wpn_lionheart_partisan', name: 'Lionheart Partisan', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { def: 300 } },
      { count: 3, stats: { hpPct: 15, mpPct: 15 } },
      { count: 4, stats: { atk: 15 } },
      { count: 5, stats: { allStat: 20 } },
      { count: 6, stats: { atk: 30, bossDmg: 30 } },
      { count: 7, stats: { hpPct: 15, mpPct: 15, atk: 10 } },
    ],
  },
  {
    id: 'falcon_wing',
    nameKey: 'itemSet.falcon_wing.name',
    members: [
      { id: 'hat_falcon_wing_sentinel_cap', name: 'Falcon Wing Sentinel Cap', type: 'hat' },
      { id: 'overall_falcon_wing_sentinel_suit', name: 'Falcon Wing Sentinel Suit', type: 'overall' },
      { id: 'shoes_falcon_wing_sentinel_boots', name: 'Falcon Wing Sentinel Boots', type: 'shoes' },
      { id: 'glove_falcon_wing_sentinel_gloves', name: 'Falcon Wing Sentinel Gloves', type: 'glove' },
      { id: 'cape_falcon_wing_sentinel_cape', name: 'Falcon Wing Sentinel Cape', type: 'cape' },
      { id: 'shoulder_falcon_wing_sentinel_shoulder', name: 'Falcon Wing Sentinel Shoulder', type: 'shoulder' },
    ],
    tiers: [
      { count: 2, stats: { def: 300 } },
      { count: 3, stats: { hpPct: 15, mpPct: 15 } },
      { count: 4, stats: { atk: 15 } },
      { count: 5, stats: { allStat: 20 } },
      { count: 6, stats: { atk: 30, bossDmg: 30 } },
      { count: 7, stats: { hpPct: 15, mpPct: 15, atk: 10 } },
    ],
  },
  {
    id: 'unchained_magician',
    nameKey: 'itemSet.unchained_magician.name',
    members: [
      { id: 'hat_unchained_magician_helm', name: 'Unchained Magician Helm', type: 'hat' },
      { id: 'overall_unchained_mage_suit', name: 'Unchained Mage Suit', type: 'overall' },
      { id: 'shoes_unchained_magician_boots', name: 'Unchained Magician Boots', type: 'shoes' },
      { id: 'glove_unchained_mage_hands', name: 'Unchained Mage Hands', type: 'glove' },
      { id: 'wpn_unchained_shining_rod', name: 'Unchained Shining Rod', type: 'weapon' },
    ],
    tiers: [
      { count: 2, stats: { allStat: 5, def: 100 } },
      { count: 3, stats: { allStat: 10, atk: 5, matk: 5, def: 200 } },
      { count: 4, stats: { hpPct: 5, mpPct: 5, atk: 10, matk: 10, def: 300, ignoreDef: 5, bossDmg: 5 } },
      { count: 5, stats: { allStat: 15, atk: 15, matk: 15, ignoreDef: 10, bossDmg: 10 } },
    ],
  },
]

// 產生 itemIds 供現有邏輯使用;group 成員展開為多個 id
for (const set of ITEM_SETS) {
  set.itemIds = set.members.flatMap((m) => m.group ? m.ids : [m.id])
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

// 幸運道具優先級:全身僅一件生效;帽子 > 武器
const LUCKY_PRIORITY = ['hat', 'weapon']

// 決定全域唯一的生效幸運道具
// — 依優先級排序,選出「能對至少一個套裝貢獻」的最高優先幸運道具
export function determineActiveLuckyItem(equippedItems) {
  const luckyItems = equippedItems
    .filter((it) => it?.luckyItem)
    .sort((a, b) => {
      const ai = LUCKY_PRIORITY.indexOf(a.type)
      const bi = LUCKY_PRIORITY.indexOf(b.type)
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
    })
  if (!luckyItems.length) return null
  const equippedIds = new Set(equippedItems.map((it) => it?.id).filter(Boolean))
  for (const lucky of luckyItems) {
    for (const set of ITEM_SETS) {
      let count = 0
      for (const id of set.itemIds) if (equippedIds.has(id)) count++
      if (count < 3) continue
      const memberIds = new Set(set.itemIds)
      const memberTypes = new Set(set.members.map((m) => m.type).filter(Boolean))
      if (!memberIds.has(lucky.id) && memberTypes.has(lucky.type)) return lucky
    }
  }
  return null
}

// 計算套裝生效件數(含「幸運道具」加成)
// activeLucky 由外層 determineActiveLuckyItem() 統一決定
export function countActiveSet(set, equippedItems, activeLucky = null) {
  const equippedIds = new Set()
  for (const it of equippedItems) if (it?.id) equippedIds.add(it.id)
  let count = 0
  for (const m of set.members) {
    if (m.group) {
      if (m.ids.some((id) => equippedIds.has(id))) count++
    } else {
      if (equippedIds.has(m.id)) count++
    }
  }
  if (count >= 3 && activeLucky) {
    const memberIds = new Set(set.itemIds)
    const memberTypes = new Set(
      set.members.map((m) => m.type).filter(Boolean),
    )
    if (!memberIds.has(activeLucky.id) && memberTypes.has(activeLucky.type)) {
      count += 1
    }
  }
  return count
}
