<template>
    <div class="max-w-4xl mx-auto px-4 py-8">
        <template v-if="!loading && advisor">
            <div class="bg-white shadow-lg rounded-lg overflow-hidden">
                <!-- Header -->
                <div class="p-6 sm:p-8 bg-gradient-to-r from-blue-600 to-purple-600">
                    <div class="flex flex-col md:flex-row items-center">
                        <div class="flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                            <img :src="advisor.profilePicture || '/images/user-placeholder.jpg'"
                                :alt="`${advisor.firstName} ${advisor.lastName}`"
                                class="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover">
                        </div>
                        <div class="text-center md:text-left text-white">
                            <h1 class="text-3xl font-bold">{{ advisor.firstName }} {{ advisor.lastName }}</h1>
                            <div class="mt-2 flex flex-wrap justify-center md:justify-start gap-2">
                                <span v-for="spec in advisor.specializations" :key="spec"
                                    class="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                                    {{ spec }}
                                </span>
                            </div>
                            <div class="mt-4 flex items-center justify-center md:justify-start">
                                <div class="flex items-center">
                                    <svg v-for="star in getStarRating(parseFloat(averageRating))" :key="star"
                                        class="w-5 h-5"
                                        :class="star === 'full' ? 'text-yellow-400' : star === 'half' ? 'text-yellow-400' : 'text-gray-300'"
                                        fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <span class="ml-2 text-white">{{ averageRating }} ({{ totalReviews }} {{
                                    t('advisors.reviews') }})</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="p-6 sm:p-8">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <!-- Main Info -->
                        <div class="lg:col-span-2 space-y-6">
                            <div>
                                <h2 class="text-xl font-semibold text-gray-900 mb-3">{{ t('advisors.about') }}</h2>
                                <p class="text-gray-700 leading-relaxed">{{ decodedBio }}</p>
                            </div>

                            <div v-if="advisor.qualifications && advisor.qualifications.length > 0">
                                <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ t('advisors.qualifications') }}
                                </h3>
                                <ul class="space-y-2">
                                    <li v-for="qualification in advisor.qualifications" :key="qualification._id"
                                        class="flex items-start">
                                        <svg class="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor"
                                            viewBox="0 0 20 20">
                                            <path fill-rule="evenodd"
                                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                clip-rule="evenodd" />
                                        </svg>
                                        <span class="text-gray-700">{{ qualification.degree }} - {{
                                            qualification.institution
                                            }} ({{ qualification.year }})</span>
                                    </li>
                                </ul>
                            </div>

                            <div v-if="advisor.experience && advisor.experience.length > 0">
                                <h3 class="text-lg font-semibold text-gray-900 mb-3">{{ t('advisors.experience') }}</h3>
                                <div class="space-y-3">
                                    <div v-for="exp in advisor.experience" :key="exp._id"
                                        class="border-l-4 border-blue-500 pl-4">
                                        <h4 class="font-medium text-gray-900">{{ exp.position }}</h4>
                                        <p class="text-gray-600">{{ exp.company }}</p>
                                        <p class="text-sm text-gray-500">{{ exp.startYear }} - {{ exp.endYear ||
                                            'Present' }}</p>
                                        <p v-if="exp.description" class="text-gray-700 mt-1">{{ exp.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sidebar -->
                        <div class="space-y-6">
                            <div class="bg-gray-50 rounded-lg p-6">
                                <h3 class="font-semibold text-gray-900 mb-4">{{ t('advisors.consultationInfo') }}</h3>
                                <div class="space-y-3">
                                    <div>
                                        <p class="text-sm text-gray-600">{{ t('advisors.consultationFee') }}</p>
                                        <p class="text-lg font-semibold text-gray-900">{{ formatConsultationFee }}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">{{ t('advisors.languages') }}</p>
                                        <p class="text-gray-900">{{ advisor.languages?.join(', ') ||
                                            t('advisors.notSpecified') }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-gray-50 rounded-lg p-6">
                                <h3 class="font-semibold text-gray-900 mb-4">{{ t('advisors.availability') }}</h3>
                                <div class="space-y-3">
                                    <div>
                                        <h4 class="font-medium text-gray-900">{{ t('advisors.availableDays') }}</h4>
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
                                        <h4 class="font-medium text-gray-900">{{ t('advisors.location') }}</h4>
                                        <p class="text-gray-600">{{ formattedAddress }}</p>
                                    </div>
                                </div>
                            </div>

                            <!-- Book Appointment Button -->
                            <div v-if="authStore.user && authStore.user.role === 'client' && !hasUpcomingAppointment">
                                <router-link :to="{ name: 'book-appointment', params: { advisorId: advisor._id } }"
                                    class="w-full btn-primary text-center block">
                                    {{ t('advisors.bookAppointment') }}
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Reviews Section -->
                <div class="p-6 sm:p-8 border-t border-gray-200">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-xl font-semibold text-gray-900">{{ t('advisors.clientReviews') }}</h2>
                        <div v-if="totalReviews > 0" class="flex items-center space-x-4">
                            <select v-model="reviewSort" @change="loadReviews" class="input-sm">
                                <option value="newest">{{ t('reviews.sort.newest') }}</option>
                                <option value="oldest">{{ t('reviews.sort.oldest') }}</option>
                                <option value="rating-high">{{ t('reviews.sort.ratingHigh') }}</option>
                                <option value="rating-low">{{ t('reviews.sort.ratingLow') }}</option>
                            </select>
                        </div>
                    </div>

                    <!-- Review Statistics -->
                    <div v-if="reviewStats" class="mb-6 bg-gray-50 rounded-lg p-4">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <div class="text-2xl font-bold text-gray-900">{{ averageRating }}</div>
                                <div class="text-sm text-gray-600">{{ t('reviews.stats.overall') }}</div>
                            </div>
                            <div v-if="reviewStats.communicationRating">
                                <div class="text-2xl font-bold text-gray-900">{{
                                    formatRating(reviewStats.communicationRating) }}</div>
                                <div class="text-sm text-gray-600">{{ t('reviews.stats.communication') }}</div>
                            </div>
                            <div v-if="reviewStats.professionalismRating">
                                <div class="text-2xl font-bold text-gray-900">{{
                                    formatRating(reviewStats.professionalismRating) }}</div>
                                <div class="text-sm text-gray-600">{{ t('reviews.stats.professionalism') }}</div>
                            </div>
                            <div v-if="reviewStats.satisfactionRating">
                                <div class="text-2xl font-bold text-gray-900">{{
                                    formatRating(reviewStats.satisfactionRating) }}</div>
                                <div class="text-sm text-gray-600">{{ t('reviews.stats.satisfaction') }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Reviews List -->
                    <div v-if="reviewsLoading" class="text-center py-8">
                        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p class="mt-4 text-gray-600">{{ t('reviews.loading') }}</p>
                    </div>

                    <div v-else-if="reviews.length === 0" class="text-center py-8">
                        <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor"
                            viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.458L3 21l2.542-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                        <p class="text-gray-600">{{ t('advisors.noReviewsYet') }}</p>
                    </div>

                    <div v-else class="space-y-6">
                        <div v-for="review in reviews" :key="review._id"
                            class="border-b border-gray-200 pb-6 last:border-0">
                            <div class="flex items-start">
                                <div class="flex-shrink-0 mr-4">
                                    <img :src="review.client.profilePicture || '/images/user-placeholder.jpg'"
                                        :alt="`${review.client.firstName} ${review.client.lastName}`"
                                        class="w-10 h-10 rounded-full object-cover">
                                </div>
                                <div class="flex-1">
                                    <div class="flex items-center justify-between">
                                        <div class="flex items-center">
                                            <div class="flex">
                                                <svg v-for="star in getStarRating(review.rating)" :key="star"
                                                    class="w-4 h-4"
                                                    :class="star === 'full' ? 'text-yellow-400' : star === 'half' ? 'text-yellow-400' : 'text-gray-300'"
                                                    fill="currentColor" viewBox="0 0 20 20">
                                                    <path
                                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                            </div>
                                            <span class="ml-2 text-sm text-gray-600">{{ review.rating }}/5</span>
                                        </div>
                                        <span class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</span>
                                    </div>
                                    <p class="mt-2 text-gray-900">{{ review.comment }}</p>
                                    <p class="mt-1 text-sm text-gray-600">
                                        {{ review.client.firstName }} {{ review.client.lastName }}
                                    </p>

                                    <!-- Category Ratings -->
                                    <div v-if="review.communicationRating || review.professionalismRating || review.satisfactionRating"
                                        class="mt-3 flex flex-wrap gap-4 text-xs text-gray-500">
                                        <span v-if="review.communicationRating">
                                            {{ t('reviews.communication') }}: {{ review.communicationRating }}/5
                                        </span>
                                        <span v-if="review.professionalismRating">
                                            {{ t('reviews.professionalism') }}: {{ review.professionalismRating }}/5
                                        </span>
                                        <span v-if="review.satisfactionRating">
                                            {{ t('reviews.satisfaction') }}: {{ review.satisfactionRating }}/5
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <!-- Advisor Response -->
                            <div v-if="review.advisorResponse" class="mt-4 ml-14 p-4 bg-blue-50 rounded-lg">
                                <div class="flex items-start">
                                    <img :src="advisor.profilePicture || '/images/user-placeholder.jpg'"
                                        :alt="`${advisor.firstName} ${advisor.lastName}`"
                                        class="w-8 h-8 rounded-full mr-3 object-cover">
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-900">
                                            <span class="font-medium">{{ advisor.firstName }} {{ advisor.lastName
                                                }}:</span>
                                            {{ review.advisorResponse.text }}
                                        </p>
                                        <p class="mt-1 text-xs text-gray-500">
                                            {{ formatDate(review.advisorResponse.respondedAt) }}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Load More Button -->
                        <div v-if="hasMoreReviews" class="text-center pt-6">
                            <button @click="loadMoreReviews" :disabled="reviewsLoading" class="btn-secondary">
                                {{ reviewsLoading ? t('reviews.loading') : t('reviews.loadMore') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </template>

        <div v-else-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ t('common.loading') }}</p>
        </div>

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
import { useReviews } from '@/composables/useReviews'
import { format } from 'date-fns'
import { enUS, ru } from 'date-fns/locale'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t, locale } = useI18n()
const { api } = useApi()
const {
    reviews,
    reviewStats,
    loading: reviewsLoading,
    getAdvisorReviews,
    getAdvisorStats,
    formatRating,
    getStarRating,
    averageRating,
    totalReviews
} = useReviews()

const advisor = ref(null)
const loading = ref(true)
const hasUpcomingAppointment = ref(false)
const reviewSort = ref('newest')
const currentPage = ref(1)
const hasMoreReviews = ref(false)

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
        return `${new Intl.NumberFormat('uz-UZ').format(fee.amount)} ${fee.currency || 'UZS'}`
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
    return days[dayOfWeek] || `Day ${dayOfWeek}`
}

const formatDate = (date) => {
    if (!date) return ''
    try {
        return format(new Date(date), 'MMM d, yyyy', {
            locale: localeMap[locale.value] || enUS
        })
    } catch (error) {
        return date
    }
}

async function fetchAdvisor() {
    try {
        loading.value = true
        const response = await api.get(`/users/advisors/${route.params.id}`)
        advisor.value = response.data.advisor

        // Check if current user has upcoming appointment with this advisor
        if (authStore.user && authStore.user.role === 'client') {
            await checkUpcomingAppointment()
        }
    } catch (error) {
        console.error('Error fetching advisor:', error)
        // Handle 404 or other errors
        if (error.response?.status === 404) {
            // Advisor not found
            advisor.value = null
        }
    } finally {
        loading.value = false
    }
}

async function checkUpcomingAppointment() {
    try {
        const response = await api.get(`/appointments/client/${authStore.user.id}`, {
            params: {
                status: 'scheduled',
                advisorId: route.params.id
            }
        })
        hasUpcomingAppointment.value = response.data.appointments.length > 0
    } catch (error) {
        console.error('Error checking upcoming appointments:', error)
    }
}

async function loadReviews() {
    if (!advisor.value) return

    try {
        currentPage.value = 1
        const response = await getAdvisorReviews(advisor.value._id, {
            page: currentPage.value,
            limit: 10,
            sort: reviewSort.value
        })

        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (error) {
        console.error('Error loading reviews:', error)
    }
}

async function loadMoreReviews() {
    if (!advisor.value || !hasMoreReviews.value) return

    try {
        currentPage.value += 1
        const response = await getAdvisorReviews(advisor.value._id, {
            page: currentPage.value,
            limit: 10,
            sort: reviewSort.value
        })

        // Append new reviews to existing ones
        reviews.value.push(...response.reviews)
        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (error) {
        console.error('Error loading more reviews:', error)
    }
}

async function loadReviewStats() {
    if (!advisor.value) return

    try {
        await getAdvisorStats(advisor.value._id)
    } catch (error) {
        console.error('Error loading review stats:', error)
    }
}

onMounted(async () => {
    await fetchAdvisor()
    if (advisor.value) {
        await Promise.all([
            loadReviews(),
            loadReviewStats()
        ])
    }
})
</script>