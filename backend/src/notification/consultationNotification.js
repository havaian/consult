/**
 * Send notification when a consultation is automatically completed
 * @param {Object} appointment - Appointment object with populated client and advisor
 */
exports.sendConsultationCompletedNotification = async (appointment) => {
    try {
        if (!appointment) {
            console.error('Error: No appointment provided for consultation completed notification');
            return;
        }

        // Make sure client and advisor are populated
        const client = appointment.client;
        const advisor = appointment.advisor;

        if (!client || !advisor) {
            console.error('Error: Client or advisor not populated in appointment for notification');
            return;
        }

        // Send email to client
        await emailService.sendEmail({
            to: client.email,
            subject: 'Your Consultation Has Ended - E-Consult',
            text: `Your consultation with Dr. ${advisor.firstName} ${advisor.lastName} has ended. 
            If you need to schedule a follow-up appointment, please visit our website.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a90e2;">Consultation Ended</h2>
              <p>Dear ${client.firstName} ${client.lastName},</p>
              <p>Your consultation with Dr. ${advisor.firstName} ${advisor.lastName} has ended.</p>
              <p><strong>Date:</strong> ${new Date(appointment.dateTime).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date(appointment.dateTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString()}</p>
              <p>If you need to schedule a follow-up appointment, please visit our website.</p>
              <p>Thank you for choosing E-Consult for your healthcare needs.</p>
            </div>
            `
        });

        // Send email to advisor
        await emailService.sendEmail({
            to: advisor.email,
            subject: 'Consultation Completed - E-Consult',
            text: `Your consultation with ${client.firstName} ${client.lastName} has ended. 
            Please complete your consultation summary if you haven't already done so.`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a90e2;">Consultation Completed</h2>
              <p>Dear Dr. ${advisor.firstName} ${advisor.lastName},</p>
              <p>Your consultation with ${client.firstName} ${client.lastName} has ended.</p>
              <p><strong>Date:</strong> ${new Date(appointment.dateTime).toLocaleDateString()}</p>
              <p><strong>Time:</strong> ${new Date(appointment.dateTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString()}</p>
              <p>Please complete your consultation summary and add any necessary advices or follow-up recommendations.</p>
              <p>Thank you for your dedication to client care.</p>
            </div>
            `
        });

        // Send Telegram notification if user has linked account
        if (client.telegramId) {
            const { telegramBot } = require('../bot/index');
            if (telegramBot) {
                await telegramBot.telegram.sendMessage(
                    client.telegramId,
                    `Your consultation with Dr. ${advisor.firstName} ${advisor.lastName} has ended.`
                );
            }
        }

        if (advisor.telegramId) {
            const { telegramBot } = require('../bot/index');
            if (telegramBot) {
                await telegramBot.telegram.sendMessage(
                    advisor.telegramId,
                    `Your consultation with ${client.firstName} ${client.lastName} has ended. Please complete your consultation summary.`
                );
            }
        }

    } catch (error) {
        console.error('Error sending consultation completed notification:', error);
    }
};