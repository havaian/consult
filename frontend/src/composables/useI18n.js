// frontend/src/composables/useI18n.js
import { ref, computed } from 'vue'
import i18n from '@/plugins/i18n'

const currentLocale = ref(i18n.getCurrentLocale())

export function useI18n() {  // Make sure this line has 'export'
  const t = (key, params = {}) => {
    return i18n.global.t(key, params)
  }

  const setLocale = (locale) => {
    if (i18n.setLocale(locale)) {
      currentLocale.value = locale
      
      // Emit custom event for components that need to react
      window.dispatchEvent(new CustomEvent('localeChanged', {
        detail: { locale }
      }))
      
      return true
    }
    return false
  }

  const availableLocales = computed(() => i18n.getAvailableLocales())
  const locale = computed(() => currentLocale.value)

  return {
    t,
    setLocale,
    availableLocales,
    locale
  }
}