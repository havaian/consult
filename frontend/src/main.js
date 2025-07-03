// File: frontend/src/main.js
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import i18n from './plugins/i18n';

const app = createApp(App);

// Make i18n available globally
app.config.globalProperties.$i18n = i18n;
app.config.globalProperties.$t = (key, params) => i18n.t(key, params);

app.use(createPinia());
app.use(router);

app.mount('#app');