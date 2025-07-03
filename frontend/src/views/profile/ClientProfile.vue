<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <!-- Profile Header -->
      <div class="p-6 sm:p-8 border-b border-gray-200">
        <div class="flex flex-col sm:flex-row items-center">
          <img :src="user?.profilePicture || ''" :alt="user?.firstName" class="h-32 w-32 rounded-full object-cover" />
          <div class="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ user?.firstName }} {{ user?.lastName }}
            </h1>
            <p class="text-gray-600">{{ t('profile.client.role') }}</p>
          </div>
        </div>
      </div>

      <!-- Profile Content -->
      <div class="p-6 sm:p-8">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Personal Information -->
          <div>
            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.client.personalInfo') }}</h2>
            <dl class="space-y-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">{{ t('profile.email') }}</dt>
                <dd class="mt-1 text-gray-900">{{ user?.email }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">{{ t('profile.phone') }}</dt>
                <dd class="mt-1 text-gray-900">{{ user?.phone }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">{{ t('profile.client.dateOfBirth') }}</dt>
                <dd class="mt-1 text-gray-900">{{ formatDate(user?.dateOfBirth) }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-gray-500">{{ t('profile.client.gender') }}</dt>
                <dd class="mt-1 text-gray-900">{{ formatGender(user?.gender) }}</dd>
              </div>
            </dl>
          </div>

          <!-- Legal History -->
          <div>
            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.client.legalHistory') }}</h2>
            <dl class="space-y-4">
              <div>
                <dt class="text-sm font-medium text-gray-500">{{ t('profile.client.legalHistory') }}</dt>
                <dd class="mt-1 text-gray-900">
                  <p v-if="user?.legalHistory?.length">{{ user?.legalHistory }}</p>
                  <span v-else class="text-gray-500">{{ t('profile.client.nothingReported') }}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- Emergency Contact -->
        <div class="mt-8">
          <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.client.emergencyContact') }}</h2>
          <dl class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <dt class="text-sm font-medium text-gray-500">{{ t('profile.client.name') }}</dt>
              <dd class="mt-1 text-gray-900">{{ user?.emergencyContact?.name || t('profile.notProvided') }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">{{ t('profile.client.relationship') }}</dt>
              <dd class="mt-1 text-gray-900">{{ user?.emergencyContact?.relationship || t('profile.notProvided') }}</dd>
            </div>
            <div>
              <dt class="text-sm font-medium text-gray-500">{{ t('profile.phone') }}</dt>
              <dd class="mt-1 text-gray-900">{{ user?.emergencyContact?.phone || t('profile.notProvided') }}</dd>
            </div>
          </dl>
        </div>

        <!-- Edit Profile Button -->
        <div class="mt-8 flex justify-end">
          <router-link :to="{ name: 'profile-edit' }" class="btn-primary">
            {{ t('profile.editProfile') }}
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { format } from 'date-fns'

const authStore = useAuthStore()
const { t } = useI18n()
const { api } = useApi()
const user = ref(null)

const formatDate = (date) => {
  if (!date) return t('profile.notProvided')
  return format(new Date(date), 'MMMM d, yyyy')
}

const formatGender = (gender) => {
  if (!gender) return t('profile.client.notSpecified')

  // Return localized gender values
  const genderMap = {
    'male': t('profile.client.genders.male'),
    'female': t('profile.client.genders.female'),
    // 'other': t('profile.client.genders.other'),
    // 'prefer not to say': t('profile.client.genders.preferNotToSay')
  }

  return genderMap[gender.toLowerCase()] || gender.charAt(0).toUpperCase() + gender.slice(1)
}

async function fetchUserProfile() {
  try {
    const response = await api.get('/users/me')
    user.value = response.data.user
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

onMounted(() => {
  fetchUserProfile()
})
</script>