<template>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent">
            </div>
            <p class="mt-2 text-gray-600">{{ t('common.loading') }}</p>
        </div>

        <template v-else-if="advisor">
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <div class="p-6">
                    <h1 class="text-2xl font-bold text-gray-900">
                        {{ t('appointments.bookAppointmentWith', {
                            title: 'Dr.', firstName: advisor.firstName, lastName:
                        advisor.lastName }) }}
                    </h1>
                    <div class="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        <span v-for="spec in advisor.specializations" :key="spec"
                            class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                            {{ spec }}
                        </span>
                    </div>

                    <form @submit.prevent="handleSubmit" class="mt-6 space-y-6">
                        <!-- Date Selection -->
                        <div>
                            <label for="date" class="label">{{ t('appointments.selectDate') }}</label>
                            <input id="date" v-model="formData.date" type="date" :min="minDate" :max="maxDate"
                                class="input mt-1" required @change="fetchAvailableSlots"
                                :class="{ 'border-red-500': validationErrors.date }" />
                            <p v-if="validationErrors.date" class="mt-1 text-sm text-red-600">
                                {{ validationErrors.date }}
                            </p>
                        </div>

                        <!-- Time Slots -->
                        <div v-if="formData.date">
                            <label class="label">{{ t('appointments.availableTimeSlots') }}</label>
                            <div class="mt-2 grid grid-cols-3 gap-3">
                                <button v-for="slot in availableSlots" :key="slot.start" type="button"
                                    class="btn-secondary"
                                    :class="{ 'ring-2 ring-indigo-500': formData.time === slot.start }"
                                    @click="formData.time = slot.start">
                                    {{ formatTimeDisplay(slot.start) }}
                                </button>
                            </div>
                            <p v-if="availableSlots.length === 0" class="mt-2 text-sm text-gray-500">
                                {{ t('appointments.noAvailableSlots') }}
                            </p>
                            <p v-if="validationErrors.time" class="mt-1 text-sm text-red-600">
                                {{ validationErrors.time }}
                            </p>
                        </div>

                        <!-- Consultation Type -->
                        <div>
                            <label class="label">{{ t('appointments.consultationType') }}</label>
                            <div class="mt-2 grid grid-cols-3 gap-3">
                                <button v-for="type in consultationTypes" :key="type.value" type="button"
                                    class="btn-secondary" :class="{
                                        'ring-2 ring-indigo-500': formData.type === type.value,
                                        'border-red-500': validationErrors.type
                                    }" @click="formData.type = type.value">
                                    {{ t(`appointments.types.${type.value}`) }}
                                </button>
                            </div>
                            <p v-if="validationErrors.type" class="mt-1 text-sm text-red-600">
                                {{ validationErrors.type }}
                            </p>
                        </div>

                        <!-- Short description -->
                        <div>
                            <label for="description" class="label">{{ t('appointments.shortDescription') }}</label>
                            <textarea id="description" v-model="formData.shortDescription" rows="3" class="input mt-1"
                                required :class="{ 'border-red-500': validationErrors.shortDescription }"
                                :placeholder="t('appointments.descriptionPlaceholder')"></textarea>
                            <p v-if="validationErrors.shortDescription" class="mt-1 text-sm text-red-600">
                                {{ validationErrors.shortDescription }}
                            </p>
                        </div>

                        <!-- Fee Information -->
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <h3 class="text-lg font-medium text-gray-900">{{ t('appointments.consultationFee') }}</h3>
                            <p class="mt-1 text-gray-600">
                                {{ formatFee() }} UZS
                            </p>
                            <p class="mt-2 text-sm text-gray-500">
                                {{ t('appointments.paymentProcessedSecurely') }}
                            </p>
                        </div>

                        <div>
                            <button type="submit" class="btn-primary w-full" :disabled="submitting">
                                {{ submitting ? t('appointments.processing') : t('appointments.proceedToPayment') }}
                            </button>
                        </div>

                        <div v-if="error" class="text-sm text-center text-red-600">
                            {{ error }}
                        </div>
                    </form>
                </div>
            </div>
        </template>

        <div v-else class="text-center py-8">
            <p class="text-gray-600">{{ t('advisors.advisorNotFound') }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format, addDays, parseISO, subMinutes, addMinutes, isWithinInterval } from 'date-fns'
import { usePaymentStore } from '@/stores/payment'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const { t } = useI18n()
const { api } = useApi()

const advisor = ref(null)
const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const availableSlots = ref([])
const validationErrors = reactive({
    date: '',
    time: '',
    type: '',
    shortDescription: ''
})

const consultationTypes = [
    { value: 'video', label: t('appointments.types.video') },
    { value: 'phone', label: t('appointments.types.phone') },
    { value: 'online', label: t('appointments.types.online') }
]

const formData = reactive({
    date: '',
    time: '',
    type: 'video',
    shortDescription: ''
})

// Fixed to use UTC+5 timezone
const minDate = computed(() => {
    const now = new Date()
    const utc5Offset = 5 * 60 // UTC+5 in minutes
    const utc5Date = new Date(now.getTime() + (utc5Offset * 60 * 1000))
    return format(utc5Date, 'yyyy-MM-dd')
})

const maxDate = computed(() => {
    const now = new Date()
    const utc5Offset = 5 * 60 // UTC+5 in minutes
    const utc5Date = new Date(now.getTime() + (utc5Offset * 60 * 1000))
    const maxDate = addDays(utc5Date, 30)
    return format(maxDate, 'yyyy-MM-dd')
})

// Safe formatting function for currency
const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) {
        return '0'
    }
    const numAmount = Number(amount)
    if (isNaN(numAmount)) {
        console.error('Invalid fee amount:', amount)
        return '0'
    }
    return new Intl.NumberFormat('uz-UZ').format(numAmount)
}

// Function to safely format the advisor's fee
const formatFee = () => {
    if (!advisor.value) return '0'
    return formatCurrency(advisor.value.consultationFee)
}

// Fixed to display UTC+5 time correctly
const formatTimeDisplay = (timeString) => {
    try {
        const timeDate = new Date(timeString)
        const utc5Time = new Date(timeDate.getTime() + 0)

        const hours = utc5Time.getUTCHours()
        const minutes = utc5Time.getUTCMinutes()

        const period = hours >= 12 ? 'PM' : 'AM'
        const displayHours = hours % 12 || 12
        const displayMinutes = minutes.toString().padStart(2, '0')

        return `${displayHours}:${displayMinutes} ${period}`
    } catch (error) {
        console.error('Error formatting time:', error)
        return timeString
    }
}

const isWithinJoinWindow = (dateTime) => {
    const appointmentTime = parseISO(dateTime)
    const now = new Date()
    return isWithinInterval(now, {
        start: subMinutes(appointmentTime, 5),
        end: addMinutes(appointmentTime, 30)
    })
}

async function fetchAdvisorProfile() {
    try {
        loading.value = true
        const response = await api.get(`/users/advisors/${route.params.advisorId}`)
        advisor.value = response.data.advisor
    } catch (error) {
        console.error('Error fetching advisor profile:', error)
    } finally {
        loading.value = false
    }
}

async function fetchAvailableSlots() {
    try {
        const response = await api.get(`/appointments/availability/${route.params.advisorId}`, {
            params: { date: formData.date }
        })
        availableSlots.value = response.data.availableSlots.map(slot => ({
            ...slot,
            start: slot.start
        }))

        formData.time = ''
        validationErrors.time = ''
    } catch (error) {
        console.error('Error fetching available slots:', error)
        availableSlots.value = []
    }
}

function validateForm() {
    Object.keys(validationErrors).forEach(key => {
        validationErrors[key] = ''
    })

    let isValid = true

    if (!formData.date) {
        validationErrors.date = t('appointments.validation.selectDate')
        isValid = false
    }

    if (!formData.time) {
        validationErrors.time = t('appointments.validation.selectTime')
        isValid = false
    }

    if (!formData.type) {
        validationErrors.type = t('appointments.validation.selectType')
        isValid = false
    }

    if (!formData.shortDescription.trim()) {
        validationErrors.shortDescription = t('appointments.validation.provideDescription')
        isValid = false
    }

    return isValid
}

async function handleSubmit() {
    if (!validateForm()) {
        return
    }

    try {
        submitting.value = true
        error.value = ''

        const selectedDateTime = formData.time
        const appointmentTime = new Date(selectedDateTime)
        const utc5AdjustedTime = new Date(appointmentTime.getTime() - (5 * 60 * 60 * 1000))

        const appointmentData = {
            advisorId: route.params.advisorId,
            dateTime: utc5AdjustedTime.toISOString(),
            type: formData.type,
            shortDescription: formData.shortDescription
        }

        const response = await api.post('/appointments', appointmentData)
        await paymentStore.createCheckoutSession(response.data.appointment._id)

    } catch (err) {
        console.error('Error booking appointment:', err)
        error.value = err.response?.data?.message || t('appointments.bookingFailed')
    } finally {
        submitting.value = false
    }
}

onMounted(() => {
    fetchAdvisorProfile()
})
</script>