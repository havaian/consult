// File: shared-localization/index.js
class Localization {
    constructor() {
        this.translations = {
            en: require('./locales/en.json'),
            ru: require('./locales/ru.json'),
            uz: require('./locales/uz.json')
        };
        this.currentLocale = 'en';
        this.fallbackLocale = 'en';
    }

    setLocale(locale) {
        if (this.translations[locale]) {
            this.currentLocale = locale;
            return true;
        }
        console.warn(`Locale ${locale} not found, using fallback`);
        return false;
    }

    t(key, params = {}) {
        const value = this.getValue(key, this.currentLocale) ||
            this.getValue(key, this.fallbackLocale) ||
            key;

        return this.interpolate(value, params);
    }

    getValue(key, locale) {
        const keys = key.split('.');
        let value = this.translations[locale];

        for (const k of keys) {
            if (value && typeof value === 'object' && value[k] !== undefined) {
                value = value[k];
            } else {
                return null;
            }
        }

        return value;
    }

    interpolate(str, params) {
        if (typeof str !== 'string') return str;

        return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });
    }

    // Get all available locales
    getAvailableLocales() {
        return Object.keys(this.translations);
    }

    // Get current locale
    getCurrentLocale() {
        return this.currentLocale;
    }

    // Check if locale exists
    hasLocale(locale) {
        return this.translations.hasOwnProperty(locale);
    }

    // Get all translations for a locale (useful for frontend)
    getTranslations(locale = this.currentLocale) {
        return this.translations[locale] || {};
    }
}

module.exports = Localization;