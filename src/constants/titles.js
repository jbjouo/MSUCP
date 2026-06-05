// Title 稱號 — 可切換開關的永久性加成
// 不屬於 0~6 轉技能系統,單獨放在本檔。
//
// schema:
//   id, name, nameKey?, descriptionKey?, icon
//   stats?  — 啟用時的靜態加成
//   jobs?   — 限定職業 (預設全職業可見)

import { ASSET } from './skills/_shared/helpers.js'

export const TITLES = [
  {
    id: 'blessed_maple_goddesses',
    name: 'Blessed of the Maple Goddesses',
    nameKey: 'titles.blessed_maple_goddesses.name',
    descriptionKey: 'titles.blessed_maple_goddesses.description',
    icon: ASSET('skills/titles/maple_goddesses.png'),
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
  {
    id: 'mulung_600y_inner_power',
    name: 'One with 600 Years of Inner Power',
    nameKey: 'titles.mulung_600y_inner_power.name',
    descriptionKey: 'titles.mulung_600y_inner_power.description',
    icon: ASSET('skills/titles/mulung_600y_inner_power.png'),
    stats: {
      allStat: 15,
      atk: 9,
      matk: 9,
      hp: 400,
      mp: 400,
      bossDmg: 10,
    },
  },
  {
    id: 'holy_pink_beanity',
    name: 'Holy Pink Beanity',
    nameKey: 'titles.holy_pink_beanity.name',
    descriptionKey: 'titles.holy_pink_beanity.description',
    icon: ASSET('skills/titles/holy_pink_beanity.png'),
    stats: {
      allStat: 10,
      atk: 5,
      matk: 5,
      bossDmg: 10,
    },
  },
]

export const TITLES_BY_ID = Object.fromEntries(TITLES.map((t) => [t.id, t]))
