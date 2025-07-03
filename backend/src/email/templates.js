// File: backend/src/email/templates.js
const { getLocalizedMessage } = require('../localization');

const getEmailTemplate = (templateName, locale, params = {}) => {
    const templates = {
        welcomeEmail: {
            subject: getLocalizedMessage('email.welcome.subject', locale, params),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${getLocalizedMessage('email.welcome.title', locale, params)}</h2>
          <p>${getLocalizedMessage('email.welcome.greeting', locale, params)}</p>
          <p>${getLocalizedMessage('email.welcome.message', locale, params)}</p>
          <div style="margin: 20px 0;">
            <a href="${params.verificationUrl}" 
               style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              ${getLocalizedMessage('email.welcome.verifyButton', locale, params)}
            </a>
          </div>
          <p>${getLocalizedMessage('email.welcome.footer', locale, params)}</p>
        </div>
      `
        },
        appointmentConfirmation: {
            subject: getLocalizedMessage('email.appointment.confirmationSubject', locale, params),
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${getLocalizedMessage('email.appointment.confirmationTitle', locale, params)}</h2>
          <p>${getLocalizedMessage('email.appointment.details', locale, params)}</p>
          <ul>
            <li>${getLocalizedMessage('appointments.date', locale)}: ${params.date}</li>
            <li>${getLocalizedMessage('appointments.time', locale)}: ${params.time}</li>
            <li>${getLocalizedMessage('appointments.advisor', locale)}: ${params.advisorName}</li>
          </ul>
          <p>${getLocalizedMessage('email.appointment.footer', locale, params)}</p>
        </div>
      `
        }
    };

    return templates[templateName];
};

module.exports = { getEmailTemplate };