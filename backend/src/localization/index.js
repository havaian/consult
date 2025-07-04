// backend/src/localization/index.js
const i18n = require('i18n');

// Configure i18n
i18n.configure({
    locales: ['en', 'ru', 'uz'],
    directory: __dirname + '/../../locales', // Points to mounted locales directory
    defaultLocale: 'en',
    objectNotation: true,
    updateFiles: false, // Don't update files in production
    syncFiles: false
});

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
    
    // Set locale for this request
    i18n.setLocale(req, validLocale);
    
    // Add translation function to request
    req.t = (key, params = {}) => {
        return i18n.__(key, params);
    };

    next();
};

// Function to get localized messages (useful for API responses)
const getLocalizedMessage = (key, locale = 'en', params = {}) => {
    // Create a temporary object to set locale
    const tempReq = {};
    i18n.setLocale(tempReq, locale);
    return i18n.__(tempReq, key, params);
};

module.exports = {
    i18n,
    detectLanguage,
    getLocalizedMessage
};