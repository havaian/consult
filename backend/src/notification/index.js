const nodemailer = require('nodemailer');
const amqp = require('amqplib');
const { telegramBot } = require('../bot');
const consultationNotification = require('./consultationNotification');
const emailService = require('./emailService');

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
                
                console.log(`⏳ Retrying in ${retryInterval/1000} seconds...`);
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
                from: `"consult.ytech.space" <${process.env.SMTP_FROM_EMAIL}>`,
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
     */
    async sendVerificationEmail(email, token) {
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${token}`;

        const emailData = {
            to: email,
            subject: 'Verify Your Email - consult.ytech.space',
            text: `Please verify your email by clicking on the following link: ${verificationLink}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">consult.ytech.space Email Verification</h2>
          <p>Thank you for registering with consult.ytech.space! Please verify your email address by clicking the button below:</p>
          <a href="${verificationLink}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p>${verificationLink}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account with consult.ytech.space, please ignore this email.</p>
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
     */
    async sendPasswordResetEmail(email, token) {
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        const emailData = {
            to: email,
            subject: 'Reset Your Password - consult.ytech.space',
            text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4a90e2;">consult.ytech.space Password Reset</h2>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
          <p>If the button doesn't work, you can also copy and paste the following link into your browser:</p>
          <p>${resetLink}</p>
          <p>This link will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you're concerned.</p>
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
                subject: 'Appointment Confirmation - consult.ytech.space',
                text: `Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been confirmed for ${formattedDateTime}.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Appointment Confirmation</h2>
            <p>Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been confirmed.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Advisor:</strong> Dr. ${advisor.firstName} ${advisor.lastName} (${advisor.specializations})</p>
            </div>
            <p>You can view your appointment details and join the consultation by logging into your consult.ytech.space account.</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: 'New Appointment - consult.ytech.space',
                text: `You have a new appointment with ${client.firstName} ${client.lastName} scheduled for ${formattedDateTime}.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">New Appointment</h2>
            <p>You have a new appointment with ${client.firstName} ${client.lastName}.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Client:</strong> ${client.firstName} ${client.lastName}</p>
            </div>
            <p>You can view appointment details and join the consultation by logging into your consult.ytech.space account.</p>
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
                    text: `✅ Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been confirmed for ${formattedDateTime}.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: `📋 New appointment with ${client.firstName} ${client.lastName} scheduled for ${formattedDateTime}.`,
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
                subject: 'Appointment Canceled - consult.ytech.space',
                text: `Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} scheduled for ${formattedDateTime} has been canceled.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Appointment Canceled</h2>
            <p>Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been canceled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Advisor:</strong> Dr. ${advisor.firstName} ${advisor.lastName} (${advisor.specializations})</p>
            </div>
            <p>You can schedule a new appointment by logging into your consult.ytech.space account.</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: 'Appointment Canceled - consult.ytech.space',
                text: `Your appointment with ${client.firstName} ${client.lastName} scheduled for ${formattedDateTime} has been canceled.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Appointment Canceled</h2>
            <p>Your appointment with ${client.firstName} ${client.lastName} has been canceled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Client:</strong> ${client.firstName} ${client.lastName}</p>
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
                    text: `❌ Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} scheduled for ${formattedDateTime} has been canceled.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: `❌ Appointment with ${client.firstName} ${client.lastName} scheduled for ${formattedDateTime} has been canceled.`,
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

    /**
     * Send appointment completion notification
     * @param {Object} appointment Appointment object
     */
    async sendAppointmentCompletionNotification(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor } = appointment;

            // Email to client for feedback
            const clientEmailData = {
                to: client.email,
                subject: 'Appointment Completed - consult.ytech.space',
                text: `Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been completed. Please leave your feedback.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Appointment Completed</h2>
            <p>Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been completed.</p>
            <p>If any advices were provided, you can view them in your consult.ytech.space account.</p>
            <a href="${process.env.FRONTEND_URL}/appointments/feedback/${appointment._id}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Leave Feedback</a>
            <p>Your feedback helps us improve our services.</p>
          </div>
        `
            };

            // Queue emails
            this.queueEmail(clientEmailData);

            // If client has Telegram account linked, send notification there too
            if (client.telegramId) {
                const telegramData = {
                    chatId: client.telegramId,
                    text: `✅ Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been completed. Any advices will be available in your account. Please consider leaving feedback.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending appointment completion notification:', error);
        }
    }

    /**
     * Send advice notification
     * @param {Object} appointment Appointment object with advices
     */
    async sendAdviceNotification(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor, advices } = appointment;

            // Format advices for email
            let advicesHtml = '';
            advices.forEach((advice, index) => {
                advicesHtml += `
          <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
            <p><strong>Action:</strong> ${advice.action}</p>
            <p><strong>Dosage:</strong> ${advice.dosage}</p>
            <p><strong>Frequency:</strong> ${advice.frequency}</p>
            <p><strong>Duration:</strong> ${advice.duration}</p>
            <p><strong>Instructions:</strong> ${advice.instructions}</p>
          </div>
        `;
            });

            // Email to client
            const clientEmailData = {
                to: client.email,
                subject: 'New Advices - consult.ytech.space',
                text: `Dr. ${advisor.firstName} ${advisor.lastName} has added advices to your recent appointment.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">New Advices</h2>
            <p>Dr. ${advisor.firstName} ${advisor.lastName} has added the following advices to your recent appointment:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              ${advicesHtml}
            </div>
            <p>You can view these advices anytime by logging into your consult.ytech.space account.</p>
          </div>
        `
            };

            // Queue email
            this.queueEmail(clientEmailData);

            // If client has Telegram account linked, send notification there too
            if (client.telegramId) {
                const telegramData = {
                    chatId: client.telegramId,
                    text: `💊 Dr. ${advisor.firstName} ${advisor.lastName} has added advices to your recent appointment. Check your email or consult.ytech.space account for details.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending advice notification:', error);
        }
    }

    /**
     * Send follow-up notification
     * @param {Object} followUpAppointment Follow-up appointment object
     */
    async sendFollowUpNotification(followUpAppointment) {
        try {
            await followUpAppointment.populate('client advisor');

            const { client, advisor, dateTime, type } = followUpAppointment;
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
                subject: 'Follow-up Appointment Scheduled - consult.ytech.space',
                text: `A follow-up appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been scheduled for ${formattedDateTime}.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Follow-up Appointment Scheduled</h2>
            <p>A follow-up appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been scheduled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Advisor:</strong> Dr. ${advisor.firstName} ${advisor.lastName} (${advisor.specializations})</p>
            </div>
            <p>You can view your appointment details and join the consultation by logging into your consult.ytech.space account.</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: 'Follow-up Appointment Scheduled - consult.ytech.space',
                text: `A follow-up appointment with ${client.firstName} ${client.lastName} has been scheduled for ${formattedDateTime}.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Follow-up Appointment Scheduled</h2>
            <p>A follow-up appointment with ${client.firstName} ${client.lastName} has been scheduled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Client:</strong> ${client.firstName} ${client.lastName}</p>
            </div>
            <p>You can view appointment details and join the consultation by logging into your consult.ytech.space account.</p>
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
                    text: `📅 A follow-up appointment with Dr. ${advisor.firstName} ${advisor.lastName} has been scheduled for ${formattedDateTime}.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: `📅 Follow-up appointment with ${client.firstName} ${client.lastName} scheduled for ${formattedDateTime}.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending follow-up notification:', error);
        }
    }

    /**
     * Send appointment reminder (24 hours before)
     * @param {Object} appointment Appointment object
     */
    async sendAppointmentReminder(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor, dateTime, type } = appointment;
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
                subject: 'Appointment Reminder - consult.ytech.space',
                text: `Reminder: Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} is scheduled for tomorrow at ${formattedDateTime}.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Appointment Reminder</h2>
            <p>This is a reminder that your appointment with Dr. ${advisor.firstName} ${advisor.lastName} is scheduled for tomorrow.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Advisor:</strong> Dr. ${advisor.firstName} ${advisor.lastName} (${advisor.specializations})</p>
            </div>
            <p>You can view your appointment details and join the consultation by logging into your consult.ytech.space account.</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: 'Appointment Reminder - consult.ytech.space',
                text: `Reminder: Your appointment with ${client.firstName} ${client.lastName} is scheduled for tomorrow at ${formattedDateTime}.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Appointment Reminder</h2>
            <p>This is a reminder that your appointment with ${client.firstName} ${client.lastName} is scheduled for tomorrow.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Date and Time:</strong> ${formattedDateTime}</p>
              <p><strong>Consultation Type:</strong> ${type.charAt(0).toUpperCase() + type.slice(1)}</p>
              <p><strong>Client:</strong> ${client.firstName} ${client.lastName}</p>
            </div>
            <p>You can view appointment details and join the consultation by logging into your consult.ytech.space account.</p>
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
                    text: `⏰ Reminder: Your appointment with Dr. ${advisor.firstName} ${advisor.lastName} is scheduled for tomorrow at ${formattedDateTime}.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: `⏰ Reminder: Your appointment with ${client.firstName} ${client.lastName} is scheduled for tomorrow at ${formattedDateTime}.`,
                    options: {
                        parse_mode: 'HTML'
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending appointment reminder:', error);
        }
    }

    /**
     * Send consultation start notification (15 minutes before)
     * @param {Object} appointment Appointment object
     */
    async sendConsultationStartNotification(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor, dateTime, type, _id } = appointment;
            const formattedTime = new Date(dateTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            const consultationLink = `${process.env.FRONTEND_URL}/consultation/${_id}`;

            // Email to client
            const clientEmailData = {
                to: client.email,
                subject: 'Your Consultation Starts Soon - consult.ytech.space',
                text: `Your consultation with Dr. ${advisor.firstName} ${advisor.lastName} starts in 15 minutes.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Your Consultation Starts Soon</h2>
            <p>Your consultation with Dr. ${advisor.firstName} ${advisor.lastName} starts in 15 minutes at ${formattedTime}.</p>
            <a href="${consultationLink}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Join Consultation</a>
            <p>Please ensure your device has a working camera and microphone for a video consultation.</p>
          </div>
        `
            };

            // Email to advisor
            const advisorEmailData = {
                to: advisor.email,
                subject: 'Consultation Starts Soon - consult.ytech.space',
                text: `Your consultation with ${client.firstName} ${client.lastName} starts in 15 minutes.`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Consultation Starts Soon</h2>
            <p>Your consultation with ${client.firstName} ${client.lastName} starts in 15 minutes at ${formattedTime}.</p>
            <a href="${consultationLink}" style="display: inline-block; background-color: #4a90e2; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Join Consultation</a>
            <p>Please ensure your device has a working camera and microphone for a video consultation.</p>
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
                    text: `🔔 Your consultation with Dr. ${advisor.firstName} ${advisor.lastName} starts in 15 minutes. Click here to join: ${consultationLink}`,
                    options: {
                        parse_mode: 'HTML',
                        disable_web_page_preview: false
                    }
                };
                this.queueTelegramMessage(telegramData);
            }

            if (advisor.telegramId) {
                const telegramData = {
                    chatId: advisor.telegramId,
                    text: `🔔 Your consultation with ${client.firstName} ${client.lastName} starts in 15 minutes. Click here to join: ${consultationLink}`,
                    options: {
                        parse_mode: 'HTML',
                        disable_web_page_preview: false
                    }
                };
                this.queueTelegramMessage(telegramData);
            }
        } catch (error) {
            console.error('Error sending consultation start notification:', error);
        }
    }

    /**
     * Send payment success email
     * @param {String} paymentId Payment ID
     * @param {Object} appointment Appointment object
     */
    async sendPaymentSuccessEmail(paymentId, appointment) {
        try {
            const { client, advisor } = appointment;
            const formattedDate = new Date(appointment.dateTime).toLocaleString();

            const emailData = {
                to: client.email,
                subject: 'Payment Successful - consult.ytech.space',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">Payment Successful</h2>
            <p>Your payment for the appointment has been processed successfully.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Advisor:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              <p><strong>Type:</strong> ${appointment.type}</p>
              <p><strong>Payment ID:</strong> ${paymentId}</p>
            </div>
            <p>You can view your appointment details in your consult.ytech.space account.</p>
          </div>
        `
            };

            await this.queueEmail(emailData);
        } catch (error) {
            console.error('Error sending payment success email:', error);
        }
    }

    /**
     * Send advisor appointment email
     * @param {Object} appointment Appointment object
     */
    async sendAdvisorAppointmentEmail(appointment) {
        try {
            const { client, advisor, dateTime } = appointment;
            const formattedDate = new Date(dateTime).toLocaleString();

            const emailData = {
                to: advisor.email,
                subject: 'New Appointment Confirmed - consult.ytech.space',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4a90e2;">New Appointment Confirmed</h2>
            <p>A new appointment has been scheduled and payment has been received.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Client:</strong> ${client.firstName} ${client.lastName}</p>
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              <p><strong>Type:</strong> ${appointment.type}</p>
            </div>
            <p>Please log in to your consult.ytech.space account to view the appointment details.</p>
          </div>
        `
            };

            await this.queueEmail(emailData);
        } catch (error) {
            console.error('Error sending advisor appointment email:', error);
        }
    }

    /**
     * Send payment failure email
     * @param {String} paymentId Payment ID
     * @param {Object} appointment Appointment object
     */
    async sendPaymentFailureEmail(paymentId, appointment) {
        try {
            const { client, advisor } = appointment;
            const formattedDate = new Date(appointment.dateTime).toLocaleString();

            const emailData = {
                to: client.email,
                subject: 'Payment Failed - consult.ytech.space',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">Payment Failed</h2>
            <p>We were unable to process your payment for the following appointment:</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Advisor:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
              <p><strong>Date & Time:</strong> ${formattedDate}</p>
              <p><strong>Type:</strong> ${appointment.type}</p>
            </div>
            <p>Please try booking again or contact support if you need assistance.</p>
          </div>
        `
            };

            await this.queueEmail(emailData);
        } catch (error) {
            console.error('Error sending payment failure email:', error);
        }
    }



    
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