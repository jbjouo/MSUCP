import { createRouter, createWebHistory } from 'vue-router'
import EquipmentPage from '../pages/EquipmentPage.vue'
import CpCalculatorPage from '../pages/CpCalculatorPage.vue'
import CharacterPage from '../pages/CharacterPage.vue'
import BattlePage from '../pages/BattlePage.vue'
import CharacterManagerPage from '../pages/CharacterManagerPage.vue'
import CharacterComparePage from '../pages/CharacterComparePage.vue'
import { useCharacter } from '../composables/useCharacter.js'

// 開放戰鬥模擬頁的職業 — 側欄入口 (Sidebar) 與路由守衛共用此清單
export const BATTLE_JOBS = new Set(['archmageFP'])

export const routes = [
  {
    path: '/',
    name: 'characterManager',
    component: CharacterManagerPage,
    meta: { navKey: 'characterManager' },
  },
  {
    path: '/character',
    name: 'character',
    component: CharacterPage,
    meta: { navKey: 'character' },
  },
  {
    path: '/equipment',
    name: 'equipment',
    component: EquipmentPage,
    meta: { navKey: 'equipment' },
  },
  {
    path: '/cp',
    name: 'cp',
    component: CpCalculatorPage,
    meta: { navKey: 'cp' },
  },
  {
    path: '/compare',
    name: 'characterCompare',
    component: CharacterComparePage,
    meta: { navKey: 'characterCompare' },
  },
  {
    path: '/battle',
    name: 'battle',
    component: BattlePage,
    meta: { navKey: 'battle' },
    beforeEnter: (to, from, next) => {
      const { state } = useCharacter()
      next(BATTLE_JOBS.has(state.job) ? true : '/character')
    },
  },
  // /legion 已併入 /character,相容舊連結
  {
    path: '/legion',
    redirect: '/character',
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})
