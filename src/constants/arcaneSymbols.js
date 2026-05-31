// 秘法符文 (Arcane Symbol) — ARC 系統
//
// 6 個符文,每個 0 ~ 20 級。
//   Lv 1  : ARC +30,  主屬性 +300
//   每升一級 : ARC +10,  主屬性 +100
//
// 主屬性依角色 currentJob.primary 決定 (str/dex/int/luk)。
// ARC (Arcane Power) 為獨立屬性,僅在面板顯示;主屬性加成視為 fixed flat (不吃 % 加成)。

import { ASSET } from './skills/_shared/helpers.js'

export const ARCANE_MAX_LEVEL = 20

export const ARCANE_SYMBOLS = [
  { id: 'vanishing_journey', nameKey: 'arcane.vanishing_journey', imageUrl: ASSET('images/arcane/1712001.png') },
  { id: 'chu_chu_island',    nameKey: 'arcane.chu_chu_island',    imageUrl: ASSET('images/arcane/1712002.png') },
  { id: 'lachelein',         nameKey: 'arcane.lachelein',         imageUrl: ASSET('images/arcane/1712003.png') },
  { id: 'arcana',            nameKey: 'arcane.arcana',            imageUrl: ASSET('images/arcane/1712004.png') },
  { id: 'morass',            nameKey: 'arcane.morass',            imageUrl: ASSET('images/arcane/1712005.png') },
  { id: 'esfera',            nameKey: 'arcane.esfera',            imageUrl: ASSET('images/arcane/1712006.png') },
]

export function arcForLevel(level) {
  const n = Math.max(0, Math.min(ARCANE_MAX_LEVEL, Math.floor(Number(level) || 0)))
  return n >= 1 ? 30 + (n - 1) * 10 : 0
}

export function mainStatForLevel(level) {
  const n = Math.max(0, Math.min(ARCANE_MAX_LEVEL, Math.floor(Number(level) || 0)))
  return n >= 1 ? 300 + (n - 1) * 100 : 0
}
