// Title 稱號 — 可切換開關的永久性加成
// 不屬於 0~6 轉技能系統,單獨放在本檔。
//
// schema:
//   id, name, nameKey?, descriptionKey?, icon
//   stats?  — 啟用時的靜態加成
//   jobs?   — 限定職業 (預設全職業可見)

export const TITLES = [
  {
    id: 'blessed_maple_goddesses',
    name: 'Blessed of the Maple Goddesses',
    nameKey: 'titles.blessed_maple_goddesses.name',
    descriptionKey: 'titles.blessed_maple_goddesses.description',
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
