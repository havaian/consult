<template>
    <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div class="max-w-md w-full space-y-8">
            <div>
                <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">{{ t('auth.createAccount') }}</h2>
            </div>

            <div v-if="registrationSuccess" class="rounded-md bg-green-50 p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <h3 class="text-sm font-medium text-green-800">{{ t('auth.registrationSuccessful') }}</h3>
                        <div class="mt-2 text-sm text-green-700">
                            <p>{{ t('auth.checkEmailToVerify') }}</p>
                        </div>
                        <div class="mt-4">
                            <router-link to="/login" class="text-sm font-medium text-green-600 hover:text-green-500">
                                {{ t('auth.goToLoginPage') }}
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>

            <form v-else class="mt-8 space-y-6" @submit.prevent="handleSubmit">
                <div class="rounded-md shadow-sm space-y-4">
                    <div>
                        <label for="role" class="label">{{ t('auth.iAmA') }}</label>
                        <select id="role" v-model="formData.role" class="input mt-1" required @change="watchRole">
                            <option value="client">{{ t('auth.client') }}</option>
                            <option value="advisor">{{ t('auth.advisor') }}</option>
                        </select>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="firstName" class="label">{{ t('user.firstName') }}</label>
                            <input id="firstName" v-model="formData.firstName" type="text" required
                                class="input mt-1" />
                        </div>
                        <div>
                            <label for="lastName" class="label">{{ t('user.lastName') }}</label>
                            <input id="lastName" v-model="formData.lastName" type="text" required class="input mt-1" />
                        </div>
                    </div>

                    <div>
                        <label for="email" class="label">{{ t('auth.emailAddress') }}</label>
                        <input id="email" v-model="formData.email" type="email" required class="input mt-1" />
                    </div>

                    <div>
                        <label for="phone" class="label">{{ t('auth.phoneNumber') }}</label>
                        <input id="phone" v-model="formData.phone" type="tel" required class="input mt-1"
                            :placeholder="t('auth.phoneNumberPlaceholder')" />
                    </div>

                    <div>
                        <label for="password" class="label">{{ t('auth.password') }}</label>
                        <input id="password" v-model="formData.password" type="password" required class="input mt-1" />
                    </div>

                    <template v-if="formData.role === 'advisor'">
                        <div>
                            <label for="specializations" class="label">{{ t('auth.specializations') }}</label>
                            <div class="space-y-2">
                                <div v-for="(spec, index) in formData.specializations" :key="index" class="flex gap-2">
                                    <select v-model="formData.specializations[index]" class="input flex-1">
                                        <option value="">{{ t('auth.selectSpecialization') }}</option>
                                        <option v-for="spec in availableSpecializations" :key="spec" :value="spec">
                                            {{ t(`specializations.${spec.toLowerCase().replace(/\s+/g, '')}`, spec) }}
                                        </option>
                                    </select>
                                    <button type="button" @click="removeSpecialization(index)"
                                        class="px-2 py-1 text-red-600 hover:text-red-800">
                                        {{ t('auth.remove') }}
                                    </button>
                                </div>
                                <button type="button" @click="addSpecialization"
                                    class="text-sm bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent  hover:text-indigo-800">
                                    {{ t('auth.addSpecialization') }}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label for="licenseNumber" class="label">{{ t('auth.licenseNumber') }}</label>
                            <input id="licenseNumber" v-model="formData.licenseNumber" type="text" required
                                class="input mt-1" />
                        </div>

                        <div>
                            <label for="experience" class="label">{{ t('auth.yearsOfExperience') }}</label>
                            <input id="experience" v-model.number="formData.experience" type="number" min="0" required
                                class="input mt-1" />
                        </div>

                        <div>
                            <label for="consultationFee" class="label">{{ t('auth.consultationFeeUZS') }}</label>
                            <input id="consultationFee" v-model.number="formData.consultationFee" type="number" min="0"
                                required class="input mt-1" />
                        </div>

                        <div>
                            <label for="languages" class="label">{{ t('auth.languages') }}</label>
                            <input id="languages" v-model="languagesInput" type="text" class="input mt-1"
                                :placeholder="t('auth.languagesPlaceholder')" />
                        </div>
                    </template>

                    <!-- Date of Birth - Only for clients -->
                    <div v-if="formData.role === 'client'">
                        <label for="dateOfBirth" class="label">{{ t('user.dateOfBirth') }}</label>
                        <input id="dateOfBirth" v-model="formData.dateOfBirth" type="date" required class="input mt-1"
                            :max="maxDate" />
                    </div>

                    <!-- Gender - Only for clients -->
                    <div v-if="formData.role === 'client'">
                        <label for="gender" class="label">{{ t('user.gender') }}</label>
                        <select id="gender" v-model="formData.gender" class="input mt-1" required>
                            <option value="">{{ t('auth.selectGender') }}</option>
                            <option value="male">{{ t('auth.male') }}</option>
                            <option value="female">{{ t('auth.female') }}</option>
                            <option value="other">{{ t('auth.other') }}</option>
                            <option value="prefer not to say">{{ t('auth.preferNotToSay') }}</option>
                        </select>
                    </div>
                </div>

                <div>
                    <button type="submit" class="btn-primary w-full" :disabled="loading">
                        {{ loading ? t('auth.creatingAccount') : t('auth.createAccount') }}
                    </button>
                </div>
            </form>

            <p class="mt-2 text-center text-sm text-gray-600">
                {{ t('auth.alreadyHaveAccount') }}
                <router-link to="/login"
                    class="font-medium bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent  hover:text-indigo-500">
                    {{ t('auth.signIn') }}
                </router-link>
            </p>

            <div v-if="error" class="mt-4 text-sm text-center text-red-600">
                {{ error }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import { useApi } from '@/composables/useApi'

const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()
const { api } = useApi()

const availableSpecializations = ref([])
const languagesInput = ref('')

const formData = reactive({
    role: 'client',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    dateOfBirth: '',
    gender: '',
    specializations: [],
    licenseNumber: '',
    experience: 0,
    consultationFee: 0
})

const registrationSuccess = ref(false)
const loading = ref(false)
const error = ref('')

// Calculate max date (18 years ago from today)
const maxDate = computed(() => {
    const date = new Date()
    date.setFullYear(date.getFullYear() - 18)
    return date.toISOString().split('T')[0]
})

// Helper functions for specializations
const addSpecialization = () => {
    formData.specializations.push('')
}

const removeSpecialization = (index) => {
    formData.specializations.splice(index, 1)
}

// Add default empty specialization when switching to advisor role
const watchRole = () => {
    if (formData.role === 'advisor' && formData.specializations.length === 0) {
        formData.specializations.push('')
    }
}

async function handleSubmit() {
    try {
        loading.value = true;
        error.value = '';

        // Create a copy of the formData to modify before sending
        const registrationData = { ...formData };

        if (registrationData.role === 'advisor') {
            // Make sure specializations is processed properly
            registrationData.specializations = formData.specializations.filter(s => s !== "");

            // Process languages for advisor registration
            if (languagesInput.value) {
                registrationData.languages = languagesInput.value.split(',').map(lang => lang.trim()).filter(Boolean);
            } else {
                registrationData.languages = [];
            }

            // Remove client-only fields for advisor registration
            delete registrationData.dateOfBirth;
            delete registrationData.gender;
        } else {
            // For client registration, remove all advisor-specific fields
            delete registrationData.specializations;
            delete registrationData.licenseNumber;
            delete registrationData.experience;
            delete registrationData.consultationFee;
            delete registrationData.languages;
        }

        await authStore.register(registrationData);
        registrationSuccess.value = true;
    } catch (err) {
        error.value = err.message || t('auth.registrationFailed');
    } finally {
        loading.value = false;
    }
}

async function fetchSpecializations() {
    try {
        const response = await api.get('/specializations')
        availableSpecializations.value = response.data.specializations.map(s => s.name)
    } catch (error) {
        console.error('Error fetching specializations:', error)
        // Set localized defaults in case API call fails
        availableSpecializations.value = [
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
            'Civil Law',
            'Contract Law',
            'Business Law',
            'Banking Law',
            'Insurance Law'
        ]
    }
}

onMounted(() => {
    fetchSpecializations()
})
</script>