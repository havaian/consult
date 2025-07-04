<template>
    <div class="max-w-6xl mx-auto px-4 py-8">
        <!-- Header -->
        <div class="mb-8">
            <h1 class="text-3xl font-bold text-gray-900">{{ t('reviews.myReviews') }}</h1>
            <p class="mt-2 text-gray-600">{{ t('reviews.myReviewsDescription') }}</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.458L3 21l2.542-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">{{ t('reviews.stats.totalReviews') }}</p>
                        <p class="text-2xl font-semibold text-gray-900">{{ totalReviews }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">{{ t('reviews.stats.averageRating') }}</p>
                        <p class="text-2xl font-semibold text-gray-900">{{ averageRating }}</p>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                    <div class="flex-shrink-0">
                        <svg class="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-1l-4 4z" />
                        </svg>
                    </div>
                    <div class="ml-4">
                        <p class="text-sm font-medium text-gray-500">{{ t('reviews.stats.withResponses') }}</p>
                        <p class="text-2xl font-semibold text-gray-900">{{ reviewsWithResponses }}</p>
                    </div>
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
                    <span class="text-sm text-gray-600">{{ t('reviews.showingResults', {
                        count: reviews.length, total:
                        totalReviews }) }}</span>
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
            <p class="text-gray-600 mb-6">{{ t('reviews.noReviewsDescription') }}</p>
            <router-link to="/advisors" class="btn-primary">
                {{ t('reviews.bookConsultation') }}
            </router-link>
        </div>

        <!-- Reviews List -->
        <div v-else class="space-y-6">
            <div v-for="review in reviews" :key="review._id"
                class="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <!-- Review Header -->
                <div class="p-6 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center">
                            <img :src="review.advisor.profilePicture || '/images/user-placeholder.jpg'"
                                :alt="`${review.advisor.firstName} ${review.advisor.lastName}`"
                                class="w-12 h-12 rounded-full mr-4 object-cover">
                            <div>
                                <h3 class="text-lg font-semibold text-gray-900">
                                    {{ review.advisor.firstName }} {{ review.advisor.lastName }}
                                </h3>
                                <div class="flex items-center text-sm text-gray-500">
                                    <span v-if="review.advisor.specializations?.length > 0">
                                        {{ review.advisor.specializations.join(', ') }}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-4">
                            <div class="text-right">
                                <div class="flex items-center">
                                    <div class="flex">
                                        <svg v-for="star in getStarRating(review.rating)" :key="star" class="w-5 h-5"
                                            :class="star === 'full' ? 'text-yellow-400' : star === 'half' ? 'text-yellow-400' : 'text-gray-300'"
                                            fill="currentColor" viewBox="0 0 20 20">
                                            <path
                                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                    <span class="ml-2 text-sm font-medium text-gray-900">{{ review.rating }}/5</span>
                                </div>
                                <p class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</p>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button @click="toggleEdit(review)" v-if="canEditReview(review)"
                                    class="text-blue-600 hover:text-blue-800 text-sm">
                                    {{ t('reviews.edit') }}
                                </button>
                                <button @click="confirmDelete(review)" v-if="canDeleteReview(review)"
                                    class="text-red-600 hover:text-red-800 text-sm">
                                    {{ t('reviews.delete') }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Review Content -->
                <div class="p-6">
                    <!-- Appointment Info -->
                    <div v-if="review.appointment" class="mb-4 p-3 bg-gray-50 rounded-lg">
                        <p class="text-sm text-gray-600">
                            <span class="font-medium">{{ t('reviews.appointment') }}:</span>
                            {{ review.appointment.shortDescription || t('reviews.consultationSession') }}
                        </p>
                        <p class="text-sm text-gray-500">
                            {{ formatDate(review.appointment.dateTime) }}
                        </p>
                    </div>

                    <!-- Edit Form -->
                    <div v-if="editingReview && editingReview._id === review._id" class="mb-4">
                        <ReviewEditForm :review="review" @save="onReviewUpdate" @cancel="cancelEdit" />
                    </div>

                    <!-- Review Text -->
                    <div v-else class="mb-4">
                        <p class="text-gray-900 leading-relaxed">{{ review.comment }}</p>

                        <!-- Category Ratings -->
                        <div v-if="review.communicationRating || review.professionalismRating || review.satisfactionRating"
                            class="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <span class="text-sm font-medium text-green-900">{{ t('reviews.professionalism')
                                    }}</span>
                                <div class="flex items-center">
                                    <svg v-for="i in 5" :key="i" class="w-4 h-4"
                                        :class="i <= review.professionalismRating ? 'text-green-500' : 'text-gray-300'"
                                        fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span class="ml-1 text-sm font-medium text-green-900">{{
                                        review.professionalismRating }}</span>
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
                    </div>

                    <!-- Advisor Response -->
                    <div v-if="review.advisorResponse" class="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                        <div class="flex items-start">
                            <img :src="review.advisor.profilePicture || '/images/user-placeholder.jpg'"
                                :alt="`${review.advisor.firstName} ${review.advisor.lastName}`"
                                class="w-8 h-8 rounded-full mr-3 object-cover">
                            <div class="flex-1">
                                <p class="text-sm text-blue-900">
                                    <span class="font-medium">{{ review.advisor.firstName }} {{ review.advisor.lastName
                                        }}:</span>
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
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
            <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">{{ t('reviews.deleteConfirmation') }}</h3>
                <p class="text-sm text-gray-600 mb-6">{{ t('reviews.deleteWarning') }}</p>
                <div class="flex justify-end space-x-3">
                    <button @click="showDeleteModal = false" class="btn-secondary">
                        {{ t('common.cancel') }}
                    </button>
                    <button @click="deleteReview" class="btn-danger">
                        {{ t('common.delete') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useAuthStore } from '@/stores/auth'
import { useReviews } from '@/composables/useReviews'
import { format } from 'date-fns'
import ReviewEditForm from '@/components/reviews/ReviewEditForm.vue'

const { t } = useI18n()
const authStore = useAuthStore()
const {
    reviews,
    loading,
    error,
    getClientReviews,
    updateReview,
    deleteReview: deleteReviewAPI,
    getStarRating
} = useReviews()

// Component state
const sortBy = ref('newest')
const filterRating = ref('')
const currentPage = ref(1)
const hasMoreReviews = ref(false)
const editingReview = ref(null)
const showDeleteModal = ref(false)
const reviewToDelete = ref(null)

// Computed properties
const totalReviews = computed(() => reviews.value.length)
const averageRating = computed(() => {
    if (reviews.value.length === 0) return '0.0'
    const sum = reviews.value.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.value.length).toFixed(1)
})
const reviewsWithResponses = computed(() => {
    return reviews.value.filter(review => review.advisorResponse?.text).length
})

// Methods
const loadReviews = async () => {
    try {
        currentPage.value = 1
        const options = {
            page: currentPage.value,
            limit: 10
        }

        const response = await getClientReviews(authStore.user.id, options)
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
            limit: 10
        }

        const response = await getClientReviews(authStore.user.id, options)
        reviews.value.push(...response.reviews)
        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (err) {
        console.error('Error loading more reviews:', err)
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

const canEditReview = (review) => {
    // Can edit within 24 hours if no advisor response
    const twentyFourHours = 24 * 60 * 60 * 1000
    const reviewAge = Date.now() - new Date(review.createdAt).getTime()
    return reviewAge < twentyFourHours && !review.advisorResponse?.text
}

const canDeleteReview = (review) => {
    // Can delete if no advisor response
    return !review.advisorResponse?.text
}

const toggleEdit = (review) => {
    editingReview.value = editingReview.value?._id === review._id ? null : review
}

const cancelEdit = () => {
    editingReview.value = null
}

const onReviewUpdate = async (updatedReview) => {
    // Update the review in the list
    const index = reviews.value.findIndex(r => r._id === updatedReview._id)
    if (index !== -1) {
        reviews.value[index] = updatedReview
    }
    editingReview.value = null
}

const confirmDelete = (review) => {
    reviewToDelete.value = review
    showDeleteModal.value = true
}

const deleteReview = async () => {
    if (!reviewToDelete.value) return

    try {
        await deleteReviewAPI(reviewToDelete.value._id)
        // Remove from local array
        reviews.value = reviews.value.filter(r => r._id !== reviewToDelete.value._id)
        showDeleteModal.value = false
        reviewToDelete.value = null
    } catch (err) {
        console.error('Error deleting review:', err)
        // You might want to show an error toast here
    }
}

onMounted(async () => {
    await loadReviews()
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

.btn-danger {
    @apply px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
}
</style>