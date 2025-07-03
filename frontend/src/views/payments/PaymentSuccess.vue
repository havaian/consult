<template>
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full text-center">
            <div v-if="loading" class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                <p class="mt-4 text-gray-600">{{ t('payment.success.verifying') }}</p>
            </div>

            <template v-else>
                <div v-if="success" class="space-y-6">
                    <div class="rounded-full bg-green-100 h-24 w-24 flex items-center justify-center mx-auto">
                        <svg class="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>

                    <h2 class="text-3xl font-extrabold text-gray-900">
                        {{ t('payment.success.title') }}
                    </h2>
                    <p class="mt-2 text-sm text-gray-600">
                        {{ t('payment.success.description') }}
                    </p>

                    <div class="mt-8 space-y-4">
                        <router-link v-if="appointment"
                            :to="{ name: 'appointment-details', params: { id: appointment._id } }"
                            class="btn-primary w-full justify-center">
                            {{ t('payment.success.viewDetails') }}
                        </router-link>

                        <router-link :to="{ name: 'client-appointments' }" class="btn-secondary w-full justify-center">
                            {{ t('payment.success.viewAll') }}
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
                        {{ t('payment.success.verificationFailed') }}
                    </h2>
                    <p class="mt-2 text-sm text-gray-600">
                        {{ t('payment.success.verificationFailedDesc') }}
                    </p>

                    <div class="mt-8">
                        <router-link :to="{ name: 'client-appointments' }" class="btn-primary w-full justify-center">
                            {{ t('payment.success.returnToAppointments') }}
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
import { usePaymentStore } from '@/stores/payment'
import { useI18n } from '@/composables/useI18n'

const route = useRoute()
const router = useRouter()
const paymentStore = usePaymentStore()
const { t } = useI18n()

const appointment = ref(null)
const loading = ref(true)
const success = ref(false)

onMounted(async () => {
    try {
        const sessionId = route.query.session_id
        if (!sessionId) {
            router.push('/')
            return
        }

        const result = await paymentStore.verifyPayment(sessionId)
        if (result.success) {
            appointment.value = result.payment.appointment
            success.value = true
        }
    } catch (error) {
        console.error('Error verifying payment:', error)
        success.value = false
    } finally {
        loading.value = false
    }
})
</script>