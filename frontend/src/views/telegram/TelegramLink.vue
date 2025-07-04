<template>
    <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900">{{ t('telegram.link.title') }}</h2>
        <p class="mt-1 text-sm text-gray-500">
            {{ t('telegram.link.description') }}
        </p>

        <div v-if="!linked" class="mt-4">
            <form @submit.prevent="handleSubmit" class="space-y-4">
                <div>
                    <label for="email" class="label">{{ t('telegram.link.confirmEmail') }}</label>
                    <input id="email" v-model="email" type="email" class="input mt-1" required />
                </div>

                <div v-if="verificationSent">
                    <label for="code" class="label">{{ t('telegram.link.enterCode') }}</label>
                    <input id="code" v-model="verificationCode" type="text" class="input mt-1" required />
                </div>

                <button type="submit" class="btn-primary w-full" :disabled="loading">
                    {{ loading ? t('telegram.link.processing') : verificationSent ? t('telegram.link.verifyCode') :
                        t('telegram.link.sendCode') }}
                </button>
            </form>

            <div v-if="error" class="mt-2 text-sm text-red-600">
                {{ error }}
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

const props = defineProps({
    linked: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['update:linked'])

const email = ref('')
const verificationCode = ref('')
const verificationSent = ref(false)
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
    try {
        loading.value = true
        error.value = ''

        if (!verificationSent.value) {
            // Request verification code
            await api.post('/telegram/verification', {
                email: emails.value
            })
            verificationSent.value = true
        } else {
            // Verify code
            await api.post('/users/link-telegram', {
                verificationCode: verificationCode.value
            })
            emit('update:linked', true)
        }
    } catch (err) {
        error.value = err.response?.data?.message || t('telegram.link.errors.genericError')
    } finally {
        loading.value = false
    }
}
</script>