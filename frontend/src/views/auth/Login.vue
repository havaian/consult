<template>
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">{{ t('auth.signInToAccount') }}</h2>
            </div>
            <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                <div class="rounded-md shadow-sm -space-y-px">
                    <div>
                        <label for="email" class="sr-only">{{ t('auth.email') }}</label>
                        <input id="email" v-model="email" name="email" type="email" required class="input rounded-t-md"
                            :placeholder="t('auth.emailAddress')" />
                    </div>
                    <div>
                        <label for="password" class="sr-only">{{ t('auth.password') }}</label>
                        <input id="password" v-model="password" name="password" type="password" required
                            class="input rounded-b-md" :placeholder="t('auth.password')" />
                    </div>
                </div>

                <div class="flex items-center justify-between">
                    <div class="text-sm">
                        <a href="#" @click.prevent="forgotPassword"
                            class="font-medium bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent  hover:text-indigo-500">
                            {{ t('auth.forgotPassword') }}
                        </a>
                    </div>
                </div>

                <div>
                    <button type="submit" class="btn-primary w-full" :disabled="loading">
                        {{ loading ? t('auth.signingIn') : t('auth.signIn') }}
                    </button>
                </div>
            </form>

            <p class="mt-2 text-center text-sm text-gray-600">
                {{ t('auth.noAccount') }}
                <a href="#" @click.prevent="goToRegister"
                    class="font-medium bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent  hover:text-indigo-500">
                    {{ t('auth.signUp') }}
                </a>
            </p>

            <div v-if="error"
                class="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm text-center">
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleSubmit(event) {
    if (loading.value) return

    try {
        loading.value = true
        error.value = ''

        // Attempt login - will return response.data on success or throw on error
        await authStore.login(email.value, password.value)

        // If we get here, login was successful, so navigate
        router.push({ path: '/' })
    } catch (err) {
        console.error('Login error:', err)
        // Your authStore throws either error.response.data or error.message
        error.value = typeof err === 'string' ? err : (err.message || t('auth.loginFailed'))
        // No navigation here, so errors will be visible on the page
    } finally {
        loading.value = false
    }
}

function forgotPassword() {
    router.push('/forgot-password')
}

function goToRegister() {
    router.push('/register')
}
</script>