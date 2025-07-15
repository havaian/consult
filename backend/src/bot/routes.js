const express = require('express');
const router = express.Router();
const { handleUpdate, telegramBot } = require('./index');
const { verifyTelegramWebhook } = require('../auth/index');

/**
 * @route POST /api/telegram/webhook/:secret
 * @desc Webhook endpoint for Telegram updates
 * @access Private (requires secret)
 */
router.post('/webhook/:secret', verifyTelegramWebhook, (req, res) => {
    handleUpdate(req, res);
});

/**
 * @route POST /api/telegram/verification
 * @desc Generate a verification code to link Telegram account
 * @access Public
 */
router.post('/verification', async (req, res) => {
    try {
        const { email, telegramChatId } = req.body;

        if (!email || !telegramChatId) {
            return res.status(400).json({
                success: false,
                message: req.t('validation.required')
            });
        }

        // Import User model
        const User = require('../user/model');

        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: req.t('errors.notFound')
            });
        }

        // Generate random 6-digit code
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Save verification code and expiration (valid for 15 minutes)
        user.telegramVerificationCode = verificationCode;
        user.telegramVerificationExpire = Date.now() + 15 * 60 * 1000;
        await user.save();

        // Send email with verification code
        const { NotificationService } = require('../notification');
        await NotificationService.sendEmail({
            to: email,
            subject: 'Telegram Verification Code - consult.ytech.space',
            text: `Your verification code for linking your Telegram account is: ${verificationCode}. This code is valid for 15 minutes.`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">consult.ytech.space Telegram Verification</h2>
          <p>Your verification code for linking your Telegram account is:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h1 style="font-size: 32px; margin: 0; color: #333;">${verificationCode}</h1>
          </div>
          <p>This code is valid for 15 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `
        });

        res.status(200).json({
            success: true,
            message: req.t('telegram.codeSent')
        });
    } catch (error) {
        console.error('Error generating verification code:', error);
        res.status(500).json({
            success: false,
            message: req.t('telegram.codeGenerationFailed')
        });
    }
});

/**
 * @route POST /api/telegram/send
 * @desc Send a message to a user via Telegram
 * @access Private (requires API key)
 */
router.post('/send', async (req, res) => {
    try {

        const { userId, message, parseMode } = req.body;

        if (!userId || !message) {
            return res.status(400).json({
                success: false,
                message: req.t('validation.required')
            });
        }

        if (!telegramBot) {
            return res.status(503).json({
                success: false,
                message: req.t('telegram.botNotInitialized')
            });
        }

        // Find user's Telegram ID
        const User = require('../user/model');
        const user = await User.findById(userId);

        if (!user || !user.telegramId) {
            return res.status(404).json({
                success: false,
                message: req.t('errors.serverError')
            });
        }

        // Send message
        const options = {};
        if (parseMode && ['HTML', 'Markdown', 'MarkdownV2'].includes(parseMode)) {
            options.parse_mode = parseMode;
        }

        await telegramBot.telegram.sendMessage(user.telegramId, message, options);

        res.status(200).json({
            success: true,
            message: req.t('success.sent')
        });
    } catch (error) {
        console.error('Error sending Telegram message:', error);
        res.status(500).json({
            success: false,
            message: req.t('telegram.sendFailed'),
            error: error.message
        });
    }
});

/**
 * @route GET /api/telegram/status
 * @desc Check Telegram bot status
 * @access Public
 */
router.get('/status', (req, res) => {
    if (telegramBot) {
        res.status(200).json({
            status: 'online',
            mode: process.env.NODE_ENV === 'production' ? 'webhook' : 'polling'
        });
    } else {
        res.status(503).json({
            status: 'offline',
            message: req.t('telegram.botNotInitialized')
        });
    }
});

module.exports = router;