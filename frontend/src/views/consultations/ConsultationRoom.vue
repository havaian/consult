<template>
    <div class="min-h-screen bg-gray-100">
        <!-- Header -->
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold text-gray-900">
                            {{ t('consultation.titleWith', {
                                name: consultation?.client?.name || consultation?.advisor?.name
                            }) }}
                        </h1>
                        <span class="ml-4 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" :class="{
                            'bg-green-100 text-green-800': isConnected,
                            'bg-red-100 text-red-800': !isConnected
                        }">
                            {{ isConnected ? t('consultation.status.connected') : t('consultation.status.connecting') }}
                        </span>
                    </div>
                    <button class="btn-secondary text-red-600 hover:text-red-700" @click="showEndConsultationConfirm">
                        {{ t('consultation.endConsultation') }}
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 gap-8">
                <!-- Video Area -->
                <div class="bg-white shadow rounded-lg overflow-hidden">
                    <!-- Jitsi Meet container -->
                    <div id="jitsi-container" class="w-full h-[600px]"></div>
                </div>
            </div>
        </main>

        <!-- End Consultation Confirmation Modal -->
        <div v-if="showEndConfirmation"
            class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
                <div class="p-6">
                    <h3 class="text-lg font-medium text-gray-900">{{ t('consultation.endConsultation') }}</h3>
                    <p class="mt-2 text-sm text-gray-500">
                        {{ t('consultation.endConfirmation') }}
                        {{ isAdvisor ? t('consultation.advisorEndNote') : '' }}
                    </p>
                    <div class="mt-4 flex justify-end space-x-3">
                        <button @click="showEndConfirmation = false" class="btn-secondary">
                            {{ t('common.cancel') }}
                        </button>
                        <button @click="confirmEndConsultation" class="btn-primary bg-red-600 hover:bg-red-700">
                            {{ t('consultation.endConsultation') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Post-Consultation Form for Advisors -->
        <div v-if="showPostConsultationForm && isAdvisor"
            class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-4xl w-full mx-4 my-8">
                <div class="p-6 max-h-[90vh] overflow-y-auto">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">{{ t('consultation.postForm.title') }}</h3>

                    <form @submit.prevent="submitPostConsultationForm">
                        <!-- Consultation Summary -->
                        <div class="mb-6">
                            <label for="consultationSummary" class="block text-sm font-medium text-gray-700 mb-1">
                                {{ t('consultation.postForm.summary') }}
                            </label>
                            <textarea id="consultationSummary" v-model="postConsultationData.consultationSummary"
                                rows="4" class="input w-full" required></textarea>
                        </div>

                        <!-- Advices -->
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-2">
                                <h4 class="text-lg font-medium text-gray-900">{{ t('consultation.postForm.advices') }}
                                </h4>
                                <button type="button" @click="addAdvice"
                                    class="text-sm bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent hover:text-indigo-900">
                                    {{ t('consultation.postForm.addAdvice') }}
                                </button>
                            </div>

                            <div v-for="(advice, index) in postConsultationData.advices" :key="index"
                                class="bg-gray-50 p-4 rounded-lg mb-3">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <label :for="`action-${index}`"
                                            class="block text-sm font-medium text-gray-700 mb-1">
                                            {{ t('consultation.postForm.advice.action') }}
                                        </label>
                                        <input :id="`action-${index}`" v-model="advice.action" type="text"
                                            class="input w-full" required />
                                    </div>
                                    <div>
                                        <label :for="`dosage-${index}`"
                                            class="block text-sm font-medium text-gray-700 mb-1">
                                            {{ t('consultation.postForm.advice.dosage') }}
                                        </label>
                                        <input :id="`dosage-${index}`" v-model="advice.dosage" type="text"
                                            class="input w-full" required />
                                    </div>
                                </div>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
                                    <div>
                                        <label :for="`frequency-${index}`"
                                            class="block text-sm font-medium text-gray-700 mb-1">
                                            {{ t('consultation.postForm.advice.frequency') }}
                                        </label>
                                        <input :id="`frequency-${index}`" v-model="advice.frequency" type="text"
                                            class="input w-full" required />
                                    </div>
                                    <div>
                                        <label :for="`duration-${index}`"
                                            class="block text-sm font-medium text-gray-700 mb-1">
                                            {{ t('consultation.postForm.advice.duration') }}
                                        </label>
                                        <input :id="`duration-${index}`" v-model="advice.duration" type="text"
                                            class="input w-full" required />
                                    </div>
                                </div>
                                <div class="mb-2">
                                    <label :for="`instructions-${index}`"
                                        class="block text-sm font-medium text-gray-700 mb-1">
                                        {{ t('consultation.postForm.advice.instructions') }}
                                    </label>
                                    <textarea :id="`instructions-${index}`" v-model="advice.instructions" rows="2"
                                        class="input w-full"></textarea>
                                </div>
                                <button type="button" @click="removeAdvice(index)"
                                    class="text-sm text-red-600 hover:text-red-900">
                                    {{ t('common.remove') }}
                                </button>
                            </div>

                            <div v-if="postConsultationData.advices.length === 0"
                                class="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                                {{ t('consultation.postForm.noAdvices') }}
                            </div>
                        </div>

                        <!-- Follow-up Recommendation -->
                        <div class="mb-6">
                            <div class="flex items-center mb-2">
                                <input id="followUpRecommended" v-model="postConsultationData.followUp.recommended"
                                    type="checkbox"
                                    class="h-4 w-4 bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent rounded" />
                                <label for="followUpRecommended" class="ml-2 block text-sm font-medium text-gray-700">
                                    {{ t('consultation.postForm.followUp.recommend') }}
                                </label>
                            </div>

                            <div v-if="postConsultationData.followUp.recommended" class="ml-6 mt-3">
                                <label for="followUpDate" class="block text-sm font-medium text-gray-700 mb-1">
                                    {{ t('consultation.postForm.followUp.date') }}
                                </label>
                                <input id="followUpDate" v-model="postConsultationData.followUp.date" type="date"
                                    class="input w-full" :min="minFollowUpDate" required />

                                <div class="mt-3">
                                    <label for="followUpNotes" class="block text-sm font-medium text-gray-700 mb-1">
                                        {{ t('consultation.postForm.followUp.notes') }}
                                    </label>
                                    <textarea id="followUpNotes" v-model="postConsultationData.followUp.notes" rows="2"
                                        class="input w-full"></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Chat Log (if available) -->
                        <div v-if="chatLog.length > 0" class="mb-6">
                            <h4 class="text-lg font-medium text-gray-900 mb-2">{{ t('consultation.postForm.chatLog') }}
                            </h4>
                            <div class="bg-gray-50 p-4 rounded-lg h-40 overflow-y-auto">
                                <div v-for="(message, index) in chatLog" :key="index" class="mb-2">
                                    <span class="font-semibold">{{ message.sender }}:</span> {{ message.text }}
                                    <span class="text-xs text-gray-500 ml-2">{{ message.time }}</span>
                                </div>
                            </div>
                        </div>

                        <div class="mt-6 flex justify-end space-x-3">
                            <button type="button" @click="skipPostConsultation" class="btn-secondary">
                                {{ t('common.skip') }}
                            </button>
                            <button type="submit" class="btn-primary" :disabled="submitting">
                                {{ submitting ? t('consultation.postForm.saving') :
                                    t('consultation.postForm.saveAndEnd') }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <!-- Follow-up Created Notification -->
        <div v-if="showFollowUpNotification"
            class="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg overflow-hidden shadow-xl max-w-md w-full mx-4">
                <div class="p-6">
                    <div class="flex items-center justify-center mb-4">
                        <div class="bg-green-100 rounded-full p-3">
                            <svg class="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 text-center">{{ t('consultation.followUpCreated.title')
                        }}</h3>
                    <p class="mt-2 text-sm text-gray-500 text-center">
                        {{ t('consultation.followUpCreated.description') }}
                    </p>
                    <div class="mt-4 flex justify-center">
                        <button @click="returnToAppointments" class="btn-primary">
                            {{ t('consultation.followUpCreated.returnToAppointments') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'
import { format, addDays } from 'date-fns'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const { api } = useApi()

const isConnected = ref(false)
const consultation = ref(null)
const jitsiApi = ref(null)
const chatLog = ref([])
const submitting = ref(false)

// Modal states
const showEndConfirmation = ref(false)
const showPostConsultationForm = ref(false)
const showFollowUpNotification = ref(false)

// Post-consultation form data
const postConsultationData = reactive({
    consultationSummary: '',
    advices: [],
    followUp: {
        recommended: false,
        date: '',
        notes: ''
    }
})

const isAdvisor = computed(() => authStore.isAdvisor)

const minFollowUpDate = computed(() => {
    const tomorrow = addDays(new Date(), 1)
    return format(tomorrow, 'yyyy-MM-dd')
})

function loadJitsiScript() {
    return new Promise((resolve, reject) => {
        if (document.getElementById('jitsi-api-script')) {
            resolve()
            return
        }

        const script = document.createElement('script')
        script.id = 'jitsi-api-script'
        script.src = 'https://meet.jit.si/external_api.js'
        script.async = true
        script.onload = resolve
        script.onerror = reject
        document.body.appendChild(script)
    })
}

async function initializeJitsi() {
    try {
        if (!consultation.value?.jitsi) {
            throw new Error('Jitsi configuration not available')
        }

        await loadJitsiScript()

        // Wait for the JitsiMeetExternalAPI to be available
        if (!window.JitsiMeetExternalAPI) {
            throw new Error('Jitsi Meet External API not loaded')
        }

        const { domain, roomName, token } = consultation.value.jitsi

        // Configure Jitsi options
        const options = {
            roomName,
            jwt: token,
            width: '100%',
            height: '100%',
            parentNode: document.getElementById('jitsi-container'),
            configOverwrite: {
                prejoinPageEnabled: false,
                disableDeepLinking: true,
                startWithAudioMuted: false,
                startWithVideoMuted: false
            },
            interfaceConfigOverwrite: {
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
                DEFAULT_BACKGROUND: '#FFFFFF',
                DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
                TOOLBAR_BUTTONS: [
                    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
                    'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
                    'settings', 'raisehand', 'videoquality', 'filmstrip', 'feedback',
                    'stats', 'tileview'
                ]
            },
            userInfo: {
                displayName: authStore.isAdvisor ?
                    `${authStore.user.firstName} ${authStore.user.lastName}` :
                    `${authStore.user.firstName} ${authStore.user.lastName}`
            }
        }

        // Create Jitsi Meet external API instance
        jitsiApi.value = new window.JitsiMeetExternalAPI(domain, options)

        // Set event listeners
        jitsiApi.value.on('videoConferenceJoined', () => {
            isConnected.value = true
        })

        jitsiApi.value.on('videoConferenceLeft', () => {
            if (isAdvisor.value) {
                // If advisor hasn't completed the form yet, show it
                if (!showPostConsultationForm.value) {
                    showPostConsultationForm.value = true
                }
            } else {
                router.push({ name: 'appointment-details', params: { id: route.params.appointmentId } })
            }
        })

        // Try to capture chat messages
        jitsiApi.value.on('chatUpdated', (event) => {
            if (event && event.message) {
                chatLog.value.push({
                    sender: event.from || 'Unknown',
                    text: event.message,
                    time: format(new Date(), 'HH:mm')
                })
            }
        })
    } catch (error) {
        console.error('Error initializing Jitsi:', error)
        isConnected.value = false
    }
}

function showEndConsultationConfirm() {
    showEndConfirmation.value = true
}

function confirmEndConsultation() {
    showEndConfirmation.value = false

    // Dispose Jitsi API 
    if (jitsiApi.value) {
        // Try to get chat history if possible
        try {
            const messages = jitsiApi.value.getChatHistory()
            if (messages && Array.isArray(messages)) {
                chatLog.value = messages.map(msg => ({
                    sender: msg.from || 'Unknown',
                    text: msg.message,
                    time: format(new Date(msg.timestamp || Date.now()), 'HH:mm')
                }))
            }
        } catch (e) {
            console.log('Chat history not available:', e)
        }

        jitsiApi.value.dispose()
    }

    if (isAdvisor.value) {
        showPostConsultationForm.value = true
    } else {
        router.push({ name: 'appointment-details', params: { id: route.params.appointmentId } })
    }
}

function addAdvice() {
    postConsultationData.advices.push({
        action: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
    })
}

function removeAdvice(index) {
    postConsultationData.advices.splice(index, 1)
}

async function submitPostConsultationForm() {
    try {
        submitting.value = true

        // 1. Update appointment status to completed and add consultation summary
        await api.patch(`/appointments/${route.params.appointmentId}/status`, {
            status: 'completed',
            consultationSummary: postConsultationData.consultationSummary
        })

        // 2. Add advices if any
        if (postConsultationData.advices.length > 0) {
            await api.patch(`/appointments/${route.params.appointmentId}/advices`, {
                advices: postConsultationData.advices
            })
        }

        // 3. Schedule follow-up if recommended
        if (postConsultationData.followUp.recommended) {
            await api.post(`/appointments/${route.params.appointmentId}/follow-up`, {
                followUpDate: postConsultationData.followUp.date,
                notes: postConsultationData.followUp.notes
            })

            // Show follow-up notification
            showPostConsultationForm.value = false
            showFollowUpNotification.value = true
        } else {
            returnToAppointments()
        }
    } catch (error) {
        console.error('Error submitting post-consultation data:', error)
        alert(t('consultation.errors.saveError'))
    } finally {
        submitting.value = false
    }
}

function skipPostConsultation() {
    // Just end the consultation without saving any data
    router.push({ name: 'advisor-appointments' })
}

function returnToAppointments() {
    router.push(isAdvisor.value ?
        { name: 'advisor-appointments' } :
        { name: 'client-appointments' }
    )
}

onMounted(async () => {
    try {
        // Get consultation details
        const response = await api.get(`/consultations/${route.params.appointmentId}/join`)
        consultation.value = response.data.consultation

        await initializeJitsi()
    } catch (error) {
        console.error('Error joining consultation:', error)
        router.push({ name: 'appointment-details', params: { id: route.params.appointmentId } })
    }
})

onUnmounted(() => {
    // Clean up Jitsi
    if (jitsiApi.value) {
        jitsiApi.value.dispose()
    }
})
</script>