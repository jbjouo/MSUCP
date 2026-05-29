import { createApp } from 'vue'
import './style.css'
// 必須在 App 之前 import:此模組會在 module init 階段做 legacy key 遷移
import './composables/useActiveCharacter.js'
import App from './App.vue'
import { router } from './router'
import { i18n } from './i18n'

const app = createApp(App)
app.use(router)
app.use(i18n)
app.mount('#app')

document.documentElement.setAttribute('lang', i18n.global.locale.value)
