import { createRouter, createWebHistory } from 'vue-router'
import EquipmentPage from '../pages/EquipmentPage.vue'
import CpCalculatorPage from '../pages/CpCalculatorPage.vue'
import CharacterPage from '../pages/CharacterPage.vue'

export const routes = [
  {
    path: '/',
    redirect: '/character',
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
  // /legion 已併入 /character,相容舊連結
  {
    path: '/legion',
    redirect: '/character',
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
