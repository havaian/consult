const nodemailer = require('nodemailer');
const amqp = require('amqplib');
const { telegramBot } = require('../bot');
const consultationNotification = require('./consultationNotification');
const emailService = require('./emailService');
const { getLocalizedMessage } = require('../localization');

/**
 * Notification Service
 * Handles sending various notifications through email, SMS, push notifications, and Telegram
 */
class NotificationService {
    constructor() {
        // Initialize email transporter
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });

        // Initialize RabbitMQ connection (for async notifications)
        this.initializeRabbitMQ();
    }

    /**
     * Initialize RabbitMQ connection and channels with retry logic
     */
    async initializeRabbitMQ() {
        const maxRetries = 10;  // Increased retries
        const retryInterval = 10000; // Increased to 10 seconds
        let attempts = 0;

        const tryConnect = async () => {
            try {
                attempts++;
                console.log(`🔄 Attempting to connect to RabbitMQ (Attempt ${attempts}/${maxRetries})...`);

                // Wait for RabbitMQ to be fully ready
                if (attempts > 1) {
                    await new Promise(resolve => setTimeout(resolve, retryInterval));
                }

                this.rabbitConnection = await amqp.connect(process.env.RABBITMQ_URI);

                // Set up event handlers for connection
                this.rabbitConnection.on('error', (err) => {
                    console.error('⚠️ RabbitMQ connection error:', err);
                    setTimeout(() => this.initializeRabbitMQ(), retryInterval);
                });

                this.rabbitConnection.on('close', () => {
                    console.warn('⚠️ RabbitMQ connection closed. Attempting to reconnect...');
                    setTimeout(() => this.initializeRabbitMQ(), retryInterval);
                });

                // Create channel
                this.rabbitChannel = await this.rabbitConnection.createChannel();

                // Set up event handlers for channel
                this.rabbitChannel.on('error', (err) => {
                    console.error('⚠️ RabbitMQ channel error:', err);
                    setTimeout(() => this.createChannel(), retryInterval);
                });

                this.rabbitChannel.on('close', () => {
                    console.warn('⚠️ RabbitMQ channel closed. Attempting to recreate...');
                    setTimeout(() => this.createChannel(), retryInterval);
                });

                // Define notification queues
                await this.rabbitChannel.assertQueue('email_notifications', { durable: true });
                await this.rabbitChannel.assertQueue('sms_notifications', { durable: true });
                await this.rabbitChannel.assertQueue('push_notifications', { durable: true });
                await this.rabbitChannel.assertQueue('telegram_notifications', { durable: true });

                console.log('✅ RabbitMQ connection established for notifications');
                return true;
            } catch (error) {
                console.error(`❌ Failed to connect to RabbitMQ (Attempt ${attempts}/${maxRetries}):`, error.message);

                if (attempts >= maxRetries) {
                    console.error('⚠️ Maximum connection attempts reached. System will operate without message queuing.');
                    return false;
                }

                console.log(`⏳ Retrying in ${retryInterval / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, retryInterval));
                return tryConnect();
            }
        };

        return tryConnect();
    }

    /**
     * Create a RabbitMQ channel (used for reconnection)
     */
    async createChannel() {
        try {
            if (!this.rabbitConnection || this.rabbitConnection.closed) {
                await this.initializeRabbitMQ();
                return;
            }

            this.rabbitChannel = await this.rabbitConnection.createChannel();

            // Re-assert queues on channel reconnection
            await this.rabbitChannel.assertQueue('email_notifications', { durable: true });
            await this.rabbitChannel.assertQueue('sms_notifications', { durable: true });
            await this.rabbitChannel.assertQueue('push_notifications', { durable: true });
            await this.rabbitChannel.assertQueue('telegram_notifications', { durable: true });

            // Start consuming from the email queue
            this.setupEmailConsumer();

            console.log('RabbitMQ connection established for notifications');
        } catch (error) {
            console.error('Error creating RabbitMQ channel:', error);
            setTimeout(() => this.createChannel(), 5000);
        }
    }

    /**
     * Set up consumer for email queue
     */
    setupEmailConsumer() {
        if (!this.rabbitChannel) {
            console.error('Cannot set up email consumer: RabbitMQ channel not available');
            return;
        }

        this.rabbitChannel.prefetch(1); // Process one message at a time

        this.rabbitChannel.consume('email_notifications', async (msg) => {
            if (!msg) return;

            try {
                const emailData = JSON.parse(msg.content.toString());
                console.log(`Processing email to: ${emailData.to}, subject: ${emailData.subject}`);

                // Send the email
                await this.sendEmail(emailData);

                // Acknowledge message
                this.rabbitChannel.ack(msg);
            } catch (error) {
                console.error('Error sending queued email:', error);

                // Only retry if it's not a permanent error
                const isPermanentError =
                    error.message.includes('no recipients defined') ||
                    error.message.includes('authentication failed');

                this.rabbitChannel.nack(msg, false, !isPermanentError);
            }
        });

        console.log('Email consumer initialized and listening for messages');
    }

    /**
     * Queue an email to be sent asynchronously
     * @param {Object} emailData Email data (to, subject, text, html)
     */
    queueEmail(emailData) {
        if (!this.rabbitChannel) {
            console.error('RabbitMQ channel not available for email notifications');
            // Fallback to direct send
            this.sendEmail(emailData).catch(err => {
                console.error('Error in fallback email send:', err);
            });
            return;
        }

        try {
            this.rabbitChannel.sendToQueue(
                'email_notifications',
                Buffer.from(JSON.stringify(emailData)),
                { persistent: true }
            );
            console.log('Email successfully queued to RabbitMQ:', emailData.to);
        } catch (error) {
            console.error('Error queueing email to RabbitMQ:', error);
            // Fall back to direct sending
            this.sendEmail(emailData).catch(err => {
                console.error('Error in fallback direct email sending:', err);
            });
        }
    }

    /**
     * Send an email directly
     * @param {Object} emailData Email data (to, subject, text, html)
     */
    async sendEmail(emailData) {
        try {
            const { to, subject, text, html } = emailData;

            console.log('Sending email:');
            console.log('- To:', to);
            console.log('- Subject:', subject);

            const mailOptions = {
                from: `"e-consult.uz" <${process.env.SMTP_FROM_EMAIL}>`,
                to,
                subject,
                text,
                html
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    /**
     * Queue an SMS to be sent asynchronously
     * @param {Object} smsData SMS data (to, message)
     */
    queueSMS(smsData) {
        if (!this.rabbitChannel) {
            console.error('RabbitMQ channel not available for SMS notifications');
            return;
        }

        try {
            this.rabbitChannel.sendToQueue(
                'sms_notifications',
                Buffer.from(JSON.stringify(smsData)),
                { persistent: true }
            );
        } catch (error) {
            console.error('Error queuing SMS:', error);
        }
    }

    /**
     * Queue a push notification to be sent asynchronously
     * @param {Object} pushData Push notification data (userId, title, body, data)
     */
    queuePushNotification(pushData) {
        if (!this.rabbitChannel) {
            console.error('RabbitMQ channel not available for push notifications');
            return;
        }

        try {
            this.rabbitChannel.sendToQueue(
                'push_notifications',
                Buffer.from(JSON.stringify(pushData)),
                { persistent: true }
            );
        } catch (error) {
            console.error('Error queuing push notification:', error);
        }
    }

    /**
     * Queue a Telegram message to be sent asynchronously
     * @param {Object} telegramData Telegram message data (chatId, text, options)
     */
    queueTelegramMessage(telegramData) {
        if (!this.rabbitChannel) {
            console.error('RabbitMQ channel not available for Telegram notifications');
            // Fallback to direct send
            this.sendTelegramMessage(telegramData.chatId, telegramData.text, telegramData.options).catch(err => {
                console.error('Error in fallback Telegram send:', err);
            });
            return;
        }

        try {
            this.rabbitChannel.sendToQueue(
                'telegram_notifications',
                Buffer.from(JSON.stringify(telegramData)),
                { persistent: true }
            );
        } catch (error) {
            console.error('Error queuing Telegram message:', error);
            // Fallback to direct send
            this.sendTelegramMessage(telegramData.chatId, telegramData.text, telegramData.options).catch(err => {
                console.error('Error in fallback Telegram send:', err);
            });
        }
    }

    /**
     * Send a Telegram message directly
     * @param {String} chatId Telegram chat ID
     * @param {String} text Message text
     * @param {Object} options Additional options
     */
    async sendTelegramMessage(chatId, text, options = {}) {
        try {
            if (!telegramBot) {
                console.error('Telegram bot not initialized');
                return;
            }

            const result = await telegramBot.telegram.sendMessage(chatId, text, options);
            return result;
        } catch (error) {
            console.error('Error sending Telegram message:', error);
            throw error;
        }
    }

    /**
     * Send verification email
     * @param {String} email User email
     * @param {String} token Verification token
     * @param {String} locale User's preferred language
     */
    async sendVerificationEmail(email, token, locale = 'en') {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

        const emailData = {
            to: email,
            subject: getLocalizedMessage('emails.verification.subject', locale),
            text: getLocalizedMessage('emails.verification.text', locale, { verificationLink }),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.verification.title', locale)}</h2>
          <p>${getLocalizedMessage('emails.verification.body', locale)}</p>
          <a href="${verificationLink}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">${getLocalizedMessage('emails.verification.button', locale)}</a>
          <p>${getLocalizedMessage('emails.verification.altText', locale)}</p>
          <p>${verificationLink}</p>
          <p>${getLocalizedMessage('emails.verification.expiry', locale)}</p>
          <p>${getLocalizedMessage('emails.verification.ignore', locale)}</p>
        </div>
      `
        };

        // Queue email to be sent asynchronously
        this.queueEmail(emailData);

        // Also try sending directly for important verification emails
        try {
            await this.sendEmail(emailData);
            console.log('Verification email sent directly as backup');
        } catch (directError) {
            console.error('Direct verification email sending failed (queued version still processing):', directError.message);
        }
    }

    /**
     * Send password reset email
     * @param {String} email User email
     * @param {String} token Reset token
     * @param {String} locale User's preferred language
     */
    async sendPasswordResetEmail(email, token, locale = 'en') {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        const emailData = {
            to: email,
            subject: getLocalizedMessage('emails.passwordReset.subject', locale),
            text: getLocalizedMessage('emails.passwordReset.text', locale, { resetLink }),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.passwordReset.title', locale)}</h2>
          <p>${getLocalizedMessage('emails.passwordReset.body', locale)}</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">${getLocalizedMessage('emails.passwordReset.button', locale)}</a>
          <p>${getLocalizedMessage('emails.passwordReset.altText', locale)}</p>
          <p>${resetLink}</p>
          <p>${getLocalizedMessage('emails.passwordReset.expiry', locale)}</p>
          <p>${getLocalizedMessage('emails.passwordReset.ignore', locale)}</p>
        </div>
      `
        };

        // Queue email to be sent asynchronously
        this.queueEmail(emailData);

        // Also try sending directly for important reset emails
        try {
            await this.sendEmail(emailData);
            console.log('Password reset email sent directly as backup');
        } catch (directError) {
            console.error('Direct password reset email sending failed (queued version still processing):', directError.message);
        }
    }

    /**
     * Send appointment confirmation
     * @param {Object} appointment Appointment object
     */
    async sendAppointmentConfirmation(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor, dateTime, type } = appointment;

            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            const formattedDateTime = new Date(dateTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Email to client
            const clientEmailData = {
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentConfirmation.client.subject', clientLocale),
                text: getLocalizedMessage('emails.appointmentConfirmation.client.text', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`,
                    dateTime: formattedDateTime
                }),
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentConfirmation.client.title', clientLocale)}</h2>
            <p>${getLocalizedMessage('emails.appointmentConfirmation.client.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formattedDateTime}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName} (${advisor.specializations})</p>
            </div>
            <p>${getLocalizedMessage('emails.appointmentConfirmation.client.loginInfo', clientLocale)}</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: getLocalizedMessage('emails.appointmentConfirmation.advisor.subject', advisorLocale),
                text: getLocalizedMessage('emails.appointmentConfirmation.advisor.text', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`,
                    dateTime: formattedDateTime
                }),
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentConfirmation.advisor.title', advisorLocale)}</h2>
            <p>${getLocalizedMessage('emails.appointmentConfirmation.advisor.body', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`
                })}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formattedDateTime}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
            </div>
            <p>${getLocalizedMessage('emails.appointmentConfirmation.advisor.loginInfo', advisorLocale)}</p>
          </div>
        `
            };

            // Queue emails
            this.queueEmail(clientEmailData);
            this.queueEmail(advisorEmailData);

            // If users have Telegram accounts linked, send notifications there too
            if (client.telegramId) {
                const telegramData = {
                    chatId: client.telegramId,
                    text: getLocalizedMessage('notifications.appointmentConfirmation.telegram', clientLocale, {
                        advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`,
                        dateTime: formattedDateTime
                    }),
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: getLocalizedMessage('notifications.appointmentConfirmation.telegram', advisorLocale, {
                        clientName: `${client.firstName} ${client.lastName}`,
                        dateTime: formattedDateTime
                    }),
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending appointment confirmation:', error);
        }
    }

    /**
     * Send appointment cancellation notification
     * @param {Object} appointment Appointment object
     */
    async sendAppointmentCancellation(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor, dateTime, type } = appointment;

            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            const formattedDateTime = new Date(dateTime).toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            // Email to client
            const clientEmailData = {
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentCancellation.client.subject', clientLocale),
                text: getLocalizedMessage('emails.appointmentCancellation.client.text', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`,
                    dateTime: formattedDateTime
                }),
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">${getLocalizedMessage('emails.appointmentCancellation.client.title', clientLocale)}</h2>
            <p>${getLocalizedMessage('emails.appointmentCancellation.client.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formattedDateTime}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName} (${advisor.specializations})</p>
            </div>
            <p>${getLocalizedMessage('emails.appointmentCancellation.client.action', clientLocale)}</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: getLocalizedMessage('emails.appointmentCancellation.advisor.subject', advisorLocale),
                text: getLocalizedMessage('emails.appointmentCancellation.advisor.text', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`,
                    dateTime: formattedDateTime
                }),
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">${getLocalizedMessage('emails.appointmentCancellation.advisor.title', advisorLocale)}</h2>
            <p>${getLocalizedMessage('emails.appointmentCancellation.advisor.body', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`
                })}</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formattedDateTime}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
              <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
            </div>
          </div>
        `
            };

            // Queue emails
            this.queueEmail(clientEmailData);
            this.queueEmail(advisorEmailData);

            // If users have Telegram accounts linked, send notifications there too
            if (client.telegramId) {
                const telegramData = {
                    chatId: client.telegramId,
                    text: getLocalizedMessage('notifications.appointmentCancellation.telegram', clientLocale, {
                        advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`,
                        dateTime: formattedDateTime
                    }),
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: getLocalizedMessage('notifications.appointmentCancellation.telegram', advisorLocale, {
                        clientName: `${client.firstName} ${client.lastName}`,
                        dateTime: formattedDateTime
                    }),
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending appointment cancellation:', error);
        }
    }

    // [Additional methods would be similarly updated with localization...]
    // For brevity, I'll include the method signatures that delegate to the emailService

    /**
     * Send document upload notification
     * @param {Object} appointment - Appointment object
     * @param {Object} document - Document object
     * @param {Object} recipient - User to notify
     */
    async sendDocumentUploadNotification(appointment, document, recipient) {
        const documentNotification = require('./documentNotification');
        return documentNotification.sendDocumentUploadNotification(appointment, document, recipient);
    }

    /**
     * Send appointment booking confirmation
     * @param {Object} appointment - Appointment object with populated client and advisor
     */
    async sendAppointmentBookedEmails(appointment) {
        return emailService.sendAppointmentBookedEmails(appointment);
    }

    /**
     * Send appointment cancellation notification
     * @param {Object} appointment - Appointment object with populated client and advisor
     * @param {String} cancelledBy - Who cancelled the appointment ('client', 'advisor', 'system')
     */
    async sendAppointmentCancellationNotification(appointment, cancelledBy) {
        return emailService.sendAppointmentCancelledEmails(appointment, cancelledBy);
    }

    /**
     * Send appointment confirmation notification
     * @param {Object} appointment - Appointment object with populated client and advisor
     */
    async sendAppointmentConfirmedNotification(appointment) {
        return emailService.sendAppointmentConfirmedEmails(appointment);
    }

    /**
     * Send payment success notification
     * @param {String} paymentId - Payment ID
     * @param {Object} appointment - Appointment object
     */
    async sendPaymentSuccessEmail(paymentId, appointment) {
        return emailService.sendPaymentSuccessEmail(paymentId, appointment);
    }

    /**
     * Send payment confirmation
     * @param {String} paymentId - Payment ID
     */
    async sendPaymentConfirmation(paymentId) {
        return emailService.sendPaymentConfirmation(paymentId);
    }

    /**
     * Send payment refund notification
     * @param {Object} payment - Payment object
     */
    async sendPaymentRefundNotification(payment) {
        return emailService.sendPaymentRefundNotification(payment);
    }

    /**
     * Send appointment reminder emails
     * @param {Object} appointment - Appointment object with populated client and advisor
     */
    async sendAppointmentReminderEmails(appointment) {
        return emailService.sendAppointmentReminderEmails(appointment);
    }

    /**
     * Send advice notification
     * @param {Object} appointment - Appointment object with populated client and advisor
     */
    async sendAdviceNotification(appointment) {
        return emailService.sendAdviceNotification(appointment);
    }

    /**
     * Send follow-up notification
     * @param {Object} appointment - Appointment object with populated client and advisor
     */
    async sendFollowUpNotification(appointment) {
        return emailService.sendFollowUpNotification(appointment);
    }

    /**
     * Send consultation completed notification
     * @param {Object} appointment - Appointment object with populated client and advisor
     */
    async sendConsultationCompletedNotification(appointment) {
        return consultationNotification.sendConsultationCompletedNotification(appointment);
    }
}

// Create singleton instance
const notificationService = new NotificationService();

// Export the service
module.exports = {
    NotificationService: notificationService
};