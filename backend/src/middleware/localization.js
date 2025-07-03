// File: backend/src/middleware/localization.js
const { detectLanguage } = require('../localization');

module.exports = detectLanguage;

// File: backend/src/user/controller.js (Updated with localization)
const User = require('./model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getLocalizedMessage } = require('../localization');

const userController = {
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;
            const locale = req.locale || 'en';

            // Validate input
            if (!email || !password) {
                return res.status(400).json({
                    message: req.t('errors.validation'),
                    field: 'email_password'
                });
            }

            // Find user
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(401).json({
                    message: req.t('auth.invalidCredentials')
                });
            }

            // Check password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(401).json({
                    message: req.t('auth.invalidCredentials')
                });
            }

            // Generate JWT
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );

            res.json({
                message: req.t('auth.loginSuccess'),
                token,
                user: {
                    id: user._id,
                    email: user.email,
                    role: user.role,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    preferredLanguage: user.preferredLanguage || locale
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({
                message: req.t('errors.serverError')
            });
        }
    },

    async updateUserProfile(req, res) {
        try {
            const userId = req.user.id;
            const updates = req.body;

            // Update user's preferred language if provided
            if (updates.preferredLanguage) {
                const { i18n } = require('../localization');
                if (!i18n.hasLocale(updates.preferredLanguage)) {
                    return res.status(400).json({
                        message: req.t('errors.invalidLanguage')
                    });
                }
            }

            const user = await User.findByIdAndUpdate(
                userId,
                updates,
                { new: true, runValidators: true }
            );

            if (!user) {
                return res.status(404).json({
                    message: req.t('errors.notFound')
                });
            }

            res.json({
                message: req.t('success.updated'),
                user: {
                    id: user._id,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    preferredLanguage: user.preferredLanguage
                }
            });
        } catch (error) {
            console.error('Update profile error:', error);
            res.status(500).json({
                message: req.t('errors.serverError')
            });
        }
    }
};

module.exports = userController;