<template>
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div v-if="!success">
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    {{ t('auth.forgotPasswordTitle') }}
                </h2>
                <p class="mt-2 text-center text-sm text-gray-600">
                    {{ t('auth.forgotPasswordDescription') }}
                </p>

                <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                    <div>
                        <label for="email" class="sr-only">{{ t('auth.email') }}</label>
                        <input id="email" v-model="email" name="email" type="email" required class="input rounded-md"
                            :placeholder="t('auth.emailAddress')" />
                    </div>

                    <div>
                        <button type="submit" class="btn-primary w-full" :disabled="loading">
                            {{ loading ? t('auth.sending') : t('auth.sendResetLink') }}
                        </button>
                    </div>

                    <div v-if="error" class="text-sm text-center text-red-600">
                        {{ error }}
                    </div>
                </form>

                <div class="text-sm text-center">
                    <router-link to="/login"
                        class="font-medium bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent  hover:text-indigo-500">
                        {{ t('auth.backToLogin') }}
                    </router-link>
                </div>
            </div>

            <div v-else class="text-center">
                <div class="rounded-full bg-green-100 h-24 w-24 flex items-center justify-center mx-auto">
                    <svg class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                </div>

                <h2 class="mt-6 text-3xl font-extrabold text-gray-900">
                    {{ t('auth.checkYourEmail') }}
                </h2>
                <p class="mt-2 text-sm text-gray-600">
                    {{ t('auth.resetInstructionsSent', { email: email }) }}
                </p>

                <div class="mt-8 space-y-4">
                    <router-link to="/login" class="btn-primary w-full inline-block text-center">
                        {{ t('auth.returnToLogin') }}
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'

const { t } = useI18n()
const { api } = useApi()

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref(false)

async function handleSubmit() {
    try {
        loading.value = true
        error.value = ''

        await api.post('/users/forgot-password', { email: emails.value })
        success.value = true
    } catch (err) {
        error.value = err.response?.data?.message || t('auth.forgotPasswordFailed')
    } finally {
        loading.value = false
    }
}
</script>