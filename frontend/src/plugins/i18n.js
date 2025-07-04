// File: frontend/src/plugins/i18n.js
import Localization from '@econsult/localization';

const i18n = new Localization();

// Set default locale based on browser or saved preference
const savedLocale = localStorage.getItem('locale') ||
    navigator.language.split('-')[0] ||
    'en';

i18n.setLocale(savedLocale);

export default i18n;
