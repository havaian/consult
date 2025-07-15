// frontend/src/composables/useI18n.js
import { ref, computed } from 'vue';
import i18n from '@/plugins/i18n';

// Fix: Use the correct method to get current locale
const currentLocale = ref(i18n.global?.locale?.value || i18n.locale || 'en');

export function useI18n() {
    const t = (key, params = {}) => {
        return i18n.global?.t(key, params) || i18n.t(key, params);
    };

    const setLocale = (locale) => {
        try {
            // Try different methods based on your i18n setup
            if (i18n.global?.locale) {
                i18n.global.locale.value = locale;
            } else if (i18n.setLocale) {
                i18n.setLocale(locale);
            } else {
                i18n.locale = locale;
            }
            
            currentLocale.value = locale;
            localStorage.setItem('locale', locale);

            // Update document language
            document.documentElement.lang = locale;

            // Emit custom event for components that need to react
            window.dispatchEvent(new CustomEvent('localeChanged', {
                detail: { locale }
            }));

            return true;
        } catch (error) {
            console.error('Error setting locale:', error);
            return false;
        }
    };

    const availableLocales = computed(() => {
        return i18n.availableLocales || i18n.global?.availableLocales || ['en', 'uz', 'ru'];
    });
    
    const locale = computed(() => currentLocale.value);

    return {
        t,
        setLocale,
        availableLocales,
        locale
    };
}