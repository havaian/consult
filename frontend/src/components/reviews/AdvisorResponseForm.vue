<template>
    <div class="space-y-6">
        <!-- Reviews List -->
        <div v-if="loading" class="text-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">{{ t('reviews.loading') }}</p>
        </div>

        <div v-else-if="reviews.length === 0" class="text-center py-8">
            <svg class="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.458L3 21l2.542-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
            </svg>
            <p class="text-gray-600">{{ t('reviews.noReviews') }}</p>
        </div>

        <div v-else class="space-y-6">
            <div v-for="review in reviews" :key="review._id"
                class="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
                <!-- Review Header -->
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center">
                        <img :src="review.client.profilePicture || '/images/user-placeholder.jpg'"
                            :alt="`${review.client.firstName} ${review.client.lastName}`"
                            class="w-10 h-10 rounded-full mr-3 object-cover">
                        <div>
                            <h4 class="font-medium text-gray-900">
                                {{ review.client.firstName }} {{ review.client.lastName }}
                            </h4>
                            <div class="flex items-center mt-1">
                                <div class="flex items-center">
                                    <svg v-for="star in getStarRating(review.rating)" :key="star" class="w-4 h-4"
                                        :class="star === 'full' ? 'text-yellow-400' : star === 'half' ? 'text-yellow-400' : 'text-gray-300'"
                                        fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </div>
                                <span class="ml-2 text-sm text-gray-600">{{ review.rating }}/5</span>
                            </div>
                        </div>
                    </div>
                    <span class="text-sm text-gray-500">{{ formatDate(review.createdAt) }}</span>
                </div>

                <!-- Review Content -->
                <div class="mb-4">
                    <p class="text-gray-900 leading-relaxed">{{ review.comment }}</p>

                    <!-- Category Ratings -->
                    <div v-if="review.communicationRating || review.professionalismRating || review.satisfactionRating"
                        class="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                        <span v-if="review.communicationRating" class="flex items-center">
                            <span class="mr-1">{{ t('reviews.communication') }}:</span>
                            <div class="flex items-center">
                                <svg v-for="i in 5" :key="i" class="w-3 h-3"
                                    :class="i <= review.communicationRating ? 'text-yellow-400' : 'text-gray-300'"
                                    fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                        </span>
                        <span v-if="review.professionalismRating" class="flex items-center">
                            <span class="mr-1">{{ t('reviews.professionalism') }}:</span>
                            <div class="flex items-center">
                                <svg v-for="i in 5" :key="i" class="w-3 h-3"
                                    :class="i <= review.professionalismRating ? 'text-yellow-400' : 'text-gray-300'"
                                    fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                        </span>
                        <span v-if="review.satisfactionRating" class="flex items-center">
                            <span class="mr-1">{{ t('reviews.satisfaction') }}:</span>
                            <div class="flex items-center">
                                <svg v-for="i in 5" :key="i" class="w-3 h-3"
                                    :class="i <= review.satisfactionRating ? 'text-yellow-400' : 'text-gray-300'"
                                    fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                        </span>
                    </div>
                </div>

                <!-- Existing Response or Response Form -->
                <div v-if="review.advisorResponse" class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                    <div class="flex items-start justify-between mb-2">
                        <h5 class="font-medium text-blue-900">{{ t('reviews.response.yourResponse') }}</h5>
                        <div class="flex items-center space-x-2">
                            <button @click="startEditingResponse(review)"
                                class="text-blue-600 hover:text-blue-800 text-sm">
                                {{ t('reviews.response.edit') }}
                            </button>
                            <button @click="confirmDeleteResponse(review)"
                                class="text-red-600 hover:text-red-800 text-sm">
                                {{ t('reviews.response.delete') }}
                            </button>
                        </div>
                    </div>
                    <p class="text-blue-800 mb-2">{{ review.advisorResponse.text }}</p>
                    <p class="text-xs text-blue-600">
                        {{ t('reviews.response.respondedAt') }} {{ formatDate(review.advisorResponse.respondedAt) }}
                    </p>
                </div>

                <!-- Response Form -->
                <div v-else-if="!respondingToReview || respondingToReview._id !== review._id"
                    class="border-t border-gray-200 pt-4">
                    <button @click="startResponding(review)"
                        class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        {{ t('reviews.response.addResponse') }}
                    </button>
                </div>

                <!-- Active Response Form -->
                <div v-else class="border-t border-gray-200 pt-4">
                    <form @submit.prevent="submitResponse(review)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                {{ t('reviews.response.yourResponse') }}
                            </label>
                            <textarea v-model="responseText" rows="3"
                                class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                :placeholder="t('reviews.response.placeholder')" :maxlength="500" required></textarea>
                            <p class="mt-1 text-sm text-gray-500">
                                {{ responseText.length }}/500 {{ t('reviews.form.characters') }}
                            </p>
                        </div>

                        <div v-if="responseError" class="bg-red-50 border border-red-200 rounded-md p-3">
                            <p class="text-sm text-red-700">{{ responseError }}</p>
                        </div>

                        <div class="flex justify-end space-x-3">
                            <button type="button" @click="cancelResponse"
                                class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                                {{ t('common.cancel') }}
                            </button>
                            <button type="submit" :disabled="responseLoading || !responseText.trim()"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
                                {{ responseLoading ? t('reviews.response.submitting') : t('reviews.response.submit') }}
                            </button>
                        </div>
                    </form>
                </div>

                <!-- Edit Response Form -->
                <div v-if="editingResponse && editingResponse._id === review._id"
                    class="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400 mt-4">
                    <form @submit.prevent="updateResponse(review)" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-blue-900 mb-2">
                                {{ t('reviews.response.editResponse') }}
                            </label>
                            <textarea v-model="editResponseText" rows="3"
                                class="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                :maxlength="500" required></textarea>
                            <p class="mt-1 text-sm text-blue-600">
                                {{ editResponseText.length }}/500 {{ t('reviews.form.characters') }}
                            </p>
                        </div>

                        <div v-if="responseError" class="bg-red-50 border border-red-200 rounded-md p-3">
                            <p class="text-sm text-red-700">{{ responseError }}</p>
                        </div>

                        <div class="flex justify-end space-x-3">
                            <button type="button" @click="cancelEditResponse"
                                class="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50">
                                {{ t('common.cancel') }}
                            </button>
                            <button type="submit" :disabled="responseLoading || !editResponseText.trim()"
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50">
                                {{ responseLoading ? t('reviews.response.updating') : t('reviews.response.update') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMoreReviews" class="text-center">
            <button @click="loadMoreReviews" :disabled="loading" class="btn-secondary">
                {{ loading ? t('reviews.loading') : t('reviews.loadMore') }}
            </button>
        </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirmation"
        class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
            <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">{{ t('reviews.response.deleteConfirmation') }}</h3>
                <p class="text-sm text-gray-600 mb-6">{{ t('reviews.response.deleteWarning') }}</p>
                <div class="flex justify-end space-x-3">
                    <button @click="showDeleteConfirmation = false" class="btn-secondary">
                        {{ t('common.cancel') }}
                    </button>
                    <button @click="deleteResponse" class="btn-danger">
                        {{ t('common.delete') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useReviews } from '@/composables/useReviews'
import { useAuthStore } from '@/stores/auth'
import { format } from 'date-fns'

const { t } = useI18n()
const authStore = useAuthStore()
const {
    reviews,
    loading,
    error,
    getAdvisorReviews,
    addAdvisorResponse,
    updateAdvisorResponse,
    deleteAdvisorResponse,
    getStarRating
} = useReviews()

const props = defineProps({
    advisorId: {
        type: String,
        required: true
    }
})

// Component state
const respondingToReview = ref(null)
const responseText = ref('')
const responseLoading = ref(false)
const responseError = ref('')
const editingResponse = ref(null)
const editResponseText = ref('')
const showDeleteConfirmation = ref(false)
const reviewToDelete = ref(null)
const currentPage = ref(1)
const hasMoreReviews = ref(false)

// Load reviews on mount
onMounted(async () => {
    await loadReviews()
})

// Methods
const loadReviews = async () => {
    try {
        currentPage.value = 1
        const response = await getAdvisorReviews(props.advisorId, {
            page: currentPage.value,
            limit: 10,
            sort: 'newest'
        })
        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (err) {
        console.error('Error loading reviews:', err)
    }
}

const loadMoreReviews = async () => {
    if (!hasMoreReviews.value) return

    try {
        currentPage.value += 1
        const response = await getAdvisorReviews(props.advisorId, {
            page: currentPage.value,
            limit: 10,
            sort: 'newest'
        })

        // Append new reviews to existing ones
        reviews.value.push(...response.reviews)
        hasMoreReviews.value = response.pagination.pages > currentPage.value
    } catch (err) {
        console.error('Error loading more reviews:', err)
    }
}

const startResponding = (review) => {
    respondingToReview.value = review
    responseText.value = ''
    responseError.value = ''
}

const cancelResponse = () => {
    respondingToReview.value = null
    responseText.value = ''
    responseError.value = ''
}

const submitResponse = async (review) => {
    if (!responseText.value.trim()) return

    try {
        responseLoading.value = true
        responseError.value = ''

        await addAdvisorResponse(review._id, responseText.value.trim())

        // Reset form
        respondingToReview.value = null
        responseText.value = ''

        // Show success message
        // You might want to add a toast notification here

    } catch (err) {
        responseError.value = err.response?.data?.message || t('reviews.response.submitError')
    } finally {
        responseLoading.value = false
    }
}

const startEditingResponse = (review) => {
    editingResponse.value = review
    editResponseText.value = review.advisorResponse.text
    responseError.value = ''
}

const cancelEditResponse = () => {
    editingResponse.value = null
    editResponseText.value = ''
    responseError.value = ''
}

const updateResponse = async (review) => {
    if (!editResponseText.value.trim()) return

    try {
        responseLoading.value = true
        responseError.value = ''

        await updateAdvisorResponse(review._id, editResponseText.value.trim())

        // Reset form
        editingResponse.value = null
        editResponseText.value = ''

    } catch (err) {
        responseError.value = err.response?.data?.message || t('reviews.response.updateError')
    } finally {
        responseLoading.value = false
    }
}

const confirmDeleteResponse = (review) => {
    reviewToDelete.value = review
    showDeleteConfirmation.value = true
}

const deleteResponse = async () => {
    if (!reviewToDelete.value) return

    try {
        await deleteAdvisorResponse(reviewToDelete.value._id)

        // Close modal
        showDeleteConfirmation.value = false
        reviewToDelete.value = null

    } catch (err) {
        responseError.value = err.response?.data?.message || t('reviews.response.deleteError')
        showDeleteConfirmation.value = false
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
</script>

<style scoped>
.btn-secondary {
    @apply px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500;
}

.btn-danger {
    @apply px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500;
}
</style>