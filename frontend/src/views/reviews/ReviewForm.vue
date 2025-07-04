<template>
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ t('reviews.form.title') }}</h3>

        <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Overall Rating -->
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    {{ t('reviews.form.overallRating') }} <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center space-x-1">
                    <button v-for="i in 5" :key="i" type="button"
                        class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded" @click="rating = i">
                        <svg class="h-8 w-8 transition-colors"
                            :class="i <= rating ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                </div>
                <p v-if="rating > 0" class="text-sm text-gray-600 mt-1">
                    {{ getRatingLabel(rating) }}
                </p>
            </div>

            <!-- Category Ratings -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Communication Rating -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t('reviews.form.communication') }}
                    </label>
                    <div class="flex items-center space-x-1">
                        <button v-for="i in 5" :key="i" type="button"
                            class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            @click="communicationRating = i">
                            <svg class="h-5 w-5 transition-colors"
                                :class="i <= communicationRating ? 'text-yellow-400' : 'text-gray-300'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Professionalism Rating -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t('reviews.form.professionalism') }}
                    </label>
                    <div class="flex items-center space-x-1">
                        <button v-for="i in 5" :key="i" type="button"
                            class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            @click="professionalismRating = i">
                            <svg class="h-5 w-5 transition-colors"
                                :class="i <= professionalismRating ? 'text-yellow-400' : 'text-gray-300'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Satisfaction Rating -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        {{ t('reviews.form.satisfaction') }}
                    </label>
                    <div class="flex items-center space-x-1">
                        <button v-for="i in 5" :key="i" type="button"
                            class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            @click="satisfactionRating = i">
                            <svg class="h-5 w-5 transition-colors"
                                :class="i <= satisfactionRating ? 'text-yellow-400' : 'text-gray-300'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Review Comment -->
            <div>
                <label for="comment" class="block text-sm font-medium text-gray-700 mb-2">
                    {{ t('reviews.form.yourReview') }} <span class="text-red-500">*</span>
                </label>
                <textarea id="comment" v-model="comment" rows="4"
                    class="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    :placeholder="t('reviews.form.placeholder')" :maxlength="1000" required></textarea>
                <p class="mt-1 text-sm text-gray-500">
                    {{ comment.length }}/1000 {{ t('reviews.form.characters') }}
                </p>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
                <div class="flex">
                    <svg class="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-red-800">{{ t('reviews.form.error') }}</h3>
                        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
                    </div>
                </div>
            </div>

            <!-- Success Message -->
            <div v-if="success" class="bg-green-50 border border-green-200 rounded-md p-3">
                <div class="flex">
                    <svg class="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clip-rule="evenodd" />
                    </svg>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">{{ success }}</p>
                    </div>
                </div>
            </div>

            <!-- Submit Button -->
            <div class="flex justify-end space-x-3">
                <button type="button" @click="resetForm"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {{ t('reviews.form.reset') }}
                </button>
                <button type="submit"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="loading || !isValid">
                    {{ loading ? t('reviews.form.submitting') : t('reviews.form.submitReview') }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useReviews } from '@/composables/useReviews'

const { t } = useI18n()
const { createReview, loading, error: reviewError } = useReviews()

const props = defineProps({
    appointmentId: {
        type: String,
        required: true
    },
    advisorId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['success', 'error'])

// Form data
const rating = ref(0)
const comment = ref('')
const communicationRating = ref(0)
const professionalismRating = ref(0)
const satisfactionRating = ref(0)

// UI state
const error = ref('')
const success = ref('')

// Computed properties
const isValid = computed(() => {
    return rating.value > 0 && comment.value.trim().length >= 10
})

// Watch for errors from the composable
watch(reviewError, (newError) => {
    if (newError) {
        error.value = newError
        success.value = ''
    }
})

// Methods
const getRatingLabel = (rating) => {
    const labels = {
        1: t('reviews.form.ratingLabels.poor'),
        2: t('reviews.form.ratingLabels.fair'),
        3: t('reviews.form.ratingLabels.good'),
        4: t('reviews.form.ratingLabels.veryGood'),
        5: t('reviews.form.ratingLabels.excellent')
    }
    return labels[rating] || ''
}

const resetForm = () => {
    rating.value = 0
    comment.value = ''
    communicationRating.value = 0
    professionalismRating.value = 0
    satisfactionRating.value = 0
    error.value = ''
    success.value = ''
}

const handleSubmit = async () => {
    if (!isValid.value) return

    try {
        error.value = ''
        success.value = ''

        const reviewData = {
            appointmentId: props.appointmentId,
            rating: rating.value,
            comment: comment.value.trim()
        }

        // Add category ratings if provided
        if (communicationRating.value > 0) {
            reviewData.communicationRating = communicationRating.value
        }
        if (professionalismRating.value > 0) {
            reviewData.professionalismRating = professionalismRating.value
        }
        if (satisfactionRating.value > 0) {
            reviewData.satisfactionRating = satisfactionRating.value
        }

        const result = await createReview(reviewData)

        success.value = t('reviews.form.success')
        resetForm()

        // Emit success event with the created review
        emit('success', result.review)

        // Auto-hide success message after 3 seconds
        setTimeout(() => {
            success.value = ''
        }, 3000)

    } catch (err) {
        error.value = err.response?.data?.message || t('reviews.form.submitError')
        emit('error', error.value)
    }
}
</script>

<style scoped>
/* Custom input styles */
.input {
    @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500;
}

/* Star rating hover effects */
button:hover svg {
    transform: scale(1.1);
}

/* Character counter styling */
.character-counter {
    transition: color 0.2s ease;
}

.character-counter.warning {
    color: #f59e0b;
}

.character-counter.error {
    color: #dc2626;
}
</style>