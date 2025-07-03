const Localization = require('@econsult/localization');

const i18n = new Localization();

// Middleware to detect user language
const detectLanguage = (req, res, next) => {
    // Priority: Custom header > URL parameter > Accept-Language header > User preference > Default
    const locale = req.headers['x-app-language'] ||
        req.query.lang ||
        req.headers['accept-language']?.split(',')[0]?.split('-')[0] ||
        req.user?.preferredLanguage ||
        'en';

    // Validate that the locale is supported
    const supportedLocales = ['en', 'ru', 'uz'];
    const validLocale = supportedLocales.includes(locale) ? locale : 'en';

    req.locale = validLocale;
    req.t = (key, params = {}) => {
        i18n.setLocale(validLocale);
        return i18n.t(key, params);
    };

    next();
};

// Function to get localized messages (useful for API responses)
const getLocalizedMessage = (key, locale = 'en', params = {}) => {
    i18n.setLocale(locale);
    return i18n.t(key, params);
};

module.exports = {
    i18n,
    detectLanguage,
    getLocalizedMessage
};
