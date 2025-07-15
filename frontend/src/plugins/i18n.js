// frontend/src/plugins/i18n.js
import { createI18n } from 'vue-i18n'

// Import your locale files directly
import en from '@/localization/locales/en.json'
import ru from '@/localization/locales/ru.json'
import uz from '@/localization/locales/uz.json'

const messages = {
  en,
  ru,
  uz
}

// Get saved locale from localStorage or default to 'en'
const savedLocale = localStorage.getItem('locale') || 'en'
const initialLocale = messages[savedLocale] ? savedLocale : 'en'

const i18n = createI18n({
  locale: initialLocale,
  fallbackLocale: 'en',
  messages,
  legacy: false, // Enable composition API mode
})

// Enhanced i18n helper functions
const i18nHelpers = {
  getCurrentLocale() {
    return i18n.global.locale.value
  },

  setLocale(locale) {
    if (messages[locale]) {
      i18n.global.locale.value = locale
      localStorage.setItem('locale', locale)
      document.documentElement.lang = locale
      return true
    }
    console.warn(`Locale '${locale}' not found`)
    return false
  },

  getAvailableLocales() {
    return Object.keys(messages)
  },

  isLocaleAvailable(locale) {
    return Object.keys(messages).includes(locale)
  },

  // Translation helper that works with the global instance
  t(key, params = {}) {
    return i18n.global.t(key, params)
  }
}

// Attach helpers to i18n instance
Object.assign(i18n, i18nHelpers)

export default i18n