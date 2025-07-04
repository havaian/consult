<template>
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="text-lg font-medium text-blue-900 mb-4">{{ t('reviews.editReview') }}</h4>

        <form @submit.prevent="handleSubmit" class="space-y-4">
            <!-- Overall Rating -->
            <div>
                <label class="block text-sm font-medium text-blue-900 mb-2">
                    {{ t('reviews.form.overallRating') }} <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center space-x-1">
                    <button v-for="i in 5" :key="i" type="button"
                        class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                        @click="formData.rating = i">
                        <svg class="h-6 w-6 transition-colors"
                            :class="i <= formData.rating ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor"
                            viewBox="0 0 20 20">
                            <path
                                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </button>
                </div>
                <p v-if="formData.rating > 0" class="text-sm text-blue-700 mt-1">
                    {{ getRatingLabel(formData.rating) }}
                </p>
            </div>

            <!-- Category Ratings -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Communication Rating -->
                <div>
                    <label class="block text-sm font-medium text-blue-900 mb-2">
                        {{ t('reviews.form.communication') }}
                    </label>
                    <div class="flex items-center space-x-1">
                        <button v-for="i in 5" :key="i" type="button"
                            class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            @click="formData.communicationRating = i">
                            <svg class="h-4 w-4 transition-colors"
                                :class="i <= formData.communicationRating ? 'text-blue-500' : 'text-gray-300'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Professionalism Rating -->
                <div>
                    <label class="block text-sm font-medium text-blue-900 mb-2">
                        {{ t('reviews.form.professionalism') }}
                    </label>
                    <div class="flex items-center space-x-1">
                        <button v-for="i in 5" :key="i" type="button"
                            class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            @click="formData.professionalismRating = i">
                            <svg class="h-4 w-4 transition-colors"
                                :class="i <= formData.professionalismRating ? 'text-green-500' : 'text-gray-300'"
                                fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </button>
                    </div>
                </div>

                <!-- Satisfaction Rating -->
                <div>
                    <label class="block text-sm font-medium text-blue-900 mb-2">
                        {{ t('reviews.form.satisfaction') }}
                    </label>
                    <div class="flex items-center space-x-1">
                        <button v-for="i in 5" :key="i" type="button"
                            class="p-1 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            @click="formData.satisfactionRating = i">
                            <svg class="h-4 w-4 transition-colors"
                                :class="i <= formData.satisfactionRating ? 'text-purple-500' : 'text-gray-300'"
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
                <label for="edit-comment" class="block text-sm font-medium text-blue-900 mb-2">
                    {{ t('reviews.form.yourReview') }} <span class="text-red-500">*</span>
                </label>
                <textarea id="edit-comment" v-model="formData.comment" rows="4"
                    class="block w-full px-3 py-2 border border-blue-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white"
                    :placeholder="t('reviews.form.placeholder')" :maxlength="1000" required></textarea>
                <p class="mt-1 text-sm text-blue-600">
                    {{ formData.comment.length }}/1000 {{ t('reviews.form.characters') }}
                </p>
            </div>

            <!-- Warning Message -->
            <div class="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div class="flex">
                    <svg class="h-5 w-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                            clip-rule="evenodd" />
                    </svg>
                    <div>
                        <p class="text-sm text-yellow-800">
                            {{ t('reviews.editWarning') }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Error Display -->
            <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-3">
                <div class="flex">
                    <svg class="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd" />
                    </svg>
                    <div>
                        <h3 class="text-sm font-medium text-red-800">{{ t('reviews.form.error') }}</h3>
                        <p class="text-sm text-red-700 mt-1">{{ error }}</p>
                    </div>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex justify-end space-x-3 pt-4">
                <button type="button" @click="handleCancel"
                    class="px-4 py-2 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    {{ t('common.cancel') }}
                </button>
                <button type="submit"
                    class="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="loading || !isValid">
                    {{ loading ? t('reviews.form.updating') : t('reviews.form.updateReview') }}
                </button>
            </div>
        </form>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useReviews } from '@/composables/useReviews'

const { t } = useI18n()
const { updateReview, loading } = useReviews()

const props = defineProps({
    review: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['save', 'cancel'])

// Form data
const formData = ref({
    rating: 0,
    comment: '',
    communicationRating: 0,
    professionalismRating: 0,
    satisfactionRating: 0
})

// UI state
const error = ref('')

// Computed properties
const isValid = computed(() => {
    return formData.value.rating > 0 && formData.value.comment.trim().length >= 10
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

const initializeForm = () => {
    formData.value = {
        rating: props.review.rating || 0,
        comment: props.review.comment || '',
        communicationRating: props.review.communicationRating || 0,
        professionalismRating: props.review.professionalismRating || 0,
        satisfactionRating: props.review.satisfactionRating || 0
    }
}

const handleSubmit = async () => {
    if (!isValid.value) return

    try {
        error.value = ''

        const updateData = {
            rating: formData.value.rating,
            comment: formData.value.comment.trim()
        }

        // Add category ratings if provided
        if (formData.value.communicationRating > 0) {
            updateData.communicationRating = formData.value.communicationRating
        }
        if (formData.value.professionalismRating > 0) {
            updateData.professionalismRating = formData.value.professionalismRating
        }
        if (formData.value.satisfactionRating > 0) {
            updateData.satisfactionRating = formData.value.satisfactionRating
        }

        const result = await updateReview(props.review._id, updateData)

        // Emit success event with the updated review
        emit('save', result.review)

    } catch (err) {
        error.value = err.response?.data?.message || t('reviews.form.updateError')
    }
}

const handleCancel = () => {
    // Reset form to original values
    initializeForm()
    error.value = ''
    emit('cancel')
}

// Initialize form when component mounts
onMounted(() => {
    initializeForm()
})
</script>

<style scoped>
/* Star rating hover effects */
button:hover svg {
    transform: scale(1.1);
}

/* Smooth transitions for form elements */
input,
textarea,
select {
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

/* Focus states for better accessibility */
button:focus {
    outline: 2px solid transparent;
    outline-offset: 2px;
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

/* Rating label animation */
.rating-label {
    transition: opacity 0.2s ease;
}
</style>