// frontend/src/plugins/i18n.js
import { createI18n } from 'vue-i18n'

// Import your locale files directly
import en from '../locales/en.json'
import ru from '../locales/ru.json'
import uz from '../locales/uz.json'

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