// File: frontend/src/services/api.js
import axios from 'axios';

// Create axios instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://e-consult.uz/api',
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to get current language from localStorage
const getCurrentLanguage = () => {
    return localStorage.getItem('locale') || 'en';
};

// Request interceptor to add language header and auth token
api.interceptors.request.use(
    (config) => {
        // Add language header
        config.headers['X-App-Language'] = getCurrentLanguage();

        // Add auth token if available
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('authToken');
            localStorage.removeItem('user');

            // Redirect to login page
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// API service object with common methods
const apiService = {
    // Generic methods
    get: (url, config = {}) => api.get(url, config),
    post: (url, data, config = {}) => api.post(url, data, config),
    put: (url, data, config = {}) => api.put(url, data, config),
    patch: (url, data, config = {}) => api.patch(url, data, config),
    delete: (url, config = {}) => api.delete(url, config),

    // Auth methods
    auth: {
        login: (credentials) => api.post('/users/login', credentials),
        register: (userData) => api.post('/users/register', userData),
        forgotPassword: (email) => api.post('/users/forgot-password', { email }),
        resetPassword: (token, password) => api.post(`/users/reset-password/${token}`, { password }),
        verifyEmail: (token) => api.get(`/users/verify/${token}`),
    },

    // User methods
    user: {
        getCurrentUser: () => api.get('/users/me'),
        updateProfile: (userData) => api.patch('/users/me', userData),
        changePassword: (passwordData) => api.post('/users/change-password', passwordData),
        deactivateAccount: () => api.post('/users/deactivate'),
        linkTelegram: (telegramData) => api.post('/users/link-telegram', telegramData),
        getAdvisors: (params = {}) => api.get('/users/advisors', { params }),
        getAdvisorById: (id) => api.get(`/users/advisors/${id}`),
    },

    // Appointment methods
    appointments: {
        getAll: (params = {}) => api.get('/appointments', { params }),
        getById: (id) => api.get(`/appointments/${id}`),
        create: (appointmentData) => api.post('/appointments', appointmentData),
        update: (id, appointmentData) => api.patch(`/appointments/${id}`, appointmentData),
        cancel: (id) => api.patch(`/appointments/${id}/cancel`),
        confirm: (id) => api.patch(`/appointments/${id}/confirm`),
        complete: (id) => api.patch(`/appointments/${id}/complete`),
    },

    // Chat methods
    chat: {
        getConversations: () => api.get('/chat/conversations'),
        getConversationById: (id) => api.get(`/chat/conversations/${id}`),
        createConversation: (conversationData) => api.post('/chat/conversations', conversationData),
        sendMessage: (messageData) => api.post('/chat/messages', messageData),
        markAsRead: (conversationId) => api.patch(`/chat/conversations/${conversationId}/read`),
        archiveConversation: (conversationId) => api.patch(`/chat/conversations/${conversationId}/archive`),
        getUnreadCount: () => api.get('/chat/unread'),
    },

    // Payment methods
    payments: {
        createPaymentIntent: (paymentData) => api.post('/payments/create-intent', paymentData),
        confirmPayment: (paymentId) => api.post(`/payments/${paymentId}/confirm`),
        getPaymentHistory: (params = {}) => api.get('/payments/history', { params }),
    },

    // Admin methods (only for admin users)
    admin: {
        getUsers: (params = {}) => api.get('/admin/users', { params }),
        getUserById: (id) => api.get(`/admin/users/${id}`),
        updateUser: (id, userData) => api.patch(`/admin/users/${id}`, userData),
        updateUserStatus: (id, status) => api.patch(`/admin/users/${id}/status`, { status }),
        verifyUser: (id) => api.patch(`/admin/users/${id}/verify`),
        getAppointments: (params = {}) => api.get('/admin/appointments', { params }),
        getAppointmentById: (id) => api.get(`/admin/appointments/${id}`),
        updateAppointment: (id, appointmentData) => api.patch(`/admin/appointments/${id}`, appointmentData),
        getPayments: (params = {}) => api.get('/admin/payments', { params }),
        getDashboardStats: () => api.get('/admin/dashboard'),
        getSystemHealth: () => api.get('/admin/system-health'),
    },

    // Utility method to update language header
    setLanguage: (language) => {
        localStorage.setItem('locale', language);
        // Update the default header for future requests
        api.defaults.headers['X-App-Language'] = language;
    },

    // Method to get current language
    getLanguage: () => getCurrentLanguage(),
};

export default apiService;