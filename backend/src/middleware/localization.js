const { i18n, getLocalizedMessage } = require('../localization');

/**
 * Enhanced localization middleware for comprehensive user interaction handling
 */
const localizationMiddleware = (req, res, next) => {
    // Priority order for language detection:
    // 1. Custom header (x-app-language)
    // 2. Accept-Language header
    // 3. User preference from database (req.user.preferredLanguage)
    // 4. Default fallback

    const headerLang = req.headers['x-app-language'];
    const acceptLang = req.headers['accept-language']?.split(',')[0]?.split('-')[0];
    const userLang = req.user?.preferredLanguage;
    const defaultLang = process.env.DEFAULT_LOCALE || 'en';

    // Determine locale with priority
    let locale = headerLang || acceptLang || userLang || defaultLang;

    // Validate against supported locales
    const supportedLocales = (process.env.SUPPORTED_LOCALES || 'en,ru,uz').split(',');
    const validLocale = supportedLocales.includes(locale) ? locale : defaultLang;

    // Set locale on request object
    req.locale = validLocale;

    // Create translation function bound to the request
    req.t = (key, params = {}) => {
        try {
            i18n.setLocale(validLocale);
            return i18n.t(key, params);
        } catch (error) {
            console.error(`Translation error for key "${key}":`, error);
            return key; // Return the key as fallback
        }
    };

    // Add utility function for getting localized messages with different locales
    req.getLocalizedMessage = (key, locale = validLocale, params = {}) => {
        return getLocalizedMessage(key, locale, params);
    };

    // Add available locales to request
    req.availableLocales = supportedLocales;

    // Store original res.json to wrap it
    const originalJson = res.json;

    // Override res.json to automatically localize common response patterns
    res.json = function (data) {
        // If data has a 'message' property and it's a translation key, translate it
        if (data && typeof data === 'object' && data.message && typeof data.message === 'string') {
            // Check if message looks like a translation key (contains dots)
            if (data.message.includes('.')) {
                try {
                    const translatedMessage = req.t(data.message);
                    if (translatedMessage !== data.message) {
                        data.message = translatedMessage;
                    }
                } catch (error) {
                    console.warn(`Could not translate message: ${data.message}`);
                }
            }
        }

        // Call original json method
        return originalJson.call(this, data);
    };

    // Log language selection for debugging (only in development)
    if (process.env.NODE_ENV === 'development') {
        console.log(`Request language: ${validLocale} (User: ${req.user?.email || 'Anonymous'})`);
    }

    next();
};

/**
 * Middleware specifically for API routes that require user authentication
 * This should be used after authentication middleware
 */
const authenticatedLocalizationMiddleware = (req, res, next) => {
    if (req.user && req.user.preferredLanguage) {
        const supportedLocales = (process.env.SUPPORTED_LOCALES || 'en,ru,uz').split(',');

        if (supportedLocales.includes(req.user.preferredLanguage)) {
            req.locale = req.user.preferredLanguage;

            // Update the translation function
            req.t = (key, params = {}) => {
                try {
                    i18n.setLocale(req.user.preferredLanguage);
                    return i18n.t(key, params);
                } catch (error) {
                    console.error(`Translation error for key "${key}":`, error);
                    return key;
                }
            };
        }
    }

    next();
};

/**
 * Utility function to create localized validation errors
 */
const createValidationError = (req, field, errorType, params = {}) => {
    const key = `validation.${field}.${errorType}`;
    return {
        field,
        message: req.t(key, params),
        code: errorType
    };
};

/**
 * Utility function to create localized API responses
 */
const createLocalizedResponse = (req, messageKey, data = null, params = {}) => {
    const response = {
        message: req.t(messageKey, params),
        locale: req.locale,
        timestamp: new Date().toISOString()
    };

    if (data !== null) {
        response.data = data;
    }

    return response;
};

/**
 * Error handler that localizes error messages
 */
const localizedErrorHandler = (error, req, res, next) => {
    let statusCode = 500;
    let messageKey = 'errors.serverError';
    let details = null;

    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        messageKey = 'errors.validationError';
        details = Object.keys(error.errors).map(field =>
            createValidationError(req, field, 'invalid', { value: error.errors[field].value })
        );
    } else if (error.name === 'CastError') {
        statusCode = 400;
        messageKey = 'errors.invalidId';
    } else if (error.code === 11000) {
        statusCode = 409;
        messageKey = 'errors.duplicateEntry';
        const field = Object.keys(error.keyValue)[0];
        details = { field, value: error.keyValue[field] };
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        messageKey = 'errors.invalidToken';
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        messageKey = 'errors.tokenExpired';
    }

    // Log error for debugging
    console.error('Localized error:', {
        error: error.message,
        stack: error.stack,
        user: req.user?.email || 'Anonymous',
        locale: req.locale,
        url: req.url,
        method: req.method
    });

    const response = createLocalizedResponse(req, messageKey);
    if (details) response.details = details;

    res.status(statusCode).json(response);
};

module.exports = {
    localizationMiddleware,
    authenticatedLocalizationMiddleware,
    createValidationError,
    createLocalizedResponse,
    localizedErrorHandler
};