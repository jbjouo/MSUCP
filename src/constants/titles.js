// Title 稱號 — 可切換開關的永久性加成 (類似 Buff 但屬於稱號類)
//
// 結構:
//   { id, name, icon, stats?, jobs? }
//   stats: 啟用時的屬性加成 (key/value bag)
//   jobs : 若有值,只有對應職業能見到 (預設全職業可見)

export const TITLES = [
  {
    id: 'blessed_maple_goddesses',
    name: 'Blessed of the Maple Goddesses',
    icon: '/skills/titles/maple_goddesses.png',
    stats: {
      allStat: 20,
      atk: 10,
      matk: 10,
      bossDmg: 10,
      ignoreDef: 10,
      critRate: 15,
      buffDuration: 15,
    },
  },
]

export const TITLES_BY_ID = Object.fromEntries(TITLES.map((t) => [t.id, t]))
