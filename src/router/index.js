import { createRouter, createWebHistory } from 'vue-router'
import EquipmentPage from '../pages/EquipmentPage.vue'
import CpCalculatorPage from '../pages/CpCalculatorPage.vue'
import LegionPage from '../pages/LegionPage.vue'
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
  {
    path: '/legion',
    name: 'legion',
    component: LegionPage,
    meta: { navKey: 'legion' },
  },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
