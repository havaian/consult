<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex justify-between items-center mb-8">
            <h1 class="text-2xl font-bold text-gray-900">{{ t('appointments.pending.title') }}</h1>
            <div class="text-sm text-gray-500">
                {{ t('appointments.pending.countText', {
                    count: pendingCount, appointments: pendingCount !== 1 ?
                        t('appointments.pending.appointmentsPlural') : t('appointments.pending.appointmentsSingular') }) }}
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent">
            </div>
            <p class="mt-2 text-gray-600">{{ t('appointments.pending.loading') }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="!loading && appointments.length === 0" class="text-center py-12">
            <div class="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            </div>
            <h3 class="mt-2 text-sm font-medium text-gray-900">{{ t('appointments.pending.noPendingTitle') }}</h3>
            <p class="mt-1 text-sm text-gray-500">{{ t('appointments.pending.noPendingDesc') }}</p>
        </div>

        <!-- Appointments List -->
        <div v-else class="space-y-6">
            <div v-for="appointment in appointments" :key="appointment._id"
                class="bg-white shadow rounded-lg overflow-hidden"
                :class="getUrgencyBorderClass(appointment.timeRemaining)">
                <div class="p-6">
                    <!-- Header with urgency indicator -->
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <img v-if="appointment.client.profilePicture" :src="appointment.client.profilePicture"
                                    :alt="`${appointment.client.firstName} ${appointment.client.lastName}`"
                                    class="h-10 w-10 rounded-full object-cover" />
                                <div v-else class="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
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
                                    {{ t('appointments.pending.ageText', {
                                        age:
                                            calculateAge(appointment.client.dateOfBirth) }) }}
                                </p>
                            </div>
                        </div>

                        <!-- Urgency Badge -->
                        <div class="flex flex-col items-end">
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                :class="getUrgencyBadgeClass(appointment.timeRemaining)">
                                {{ getUrgencyText(appointment.timeRemaining) }}
                            </span>
                            <span class="text-xs text-gray-500 mt-1">
                                {{ t('appointments.pending.timeLeft', {
                                    time:
                                        formatTimeRemaining(appointment.timeRemaining) }) }}
                            </span>
                        </div>
                    </div>

                    <!-- Appointment Details -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div>
                            <p class="text-sm text-gray-500">{{ t('appointments.pending.appointmentDateTime') }}</p>
                            <p class="text-gray-900 font-medium">{{ formatDateTime(appointment.dateTime) }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">{{ t('appointments.pending.duration') }}</p>
                            <p class="text-gray-900">{{ t('appointments.pending.minutesText', {
                                minutes:
                                appointment.duration || 30 }) }}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">{{ t('appointments.pending.consultationType') }}</p>
                            <p class="text-gray-900">
                                {{ appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1) }}
                            </p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-500">{{ t('appointments.pending.paymentStatus') }}</p>
                            <span
                                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {{ t('appointments.pending.paid') }}
                            </span>
                        </div>
                    </div>

                    <!-- Short Description -->
                    <div class="mb-6">
                        <p class="text-sm text-gray-500 mb-2">{{ t('appointments.pending.shortDescription') }}</p>
                        <p class="text-gray-900 bg-gray-50 p-3 rounded-md">{{ appointment.shortDescription }}</p>
                    </div>

                    <!-- Client Contact Info -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-md">
                        <div v-if="appointment.client.email">
                            <p class="text-sm text-gray-500">{{ t('profile.email') }}</p>
                            <p class="text-gray-900">{{ appointment.client.email }}</p>
                        </div>
                        <div v-if="appointment.client.phone">
                            <p class="text-sm text-gray-500">{{ t('profile.phone') }}</p>
                            <p class="text-gray-900">{{ appointment.client.phone }}</p>
                        </div>
                    </div>

                    <!-- Action Buttons -->
                    <div class="flex justify-end space-x-4">
                        <button @click="showRejectModal(appointment)"
                            :disabled="processingAppointments.has(appointment._id)"
                            class="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <span v-if="processingAppointments.has(appointment._id)" class="flex items-center">
                                <div
                                    class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-red-700 border-t-transparent rounded-full">
                                </div>
                                {{ t('appointments.pending.processing') }}
                            </span>
                            <span v-else>{{ t('appointments.pending.reject') }}</span>
                        </button>

                        <button @click="confirmAppointment(appointment)"
                            :disabled="processingAppointments.has(appointment._id)"
                            class="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            <span v-if="processingAppointments.has(appointment._id)" class="flex items-center">
                                <div
                                    class="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full">
                                </div>
                                {{ t('appointments.pending.confirming') }}
                            </span>
                            <span v-else>{{ t('appointments.pending.confirmAppointment') }}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center space-x-2 mt-8">
            <button v-for="page in totalPages" :key="page" @click="handlePageChange(page)"
                class="px-3 py-2 border rounded-md"
                :class="currentPage === page ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'">
                {{ page }}
            </button>
        </div>

        <!-- Reject Confirmation Modal -->
        <div v-if="showRejectModalFlag"
            class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div class="mt-3">
                    <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <svg class="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </div>
                    <div class="mt-5 text-center">
                        <h3 class="text-lg leading-6 font-medium text-gray-900">{{
                            t('appointments.pending.modal.rejectTitle') }}</h3>
                        <div class="mt-2">
                            <p class="text-sm text-gray-500">
                                {{ t('appointments.pending.modal.rejectDescription') }}
                            </p>
                        </div>
                        <div class="mt-4">
                            <textarea v-model="rejectionReason"
                                :placeholder="t('appointments.pending.modal.reasonPlaceholder')"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                rows="3"></textarea>
                        </div>
                    </div>
                </div>
                <div class="flex justify-end space-x-3 mt-5">
                    <button @click="closeRejectModal"
                        class="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400">
                        {{ t('common.cancel') }}
                    </button>
                    <button @click="rejectAppointment" :disabled="processingRejection"
                        class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                        <span v-if="processingRejection">{{ t('appointments.pending.modal.rejecting') }}</span>
                        <span v-else>{{ t('appointments.pending.modal.rejectAppointment') }}</span>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed, onBeforeUnmount } from 'vue'
import { format, parseISO, differenceInYears } from 'date-fns'

import { useAuthStore } from '@/stores/auth'
const authStore = useAuthStore()

import { useApi } from '../../composables/useApi';
const { api } = useApi()

import { useI18n } from '@/composables/useI18n'
const { t } = useI18n()

// Reactive data
const appointments = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const processingAppointments = ref(new Set())
const showRejectModalFlag = ref(false)
const selectedAppointment = ref(null)
const rejectionReason = ref('')
const processingRejection = ref(false)

// Computed properties
const pendingCount = computed(() => appointments.value.length)

// Utility functions
const formatDateTime = (dateTime) => {
    return format(parseISO(dateTime), 'MMM d, yyyy h:mm a')
}

const calculateAge = (dateOfBirth) => {
    return differenceInYears(new Date(), parseISO(dateOfBirth))
}

const formatTimeRemaining = (timeRemaining) => {
    if (!timeRemaining) return t('appointments.pending.unknown')
    const { hours, minutes } = timeRemaining
    if (hours > 0) {
        return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
}

const getUrgencyText = (timeRemaining) => {
    if (!timeRemaining) return t('appointments.pending.urgency.unknown')
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes

    if (totalMinutes <= 60) return t('appointments.pending.urgency.urgent')
    if (totalMinutes <= 180) return t('appointments.pending.urgency.high')
    if (totalMinutes <= 360) return t('appointments.pending.urgency.medium')
    return t('appointments.pending.urgency.low')
}

const getUrgencyBorderClass = (timeRemaining) => {
    if (!timeRemaining) return 'border-gray-300'
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes

    if (totalMinutes <= 60) return 'border-red-500'
    if (totalMinutes <= 180) return 'border-orange-500'
    if (totalMinutes <= 360) return 'border-yellow-500'
    return 'border-green-500'
}

const getUrgencyBadgeClass = (timeRemaining) => {
    if (!timeRemaining) return 'bg-gray-100 text-gray-800'
    const totalMinutes = timeRemaining.hours * 60 + timeRemaining.minutes

    if (totalMinutes <= 60) return 'bg-red-100 text-red-800'
    if (totalMinutes <= 180) return 'bg-orange-100 text-orange-800'
    if (totalMinutes <= 360) return 'bg-yellow-100 text-yellow-800'
    return 'bg-green-100 text-green-800'
}

// API functions
async function fetchPendingConfirmations() {
    try {
        loading.value = true
        const params = {
            page: currentPage.value,
            limit: 10
        }

        const response = await api.get(`/appointments/pending-confirmation/advisor/${authStore.user._id}`, { params })
        appointments.value = response.data.appointments
        totalPages.value = Math.ceil(response.data.pagination.total / response.data.pagination.limit)
    } catch (error) {
        console.error('Error fetching pending confirmations:', error)
        // Show user-friendly error message
        alert(t('appointments.pending.errors.loadFailed'))
    } finally {
        loading.value = false
    }
}

async function confirmAppointment(appointment) {
    if (!confirm(t('appointments.pending.confirmPrompt', { name: `${appointment.client.firstName} ${appointment.client.lastName}` }))) {
        return
    }

    try {
        processingAppointments.value.add(appointment._id)

        await api.post(`/appointments/${appointment._id}/confirm`)

        // Remove from list after successful confirmation
        appointments.value = appointments.value.filter(app => app._id !== appointment._id)

        // Show success message
        alert(t('appointments.pending.confirmSuccess'))

    } catch (error) {
        console.error('Error confirming appointment:', error)

        // Handle specific error cases
        if (error.response?.status === 400 && error.response.data?.message?.includes('deadline')) {
            alert(t('appointments.pending.errors.expired'))
            // Remove from list since it's been canceled
            appointments.value = appointments.value.filter(app => app._id !== appointment._id)
        } else {
            alert(t('appointments.pending.errors.confirmFailed'))
        }
    } finally {
        processingAppointments.value.delete(appointment._id)
    }
}

function showRejectModal(appointment) {
    selectedAppointment.value = appointment
    showRejectModalFlag.value = true
    rejectionReason.value = ''
}

function closeRejectModal() {
    showRejectModalFlag.value = false
    selectedAppointment.value = null
    rejectionReason.value = ''
}

async function rejectAppointment() {
    if (!selectedAppointment.value) return

    try {
        processingRejection.value = true

        // Use the updateAppointmentStatus endpoint to cancel the appointment
        await api.patch(`/appointments/${selectedAppointment.value._id}/status`, {
            status: 'canceled',
            cancellationReason: rejectionReason.value || t('appointments.pending.defaultRejectionReason')
        })

        // Remove from list after successful rejection
        appointments.value = appointments.value.filter(app => app._id !== selectedAppointment.value._id)

        closeRejectModal()
        alert(t('appointments.pending.rejectSuccess'))

    } catch (error) {
        console.error('Error rejecting appointment:', error)
        alert(t('appointments.pending.errors.rejectFailed'))
    } finally {
        processingRejection.value = false
    }
}

function handlePageChange(page) {
    currentPage.value = page
    fetchPendingConfirmations()
}

// Lifecycle
onMounted(() => {
    fetchPendingConfirmations()

    // Auto-refresh every 2 minutes to keep data current
    const refreshInterval = setInterval(() => {
        fetchPendingConfirmations()
    }, 120000) // 2 minutes

    // Clean up interval on component unmount
    onBeforeUnmount(() => {
        clearInterval(refreshInterval)
    })
})
</script>