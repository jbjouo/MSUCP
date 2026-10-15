// 時裝期限屬性 — 依部位固定一種屬性,抽選後的數值從 tiers 擇一 (遊戲內抽選機率 40/30/20/10%)
// slot: 對應 equipment.slots.* 的 i18n 標籤
// stats: 選定數值套到哪些 stat key (allStat 於 CP 端展開成四圍)
export const COSMETIC_ATTRS = [
  { slot: 'hat',    labelKey: 'cosmetic.attr.allStat',      stats: ['allStat'],      tiers: [4, 8, 12, 20] },
  { slot: 'top',    labelKey: 'cosmetic.attr.ignoreDef',    stats: ['ignoreDef'],    tiers: [2, 4, 6, 10], pct: true },
  { slot: 'weapon', labelKey: 'cosmetic.attr.atk',          stats: ['atk', 'matk'],  tiers: [2, 4, 6, 10] },
  { slot: 'cape',   labelKey: 'cosmetic.attr.bossDmg',      stats: ['bossDmg'],      tiers: [1, 2, 3, 5], pct: true },
  { slot: 'face',   labelKey: 'cosmetic.attr.critRate',     stats: ['critRate'],     tiers: [2, 4, 6, 10], pct: true },
  { slot: 'eye',    labelKey: 'cosmetic.attr.normalMobDmg', stats: ['normalMobDmg'], tiers: [2, 4, 6, 10], pct: true },
]

export const COSMETIC_ATTRS_BY_SLOT = Object.fromEntries(
  COSMETIC_ATTRS.map((a) => [a.slot, a]),
)
