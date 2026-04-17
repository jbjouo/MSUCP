// 裝備槽位定義 — 5 欄 × 6 列,對應遊戲內裝備介面
// row / col 皆以 1 起算,對應 CSS grid

export const EQUIP_GRID_COLS = 5
export const EQUIP_GRID_ROWS = 6

export const EQUIP_SLOTS = [
  // Row 1
  { key: 'ring1',     row: 1, col: 1, accepts: ['ring'] },
  { key: 'hat',       row: 1, col: 3, accepts: ['hat'] },
  { key: 'emblem',    row: 1, col: 5, accepts: ['emblem'] },
  // Row 2
  { key: 'ring2',     row: 2, col: 1, accepts: ['ring'] },
  { key: 'pendant1',  row: 2, col: 2, accepts: ['pendant'] },
  { key: 'face',      row: 2, col: 3, accepts: ['face'] },
  { key: 'badge',     row: 2, col: 5, accepts: ['badge'] },
  // Row 3
  { key: 'ring3',     row: 3, col: 1, accepts: ['ring'] },
  { key: 'pendant2',  row: 3, col: 2, accepts: ['pendant'] },
  { key: 'eye',       row: 3, col: 3, accepts: ['eye'] },
  { key: 'earring',   row: 3, col: 4, accepts: ['earring'] },
  // Row 4
  { key: 'ring4',     row: 4, col: 1, accepts: ['ring'] },
  { key: 'weapon',    row: 4, col: 2, accepts: ['weapon'] },
  { key: 'top',       row: 4, col: 3, accepts: ['top', 'overall'] },
  { key: 'shoulder',  row: 4, col: 4, accepts: ['shoulder'] },
  { key: 'secondary', row: 4, col: 5, accepts: ['secondary'] },
  // Row 5
  { key: 'pocket',    row: 5, col: 1, accepts: ['pocket'] },
  { key: 'belt',      row: 5, col: 2, accepts: ['belt'] },
  { key: 'bottom',    row: 5, col: 3, accepts: ['bottom'] },
  { key: 'glove',     row: 5, col: 4, accepts: ['glove'] },
  { key: 'cape',      row: 5, col: 5, accepts: ['cape'] },
  // Row 6
  { key: 'shoes',     row: 6, col: 3, accepts: ['shoes'] },
]

export const EQUIP_SLOTS_BY_KEY = Object.fromEntries(
  EQUIP_SLOTS.map((s) => [s.key, s]),
)

export const EQUIP_ACCEPT_TYPES = new Set(
  EQUIP_SLOTS.flatMap((s) => s.accepts),
)

// 取得可接受此 item type 的所有槽位
export function slotsAcceptingType(type) {
  return EQUIP_SLOTS.filter((s) => s.accepts.includes(type))
}

