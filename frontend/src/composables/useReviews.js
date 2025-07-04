// frontend/src/composables/useReviews.js
import { ref, computed } from 'vue'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'

export function useReviews() {
    const { api } = useApi()
    const authStore = useAuthStore()

    const reviews = ref([])
    const reviewStats = ref(null)
    const loading = ref(false)
    const error = ref(null)

    // Create a new review
    const createReview = async (reviewData) => {
        try {
            loading.value = true
            error.value = null

            const response = await api.post('/reviews', reviewData)

            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to create review'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get reviews for a specific advisor
    const getAdvisorReviews = async (advisorId, options = {}) => {
        try {
            loading.value = true
            error.value = null

            const params = new URLSearchParams()
            if (options.page) params.append('page', options.page)
            if (options.limit) params.append('limit', options.limit)
            if (options.sort) params.append('sort', options.sort)

            const response = await api.get(`/reviews/advisor/${advisorId}?${params}`)

            reviews.value = response.data.reviews
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch reviews'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get advisor review statistics
    const getAdvisorStats = async (advisorId) => {
        try {
            const response = await api.get(`/reviews/advisor/${advisorId}/stats`)
            reviewStats.value = response.data.stats
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch review stats'
            throw err
        }
    }

    // Get review for a specific appointment
    const getReviewByAppointment = async (appointmentId) => {
        try {
            const response = await api.get(`/reviews/appointment/${appointmentId}`)
            return response.data.review
        } catch (err) {
            if (err.response?.status === 404) {
                return null // No review found
            }
            error.value = err.response?.data?.message || 'Failed to fetch review'
            throw err
        }
    }

    // Get client's reviews
    const getClientReviews = async (clientId, options = {}) => {
        try {
            loading.value = true
            error.value = null

            const params = new URLSearchParams()
            if (options.page) params.append('page', options.page)
            if (options.limit) params.append('limit', options.limit)

            const response = await api.get(`/reviews/client/${clientId}?${params}`)

            reviews.value = response.data.reviews
            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch client reviews'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update a review
    const updateReview = async (reviewId, reviewData) => {
        try {
            loading.value = true
            error.value = null

            const response = await api.patch(`/reviews/${reviewId}`, reviewData)

            // Update the review in the local array if it exists
            const index = reviews.value.findIndex(r => r._id === reviewId)
            if (index !== -1) {
                reviews.value[index] = response.data.review
            }

            return response.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update review'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete a review
    const deleteReview = async (reviewId) => {
        try {
            loading.value = true
            error.value = null

            await api.delete(`/reviews/${reviewId}`)

            // Remove the review from the local array
            reviews.value = reviews.value.filter(r => r._id !== reviewId)

            return true
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete review'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Add advisor response to a review
    const addAdvisorResponse = async (reviewId, response) => {
        try {
            loading.value = true
            error.value = null

            const result = await api.post(`/reviews/${reviewId}/response`, { response })

            // Update the review in the local array if it exists
            const index = reviews.value.findIndex(r => r._id === reviewId)
            if (index !== -1) {
                reviews.value[index].advisorResponse = result.data.advisorResponse
            }

            return result.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to add response'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Update advisor response
    const updateAdvisorResponse = async (reviewId, response) => {
        try {
            loading.value = true
            error.value = null

            const result = await api.patch(`/reviews/${reviewId}/response`, { response })

            // Update the review in the local array if it exists
            const index = reviews.value.findIndex(r => r._id === reviewId)
            if (index !== -1) {
                reviews.value[index].advisorResponse = result.data.advisorResponse
            }

            return result.data
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to update response'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Delete advisor response
    const deleteAdvisorResponse = async (reviewId) => {
        try {
            loading.value = true
            error.value = null

            await api.delete(`/reviews/${reviewId}/response`)

            // Remove the response from the local array
            const index = reviews.value.findIndex(r => r._id === reviewId)
            if (index !== -1) {
                reviews.value[index].advisorResponse = null
            }

            return true
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to delete response'
            throw err
        } finally {
            loading.value = false
        }
    }

    // Get recent reviews
    const getRecentReviews = async (limit = 10) => {
        try {
            const response = await api.get(`/reviews/recent?limit=${limit}`)
            return response.data.reviews
        } catch (err) {
            error.value = err.response?.data?.message || 'Failed to fetch recent reviews'
            throw err
        }
    }

    // Check if user can review an appointment
    const canReviewAppointment = (appointment) => {
        const user = authStore.user

        if (!user || !appointment) return false

        // Only clients can review
        if (user.role !== 'client') return false

        // Only completed appointments can be reviewed
        if (appointment.status !== 'completed') return false

        // Check if user is the client for this appointment
        if (appointment.client?._id !== user.id && appointment.client !== user.id) return false

        return true
    }

    // Check if user can respond to a review
    const canRespondToReview = (review) => {
        const user = authStore.user

        if (!user || !review) return false

        // Only advisors can respond
        if (user.role !== 'advisor') return false

        // Check if user is the advisor for this review
        if (review.advisor?._id !== user.id && review.advisor !== user.id) return false

        return true
    }

    // Format rating for display
    const formatRating = (rating) => {
        return Number(rating).toFixed(1)
    }

    // Get star rating array for display
    const getStarRating = (rating) => {
        const stars = []
        const fullStars = Math.floor(rating)
        const hasHalfStar = rating % 1 >= 0.5

        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                stars.push('full')
            } else if (i === fullStars + 1 && hasHalfStar) {
                stars.push('half')
            } else {
                stars.push('empty')
            }
        }

        return stars
    }

    // Computed properties
    const averageRating = computed(() => {
        if (!reviewStats.value) return 0
        return Number(reviewStats.value.averageRating || 0).toFixed(1)
    })

    const totalReviews = computed(() => {
        return reviewStats.value?.reviewCount || 0
    })

    const hasReviews = computed(() => {
        return reviews.value.length > 0
    })

    return {
        // State
        reviews,
        reviewStats,
        loading,
        error,

        // Methods
        createReview,
        getAdvisorReviews,
        getAdvisorStats,
        getReviewByAppointment,
        getClientReviews,
        updateReview,
        deleteReview,
        addAdvisorResponse,
        updateAdvisorResponse,
        deleteAdvisorResponse,
        getRecentReviews,

        // Helpers
        canReviewAppointment,
        canRespondToReview,
        formatRating,
        getStarRating,

        // Computed
        averageRating,
        totalReviews,
        hasReviews
    }
}