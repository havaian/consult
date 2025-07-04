const { getLocalizedMessage } = require('../localization');

/**
 * Send notification when a document is uploaded
 * @param {Object} appointment - Appointment object
 * @param {Object} document - Document object
 * @param {Object} recipient - User to notify
 */
exports.sendDocumentUploadNotification = async (appointment, document, recipient) => {
    try {
        if (!appointment || !document || !recipient) {
            console.error('Error: Missing data for document upload notification');
            return;
        }

        // Get uploader information
        const uploader = document.uploadedBy === 'advisor' ? appointment.advisor : appointment.client;

        // Make sure we have the populated objects
        let uploaderName, recipientEmail, recipientLocale;

        if (typeof uploader === 'object') {
            uploaderName = document.uploadedBy === 'advisor' ?
                `Dr. ${uploader.firstName} ${uploader.lastName}` :
                `${uploader.firstName} ${uploader.lastName}`;
        } else {
            // Fetch user data if not populated
            const User = require('../user/model');
            const uploaderUser = await User.findById(uploader);
            uploaderName = document.uploadedBy === 'advisor' ?
                `Dr. ${uploaderUser.firstName} ${uploaderUser.lastName}` :
                `${uploaderUser.firstName} ${uploaderUser.lastName}`;
        }

        if (typeof recipient === 'object' && recipient.email) {
            recipientEmail = recipient.email;
            recipientLocale = recipient.preferredLanguage || 'en';
        } else {
            // Fetch user data if not populated
            const User = require('../user/model');
            const recipientUser = await User.findById(recipient);
            recipientEmail = recipientUser.email;
            recipientLocale = recipientUser.preferredLanguage || 'en';
        }

        // Send email notification
        await emailService.sendEmail({
            to: recipientEmail,
            subject: getLocalizedMessage('notifications.documentUpload.subject', recipientLocale),
            text: getLocalizedMessage('notifications.documentUpload.text', recipientLocale, {
                uploaderName,
                appointmentDate: new Date(appointment.dateTime).toLocaleDateString(),
                documentName: document.name
            }),
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #4a90e2;">${getLocalizedMessage('notifications.documentUpload.title', recipientLocale)}</h2>
              <p>${getLocalizedMessage('notifications.documentUpload.body', recipientLocale, {
                uploaderName,
                appointmentDate: new Date(appointment.dateTime).toLocaleDateString()
            })}</p>
              <p><strong>${getLocalizedMessage('notifications.documentUpload.documentName', recipientLocale)}:</strong> ${document.name}</p>
              <p>${getLocalizedMessage('notifications.documentUpload.action', recipientLocale)}</p>
            </div>
            `
        });

        // Send Telegram notification if user has linked account
        if (typeof recipient === 'object' && recipient.telegramId) {
            // const { telegramBot } = require('../bot/index');
            // if (telegramBot) {
            //     await telegramBot.telegram.sendMessage(
            //         recipient.telegramId,
            //         getLocalizedMessage('notifications.documentUpload.telegram', recipientLocale, {
            //             uploaderName,
            //             documentName: document.name,
            //             appointmentDate: new Date(appointment.dateTime).toLocaleDateString()
            //         })
            //     );
            // }
        }

    } catch (error) {
        console.error('Error sending document upload notification:', error);
    }
};