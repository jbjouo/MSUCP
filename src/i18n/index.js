import { createI18n } from 'vue-i18n'
import en from './locales/en.json'
import zhTW from './locales/zh-TW.json'

export const SUPPORTED_LOCALES = [
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'en', label: 'English' },
]

const STORAGE_KEY = 'msucp.locale'
const FALLBACK = 'zh-TW'

function detectLocale() {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved && SUPPORTED_LOCALES.some((l) => l.code === saved)) return saved
  const nav = (navigator.language || '').toLowerCase()
  if (nav.startsWith('zh')) return 'zh-TW'
  if (nav.startsWith('en')) return 'en'
  return FALLBACK
}

export const i18n = createI18n({
  legacy: false,
  locale: detectLocale(),
  fallbackLocale: FALLBACK,
  messages: {
    en,
    'zh-TW': zhTW,
  },
})

export function setLocale(code) {
  if (!SUPPORTED_LOCALES.some((l) => l.code === code)) return
  i18n.global.locale.value = code
  localStorage.setItem(STORAGE_KEY, code)
  document.documentElement.setAttribute('lang', code)
}
