<template>
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {{ t('auth.resetPasswordTitle') }}
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    {{ t('auth.resetPasswordDescription') }}
                </p>
            </div>

            <div v-if="success" class="rounded-md bg-green-50 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm font-medium text-green-800">
                            {{ t('auth.passwordResetSuccessful') }}
                        </p>
                    </div>
                </div>
            </div>

            <form v-if="!success" class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="password" class="sr-only">{{ t('auth.newPassword') }}</label>
                        <input id="password" v-model="password" name="password" type="password" required
                            class="input rounded-t-md" :placeholder="t('auth.newPassword')" />
                    </div>
                    <div>
                        <label for="confirmPassword" class="sr-only">{{ t('auth.confirmPassword') }}</label>
                        <input id="confirmPassword" v-model="confirmPassword" name="confirmPassword" type="password"
                            required class="input rounded-b-md" :placeholder="t('auth.confirmPassword')" />
                    </div>
                </div>

                <!-- Password requirements -->
                <div class="text-sm text-gray-600">
                    <p>{{ t('auth.passwordRequirements') }}</p>
                    <ul class="mt-1 list-disc list-inside space-y-1">
                        <li
                            :class="{ 'text-green-600': password.length >= 8, 'text-red-600': password.length > 0 && password.length < 8 }">
                            {{ t('auth.passwordMinLength') }}
                        </li>
                        <li
                            :class="{ 'text-green-600': password === confirmPassword && password.length > 0, 'text-red-600': confirmPassword.length > 0 && password !== confirmPassword }">
                            {{ t('auth.passwordsMatch') }}
                        </li>
                    </ul>
                </div>

                <div>
                    <button type="submit" class="btn-primary w-full" :disabled="loading || !isValid">
                        {{ loading ? t('auth.resetting') : t('auth.resetPassword') }}
                    </button>
                </div>

                <div v-if="error" class="rounded-md bg-red-50 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm font-medium text-red-800">
                                {{ error }}
                            </p>
                        </div>
                    </div>
                </div>
            </form>

            <div class="text-sm text-center">
                <router-link to="/login"
                    class="font-medium bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent  hover:text-indigo-500">
                    {{ t('auth.backToLogin') }}
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'

const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { api } = useApi()

const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

const isValid = computed(() => {
    return password.value.length >= 8 && password.value === confirmPassword.value
})

async function handleSubmit() {
    try {
        if (!isValid.value) {
            error.value = t('auth.passwordValidationError')
            return
        }

        loading.value = true
        error.value = ''

        await api.post(`/users/reset-password/${route.params.token}`, {
            password: password.value
        })

        success.value = true

        // Redirect to login after 3 seconds
        setTimeout(() => {
            router.push('/login')
        }, 3000)
    } catch (err) {
        error.value = err.response?.data?.message || t('auth.resetPasswordFailed')
        success.value = false
    } finally {
        loading.value = false
    }
}
</script>