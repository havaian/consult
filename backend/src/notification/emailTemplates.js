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

exports.appointmentBookedClient = (appointment) => {
  const { advisor, dateTime, type, payment } = appointment;
  const clientLocale = appointment.client?.preferredLanguage || 'en';

  return {
    subject: getLocalizedMessage('emails.appointmentBooked.client.subject', clientLocale),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a90e2;">${getLocalizedMessage('emails.appointmentBooked.client.title', clientLocale)}</h2>
        <p>${getLocalizedMessage('emails.appointmentBooked.client.body', clientLocale)}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.specialization', clientLocale)}:</strong> ${advisor.specializations.join(', ')}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.amountPaid', clientLocale)}:</strong> ${formatCurrency(payment.amount)}</p>
        </div>
        
        <p>${getLocalizedMessage('emails.appointmentBooked.client.joinReminder', clientLocale)}</p>
        <p>${getLocalizedMessage('emails.appointmentBooked.client.loginInfo', clientLocale)}</p>
      </div>
    `
  };
};

exports.appointmentBookedAdvisor = (appointment) => {
  const { client, dateTime, type } = appointment;
  const advisorLocale = appointment.advisor?.preferredLanguage || 'en';

  return {
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
  };
};

exports.appointmentBookingFailed = (data) => {
  const { advisor, dateTime, type, error } = data;
  const clientLocale = data.client?.preferredLanguage || 'en';

  return {
    subject: getLocalizedMessage('emails.appointmentBookingFailed.subject', clientLocale),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">${getLocalizedMessage('emails.appointmentBookingFailed.title', clientLocale)}</h2>
        <p>${getLocalizedMessage('emails.appointmentBookingFailed.body', clientLocale)}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', clientLocale)}</h3>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', clientLocale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', clientLocale)}:</strong> ${formatDateTime(dateTime)}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', clientLocale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, clientLocale)}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.reason', clientLocale)}:</strong> ${error}</p>
        </div>
        
        <p>${getLocalizedMessage('emails.appointmentBookingFailed.action', clientLocale)}</p>
      </div>
    `
  };
};

exports.appointmentReminder = (appointment, recipientType) => {
  const { advisor, client, dateTime, type } = appointment;
  const isAdvisor = recipientType === 'advisor';
  const locale = isAdvisor ?
    (advisor?.preferredLanguage || 'en') :
    (client?.preferredLanguage || 'en');

  return {
    subject: getLocalizedMessage(`emails.appointmentReminder.${isAdvisor ? 'advisor' : 'client'}.subject`, locale),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4a90e2;">${getLocalizedMessage(`emails.appointmentReminder.${isAdvisor ? 'advisor' : 'client'}.title`, locale)}</h2>
        <p>${getLocalizedMessage(`emails.appointmentReminder.${isAdvisor ? 'advisor' : 'client'}.body`, locale)}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', locale)}</h3>
          ${isAdvisor
        ? `<p><strong>${getLocalizedMessage('emails.appointmentDetails.client', locale)}:</strong> ${client.firstName} ${client.lastName}</p>`
        : `<p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', locale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>`
      }
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', locale)}:</strong> ${formatDateTime(dateTime)}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', locale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, locale)}</p>
        </div>
        
        <p>${getLocalizedMessage('emails.appointmentReminder.joinReminder', locale)}</p>
      </div>
    `
  };
};

exports.appointmentCancelled = (appointment, cancelledBy, recipientType) => {
  const { advisor, client, dateTime, type } = appointment;
  const isAdvisor = recipientType === 'advisor';
  const locale = isAdvisor ?
    (advisor?.preferredLanguage || 'en') :
    (client?.preferredLanguage || 'en');

  return {
    subject: getLocalizedMessage(`emails.appointmentCancelled.${isAdvisor ? 'advisor' : 'client'}.subject`, locale),
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #e74c3c;">${getLocalizedMessage(`emails.appointmentCancelled.${isAdvisor ? 'advisor' : 'client'}.title`, locale)}</h2>
        <p>${getLocalizedMessage(`emails.appointmentCancelled.${isAdvisor ? 'advisor' : 'client'}.body`, locale, { cancelledBy })}</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${getLocalizedMessage('emails.appointmentDetails.title', locale)}</h3>
          ${isAdvisor
        ? `<p><strong>${getLocalizedMessage('emails.appointmentDetails.client', locale)}:</strong> ${client.firstName} ${client.lastName}</p>`
        : `<p><strong>${getLocalizedMessage('emails.appointmentDetails.advisor', locale)}:</strong> Dr. ${advisor.firstName} ${advisor.lastName}</p>`
      }
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.dateTime', locale)}:</strong> ${formatDateTime(dateTime)}</p>
          <p><strong>${getLocalizedMessage('emails.appointmentDetails.type', locale)}:</strong> ${getLocalizedMessage(`appointments.types.${type}`, locale)}</p>
        </div>
        
        <p>${getLocalizedMessage(`emails.appointmentCancelled.${isAdvisor ? 'advisor' : 'client'}.action`, locale)}</p>
      </div>
    `
  };
};