const { getLocalizedMessage } = require('../localization');

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

        // Get user's preferred language
        const clientLocale = client.preferredLanguage || 'en';
        const advisorLocale = advisor.preferredLanguage || 'en';

        if (!client || !advisor) {
            console.error('Error: Client or advisor not populated in appointment for notification');
            return;
        }

        // Send email to client
        await emailService.sendEmail({
            to: client.email,
            subject: getLocalizedMessage('notifications.consultationCompleted.client.subject', clientLocale),
            text: getLocalizedMessage('notifications.consultationCompleted.client.text', clientLocale, {
                advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
            }),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">${getLocalizedMessage('notifications.consultationCompleted.client.title', clientLocale)}</h2>
                <p>${getLocalizedMessage('common.dear', clientLocale)} ${client.firstName} ${client.lastName},</p>
                <p>${getLocalizedMessage('notifications.consultationCompleted.client.body', clientLocale, {
                    advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
                })}</p>
                <p><strong>${getLocalizedMessage('appointments.appointmentDate', clientLocale)}:</strong> ${new Date(appointment.dateTime).toLocaleDateString()}</p>
                <p><strong>${getLocalizedMessage('appointments.appointmentTime', clientLocale)}:</strong> ${new Date(appointment.dateTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString()}</p>
                <p>${getLocalizedMessage('notifications.consultationCompleted.client.followUp', clientLocale)}</p>
                <p>${getLocalizedMessage('notifications.consultationCompleted.client.thanks', clientLocale)}</p>
                </div>
            `
        });

        // Send email to advisor
        await emailService.sendEmail({
            to: advisor.email,
            subject: getLocalizedMessage('notifications.consultationCompleted.advisor.subject', advisorLocale),
            text: getLocalizedMessage('notifications.consultationCompleted.advisor.text', advisorLocale, {
                clientName: `${client.firstName} ${client.lastName}`
            }),
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #4a90e2;">${getLocalizedMessage('notifications.consultationCompleted.advisor.title', advisorLocale)}</h2>
                <p>${getLocalizedMessage('common.dear', advisorLocale)} Dr. ${advisor.firstName} ${advisor.lastName},</p>
                <p>${getLocalizedMessage('notifications.consultationCompleted.advisor.body', advisorLocale, {
                    clientName: `${client.firstName} ${client.lastName}`
                })}</p>
                <p><strong>${getLocalizedMessage('appointments.appointmentDate', advisorLocale)}:</strong> ${new Date(appointment.dateTime).toLocaleDateString()}</p>
                <p><strong>${getLocalizedMessage('appointments.appointmentTime', advisorLocale)}:</strong> ${new Date(appointment.dateTime).toLocaleTimeString()} - ${new Date(appointment.endTime).toLocaleTimeString()}</p>
                <p>${getLocalizedMessage('notifications.consultationCompleted.advisor.action', advisorLocale)}</p>
                <p>${getLocalizedMessage('notifications.consultationCompleted.advisor.thanks', advisorLocale)}</p>
                </div>
            `
        });

        // Send Telegram notification if user has linked account
        if (client.telegramId) {
            // const { telegramBot } = require('../bot/index');
            // if (telegramBot) {
            //     await telegramBot.telegram.sendMessage(
            //         client.telegramId,
            //         getLocalizedMessage('notifications.consultationCompleted.client.telegram', clientLocale, {
            //             advisorName: `Dr. ${advisor.firstName} ${advisor.lastName}`
            //         })
            //     );
            // }
        }

        if (advisor.telegramId) {
            // const { telegramBot } = require('../bot/index');
            // if (telegramBot) {
            //     await telegramBot.telegram.sendMessage(
            //         advisor.telegramId,
            //         getLocalizedMessage('notifications.consultationCompleted.advisor.telegram', advisorLocale, {
            //             clientName: `${client.firstName} ${client.lastName}`
            //         })
            //     );
            // }
        }
    } catch (error) {
        console.error('Error sending consultation completed notification:', error);
    }
};