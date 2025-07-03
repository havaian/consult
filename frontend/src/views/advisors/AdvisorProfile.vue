<template>
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div v-if="loading" class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent">
            </div>
            <p class="mt-2 text-gray-600">{{ t('advisors.loadingProfile') }}</p>
        </div>

        <template v-else-if="advisor">
            <div class="bg-white shadow rounded-lg overflow-hidden">
                <!-- Header -->
                <div class="p-6 sm:p-8 border-b border-gray-200">
                    <div class="flex flex-col sm:flex-row items-center sm:items-start">
                        <img :src="advisor.profilePicture || ''" :alt="advisor.firstName"
                            class="h-32 w-32 rounded-full object-cover" />
                        <div class="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
                            <h1 class="text-2xl font-bold text-gray-900">
                                {{ advisor.firstName }} {{ advisor.lastName }}
                            </h1>

                            <!-- Specializations as tags -->
                            <div class="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                                <span v-for="spec in advisor.specializations" :key="spec"
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                    {{ spec }}
                                </span>
                            </div>

                            <div class="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                                <span
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                                    {{ t('advisors.experienceYears', { years: advisor.experience }) }}
                                </span>
                                <span v-for="lang in advisor.languages" :key="lang"
                                    class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                    {{ lang }}
                                </span>
                            </div>
                        </div>

                        <div v-if="hasUpcomingAppointment" class="mt-4">
                            <button @click="startChat" class="btn-secondary w-full flex items-center justify-center">
                                <svg class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                                {{ t('advisors.chatWithAdvisor') }}
                            </button>
                        </div>

                        <div class="mt-4 sm:mt-0 sm:ml-auto">
                            <router-link v-if="authStore.isClient"
                                :to="{ name: 'book-appointment', params: { advisorId: advisor._id } }"
                                class="btn-primary">
                                {{ t('advisors.bookAppointment') }}
                            </router-link>
                        </div>
                    </div>
                </div>

                <!-- Details -->
                <div class="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('advisors.about') }}</h2>
                        <p class="text-gray-600">{{ decodedBio }}</p>

                        <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">{{ t('advisors.education') }}</h3>
                        <ul class="space-y-2">
                            <li v-for="edu in advisor.education" :key="edu.degree" class="text-gray-600">
                                {{ edu.degree }} - {{ edu.institution }} ({{ edu.year }})
                            </li>
                            <li v-if="!advisor.education || advisor.education.length === 0" class="text-gray-500">
                                {{ t('advisors.noEducationInfo') }}
                            </li>
                        </ul>

                        <h3 class="text-lg font-semibold text-gray-900 mt-6 mb-2">{{ t('advisors.certification') }}</h3>
                        <ul class="space-y-2">
                            <li v-for="cert in advisor.certifications" :key="cert.issuer" class="text-gray-600">
                                {{ cert.issuer }} - {{ cert.name }} ({{ cert.year }})
                            </li>
                            <li v-if="!advisor.certifications || advisor.certifications.length === 0"
                                class="text-gray-500">
                                {{ t('advisors.noCertificationInfo') }}
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('advisors.consultationDetails') }}
                        </h2>
                        <div class="space-y-4">
                            <div>
                                <h3 class="font-medium text-gray-900">{{ t('advisors.fee') }}</h3>
                                <p class="text-gray-600">
                                    {{ formatConsultationFee }}
                                </p>
                            </div>

                            <div>
                                <h3 class="font-medium text-gray-900">{{ t('advisors.availableDays') }}</h3>
                                <ul class="mt-2 space-y-2">
                                    <li v-for="day in availableDays" :key="day.dayOfWeek" class="text-gray-600">
                                        {{ formatDay(day.dayOfWeek) }}: {{ day.startTime }} - {{ day.endTime }}
                                    </li>
                                    <li v-if="availableDays.length === 0" class="text-gray-500">
                                        {{ t('advisors.noAvailabilityInfo') }}
                                    </li>
                                </ul>
                            </div>

                            <div>
                                <h3 class="font-medium text-gray-900">{{ t('advisors.location') }}</h3>
                                <p class="text-gray-600">
                                    {{ formattedAddress }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reviews -->
                <div class="p-6 sm:p-8 border-t border-gray-200">
                    <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('advisors.clientReviews') }}</h2>
                    <div v-if="reviews.length === 0" class="text-gray-600">
                        {{ t('advisors.noReviewsYet') }}
                    </div>
                    <div v-else class="space-y-6">
                        <div v-for="review in reviews" :key="review._id"
                            class="border-b border-gray-200 pb-6 last:border-0">
                            <div class="flex items-start">
                                <div class="flex-1">
                                    <div class="flex items-center">
                                        <div class="flex">
                                            <span v-for="i in 5" :key="i"
                                                :class="i <= review.rating ? 'text-yellow-400' : 'text-gray-300'"
                                                class="text-lg">★</span>
                                        </div>
                                        <span class="ml-2 text-sm text-gray-600">{{ review.rating }}/5</span>
                                    </div>
                                    <p class="mt-1 text-gray-900">{{ review.comment }}</p>
                                    <p class="mt-1 text-sm text-gray-500">
                                        {{ review.client.firstName }} {{ review.client.lastName }} •
                                        {{ formatDate(review.createdAt) }}
                                    </p>
                                </div>
                            </div>
                            <div v-if="review.advisorResponse" class="mt-4 ml-6 p-4 bg-gray-50 rounded-lg">
                                <p class="text-sm text-gray-900">
                                    <span class="font-medium">{{ t('advisors.advisorResponse') }}:</span>
                                    {{ review.advisorResponse.text }}
                                </p>
                                <p class="mt-1 text-xs text-gray-500">
                                    {{ formatDate(review.advisorResponse.respondedAt) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div v-else class="text-center py-8">
            <p class="text-gray-600">{{ t('advisors.advisorNotFound') }}</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { format } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t, locale } = useI18n()
const { api } = useApi()

const advisor = ref(null)
const reviews = ref([])
const loading = ref(true)
const hasUpcomingAppointment = ref(false)

// Locale mapping for date-fns
const localeMap = {
    en: enUS,
    ru: ru,
    uz: enUS // Uzbek fallback to English
}

const availableDays = computed(() => {
    if (!advisor.value?.availability) return []
    return advisor.value.availability.filter(day => day.isAvailable)
})

// Computed property for decoded bio
const decodedBio = computed(() => {
    if (!advisor.value?.bio) return t('advisors.noBioProvided')

    // Create a temporary DOM element to decode HTML entities
    const textarea = document.createElement('textarea')
    textarea.innerHTML = advisor.value.bio
    return textarea.value
})

// Computed property for formatted consultation fee
const formatConsultationFee = computed(() => {
    const fee = advisor.value?.consultationFee

    if (!fee) return t('advisors.feeNotSpecified')

    // If fee is an object with amount property
    if (typeof fee === 'object' && fee !== null && 'amount' in fee) {
        return `${new Intl.NumberFormat('uz-UZ').format(fee)} ${fee.currency || 'UZS'}`
    }
    // If it's just a number
    else if (typeof fee === 'number') {
        return `${new Intl.NumberFormat('uz-UZ').format(fee)} UZS`
    }

    return t('advisors.feeNotSpecified')
})

// Computed property for formatted address
const formattedAddress = computed(() => {
    const address = advisor.value?.address

    if (!address) return t('advisors.addressNotProvided')

    const parts = []
    if (address.street) parts.push(address.street)
    if (address.city) parts.push(address.city)
    if (address.state) parts.push(address.state)
    if (address.zipCode) parts.push(address.zipCode)
    if (address.country) parts.push(address.country)

    return parts.length > 0 ? parts.join(', ') : t('advisors.addressNotProvided')
})

const formatDay = (dayOfWeek) => {
    const days = [
        t('advisors.days.sunday'),
        t('advisors.days.monday'),
        t('advisors.days.tuesday'),
        t('advisors.days.wednesday'),
        t('advisors.days.thursday'),
        t('advisors.days.friday'),
        t('advisors.days.saturday')
    ]
    return days[dayOfWeek]
}

const formatDate = (date) => {
    if (!date) return ''
    const currentLocale = localeMap[locale.value] || enUS
    return format(new Date(date), 'MMM d, yyyy', { locale: currentLocale })
}

async function fetchAdvisorProfile() {
    try {
        loading.value = true
        const response = await api.get(`/users/advisors/${route.params.id}`)
        advisor.value = response.data.advisor

        // Fetch reviews
        try {
            const reviewsResponse = await api.get(`/reviews/advisor/${route.params.id}`)
            reviews.value = reviewsResponse.data.reviews
        } catch (reviewError) {
            console.error('Error fetching reviews:', reviewError)
            reviews.value = []
        }
    } catch (error) {
        console.error('Error fetching advisor profile:', error)
    } finally {
        loading.value = false
    }
}

async function checkUpcomingAppointments() {
    if (!authStore.isAuthenticated || !authStore.isClient) return

    try {
        const response = await api.get(`/appointments/client/${authStore.user._id}`, {
            params: { status: 'scheduled', advisorId: advisor.value._id }
        })
        hasUpcomingAppointment.value = response.data.appointments.length > 0
    } catch (error) {
        console.error('Error checking appointments:', error)
    }
}

async function startChat() {
    try {
        const response = await api.post('/chat/conversations', {
            participantId: advisor.value._id
        })

        router.push({
            name: 'chat-conversation',
            params: { id: response.data.conversation._id }
        })
    } catch (error) {
        console.error('Error starting chat:', error)
    }
}

onMounted(() => {
    fetchAdvisorProfile()
    checkUpcomingAppointments()
})
</script>