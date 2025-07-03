// File: frontend/src/composables/useApi.js
import { ref, computed } from 'vue';
import apiService from '@/services/api';
import { useI18n } from './useI18n';

export function useApi() {
    const loading = ref(false);
    const error = ref(null);
    const { t } = useI18n();

    // Generic API call wrapper
    const makeRequest = async (apiCall, options = {}) => {
        loading.value = true;
        error.value = null;

        try {
            const response = await apiCall();
            return response.data;
        } catch (err) {
            console.error('API Error:', err);

            // Handle different error types
            if (err.response?.data?.message) {
                error.value = err.response.data.message;
            } else if (err.message) {
                error.value = err.message;
            } else {
                error.value = t('errors.general');
            }

            // Optionally rethrow for component-specific handling
            if (options.rethrow) {
                throw err;
            }

            return null;
        } finally {
            loading.value = false;
        }
    };

    // Specific API methods
    const login = async (credentials) => {
        return makeRequest(() => apiService.auth.login(credentials));
    };

    const register = async (userData) => {
        return makeRequest(() => apiService.auth.register(userData));
    };

    const getCurrentUser = async () => {
        return makeRequest(() => apiService.user.getCurrentUser());
    };

    const getAdvisors = async (params = {}) => {
        return makeRequest(() => apiService.user.getAdvisors(params));
    };

    const createAppointment = async (appointmentData) => {
        return makeRequest(() => apiService.appointments.create(appointmentData));
    };

    const getAppointments = async (params = {}) => {
        return makeRequest(() => apiService.appointments.getAll(params));
    };

    const sendMessage = async (messageData) => {
        return makeRequest(() => apiService.chat.sendMessage(messageData));
    };

    const getConversations = async () => {
        return makeRequest(() => apiService.chat.getConversations());
    };

    return {
        // State
        loading: computed(() => loading.value),
        error: computed(() => error.value),

        // Methods
        makeRequest,
        login,
        register,
        getCurrentUser,
        getAdvisors,
        createAppointment,
        getAppointments,
        sendMessage,
        getConversations,

        // Direct API service access
        api: apiService,
    };
}