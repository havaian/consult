// File: backend/src/email/templates.js
const { getLocalizedMessage } = require('../localization');

const getEmailTemplate = (templateName, locale, params = {}) => {
    const templates = {
        welcomeEmail: {
            subject: getLocalizedMessage('emails.welcome.subject', locale, params),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${getLocalizedMessage('emails.welcome.title', locale, params)}</h2>
          <p>${getLocalizedMessage('emails.welcome.greeting', locale, params)}</p>
          <p>${getLocalizedMessage('emails.welcome.message', locale, params)}</p>
          <div style="margin: 20px 0;">
            <a href="${params.verificationUrl}" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              ${getLocalizedMessage('emails.welcome.verifyButton', locale, params)}
            </a>
          </div>
          <p>${getLocalizedMessage('emails.welcome.footer', locale, params)}</p>
        </div>
      `
        },
        appointmentConfirmation: {
            subject: getLocalizedMessage('emails.appointment.confirmationSubject', locale, params),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${getLocalizedMessage('emails.appointment.confirmationTitle', locale, params)}</h2>
          <p>${getLocalizedMessage('emails.appointment.details', locale, params)}</p>
          <ul>
            <li>${getLocalizedMessage('appointments.date', locale)}: ${params.date}</li>
            <li>${getLocalizedMessage('appointments.time', locale)}: ${params.time}</li>
            <li>${getLocalizedMessage('appointments.advisor', locale)}: ${params.advisorName}</li>
          </ul>
          <p>${getLocalizedMessage('emails.appointment.footer', locale, params)}</p>
        </div>
      `
        }
    };

    return templates[templateName];
};

module.exports = { getEmailTemplate };