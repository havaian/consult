<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="space-y-8">
      <!-- Search and filters -->
      <div class="bg-white shadow rounded-lg p-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label for="search" class="label">{{ t('advisors.searchByName') }}</label>
            <input id="search" v-model="filters.name" type="text" class="input mt-1"
              :placeholder="t('advisors.searchPlaceholder')" @input="handleSearch" />
          </div>
          <div>
            <label for="specializations" class="label">{{ t('advisors.specialization') }}</label>
            <select id="specializations" v-model="filters.specializations" class="input mt-1" @change="handleSearch">
              <option value="">{{ t('advisors.allSpecializations') }}</option>
              <option v-for="spec in specializations" :key="spec" :value="spec">
                {{ spec }}
              </option>
            </select>
          </div>
          <div>
            <label for="city" class="label">{{ t('advisors.city') }}</label>
            <select id="city" v-model="filters.city" class="input mt-1" @change="handleSearch">
              <option value="">{{ t('advisors.allCities') }}</option>
              <option v-for="city in cities" :key="city" :value="city">
                {{ city }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Advisor list -->
      <div class="space-y-4">
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-600 border-t-transparent">
          </div>
          <p class="mt-2 text-gray-600">{{ t('advisors.loadingAdvisors') }}</p>
        </div>

        <template v-else>
          <div v-if="advisors.length === 0" class="text-center py-8">
            <p class="text-gray-600">{{ t('advisors.noAdvisorsFound') }}</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div v-for="advisor in advisors" :key="advisor._id" class="bg-white shadow rounded-lg overflow-hidden">
              <div class="p-6">
                <div class="flex items-center space-x-4">
                  <img :src="advisor.profilePicture || '/images/user-placeholder.jpg'" :alt="advisor.firstName"
                    class="h-16 w-16 rounded-full object-cover" />
                  <div>
                    <h3 class="text-lg font-medium text-gray-900">
                      {{ advisor.firstName }} {{ advisor.lastName }}
                    </h3>
                    <div class="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                      <span v-for="spec in advisor.specializations" :key="spec"
                        class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        {{ spec }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="mt-4 space-y-2">
                  <p class="text-sm">
                    <span class="font-medium">{{ t('advisors.experience') }}:</span>
                    {{ t('advisors.experienceYears', { years: advisor.experience }) }}
                  </p>
                  <p class="text-sm">
                    <span class="font-medium">{{ t('advisors.consultationFee') }}:</span>
                    {{ formatCurrency(advisor.consultationFee) }} {{ advisor.consultationFee.currency || 'UZS' }}
                  </p>
                  <p class="text-sm">
                    <span class="font-medium">{{ t('advisors.languages') }}:</span>
                    {{ advisor.languages?.join(', ') || t('advisors.notSpecified') }}
                  </p>
                </div>

                <div class="mt-6">
                  <router-link :to="{ name: 'advisor-profile-view', params: { id: advisor._id } }"
                    class="btn-primary w-full justify-center">
                    {{ t('advisors.viewProfile') }}
                  </router-link>
                </div>
              </div>
            </div>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex justify-center space-x-2 mt-8">
            <button v-for="page in totalPages" :key="page" class="btn-secondary"
              :class="{ 'bg-indigo-600 text-white': currentPage === page }" @click="handlePageChange(page)">
              {{ page }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const { api } = useApi()
const router = useRouter()

const specializations = ref([])

async function fetchSpecializations() {
  try {
    const response = await api.get('/specializations')
    specializations.value = response.data.specializations.map(s => s.name)
  } catch (error) {
    console.error('Error fetching specializations:', error)
    // Set some defaults in case API call fails
    specializations.value = [
      'Corporate Law',
      'Family Law',
      'Criminal Defense',
      'Real Estate Law',
      'Employment Law',
      'Immigration Law',
      'Personal Injury',
      'Intellectual Property',
      'Tax Law',
      'General Legal Advice',
    ]
  }
}

const cities = [
  'Tashkent',
  'Namangan',
  'Andijan',
  'Fergana',
  'Samarkand',
  'Bukhara'
]

const advisors = ref([])
const loading = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const filters = reactive({
  name: '',
  specializations: '',
  city: ''
})

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('uz-UZ').format(amount)
}

async function fetchAdvisors() {
  try {
    loading.value = true
    const params = {
      page: currentPage.value,
      limit: 9,
      ...filters
    }

    const response = await api.get('/users/advisors', { params })
    advisors.value = response.data.advisors
    totalPages.value = Math.ceil(response.data.pagination.total / response.data.pagination.limit)
  } catch (error) {
    console.error('Error fetching advisors:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  fetchAdvisors()
}

function handlePageChange(page) {
  currentPage.value = page
  fetchAdvisors()
}

onMounted(() => {
  fetchAdvisors()
  fetchSpecializations()
})
</script>