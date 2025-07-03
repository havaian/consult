// File: backend/index.js (Updated to include localization middleware)
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const socketIo = require('socket.io');

// Import localization middleware
const localizationMiddleware = require('./src/middleware/localization');

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

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: (req) => req.t('errors.tooManyRequests')
});
app.use('/api', limiter);

// Routes
app.use('/api/users', require('./src/user/routes'));
app.use('/api/appointments', require('./src/appointment/routes'));
app.use('/api/chat', require('./src/chat/routes'));
app.use('/api/admin', require('./src/admin/routes'));

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: req.t('system.healthy'),
        timestamp: new Date().toISOString()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: req.t('errors.serverError')
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        message: req.t('errors.notFound')
    });
});

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = server;