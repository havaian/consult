<template>
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white shadow rounded-lg overflow-hidden">
            <div class="p-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-6">{{ t('profile.edit.title') }}</h1>

                <form @submit.prevent="handleSubmit" class="space-y-6">
                    <!-- Personal Information -->
                    <div>
                        <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.edit.personalInfo') }}</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="firstName" class="label">{{ t('profile.edit.firstName') }}</label>
                                <input id="firstName" v-model="formData.firstName" type="text" class="input mt-1"
                                    required />
                            </div>
                            <div>
                                <label for="lastName" class="label">{{ t('profile.edit.lastName') }}</label>
                                <input id="lastName" v-model="formData.lastName" type="text" class="input mt-1"
                                    required />
                            </div>
                            <div>
                                <label for="phone" class="label">{{ t('profile.phone') }}</label>
                                <input id="phone" v-model="formData.phone" type="tel" class="input mt-1" required />
                            </div>
                        </div>
                    </div>

                    <!-- Location -->
                    <div>
                        <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.location') }}</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label for="city" class="label">{{ t('profile.edit.city') }}</label>
                                <input id="city" v-model="formData.address.city" type="text" class="input mt-1" />
                            </div>
                            <div>
                                <label for="street" class="label">{{ t('profile.edit.street') }}</label>
                                <input id="street" v-model="formData.address.street" type="text" class="input mt-1" />
                            </div>
                        </div>
                    </div>

                    <!-- Advisor-specific fields -->
                    <template v-if="authStore.isAdvisor">
                        <div>
                            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.professionalInfo') }}</h2>

                            <!-- Specializations -->
                            <div class="mb-4">
                                <label class="label">{{ t('profile.edit.specializations') }}</label>
                                <div class="space-y-2">
                                    <div v-for="(spec, index) in formData.specializations" :key="index"
                                        class="flex gap-2">
                                        <select v-model="formData.specializations[index]" class="input flex-1">
                                            <option value="">{{ t('profile.edit.selectSpecialization') }}</option>
                                            <option v-for="spec in availableSpecializations" :key="spec" :value="spec">
                                                {{ spec }}
                                            </option>
                                        </select>
                                        <button type="button" @click="removeSpecialization(index)"
                                            class="px-2 py-1 text-red-600 hover:text-red-800">
                                            {{ t('common.remove') }}
                                        </button>
                                    </div>
                                    <button type="button" @click="addSpecialization"
                                        class="text-sm bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent hover:text-indigo-800">
                                        {{ t('profile.edit.addSpecialization') }}
                                    </button>
                                </div>
                            </div>

                            <!-- Education -->
                            <div class="mb-4">
                                <label class="label">{{ t('profile.education') }}</label>
                                <div class="space-y-2">
                                    <div v-for="(edu, index) in formData.education" :key="index"
                                        class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input v-model="edu.degree" type="text" class="input"
                                            :placeholder="t('profile.edit.degree')" />
                                        <input v-model="edu.institution" type="text" class="input"
                                            :placeholder="t('profile.edit.institution')" />
                                        <div class="flex gap-2">
                                            <input v-model.number="edu.year" type="number" class="input"
                                                :placeholder="t('profile.edit.year')" />
                                            <button type="button" @click="removeEducation(index)"
                                                class="px-2 py-1 text-red-600 hover:text-red-800">
                                                {{ t('common.remove') }}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="button" @click="addEducation"
                                        class="text-sm bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent hover:text-indigo-800">
                                        {{ t('profile.edit.addEducation') }}
                                    </button>
                                </div>
                            </div>

                            <!-- Certifications -->
                            <div class="mb-4">
                                <label class="label">{{ t('profile.certification') }}</label>
                                <div class="space-y-2">
                                    <div v-for="(cert, index) in formData.certifications" :key="index"
                                        class="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <input v-model="cert.name" type="text" class="input"
                                            :placeholder="t('profile.edit.certificateName')" />
                                        <input v-model="cert.issuer" type="text" class="input"
                                            :placeholder="t('profile.edit.issuingOrganization')" />
                                        <div class="flex gap-2">
                                            <input v-model.number="cert.year" type="number" class="input"
                                                :placeholder="t('profile.edit.year')" />
                                            <button type="button" @click="removeCertification(index)"
                                                class="px-2 py-1 text-red-600 hover:text-red-800">
                                                {{ t('common.remove') }}
                                            </button>
                                        </div>
                                    </div>
                                    <button type="button" @click="addCertification"
                                        class="text-sm bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent hover:text-indigo-800">
                                        {{ t('profile.edit.addCertification') }}
                                    </button>
                                </div>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="consultationFee" class="label">{{ t('profile.edit.consultationFeeUZS')
                                    }}</label>
                                    <input id="consultationFee" v-model.number="formData.consultationFee" type="number"
                                        min="0" class="input mt-1" required />
                                </div>
                                <div>
                                    <label for="experience" class="label">{{ t('profile.edit.yearsOfExperience')
                                    }}</label>
                                    <input id="experience" v-model.number="formData.experience" type="number" min="0"
                                        class="input mt-1" required />
                                </div>
                            </div>

                            <div class="mt-4">
                                <label for="languages" class="label">{{ t('profile.edit.languages') }}</label>
                                <input id="languages" v-model="languagesInput" type="text" class="input mt-1"
                                    :placeholder="t('profile.edit.languagesPlaceholder')" />
                            </div>

                            <div class="mt-4">
                                <label for="bio" class="label">{{ t('profile.edit.bio') }}</label>
                                <textarea id="bio" v-model="formData.bio" rows="4" class="input mt-1"></textarea>
                            </div>

                            <!-- Availability -->
                            <div class="mt-4">
                                <label class="label">{{ t('profile.availability') }}</label>
                                <div class="space-y-2">
                                    <div v-for="day in formData.availability" :key="day.dayOfWeek"
                                        class="grid grid-cols-4 gap-4 items-center">
                                        <div class="flex items-center">
                                            <input type="checkbox" v-model="day.isAvailable" class="mr-2" />
                                            <span>{{ formatDay(day.dayOfWeek) }}</span>
                                        </div>
                                        <input type="time" v-model="day.startTime" class="input"
                                            :disabled="!day.isAvailable" />
                                        <input type="time" v-model="day.endTime" class="input"
                                            :disabled="!day.isAvailable" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Client-specific fields -->
                    <template v-else>
                        <div>
                            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.edit.legalInfo') }}</h2>
                            <div class="space-y-4">
                                <div>
                                    <label for="legalHistory" class="label">{{ t('profile.client.legalHistory')
                                    }}</label>
                                    <input id="legalHistory" v-model="legalHistoryInput" type="text" class="input mt-1"
                                        :placeholder="t('profile.edit.separateWithCommas')" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <h2 class="text-lg font-medium text-gray-900 mb-4">{{ t('profile.client.emergencyContact')
                            }}</h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label for="emergencyName" class="label">{{ t('profile.client.name') }}</label>
                                    <input id="emergencyName" v-model="formData.emergencyContact.name" type="text"
                                        class="input mt-1" />
                                </div>
                                <div>
                                    <label for="emergencyPhone" class="label">{{ t('profile.phone') }}</label>
                                    <input id="emergencyPhone" v-model="formData.emergencyContact.phone" type="tel"
                                        class="input mt-1" />
                                </div>
                                <div>
                                    <label for="emergencyRelationship" class="label">{{ t('profile.client.relationship')
                                    }}</label>
                                    <input id="emergencyRelationship" v-model="formData.emergencyContact.relationship"
                                        type="text" class="input mt-1" />
                                </div>
                            </div>
                        </div>
                    </template>

                    <div class="flex justify-end space-x-4">
                        <router-link :to="{ name: authStore.isAdvisor ? 'advisor-profile' : 'client-profile' }"
                            class="btn-secondary">
                            {{ t('common.cancel') }}
                        </router-link>
                        <button type="submit" class="btn-primary" :disabled="loading">
                            {{ loading ? t('profile.edit.saving') : t('profile.edit.saveChanges') }}
                        </button>
                    </div>
                </form>
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
const loading = ref(false)

// Replace the hardcoded specializations with a ref to be filled from API
const availableSpecializations = ref([])

const formData = reactive({
    firstName: '',
    lastName: '',
    phone: '',
    address: {
        street: '',
        city: ''
    },
    specializations: [],
    education: [],
    certifications: [],
    consultationFee: 0,
    experience: 0,
    languages: [],
    bio: '',
    availability: [
        { dayOfWeek: 1, isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 2, isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 3, isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 4, isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 5, isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 6, isAvailable: false, startTime: '09:00', endTime: '17:00' },
        { dayOfWeek: 7, isAvailable: false, startTime: '09:00', endTime: '17:00' }
    ],
    legalHistory: '',
    emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
    }
})

const languagesInput = ref('')
const legalHistoryInput = ref('')
const conditionsInput = ref('')

// Helper functions for arrays
const addSpecialization = () => {
    formData.specializations.push('')
}

const removeSpecialization = (index) => {
    formData.specializations.splice(index, 1)
}

const addEducation = () => {
    formData.education.push({ degree: '', institution: '', year: null })
}

const removeEducation = (index) => {
    formData.education.splice(index, 1)
}

const addCertification = () => {
    formData.certifications.push({ name: '', issuer: '', year: null })
}

const removeCertification = (index) => {
    formData.certifications.splice(index, 1)
}

const formatDay = (dayOfWeek) => {
    const days = [
        t('profile.days.monday'),
        t('profile.days.tuesday'),
        t('profile.days.wednesday'),
        t('profile.days.thursday'),
        t('profile.days.friday'),
        t('profile.days.saturday'),
        t('profile.days.sunday')
    ]
    return days[dayOfWeek - 1]
}

// Added function to fetch specializations from the API
async function fetchSpecializations() {
    try {
        const response = await api.get('/specializations')
        availableSpecializations.value = response.data.specializations.map(s => s.name)
    } catch (error) {
        console.error('Error fetching specializations:', error)
        // Set some defaults in case API call fails
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
        ]
    }
}

async function fetchUserProfile() {
    try {
        const response = await api.get('/users/me')
        const user = response.data.user

        // Update form data
        formData.firstName = user.firstName
        formData.lastName = user.lastName
        formData.phone = user.phone
        formData.address = user.address || { street: '', city: '' }

        if (authStore.isAdvisor) {
            // Handle specializations properly as an array
            formData.specializations = Array.isArray(user.specializations) ?
                user.specializations :
                (user.specialization ? [user.specialization] : [])

            formData.education = user.education || []
            formData.certifications = user.certifications || []
            formData.consultationFee = user.consultationFee || 0
            formData.experience = user.experience || 0
            formData.languages = user.languages || []
            formData.bio = user.bio || ''
            formData.availability = user.availability || formData.availability

            // Update input fields
            languagesInput.value = user.languages?.join(', ') || ''
        } else {
            formData.legalHistory = user.legalHistory || ''
            formData.emergencyContact = user.emergencyContact || { name: '', phone: '', relationship: '' }

            // Update input fields
            legalHistoryInput.value = user.legalHistory || ''
        }
    } catch (error) {
        console.error('Error fetching user profile:', error)
    }
}

async function handleSubmit() {
    try {
        loading.value = true

        // Prepare update data
        const updateData = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address
        }

        if (authStore.isAdvisor) {
            // Ensure specializations is an array of non-empty strings
            updateData.specializations = formData.specializations.filter(Boolean)
            updateData.education = formData.education.filter(e => e.degree && e.institution && e.year)
            updateData.certifications = formData.certifications.filter(c => c.name && c.issuer && c.year)
            updateData.consultationFee = formData.consultationFee
            updateData.experience = formData.experience
            updateData.languages = languagesInput.value.split(',').map(lang => lang.trim()).filter(Boolean)
            updateData.bio = formData.bio
            updateData.availability = formData.availability
        } else {
            updateData.legalHistory = legalHistoryInput.value
            updateData.emergencyContact = formData.emergencyContact
        }

        await api.patch('/users/me', updateData)
        router.push({ name: authStore.isAdvisor ? 'advisor-profile' : 'client-profile' })
    } catch (error) {
        console.error('Error updating profile:', error)
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchUserProfile()
    // Fetch specializations if user is a advisor
    if (authStore.isAdvisor) {
        fetchSpecializations()
    }
})
</script>