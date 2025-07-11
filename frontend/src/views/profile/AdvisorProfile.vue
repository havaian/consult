<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div v-if="loading" class="text-center py-8">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent">
      </div>
      <p class="mt-2 text-gray-600">{{ t('profile.loading') }}</p>
    </div>

    <template v-else-if="user">
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <!-- Profile Header -->
        <div class="p-6 sm:p-8 border-b border-gray-200">
          <div class="flex flex-col sm:flex-row items-center sm:items-start">
            <img :src="user.profilePicture || ''" :alt="user.firstName" class="h-32 w-32 rounded-full object-cover" />
            <div class="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-1">
              <h1 class="text-2xl font-bold text-gray-900">
                {{ user.firstName }} {{ user.lastName }}
              </h1>

              <!-- Specializations as tags -->
              <div class="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span v-for="spec in user.specializations" :key="spec"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {{ spec }}
                </span>
              </div>

              <div class="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                <span
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">
                  {{ t('profile.yearsExperience', { years: user.experience }) }}
                </span>
                <span v-for="lang in user.languages" :key="lang"
                  class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {{ lang }}
                </span>
              </div>

              <!-- Review Stats -->
              <div v-if="reviewStats" class="mt-4 flex items-center justify-center sm:justify-start space-x-4">
                <div class="flex items-center">
                  <div class="flex">
                    <svg v-for="star in getStarRating(parseFloat(averageRating))" :key="star" class="w-5 h-5"
                      :class="star === 'full' ? 'text-yellow-400' : 'text-gray-300'" fill="currentColor"
                      viewBox="0 0 20 20">
                      <path
                        d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <span class="ml-2 text-sm font-medium text-gray-900">{{ averageRating }}</span>
                </div>
                <span class="text-sm text-gray-600">({{ totalReviews }} {{ t('reviews.reviews') }})</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Tabs -->
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8 px-6 sm:px-8">
            <button @click="activeTab = 'profile'"
              :class="activeTab === 'profile' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="py-4 px-1 border-b-2 font-medium text-sm">
              {{ t('profile.profileInfo') }}
            </button>
            <button @click="activeTab = 'reviews'"
              :class="activeTab === 'reviews' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
              class="py-4 px-1 border-b-2 font-medium text-sm">
              {{ t('profile.myReviews') }}
              <span v-if="totalReviews > 0" class="ml-1 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                {{ totalReviews }}
              </span>
            </button>
          </nav>
        </div>

        <!-- Profile Content -->
        <div v-show="activeTab === 'profile'" class="p-6 sm:p-8">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Professional Information -->
            <div>
              <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('profile.professionalInfo') }}</h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-gray-500">{{ t('profile.email') }}</dt>
                  <dd class="mt-1 text-gray-900">{{ user.email }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">{{ t('profile.phone') }}</dt>
                  <dd class="mt-1 text-gray-900">{{ user.phone }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">{{ t('profile.licenseNumber') }}</dt>
                  <dd class="mt-1 text-gray-900">{{ user.licenseNumber }}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">{{ t('profile.consultationFee') }}</dt>
                  <dd class="mt-1 text-gray-900">{{ formatConsultationFee }}</dd>
                </div>
              </dl>
            </div>

            <!-- Education & Experience -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('profile.education') }}</h2>
                <dl class="space-y-4">
                  <div v-for="edu in user.education" :key="edu.degree">
                    <dt class="text-sm font-medium text-gray-900">{{ edu.degree }}</dt>
                    <dd class="mt-1 text-gray-500">{{ edu.institution }} ({{ edu.year }})</dd>
                  </div>
                  <div v-if="!user.education || user.education.length === 0" class="text-gray-500">
                    {{ t('profile.noEducation') }}
                  </div>
                </dl>
              </div>

              <div>
                <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('profile.certification') }}</h2>
                <dl class="space-y-4">
                  <div v-for="cert in user.certifications" :key="cert.issuer">
                    <dt class="text-sm font-medium text-gray-900">{{ cert.issuer }}</dt>
                    <dd class="mt-1 text-gray-500">{{ cert.name }} ({{ cert.year }})</dd>
                  </div>
                  <div v-if="!user.certifications || user.certifications.length === 0" class="text-gray-500">
                    {{ t('profile.noCertification') }}
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <!-- Bio -->
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('profile.about') }}</h2>
            <p class="text-gray-600">{{ decodedBio }}</p>
          </div>

          <!-- Location -->
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('profile.location') }}</h2>
            <p class="text-gray-600">{{ formattedAddress }}</p>
          </div>

          <!-- Availability -->
          <div class="mt-8">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">{{ t('profile.availability') }}</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="day in availableDays" :key="day.dayOfWeek" class="bg-gray-50 p-4 rounded-lg">
                <h3 class="font-medium text-gray-900">{{ formatDay(day.dayOfWeek) }}</h3>
                <p class="text-gray-600">{{ day.startTime }} - {{ day.endTime }}</p>
              </div>
              <div v-if="availableDays.length === 0" class="bg-gray-50 p-4 rounded-lg">
                <p class="text-gray-500">{{ t('profile.noAvailability') }}</p>
              </div>
            </div>
          </div>

          <!-- Edit Profile Button -->
          <div class="mt-8 flex justify-end">
            <router-link :to="{ name: 'profile-edit' }" class="btn-primary">
              {{ t('profile.editProfile') }}
            </router-link>
          </div>
        </div>

        <!-- Reviews Content -->
        <div v-show="activeTab === 'reviews'" class="p-6 sm:p-8">
          <!-- Review Statistics -->
          <div v-if="reviewStats" class="mb-8 bg-gray-50 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ t('reviews.reviewOverview') }}</h3>
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
                <div class="text-2xl font-bold text-blue-600">{{ formatRating(reviewStats.communicationRating) }}</div>
                <div class="text-sm text-gray-600">{{ t('reviews.stats.communication') }}</div>
              </div>
              <div v-if="reviewStats.professionalismRating">
                <div class="text-2xl font-bold text-green-600">{{ formatRating(reviewStats.professionalismRating) }}
                </div>
                <div class="text-sm text-gray-600">{{ t('reviews.stats.professionalism') }}</div>
              </div>
              <div v-if="reviewStats.satisfactionRating">
                <div class="text-2xl font-bold text-purple-600">{{ formatRating(reviewStats.satisfactionRating) }}</div>
                <div class="text-sm text-gray-600">{{ t('reviews.stats.satisfaction') }}</div>
              </div>
            </div>
          </div>

          <!-- Reviews Management -->
          <AdvisorResponseForm :advisor-id="user._id" />
        </div>
      </div>
    </template>

    <div v-else class="text-center py-8">
      <p class="text-gray-600">{{ t('profile.notFound') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { useReviews } from '@/composables/useReviews'
import AdvisorResponseForm from '@/components/reviews/AdvisorResponseForm.vue'

const authStore = useAuthStore()
const { t } = useI18n()
const { api } = useApi()
const {
  reviewStats,
  getAdvisorStats,
  formatRating,
  getStarRating,
  averageRating,
  totalReviews
} = useReviews()

const user = ref(null)
const loading = ref(true)
const activeTab = ref('profile')

const availableDays = computed(() => {
  if (!user.value?.availability) return []
  return user.value.availability.filter(day => day.isAvailable)
})

// Computed property for decoded bio
const decodedBio = computed(() => {
  if (!user.value?.bio) return t('profile.noBio')

  // Create a temporary DOM element to decode HTML entities
  const textarea = document.createElement('textarea')
  textarea.innerHTML = user.value.bio
  return textarea.value
})

// Computed property for formatted consultation fee
const formatConsultationFee = computed(() => {
  const fee = user.value?.consultationFee

  if (!fee) return t('profile.feeNotSpecified')

  // If fee is an object with amount property
  if (typeof fee === 'object' && fee !== null && 'amount' in fee) {
    return `${new Intl.NumberFormat('uz-UZ').format(fee.amount)} ${fee.currency || 'UZS'}`
  }
  // If it's just a number
  else if (typeof fee === 'number') {
    return `${new Intl.NumberFormat('uz-UZ').format(fee)} UZS`
  }

  return t('profile.feeNotSpecified')
})

// Computed property for formatted address
const formattedAddress = computed(() => {
  const address = user.value?.address

  if (!address) return t('profile.addressNotProvided')

  const parts = []
  if (address.street) parts.push(address.street)
  if (address.city) parts.push(address.city)
  if (address.state) parts.push(address.state)
  if (address.zipCode) parts.push(address.zipCode)
  if (address.country) parts.push(address.country)

  return parts.length > 0 ? parts.join(', ') : t('profile.addressNotProvided')
})

const formatDay = (dayOfWeek) => {
  const days = [
    t('profile.days.sunday'),
    t('profile.days.monday'),
    t('profile.days.tuesday'),
    t('profile.days.wednesday'),
    t('profile.days.thursday'),
    t('profile.days.friday'),
    t('profile.days.saturday')
  ]
  return days[dayOfWeek]
}

async function fetchUserProfile() {
  try {
    loading.value = true
    const response = await api.get('/users/me')
    user.value = response.data
  } catch (error) {
    console.error('Error fetching user profile:', error)
  } finally {
    loading.value = false
  }
}

async function loadReviewStats() {
  if (!user.value?._id) return

  try {
    await getAdvisorStats(user.value._id)
  } catch (error) {
    console.error('Error loading review stats:', error)
  }
}

// Watch for user changes to load review stats
watch(user, (newUser) => {
  if (newUser?._id) {
    loadReviewStats()
  }
}, { immediate: true })

onMounted(async () => {
  await fetchUserProfile()
})
</script>

<style scoped>
.btn-primary {
  @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500;
}

/* Tab transitions */
.tab-content {
  transition: opacity 0.2s ease-in-out;
}
</style>