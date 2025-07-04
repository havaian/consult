const nodemailer = require('nodemailer');
const { format } = require('date-fns');
const { getLocalizedMessage } = require('../localization');

// Format currency amount
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('uz-UZ', { style: 'currency', currency: 'UZS' }).format(amount);
};

// Format date and time
const formatDateTime = (date) => {
    return format(new Date(date), 'MMMM d, yyyy h:mm a');
};

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASSWORD
            }
        });
    }

    async sendEmail(options) {
        try {
            const mailOptions = {
                from: `"e-consult.uz" <${process.env.SMTP_FROM_EMAIL}>`,
                to: options.to,
                subject: options.subject,
                text: options.text || '',
                html: options.html || ''
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending email:', error);
            throw error;
        }
    }

    // Appointment booked - send to both advisor and client
    async sendAppointmentBookedEmails(appointment) {
        try {
            const { advisor, client, dateTime, type, payment } = appointment;

            // Get locales
            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            // Email to client
            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentBooked.client.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentBooked.client.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentBooked.client.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.specialization', clientLocale)}:</strong> ${advisor.specializations.join(', ')}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                        ${payment && payment.amount ? `<p><strong>${getLocalizedMessage('emails.appointmentDetails.amountPaid', clientLocale)}:</strong> ${formatCurrency(payment.amount)}</p>` : ''}
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentBooked.client.joinReminder', clientLocale)}</p>
                    <p>${getLocalizedMessage('emails.appointmentBooked.client.loginInfo', clientLocale)}</p>
                </div>
                `
            });

            // Email to advisor
            await this.sendEmail({
                to: advisor.email,
                subject: getLocalizedMessage('emails.appointmentBooked.advisor.subject', advisorLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentBooked.advisor.title', advisorLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentBooked.advisor.body', advisorLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', advisorLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentBooked.advisor.loginInfo', advisorLocale)}</p>
                </div>
                `
            });

            console.log('Appointment booking emails sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending appointment booked emails:', error);
            return false;
        }
    }

    // Appointment booking failed - send to client
    async sendAppointmentBookingFailed(data) {
        try {
            const { client, advisor, dateTime, type, error } = data;
            const clientLocale = client.preferredLanguage || 'en';

            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentBookingFailed.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">${getLocalizedMessage('emails.appointmentBookingFailed.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentBookingFailed.body', clientLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(` .${type}`, clientLocale)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.reason', clientLocale)}:</strong> ${error}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentBookingFailed.action', clientLocale)}</p>
                </div>
                `
            });

            console.log('Appointment booking failed email sent');
            return true;
        } catch (error) {
            console.error('Error sending appointment booking failed email:', error);
            return false;
        }
    }

    // Appointment reminder - send to both advisor and client
    async sendAppointmentReminderEmails(appointment) {
        try {
            const { advisor, client, dateTime, type } = appointment;

            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            // Email to client
            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentReminder.client.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentReminder.client.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentReminder.client.body', clientLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentReminder.joinReminder', clientLocale)}</p>
                </div>
                `
            });

            // Email to advisor
            await this.sendEmail({
                to: advisor.email,
                subject: getLocalizedMessage('emails.appointmentReminder.advisor.subject', advisorLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentReminder.advisor.title', advisorLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentReminder.advisor.body', advisorLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', advisorLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentReminder.joinReminder', advisorLocale)}</p>
                </div>
                `
            });

            console.log('Appointment reminder emails sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending appointment reminder emails:', error);
            return false;
        }
    }

    // Appointment cancelled - send to affected party
    async sendAppointmentCancelledEmails(appointment, cancelledBy) {
        try {
            const { advisor, client, dateTime, type } = appointment;

            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            // Email to client
            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentCancelled.client.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">${getLocalizedMessage('emails.appointmentCancelled.client.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentCancelled.client.body', clientLocale, { cancelledBy })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentCancelled.client.action', clientLocale)}</p>
                </div>
                `
            });

            // Email to advisor
            await this.sendEmail({
                to: advisor.email,
                subject: getLocalizedMessage('emails.appointmentCancelled.advisor.subject', advisorLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #e74c3c;">${getLocalizedMessage('emails.appointmentCancelled.advisor.title', advisorLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentCancelled.advisor.body', advisorLocale, { cancelledBy })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', advisorLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentCancelled.advisor.action', advisorLocale)}</p>
                </div>
                `
            });

            console.log('Appointment cancellation emails sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending appointment cancellation emails:', error);
            return false;
        }
    }

    // Send confirmation to advisor about appointment being confirmed
    async sendAppointmentConfirmedEmails(appointment) {
        try {
            const { advisor, client, dateTime, type } = appointment;

            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            // Email to client
            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.appointmentConfirmed.client.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentConfirmed.client.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentConfirmed.client.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentConfirmed.client.reminder', clientLocale)}</p>
                </div>
                `
            });

            // Email confirmation to advisor
            await this.sendEmail({
                to: advisor.email,
                subject: getLocalizedMessage('emails.appointmentConfirmed.advisor.subject', advisorLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentConfirmed.advisor.title', advisorLocale)}</h2>
                    <p>${getLocalizedMessage('emails.appointmentConfirmed.advisor.body', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`
                })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', advisorLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.appointmentConfirmed.advisor.reminder', advisorLocale)}</p>
                </div>
                `
            });

            console.log('Appointment confirmation emails sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending appointment confirmation emails:', error);
            return false;
        }
    }

    // Send payment success email to client
    async sendPaymentSuccessEmail(paymentId, appointment) {
        try {
            const { client, advisor, dateTime, type } = appointment;
            const clientLocale = client.preferredLanguage || 'en';

            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.paymentSuccess.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.paymentSuccess.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.paymentSuccess.body', clientLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.paymentId', clientLocale)}:</strong> ${paymentId}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.paymentSuccess.nextStep', clientLocale)}</p>
                </div>
                `
            });

            console.log('Payment success email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending payment success email:', error);
            return false;
        }
    }

    // Send payment confirmation email
    async sendPaymentConfirmation(paymentId) {
        try {
            // Fetch payment information first
            const Payment = require('../payment/model');
            const payment = await Payment.findById(paymentId)
                .populate({
                    path: 'appointment',
                    populate: {
                        path: 'client advisor',
                        select: 'firstName lastName email specializations preferredLanguage'
                    }
                });

            if (!payment || !payment.appointment) {
                throw new Error('Payment or appointment information not found');
            }

            const { client, advisor, dateTime, type } = payment.appointment;
            const clientLocale = client.preferredLanguage || 'en';

            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.paymentConfirmation.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.paymentConfirmation.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.paymentConfirmation.body', clientLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.paymentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.paymentDetails.paymentId', clientLocale)}:</strong> ${payment._id}</p>
                        <p><strong>${getLocalizedMessage('emails.paymentDetails.amount', clientLocale)}:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>${getLocalizedMessage('emails.paymentDetails.status', clientLocale)}:</strong> ${getLocalizedMessage(`payments.statuses.${payment.status}`, clientLocale)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.paymentConfirmation.thanks', clientLocale)}</p>
                </div>
                `
            });

            console.log('Payment confirmation email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending payment confirmation email:', error);
            return false;
        }
    }

    // Send payment refund notification
    async sendPaymentRefundNotification(payment) {
        try {
            await payment.populate({
                path: 'appointment',
                populate: {
                    path: 'client advisor',
                    select: 'firstName lastName email specializations preferredLanguage'
                }
            });

            const { client, advisor, dateTime, type } = payment.appointment;
            const clientLocale = client.preferredLanguage || 'en';

            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.paymentRefund.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.paymentRefund.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.paymentRefund.body', clientLocale)}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.refundDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.paymentDetails.paymentId', clientLocale)}:</strong> ${payment._id}</p>
                        <p><strong>${getLocalizedMessage('emails.paymentDetails.amount', clientLocale)}:</strong> ${formatCurrency(payment.amount)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.paymentRefund.processingInfo', clientLocale)}</p>
                    <p>${getLocalizedMessage('emails.paymentRefund.support', clientLocale)}</p>
                </div>
                `
            });

            console.log('Payment refund email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending payment refund email:', error);
            return false;
        }
    }

    // Send advice notification
    async sendAdviceNotification(appointment) {
        try {
            await appointment.populate('client advisor');

            const { client, advisor, advices } = appointment;
            const clientLocale = client.preferredLanguage || 'en';

            // Format advices for email
            let advicesHtml = '';
            advices.forEach((advice, index) => {
                advicesHtml += `
                <div style="border-bottom: 1px solid #ddd; padding-bottom: 10px; margin-bottom: 10px;">
                    <p><strong>${getLocalizedMessage('emails.adviceDetails.action', clientLocale)}:</strong> ${advice.action}</p>
                    <p><strong>${getLocalizedMessage('emails.adviceDetails.dosage', clientLocale)}:</strong> ${advice.dosage}</p>
                    <p><strong>${getLocalizedMessage('emails.adviceDetails.frequency', clientLocale)}:</strong> ${advice.frequency}</p>
                    <p><strong>${getLocalizedMessage('emails.adviceDetails.duration', clientLocale)}:</strong> ${advice.duration}</p>
                    ${advice.instructions ? `<p><strong>${getLocalizedMessage('emails.adviceDetails.instructions', clientLocale)}:</strong> ${advice.instructions}</p>` : ''}
                </div>
                `;
            });

            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.adviceNotification.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.adviceNotification.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.adviceNotification.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        ${advicesHtml}
                    </div>
                    
                    <p>${getLocalizedMessage('emails.adviceNotification.viewOnline', clientLocale)}</p>
                    <p><strong>${getLocalizedMessage('emails.adviceNotification.warning', clientLocale)}</strong></p>
                </div>
                `
            });

            console.log('Advice notification email sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending advice notification email:', error);
            return false;
        }
    }

    // Send follow-up notification
    async sendFollowUpNotification(followUpAppointment) {
        try {
            await followUpAppointment.populate('client advisor');

            const { client, advisor, dateTime, type, shortDescription } = followUpAppointment;

            const clientLocale = client.preferredLanguage || 'en';
            const advisorLocale = advisor.preferredLanguage || 'en';

            await this.sendEmail({
                to: client.email,
                subject: getLocalizedMessage('emails.followUpNotification.client.subject', clientLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.followUpNotification.client.title', clientLocale)}</h2>
                    <p>${getLocalizedMessage('emails.followUpNotification.client.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.reason', clientLocale)}:</strong> ${shortDescription}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.followUpNotification.client.paymentRequired', clientLocale)}</p>
                </div>
                `
            });

            await this.sendEmail({
                to: advisor.email,
                subject: getLocalizedMessage('emails.followUpNotification.advisor.subject', advisorLocale),
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.followUpNotification.advisor.title', advisorLocale)}</h2>
                    <p>${getLocalizedMessage('emails.followUpNotification.advisor.body', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`
                })}</p>
                    
                    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', advisorLocale)}</h3>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.client', advisorLocale)}:</strong> ${client.firstName} ${client.lastName}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', advisorLocale)}:</strong> ${formatDateTime(dateTime)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', advisorLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, advisorLocale)}</p>
                        <p><strong>${getLocalizedMessage('emails.appointmentDetails.reason', advisorLocale)}:</strong> ${shortDescription}</p>
                    </div>
                    
                    <p>${getLocalizedMessage('emails.followUpNotification.advisor.clientNotified', advisorLocale)}</p>
                </div>
                `
            });

            console.log('Follow-up notification emails sent successfully');
            return true;
        } catch (error) {
            console.error('Error sending follow-up notification emails:', error);
            return false;
        }
    }
}

// Create a singleton instance
const emailService = new EmailService();

module.exports = emailService;