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
    id: 'yeti_x_pink_bean',
    name: 'Yeti x Pink Bean',
    nameKey: 'titles.yeti_x_pink_bean.name',
    descriptionKey: 'titles.yeti_x_pink_bean.description',
    icon: ASSET('skills/titles/3700683.png'),
    stats: {
      allStat: 20,
      atk: 10,
      matk: 10,
      bossDmg: 10,
    },
  },
  {
    id: 'mulung_600y_inner_power',
    name: 'One with 600 Years of Inner Power',
    nameKey: 'titles.mulung_600y_inner_power.name',
    descriptionKey: 'titles.mulung_600y_inner_power.description',
    icon: ASSET('skills/titles/3700744.png'),
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
    id: 'mulung_300y_inner_power',
    name: 'One with 300 Years of Inner Power',
    nameKey: 'titles.mulung_300y_inner_power.name',
    descriptionKey: 'titles.mulung_300y_inner_power.description',
    icon: ASSET('skills/titles/3700743.png'),
    stats: {
      allStat: 10,
      atk: 7,
      matk: 7,
      hp: 300,
      mp: 300,
      bossDmg: 5,
    },
  },
  {
    id: 'mulung_120y_inner_power',
    name: 'One with 120 Years of Inner Power',
    nameKey: 'titles.mulung_120y_inner_power.name',
    descriptionKey: 'titles.mulung_120y_inner_power.description',
    icon: ASSET('skills/titles/3700742.png'),
    stats: {
      allStat: 5,
      atk: 4,
      matk: 4,
      hp: 200,
      mp: 200,
    },
  },
  {
    id: 'superior_hunter',
    name: 'Superior Hunter',
    nameKey: 'titles.superior_hunter.name',
    descriptionKey: 'titles.superior_hunter.description',
    icon: ASSET('skills/titles/3700447.png'),
    stats: {
      allStat: 3,
      atk: 1,
      matk: 1,
      hp: 400,
      mp: 400,
    },
  },
  {
    id: 'first_spider_exterminator',
    name: 'First Spider Exterminator',
    nameKey: 'titles.first_spider_exterminator.name',
    descriptionKey: 'titles.first_spider_exterminator.description',
    icon: ASSET('skills/titles/3700898.png'),
    stats: {
      allStat: 10,
      atk: 5,
      matk: 5,
      bossDmg: 10,
    },
  },
  {
    id: 'spider_exterminator',
    name: 'Spider Exterminator',
    nameKey: 'titles.spider_exterminator.name',
    descriptionKey: 'titles.spider_exterminator.description',
    icon: ASSET('skills/titles/3700899.png'),
    stats: {
      allStat: 10,
      atk: 5,
      matk: 5,
      bossDmg: 10,
    },
  },
  {
    id: 'mvp_black',
    name: 'MVP Black',
    nameKey: 'titles.mvp_black.name',
    descriptionKey: 'titles.mvp_black.description',
    icon: ASSET('skills/titles/3700845.png'),
    stats: {
      allStat: 10,
      atk: 10,
      matk: 10,
      hp: 500,
      mp: 500,
      ignoreDef: 8,
    },
  },
  {
    id: 'holy_pink_beanity',
    name: 'Holy Pink Beanity',
    nameKey: 'titles.holy_pink_beanity.name',
    descriptionKey: 'titles.holy_pink_beanity.description',
    icon: ASSET('skills/titles/3700287.png'),
    stats: {
      allStat: 10,
      atk: 5,
      matk: 5,
      bossDmg: 10,
    },
  },
]

export const TITLES_BY_ID = Object.fromEntries(TITLES.map((t) => [t.id, t]))
