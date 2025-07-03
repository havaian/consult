<template>
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full text-center">
            <div v-if="loading" class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p class="mt-4 text-gray-600">{{ t('auth.verifyingEmail') }}</p>
            </div>

            <template v-else>
                <div v-if="success" class="space-y-6">
                    <div class="rounded-full bg-green-100 h-24 w-24 flex items-center justify-center mx-auto">
                        <svg class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 class="text-3xl font-extrabold text-gray-900">
                        {{ t('auth.emailVerified') }}
                    </h2>
                    <p class="mt-2 text-sm text-gray-600">
                        {{ t('auth.emailVerifiedDescription') }}
                    </p>

                    <div class="mt-8">
                        <router-link to="/login" class="btn-primary w-full justify-center">
                            {{ t('auth.goToLogin') }}
                        </router-link>
                    </div>
                </div>

                <div v-else class="space-y-6">
                    <div class="rounded-full bg-red-100 h-24 w-24 flex items-center justify-center mx-auto">
                        <svg class="h-12 w-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>

                    <h2 class="text-3xl font-extrabold text-gray-900">
                        {{ t('auth.verificationFailed') }}
                    </h2>
                    <p class="mt-2 text-sm text-gray-600">
                        {{ error || t('auth.verificationFailedDescription') }}
                    </p>

                    <div class="mt-8 space-y-4">
                        <router-link to="/login" class="btn-primary w-full justify-center">
                            {{ t('auth.returnToLogin') }}
                        </router-link>
                        <router-link to="/forgot-password" class="btn-secondary w-full justify-center">
                            {{ t('auth.resendVerification') }}
                        </router-link>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { api } = useApi()

const loading = ref(true)
const success = ref(false)
const error = ref('')

onMounted(async () => {
    try {
        const token = route.params.token
        await api.get(`/users/verify/${token}`)
        success.value = true
    } catch (err) {
        error.value = err.response?.data?.message || t('auth.emailVerificationFailed')
        success.value = false
    } finally {
        loading.value = false
    }
})
</script>