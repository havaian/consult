<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-8">{{ t('appointments.mySchedule') }}</h1>

        <!-- Tab Navigation -->
        <div class="border-b border-gray-200 mb-8">
            <nav class="-mb-px flex space-x-8">
                <button @click="activeTab = 'pending'" :class="[
                    'py-2 px-1 border-b-2 font-medium text-sm',
                    activeTab === 'pending'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]">
                    {{ t('appointments.pendingConfirmations') }}
                    <span v-if="pendingCount > 0" class="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                        {{ pendingCount }}
                    </span>
                </button>
                <button @click="activeTab = 'scheduled'" :class="[
                    'py-2 px-1 border-b-2 font-medium text-sm',
                    activeTab === 'scheduled'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                ]">
                    {{ t('appointments.scheduledAppointments') }}
                </button>
            </nav>
        </div>

        <!-- Pending Confirmations Tab -->
        <div v-if="activeTab === 'pending'">
            <PendingConfirmations @appointment-confirmed="refreshPendingCount" />
        </div>

        <!-- Scheduled Appointments Tab -->
        <div v-if="activeTab === 'scheduled'">
            <!-- Filters -->
            <div class="bg-white shadow rounded-lg p-6 mb-8">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label for="date" class="label">{{ t('appointments.date') }}</label>
                        <input id="date" v-model="filters.date" type="date" class="input mt-1"
                            @change="fetchAppointments" />
                    </div>
                    <div>
                        <label for="status" class="label">{{ t('appointments.status') }}</label>
                        <select id="status" v-model="filters.status" class="input mt-1" @change="fetchAppointments">
                            <option value="">{{ t('appointments.allStatus') }}</option>
                            <option value="scheduled">{{ t('appointments.scheduled') }}</option>
                            <option value="completed">{{ t('appointments.completed') }}</option>
                            <option value="canceled">{{ t('appointments.cancelled') }}</option>
                            <option value="no-show">{{ t('appointments.noShow') }}</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Appointments List -->
            <div class="space-y-6">
                <div v-if="loading" class="text-center py-8">
                    <div
                        class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent">
                    </div>
                    <p class="mt-2 text-gray-600">{{ t('appointments.loadingAppointments') }}</p>
                </div>

                <template v-else>
                    <div v-if="appointments.length === 0" class="text-center py-8">
                        <p class="text-gray-600">{{ t('appointments.noAppointmentsFound') }}</p>
                    </div>

                    <div v-else class="space-y-4">
                        <div v-for="appointment in appointments" :key="appointment._id"
                            class="bg-white shadow rounded-lg overflow-hidden">
                            <div class="p-6">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        <div class="flex-shrink-0">
                                            <img v-if="appointment.client.profilePicture"
                                                :src="appointment.client.profilePicture"
                                                :alt="`${appointment.client.firstName} ${appointment.client.lastName}`"
                                                class="h-12 w-12 rounded-full object-cover" />
                                            <div v-else
                                                class="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                                                <span class="text-sm font-medium text-gray-700">
                                                    {{ appointment.client.firstName.charAt(0) }}{{
                                                        appointment.client.lastName.charAt(0) }}
                                                </span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 class="text-lg font-semibold text-gray-900">
                                                {{ appointment.client.firstName }} {{ appointment.client.lastName }}
                                            </h3>
                                            <p class="text-sm text-gray-500">
                                                {{ t('user.age') }}: {{ calculateAge(appointment.client.dateOfBirth) }}
                                                {{ t('user.years') }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <span
                                            class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                            :class="getStatusClass(appointment.status)">
                                            {{ getStatusText(appointment.status) }}
                                        </span>
                                    </div>
                                </div>

                                <div class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-500">{{ t('appointments.dateTime') }}</p>
                                        <p class="text-gray-900 font-medium">{{ formatDateTime(appointment.dateTime) }}
                                        </p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-500">{{ t('appointments.consultationType') }}</p>
                                        <p class="text-gray-900">{{ t(`appointments.types.${appointment.type}`) }}</p>
                                    </div>
                                    <div class="md:col-span-2">
                                        <p class="text-sm text-gray-500">{{ t('appointments.shortDescription') }}</p>
                                        <p class="text-gray-900">{{ appointment.shortDescription }}</p>
                                    </div>
                                </div>

                                <div class="mt-6 flex justify-end space-x-4">
                                    <router-link :to="{ name: 'appointment-details', params: { id: appointment._id } }"
                                        class="btn-secondary">
                                        {{ t('appointments.viewDetails') }}
                                    </router-link>
                                    <button v-if="appointment.status === 'scheduled'"
                                        class="btn-secondary text-red-600 hover:text-red-700"
                                        @click="markAsNoShow(appointment._id)">
                                        {{ t('appointments.markAsNoShow') }}
                                    </button>
                                    <button
                                        v-if="appointment.status === 'scheduled' && isWithinJoinWindow(appointment.dateTime)"
                                        class="btn-primary" @click="joinConsultation(appointment._id)">
                                        {{ t('appointments.startConsultation') }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination -->
                    <div v-if="totalPages > 1" class="flex justify-center space-x-2 mt-8">
                        <button v-for="page in totalPages" :key="page" class="btn-secondary"
                            :class="{ 'bg-indigo-600 text-white': currentPage === page }"
                            @click="handlePageChange(page)">
                            {{ page }}
                        </button>
                    </div>
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { format, parseISO, differenceInYears, isWithinInterval, subMinutes, addMinutes } from 'date-fns'
import PendingConfirmations from '@/components/appointments/PendingConfirmations.vue'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const { api } = useApi()

// Reactive data
const activeTab = ref('pending') // Start with pending tab to highlight urgent items
const appointments = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const pendingCount = ref(0)
const filters = reactive({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: ''
})

// Utility functions
const formatDateTime = (dateTime) => {
    return format(parseISO(dateTime), 'MMM d, yyyy h:mm a')
}

const calculateAge = (dateOfBirth) => {
    return differenceInYears(new Date(), parseISO(dateOfBirth))
}

const isWithinJoinWindow = (dateTime) => {
    const appointmentTime = parseISO(dateTime)
    const now = new Date()
    return isWithinInterval(now, {
        start: subMinutes(appointmentTime, 5),
        end: addMinutes(appointmentTime, 30)
    })
}

const getStatusClass = (status) => {
    const classes = {
        'scheduled': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'canceled': 'bg-red-100 text-red-800',
        'no-show': 'bg-gray-100 text-gray-800',
        'pending-advisor-confirmation': 'bg-yellow-100 text-yellow-800'
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const statusMap = {
        'scheduled': 'appointments.scheduled',
        'completed': 'appointments.completed',
        'canceled': 'appointments.cancelled',
        'no-show': 'appointments.noShow',
        'pending-advisor-confirmation': 'appointments.pendingConfirmation'
    }

    return statusMap[status] ? t(statusMap[status]) : status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')
}

// API functions
async function fetchAppointments() {
    try {
        loading.value = true
        const params = {
            page: currentPage.value,
            limit: 10,
            ...filters
        }

        const response = await api.get(`/appointments/advisor/${authStore.user._id}`, { params })
        appointments.value = response.data.appointments
        totalPages.value = Math.ceil(response.data.pagination.total / response.data.pagination.limit)
    } catch (error) {
        console.error('Error fetching appointments:', error)
    } finally {
        loading.value = false
    }
}

async function fetchPendingCount() {
    try {
        const response = await api.get(`/appointments/pending-confirmation/advisor/${authStore.user._id}`, {
            params: { limit: 1 } // Just get count, not all data
        })
        pendingCount.value = response.data.pagination.total
    } catch (error) {
        console.error('Error fetching pending count:', error)
        pendingCount.value = 0
    }
}

async function markAsNoShow(appointmentId) {
    if (!confirm(t('appointments.markAsNoShowConfirm'))) return

    try {
        await api.patch(`/appointments/${appointmentId}/status`, {
            status: 'no-show'
        })
        await fetchAppointments()
    } catch (error) {
        console.error('Error updating appointment status:', error)
    }
}

async function joinConsultation(appointmentId) {
    try {
        const response = await api.get(`/consultations/${appointmentId}/join`)
        if (response.data.consultation) {
            router.push({
                name: 'consultation-room',
                params: { appointmentId }
            })
        }
    } catch (error) {
        console.error('Error joining consultation:', error)
    }
}

function handlePageChange(page) {
    currentPage.value = page
    fetchAppointments()
}

function refreshPendingCount() {
    fetchPendingCount()
    // If we're on the pending tab and an appointment was confirmed, 
    // we might want to refresh that view too
}

// Lifecycle
onMounted(() => {
    fetchPendingCount()
    if (activeTab.value === 'scheduled') {
        fetchAppointments()
    }

    // Set up interval to refresh pending count
    const refreshInterval = setInterval(() => {
        fetchPendingCount()
    }, 60000) // Refresh every minute

    // Clean up interval
    onBeforeUnmount(() => {
        clearInterval(refreshInterval)
    })
})

// Watch for tab changes
watch(activeTab, (newTab) => {
    if (newTab === 'scheduled') {
        fetchAppointments()
    }
})
</script>