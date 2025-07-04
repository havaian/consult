<template>
    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
            <div v-if="advisor" class="flex items-center">
                <img :src="advisor.profilePicture || '/images/user-placeholder.jpg'"
                    :alt="`${advisor.firstName} ${advisor.lastName}`" class="w-16 h-16 rounded-full mr-4 object-cover">
                <div>
                    <h1 class="text-3xl font-bold text-gray-900">
                        {{ t('reviews.reviewsFor') }} {{ advisor.firstName }} {{ advisor.lastName }}
                    </h1>
                    <div class="flex items-center mt-2">
                        <div class="flex">
                            <svg v-for="star in getStarRating(parseFloat(averageRating))" :key="star" class="w-5 h-5"
                                :class="star === 'full' ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor"
                                viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <span class="ml-2 text-gray-900 font-medium">{{ averageRating }}</span>
                        <span class="ml-2 text-gray-600">({{ totalReviews }} {{ t('reviews.reviews') }})</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review Statistics -->
        <div v-if="reviewStats" class="mb-8 bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ t('reviews.reviewBreakdown') }}</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                <div>
                    <div class="text-3xl font-bold text-gray-900">{{ averageRating }}</div>
                    <div class="text-sm text-gray-600">{{ t('reviews.stats.overall') }}</div>
                    <div class="flex justify-center mt-1">
                        <svg v-for="star in getStarRating(parseFloat(averageRating))" :key="star" class="w-4 h-4"
                            :class="star === 'full' ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                </div>
                <div v-if="reviewStats.communicationRating">
                    <div class="text-2xl font-bold text-blue-600">{{ formatRating(reviewStats.communicationRating) }}
                    </div>
                    <div class="text-sm text-gray-600">{{ t('reviews.stats.communication') }}</div>
                </div>
                <div v-if="reviewStats.professionalismRating">
                    <div class="text-2xl font-bold text-green-600">{{ formatRating(reviewStats.professionalismRating) }}
                    </div>
                    <div class="text-sm text-gray-600">{{ t('reviews.stats.professionalism') }}</div>
                </div>
                <div v-if="reviewStats.satisfactionRating">
                    <div class="text-2xl font-bold text-purple-600">{{ formatRating(reviewStats.satisfactionRating) }}
                    </div>
                    <div class="text-sm text-gray-600">{{ t('reviews.stats.satisfaction') }}</div>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-lg shadow p-6 mb-8">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div class="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reviews.filters.sortBy')
                            }}</label>
                        <select v-model="sortBy" @change="loadReviews" class="input-sm">
                            <option value="newest">{{ t('reviews.sort.newest') }}</option>
                            <option value="oldest">{{ t('reviews.sort.oldest') }}</option>
                            <option value="rating-high">{{ t('reviews.sort.ratingHigh') }}</option>
                            <option value="rating-low">{{ t('reviews.sort.ratingLow') }}</option>
                        </select>
                    </div>

                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('reviews.filters.rating')
                            }}</label>
                        <select v-model="filterRating" @change="loadReviews" class="input-sm">
                            <option value="">{{ t('reviews.filters.allRatings') }}</option>
                            <option value="5">5 {{ t('reviews.stars') }}</option>
                            <option value="4">4 {{ t('reviews.stars') }}</option>
                            <option value="3">3 {{ t('reviews.stars') }}</option>
                            <option value="2">2 {{ t('reviews.stars') }}</option>
                            <option value="1">1 {{ t('reviews.star') }}</option>
                        </select>
                    </div>
                </div>

                <div class="flex items-center space-x-2">
                    <span class="text-sm text-gray-600">
                        {{ t('reviews.showingResults', { count: reviews.length, total: totalReviews }) }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="text-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ t('reviews.loading') }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="reviews.length === 0" class="text-center py-12">
            <svg class="w-24 h-24 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.458L3 21l2.542-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">{{ t('reviews.noReviewsYet') }}</h3>
            <p class="text-gray-600">{{ t('reviews.noReviewsForAdvisor') }}</p>
        </div>

        <!-- Reviews List -->
        <div v-else class="space-y-6">
            <div v-for="review in reviews" :key="review._id"
                class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <!-- Review Header -->
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img :src="review.client.profilePicture || '/images/user-placeholder.jpg'"
                                :alt="`${review.client.firstName} ${review.client.lastName}`"
                                class="w-12 h-12 rounded-full mr-4 object-cover">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">
                                    {{ review.client.firstName }} {{ review.client.lastName }}
                                </h3>
                                <div class="flex items-center mt-1">
                                    <div class="flex">
                                        <svg v-for="star in getStarRating(review.rating)" :key="star" class="w-4 h-4"
                                            :class="star === 'full' ? 'text-yellow-400' : 'text-gray-300'"
                                            fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <span class="ml-2 text-sm font-medium text-gray-900">{{ review.rating }}/5</span>
                                </div>
                            </div>
                        </div>
                        <span class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</span>
                    </div>
                </div>

                <!-- Review Content -->
                <div class="p-6">
                    <p class="text-gray-900 leading-relaxed mb-4">{{ review.comment }}</p>

                    <!-- Category Ratings -->
                    <div v-if="review.communicationRating || review.professionalismRating || review.satisfactionRating"
                        class="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div v-if="review.communicationRating"
                            class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <span class="text-sm font-medium text-blue-900">{{ t('reviews.communication') }}</span>
                            <div class="flex items-center">
                                <svg v-for="i in 5" :key="i" class="w-4 h-4"
                                    :class="i <= review.communicationRating ? 'text-blue-500' : 'text-gray-300'"
                                    fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="ml-1 text-sm font-medium text-blue-900">{{ review.communicationRating
                                    }}</span>
                            </div>
                        </div>

                        <div v-if="review.professionalismRating"
                            class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <span class="text-sm font-medium text-green-900">{{ t('reviews.professionalism') }}</span>
                            <div class="flex items-center">
                                <svg v-for="i in 5" :key="i" class="w-4 h-4"
                                    :class="i <= review.professionalismRating ? 'text-green-500' : 'text-gray-300'"
                                    fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="ml-1 text-sm font-medium text-green-900">{{ review.professionalismRating
                                    }}</span>
                            </div>
                        </div>

                        <div v-if="review.satisfactionRating"
                            class="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                            <span class="text-sm font-medium text-purple-900">{{ t('reviews.satisfaction') }}</span>
                            <div class="flex items-center">
                                <svg v-for="i in 5" :key="i" class="w-4 h-4"
                                    :class="i <= review.satisfactionRating ? 'text-purple-500' : 'text-gray-300'"
                                    fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span class="ml-1 text-sm font-medium text-purple-900">{{ review.satisfactionRating
                                    }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Advisor Response -->
                    <div v-if="review.advisorResponse" class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <div class="flex items-start">
                            <img :src="advisor?.profilePicture || '/images/user-placeholder.jpg'"
                                :alt="`${advisor?.firstName} ${advisor?.lastName}`"
                                class="w-8 h-8 rounded-full mr-3 object-cover">
                            <div class="flex-1">
                                <p class="text-sm text-blue-900">
                                    <span class="font-medium">{{ advisor?.firstName }} {{ advisor?.lastName }}:</span>
                                    {{ review.advisorResponse.text }}
                                </p>
                                <p class="text-xs text-blue-600 mt-1">
                                    {{ formatDate(review.advisorResponse.respondedAt) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMoreReviews" class="text-center mt-8">
            <button @click="loadMoreReviews" :disabled="loading" class="btn-secondary">
                {{ loading ? t('reviews.loading') : t('reviews.loadMore') }}
            </button>
        </div>

        <!-- Back to Advisor Button -->
        <div class="mt-8 text-center">
            <router-link :to="{ name: 'advisor-profile-view', params: { id: advisorId } }" class="btn-primary">
                {{ t('reviews.backToAdvisor') }}
            </router-link>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { useReviews } from '@/composables/useReviews'
import { format } from 'date-fns'

const route = useRoute()
const { t } = useI18n()
const { api } = useApi()
const {
    reviews,
    reviewStats,
    loading,
    getAdvisorReviews,
    getAdvisorStats,
    formatRating,
    getStarRating,
    averageRating,
    totalReviews
} = useReviews()

const props = defineProps({
    advisorId: {
        type: String,
        required: true
    }
})

// Component state
const advisor = ref(null)
const sortBy = ref('newest')
const filterRating = ref('')
const currentPage = ref(1)
const hasMoreReviews = ref(false)

// Get advisor ID from props or route
const advisorId = computed(() => props.advisorId || route.params.advisorId)

// Methods
const loadAdvisor = async () => {
    try {
        const response = await api.get(`/users/advisors/${advisorId.value}`)
        advisor.value = response.data.advisor
    } catch (error) {
        console.error('Error loading advisor:', error)
    }
}

const loadReviews = async () => {
    try {
        currentPage.value = 1
        const options = {
            page: currentPage.value,
            limit: 10,
            sort: sortBy.value
        }

        const response = await getAdvisorReviews(advisorId.value, options)
        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (err) {
        console.error('Error loading reviews:', err)
    }
}

const loadMoreReviews = async () => {
    if (!hasMoreReviews.value) return

    try {
        currentPage.value += 1
        const options = {
            page: currentPage.value,
            limit: 10,
            sort: sortBy.value
        }

        const response = await getAdvisorReviews(advisorId.value, options)
        reviews.value.push(...response.reviews)
        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (err) {
        console.error('Error loading more reviews:', err)
    }
}

const loadReviewStats = async () => {
    try {
        await getAdvisorStats(advisorId.value)
    } catch (error) {
        console.error('Error loading review stats:', error)
    }
}

const formatDate = (date) => {
    if (!date) return ''
    try {
        return format(new Date(date), 'MMM d, yyyy')
    } catch (error) {
        return date
    }
}

onMounted(async () => {
    await Promise.all([
        loadAdvisor(),
        loadReviews(),
        loadReviewStats()
    ])
})
</script>

<style scoped>
.input-sm {
    @apply px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500;
}

.btn-primary {
    @apply px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-secondary {
    @apply px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}
</style>