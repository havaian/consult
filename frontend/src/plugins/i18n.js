// File: frontend/src/plugins/i18n.js
import Localization from '@econsult/localization';

const i18n = new Localization();

// Set default locale based on browser or saved preference
const savedLocale = localStorage.getItem('locale') ||
    navigator.language.split('-')[0] ||
    'en';

i18n.setLocale(savedLocale);

export default i18n;

// File: frontend/src/composables/useI18n.js
import { ref, computed } from 'vue';
import i18n from '../plugins/i18n';

const currentLocale = ref(i18n.getCurrentLocale());

export function useI18n() {
    const t = (key, params = {}) => {
        return i18n.t(key, params);
    };

    const setLocale = (locale) => {
        if (i18n.setLocale(locale)) {
            currentLocale.value = locale;
            localStorage.setItem('locale', locale);

            // Update document language
            document.documentElement.lang = locale;

            // Emit custom event for components that need to react
            window.dispatchEvent(new CustomEvent('localeChanged', {
                detail: { locale }
            }));

            return true;
        }
        return false;
    };

    const availableLocales = computed(() => i18n.getAvailableLocales());
    const locale = computed(() => currentLocale.value);

    return {
        t,
        setLocale,
        availableLocales,
        locale
    };
}