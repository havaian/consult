<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-8">{{ t('appointments.myAppointments') }}</h1>

        <!-- Filters -->
        <div class="bg-white shadow rounded-lg p-6 mb-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                    <img :src="appointment.advisor.profilePicture || '/images/user-placeholder.jpg'"
                                        :alt="appointment.advisor.firstName"
                                        class="h-12 w-12 rounded-full object-cover" />
                                    <div>
                                        <h3 class="text-lg font-medium text-gray-900">
                                            {{ appointment.advisor.firstName }} {{ appointment.advisor.lastName }}
                                        </h3>
                                        <div class="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                                            <span v-for="spec in appointment.advisor.specializations" :key="spec"
                                                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                                {{ spec }}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                                        :class="{
                                            'bg-green-100 text-green-800': appointment.status === 'completed',
                                            'bg-yellow-100 text-yellow-800': appointment.status === 'scheduled',
                                            'bg-red-100 text-red-800': appointment.status === 'canceled' || appointment.status === 'no-show'
                                        }">
                                        {{ getStatusText(appointment.status) }}
                                    </span>
                                </div>
                            </div>

                            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-sm text-gray-500">{{ t('appointments.dateTime') }}</p>
                                    <p class="text-gray-900">{{ formatDateTime(appointment.dateTime) }}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">{{ t('appointments.consultationType') }}</p>
                                    <p class="text-gray-900">{{ t(`appointments.types.${appointment.type}`) }}</p>
                                </div>
                            </div>

                            <div class="mt-6 flex justify-end space-x-4">
                                <router-link :to="{ name: 'appointment-details', params: { id: appointment._id } }"
                                    class="btn-secondary">
                                    {{ t('appointments.viewDetails') }}
                                </router-link>
                                <button v-if="appointment.status === 'scheduled'"
                                    class="btn-secondary text-red-600 hover:text-red-700"
                                    @click="cancelAppointment(appointment._id)">
                                    {{ t('common.cancel') }}
                                </button>
                                <button
                                    v-if="appointment.status === 'scheduled' && isWithinJoinWindow(appointment.dateTime)"
                                    class="btn-primary" @click="joinConsultation(appointment._id)">
                                    {{ t('appointments.joinNow') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex justify-center space-x-2 mt-8">
                    <button v-for="page in totalPages" :key="page" class="btn-secondary"
                        :class="{ 'bg-indigo-600 text-white': currentPage === page }" @click="handlePageChange(page)">
                        {{ page }}
                    </button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { format, parseISO, isWithinInterval, subMinutes, addMinutes } from 'date-fns'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const { api } = useApi()

const appointments = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const filters = reactive({
    status: ''
})

const formatDateTime = (dateTime) => {
    return format(parseISO(dateTime), 'MMM d, yyyy h:mm a')
}

const isWithinJoinWindow = (dateTime) => {
    const appointmentTime = parseISO(dateTime)
    const now = new Date()
    return isWithinInterval(now, {
        start: subMinutes(appointmentTime, 5),
        end: addMinutes(appointmentTime, 30)
    })
}

const getStatusText = (status) => {
    const statusMap = {
        'scheduled': 'appointments.scheduled',
        'completed': 'appointments.completed',
        'canceled': 'appointments.cancelled',
        'no-show': 'appointments.noShow'
    }

    return statusMap[status] ? t(statusMap[status]) : status.charAt(0).toUpperCase() + status.slice(1)
}

async function fetchAppointments() {
    try {
        loading.value = true
        const params = {
            page: currentPage.value,
            limit: 10,
            ...filters
        }

        const response = await api.get(`/appointments/client/${authStore.user._id}`, { params })
        appointments.value = response.data.appointments
        totalPages.value = Math.ceil(response.data.pagination.total / response.data.pagination.limit)
    } catch (error) {
        console.error('Error fetching appointments:', error)
    } finally {
        loading.value = false
    }
}

async function cancelAppointment(appointmentId) {
    if (!confirm(t('appointments.cancelConfirm'))) return

    try {
        await api.patch(`/appointments/${appointmentId}/status`, {
            status: 'canceled'
        })
        await fetchAppointments()
    } catch (error) {
        console.error('Error canceling appointment:', error)
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

onMounted(() => {
    fetchAppointments()
})
</script>