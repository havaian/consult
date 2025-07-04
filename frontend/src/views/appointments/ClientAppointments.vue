<template>
    <div class="max-w-4xl mx-auto px-4 py-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-8">{{ t('appointments.myAppointments') }}</h1>

        <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ t('common.loading') }}</p>
        </div>

        <div v-else-if="appointments.length === 0" class="text-center py-8">
            <p class="text-gray-600">{{ t('appointments.noAppointments') }}</p>
        </div>

        <div v-else class="space-y-6">
            <div v-for="appointment in appointments" :key="appointment._id"
                class="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">

                <!-- Appointment Header -->
                <div class="p-6">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img :src="appointment.advisor.profilePicture || '/images/user-placeholder.jpg'"
                                :alt="`${appointment.advisor.firstName} ${appointment.advisor.lastName}`"
                                class="w-12 h-12 rounded-full mr-4 object-cover">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">
                                    {{ appointment.advisor.firstName }} {{ appointment.advisor.lastName }}
                                </h3>
                                <p class="text-sm text-gray-600">{{ formatDate(appointment.dateTime) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="px-2 py-1 text-xs font-medium rounded-full"
                                :class="getStatusClass(appointment.status)">
                                {{ getStatusText(appointment.status) }}
                            </span>
                        </div>
                    </div>

                    <div class="mt-4">
                        <p class="text-gray-700">{{ appointment.shortDescription }}</p>
                        <div class="mt-2 flex items-center text-sm text-gray-500">
                            <span class="capitalize">{{ appointment.type }}</span>
                            <span class="mx-2">•</span>
                            <span>{{ appointment.duration }} {{ t('appointments.minutes') }}</span>
                        </div>
                    </div>
                </div>

                <!-- Review Section for Completed Appointments -->
                <div v-if="appointment.status === 'completed'" class="border-t border-gray-200">
                    <div class="p-6">
                        <!-- Show existing review -->
                        <div v-if="appointment.review" class="mb-6">
                            <h4 class="font-medium text-gray-900 mb-3">{{ t('reviews.yourReview') }}</h4>
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="flex items-center mb-2">
                                    <div class="flex items-center">
                                        <svg v-for="star in getStarRating(appointment.review.rating)" :key="star"
                                            class="w-4 h-4"
                                            :class="star === 'full' ? 'text-yellow-400' : 'text-gray-300'"
                                            fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <span class="ml-2 text-sm text-gray-600">{{ appointment.review.rating }}/5</span>
                                </div>
                                <p class="text-gray-900">{{ appointment.review.comment }}</p>
                                <p class="text-xs text-gray-500 mt-2">
                                    {{ t('reviews.reviewedOn') }} {{ formatDate(appointment.review.createdAt) }}
                                </p>

                                <!-- Advisor Response -->
                                <div v-if="appointment.review.advisorResponse" class="mt-4 p-3 bg-blue-50 rounded-lg">
                                    <p class="text-sm text-blue-900">
                                        <span class="font-medium">{{ appointment.advisor.firstName }} {{
                                            appointment.advisor.lastName }}:</span>
                                        {{ appointment.review.advisorResponse.text }}
                                    </p>
                                    <p class="text-xs text-blue-600 mt-1">
                                        {{ formatDate(appointment.review.advisorResponse.respondedAt) }}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <!-- Review Form for appointments without reviews -->
                        <div v-else-if="canReviewAppointment(appointment)">
                            <div v-if="!showReviewForm[appointment._id]" class="text-center">
                                <button @click="showReviewForm[appointment._id] = true" class="btn-primary">
                                    {{ t('reviews.writeReview') }}
                                </button>
                            </div>

                            <div v-else>
                                <ReviewForm :appointment-id="appointment._id" :advisor-id="appointment.advisor._id"
                                    @success="onReviewSuccess" @error="onReviewError" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { useReviews } from '@/composables/useReviews'
import { format } from 'date-fns'
import ReviewForm from '@/components/reviews/ReviewForm.vue'

const { t } = useI18n()
const { api } = useApi()
const authStore = useAuthStore()
const { canReviewAppointment, getStarRating, getReviewByAppointment } = useReviews()

const appointments = ref([])
const loading = ref(true)
const showReviewForm = ref({})

// Load appointments with reviews
const loadAppointments = async () => {
    try {
        loading.value = true
        const response = await api.get(`/appointments/client/${authStore.user.id}`)
        appointments.value = response.data.appointments

        // Load reviews for completed appointments
        for (const appointment of appointments.value) {
            if (appointment.status === 'completed') {
                try {
                    const review = await getReviewByAppointment(appointment._id)
                    appointment.review = review
                } catch (err) {
                    // No review found - this is expected for appointments without reviews
                    appointment.review = null
                }
            }
        }
    } catch (error) {
        console.error('Error loading appointments:', error)
    } finally {
        loading.value = false
    }
}

const formatDate = (date) => {
    if (!date) return ''
    try {
        return format(new Date(date), 'MMM d, yyyy h:mm a')
    } catch (error) {
        return date
    }
}

const getStatusClass = (status) => {
    const classes = {
        'scheduled': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'canceled': 'bg-red-100 text-red-800',
        'pending-payment': 'bg-yellow-100 text-yellow-800'
    }
    return classes[status] || 'bg-gray-100 text-gray-800'
}

const getStatusText = (status) => {
    const texts = {
        'scheduled': t('appointments.status.scheduled'),
        'completed': t('appointments.status.completed'),
        'canceled': t('appointments.status.canceled'),
        'pending-payment': t('appointments.status.pendingPayment')
    }
    return texts[status] || status
}

const onReviewSuccess = (review) => {
    // Find the appointment and add the review
    const appointment = appointments.value.find(a => a._id === review.appointment)
    if (appointment) {
        appointment.review = review
        showReviewForm.value[appointment._id] = false
    }

    // Show success message
    // You might want to add a toast notification here
}

const onReviewError = (error) => {
    // Handle error
    console.error('Review submission error:', error)
    // You might want to show an error notification here
}

onMounted(async () => {
    await loadAppointments()
})
</script>

<style scoped>
.btn-primary {
    @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style>