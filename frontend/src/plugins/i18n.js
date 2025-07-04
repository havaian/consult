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

const i18n = createI18n({
  locale: 'en', // set default locale
  fallbackLocale: 'en',
  messages,
})

export default i18n