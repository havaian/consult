// File: backend/src/utils/responseHelper.js
const { getLocalizedMessage } = require('../localization');

class ResponseHelper {
    static success(res, messageKey, data = null, locale = 'en', statusCode = 200) {
        const response = {
            success: true,
            message: getLocalizedMessage(messageKey, locale)
        };

        if (data) {
            response.data = data;
        }

        return res.status(statusCode).json(response);
    }

    static error(res, messageKey, locale = 'en', statusCode = 400, details = null) {
        const response = {
            success: false,
            message: getLocalizedMessage(messageKey, locale)
        };

        if (details) {
            response.details = details;
        }

        return res.status(statusCode).json(response);
    }

    static validationError(res, errors, locale = 'en') {
        return res.status(400).json({
            success: false,
            message: getLocalizedMessage('errors.validation', locale),
            errors
        });
    }
}

module.exports = ResponseHelper;