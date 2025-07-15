// backend/src/utils/localization.js
const fs = require('fs');
const path = require('path');

/**
 * Backend localization system that uses your existing locale files
 * This avoids the path-to-regexp conflict by not using the problematic i18n library
 */
class BackendLocalization {
    constructor() {
        this.locales = {};
        this.defaultLocale = process.env.DEFAULT_LOCALE || 'en';
        this.supportedLocales = (process.env.SUPPORTED_LOCALES || 'en,ru,uz').split(',');
        this.fallbackLocale = process.env.LOCALIZATION_FALLBACK || 'en';

        this.loadExistingLocales();
    }

    /**
     * Load your existing locale files from localization/locales/
     */
    loadExistingLocales() {
        // Path to your existing locale files
        const localesPath = path.join(__dirname, '../../../localization/locales');

        console.log(`📁 Loading locales from: ${localesPath}`);

        // Check if locales directory exists
        if (!fs.existsSync(localesPath)) {
            console.error(`❌ Locales directory not found at ${localesPath}`);
            console.error('Make sure your Docker volume is mounted correctly: ./localization/locales:/app/locales:ro');
            return;
        }

        // Load each supported locale
        this.supportedLocales.forEach(locale => {
            const localeFilePath = path.join(localesPath, `${locale}.json`);

            try {
                if (fs.existsSync(localeFilePath)) {
                    const localeData = JSON.parse(fs.readFileSync(localeFilePath, 'utf8'));
                    this.locales[locale] = localeData;
                    console.log(`✅ Loaded locale: ${locale} (${Object.keys(localeData).length} sections)`);
                } else {
                    console.warn(`⚠️ Locale file not found: ${localeFilePath}`);
                }
            } catch (error) {
                console.error(`❌ Error loading locale ${locale}:`, error.message);
            }
        });

        // Validate that we have at least the fallback locale
        if (!this.locales[this.fallbackLocale]) {
            console.error(`❌ Fallback locale '${this.fallbackLocale}' not found!`);
        }
    }

    /**
     * Get translated message using your existing locale structure
     * @param {string} key - Message key in dot notation (e.g., 'errors.serverError')
     * @param {string} locale - Target locale
     * @param {object} params - Parameters for interpolation
     * @returns {string} Translated message
     */
    t(key, locale = this.defaultLocale, params = {}) {
        // Ensure locale is supported
        if (!this.supportedLocales.includes(locale)) {
            locale = this.fallbackLocale;
        }

        // Get locale data
        const localeData = this.locales[locale];

        if (!localeData) {
            console.warn(`No locale data found for ${locale}, trying fallback ${this.fallbackLocale}`);
            const fallbackData = this.locales[this.fallbackLocale];
            if (!fallbackData) {
                console.error(`Fallback locale ${this.fallbackLocale} also not found!`);
                return key;
            }
            return this.getTranslationFromData(fallbackData, key, params);
        }

        // Get translation
        const translation = this.getTranslationFromData(localeData, key, params);

        // If not found, try fallback locale
        if (translation === key && locale !== this.fallbackLocale) {
            console.warn(`Translation not found for key: ${key} in locale: ${locale}, trying fallback`);
            return this.t(key, this.fallbackLocale, params);
        }

        return translation;
    }

    /**
     * Extract translation from locale data
     * @param {object} localeData - Locale data object
     * @param {string} key - Key in dot notation
     * @param {object} params - Parameters for interpolation
     * @returns {string} Translation or key if not found
     */
    getTranslationFromData(localeData, key, params) {
        const translation = this.getNestedValue(localeData, key);

        if (translation === undefined) {
            return key;
        }

        return this.interpolate(translation, params);
    }

    /**
     * Get nested value from object using dot notation
     * @param {object} obj - Object to search in
     * @param {string} key - Key in dot notation
     * @returns {any} Value or undefined
     */
    getNestedValue(obj, key) {
        return key.split('.').reduce((current, prop) => {
            return current && current[prop] !== undefined ? current[prop] : undefined;
        }, obj);
    }

    /**
     * Interpolate parameters in translation string
     * Supports both {{param}} and {param} syntax
     * @param {string} translation - Translation string
     * @param {object} params - Parameters to interpolate
     * @returns {string} Interpolated string
     */
    interpolate(translation, params) {
        if (typeof translation !== 'string') {
            return translation;
        }

        // Handle {{param}} syntax (mustache style)
        let result = translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });

        // Handle {param} syntax (Vue i18n style)
        result = result.replace(/\{(\w+)\}/g, (match, key) => {
            return params[key] !== undefined ? params[key] : match;
        });

        return result;
    }

    /**
     * Get user's preferred locale from request
     * @param {object} req - Express request object
     * @returns {string} Preferred locale
     */
    getLocaleFromRequest(req) {
        // Priority order:
        // 1. Query parameter (?lang=en)
        // 2. User profile locale (if authenticated)
        // 3. Accept-Language header
        // 4. Default locale

        // Check query parameter
        if (req.query.lang && this.supportedLocales.includes(req.query.lang)) {
            return req.query.lang;
        }

        // Check user profile (if authenticated)
        if (req.user && req.user.preferredLocale && this.supportedLocales.includes(req.user.preferredLocale)) {
            return req.user.preferredLocale;
        }

        // Check Accept-Language header
        const acceptLanguage = req.headers['accept-language'];
        if (acceptLanguage) {
            const preferredLocales = acceptLanguage
                .split(',')
                .map(lang => lang.split(';')[0].trim().split('-')[0])
                .filter(lang => this.supportedLocales.includes(lang));

            if (preferredLocales.length > 0) {
                return preferredLocales[0];
            }
        }

        return this.defaultLocale;
    }

    /**
     * Express middleware to add localization to requests
     * @returns {function} Express middleware
     */
    middleware() {
        return (req, res, next) => {
            const locale = this.getLocaleFromRequest(req);

            // Add translation function to request
            req.t = (key, params = {}) => this.t(key, locale, params);
            req.locale = locale;

            // Add helper to response locals for templates
            res.locals.t = req.t;
            res.locals.locale = locale;

            next();
        };
    }

    /**
     * Get email subject and body translations for notifications
     * @param {string} emailType - Type of email (e.g., 'appointmentBooking', 'verification')
     * @param {string} locale - Target locale
     * @param {object} params - Parameters for interpolation
     * @returns {object} Object with subject and body
     */
    getEmailTranslations(emailType, locale, params = {}) {
        const emailPath = `email.${emailType}`;

        return {
            subject: this.t(`${emailPath}.subject`, locale, params),
            title: this.t(`${emailPath}.title`, locale, params),
            body: this.t(`${emailPath}.body`, locale, params),
            text: this.t(`${emailPath}.text`, locale, params)
        };
    }

    /**
     * Get available locales
     * @returns {array} Array of supported locales
     */
    getAvailableLocales() {
        return this.supportedLocales;
    }

    /**
     * Check if locale is supported
     * @param {string} locale - Locale to check
     * @returns {boolean} True if supported
     */
    isLocaleSupported(locale) {
        return this.supportedLocales.includes(locale);
    }

    /**
     * Reload locales (useful for development)
     */
    reloadLocales() {
        this.locales = {};
        this.loadExistingLocales();
        console.log('🔄 Locales reloaded');
    }
}

// Create singleton instance
const backendLocalization = new BackendLocalization();

module.exports = {
    BackendLocalization,
    localization: backendLocalization
};