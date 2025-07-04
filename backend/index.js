// File: backend/index.js (Updated with enhanced localization middleware)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');

// Import enhanced localization middleware
const {
    localizationMiddleware,
    authenticatedLocalizationMiddleware,
    localizedErrorHandler
} = require('./src/middleware/localization');

// Import authentication middleware
const { authenticateUser } = require('./src/auth');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Localization middleware - should be early in the middleware chain
app.use(localizationMiddleware);

// Compression
app.use(compression());

// Rate limiting with localized messages
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: (req) => ({
        message: req.t('errors.tooManyRequests'),
        locale: req.locale,
        timestamp: new Date().toISOString()
    }),
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api', limiter);

// Enhanced localization for authenticated routes
app.use('/api', authenticateUser, authenticatedLocalizationMiddleware);

// Import route files
const userRoutes = require('./src/user/routes');
const appointmentRoutes = require('./src/appointment/routes');
const paymentRoutes = require('./src/payment/routes');
const consultationRoutes = require('./src/consultation/routes');
const adminRoutes = require('./src/admin/routes');
const specializationRoutes = require('./src/specializations/routes');
const chatRoutes = require('./src/chat/routes');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/specializations', specializationRoutes);
app.use('/api/chat', chatRoutes);

// Health check endpoint with localization
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: req.t('system.healthy'),
        locale: req.locale,
        supportedLocales: req.availableLocales,
        timestamp: new Date().toISOString()
    });
});

// Enhanced error handling middleware with localization
app.use(localizedErrorHandler);

// 404 handler with localization
app.use('*', (req, res) => {
    res.status(404).json({
        message: req.t('errors.notFound'),
        locale: req.locale,
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Default locale: ${process.env.DEFAULT_LOCALE || 'en'}`);
    console.log(`Supported locales: ${process.env.SUPPORTED_LOCALES || 'en,ru,uz'}`);
});

module.exports = server;