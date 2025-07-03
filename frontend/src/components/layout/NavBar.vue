<template>
    <nav class="bg-white/95 backdrop-blur-md shadow-lg border-b border-royal-gold/10 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-24">
                <!-- Logo and main navigation -->
                <div class="flex items-center">
                    <!-- Logo -->
                    <a href='https://bolt.new/' target="_blank" rel="noopener noreferrer"
                        class="flex items-center space-x-3">
                        <img class="h-24 w-24 text-white" src="/images/logo.png" alt="">
                    </a>
                    <router-link to="/" class="flex items-center space-x-3">
                        <span class="text-xl font-bold">
                            CONSULT.<span
                                class="bg-gradient-to-r from-royal-gold to-charcoal bg-clip-text text-transparent">YTECH</span><span
                                class="text-royal-gold-light">.SPACE</span>
                        </span>
                    </router-link>

                    <!-- Desktop Navigation -->
                    <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
                        <router-link to="/"
                            class="text-gray-700 hover:text-royal-gold px-3 py-2 text-sm font-medium transition-colors duration-200"
                            :class="{ 'text-royal-gold border-b-2 border-royal-gold': $route.path === '/' }">
                            {{ t('nav.home') }}
                        </router-link>
                        <router-link to="/advisors"
                            class="text-gray-700 hover:text-royal-gold px-3 py-2 text-sm font-medium transition-colors duration-200"
                            :class="{ 'text-royal-gold border-b-2 border-royal-gold': $route.path === '/advisors' }">
                            {{ t('nav.findAdvisors') }}
                        </router-link>
                        <template v-if="authStore.isAuthenticated">
                            <router-link v-if="authStore.isClient" to="/appointments/client"
                                class="text-gray-700 hover:text-royal-gold px-3 py-2 text-sm font-medium transition-colors duration-200"
                                :class="{ 'text-royal-gold border-b-2 border-royal-gold': $route.path.includes('/appointments/client') }">
                                {{ t('nav.myAppointments') }}
                            </router-link>
                            <router-link v-if="authStore.isAdvisor" to="/appointments/advisor"
                                class="text-gray-700 hover:text-royal-gold px-3 py-2 text-sm font-medium transition-colors duration-200"
                                :class="{ 'text-royal-gold border-b-2 border-royal-gold': $route.path.includes('/appointments/advisor') }">
                                {{ t('nav.mySchedule') }}
                            </router-link>
                        </template>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <div class="sm:hidden flex items-center">
                    <!-- Language Switcher for Mobile -->
                    <div class="mr-3">
                        <LanguageSwitcher />
                    </div>

                    <button @click="toggleMobileMenu" type="button"
                        class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-royal-gold hover:bg-royal-gold/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-royal-gold transition-colors duration-200">
                        <span class="sr-only">{{ t('nav.openMainMenu') }}</span>
                        <!-- Icon when menu is closed -->
                        <svg v-if="!showMobileMenu" class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        <!-- Icon when menu is open -->
                        <svg v-else class="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <!-- Desktop profile menu -->
                <div class="hidden sm:flex sm:items-center sm:space-x-4">
                    <!-- Desktop Language Switcher -->
                    <LanguageSwitcher />

                    <template v-if="authStore.isAuthenticated">
                        <div class="relative">
                            <button @click="toggleProfileMenu"
                                class="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-royal-gold/10 to-charcoal/10 hover:from-royal-gold/20 hover:to-charcoal/20 transition-all duration-200 border border-royal-gold/20">
                                <div
                                    class="w-8 h-8 bg-gradient-to-r from-royal-gold to-charcoal rounded-full flex items-center justify-center">
                                    <span class="text-white font-semibold text-sm">{{ authStore.user?.firstName?.[0]
                                        }}</span>
                                </div>
                                <span class="text-sm font-medium text-gray-700">{{ authStore.user?.firstName }}</span>
                                <svg class="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                        d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div v-if="showProfileMenu"
                                class="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white/95 backdrop-blur-md ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 border border-royal-gold/10">
                                <div class="py-1">
                                    <router-link :to="authStore.isAdvisor ? '/profile/advisor' : '/profile/client'"
                                        class="block px-4 py-3 text-sm text-gray-700 hover:bg-royal-gold/5 hover:text-royal-gold transition-colors duration-200">
                                        <div class="flex items-center space-x-3">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>{{ t('nav.myProfile') }}</span>
                                        </div>
                                    </router-link>
                                    <router-link to="/profile/edit"
                                        class="block px-4 py-3 text-sm text-gray-700 hover:bg-royal-gold/5 hover:text-royal-gold transition-colors duration-200">
                                        <div class="flex items-center space-x-3">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span>{{ t('nav.editProfile') }}</span>
                                        </div>
                                    </router-link>
                                </div>
                                <div class="py-1">
                                    <button @click="logout"
                                        class="block w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200">
                                        <div class="flex items-center space-x-3">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                            </svg>
                                            <span>{{ t('nav.signOut') }}</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <router-link to="/login"
                            class="text-royal-gold hover:text-charcoal font-medium px-4 py-2 rounded-xl transition-colors duration-200">
                            {{ t('nav.signIn') }}
                        </router-link>
                        <router-link to="/register" class="btn-legal-primary text-sm">
                            {{ t('nav.getStarted') }}
                        </router-link>
                    </template>
                </div>
            </div>
        </div>

        <!-- Mobile menu -->
        <div v-if="showMobileMenu" class="sm:hidden bg-white/95 backdrop-blur-md border-t border-royal-gold/10">
            <div class="px-2 pt-2 pb-3 space-y-1">
                <router-link to="/"
                    class="text-gray-700 hover:text-royal-gold block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    :class="{ 'text-royal-gold bg-royal-gold/5': $route.path === '/' }" @click="closeMobileMenu">
                    {{ t('nav.home') }}
                </router-link>
                <router-link to="/advisors"
                    class="text-gray-700 hover:text-royal-gold block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    :class="{ 'text-royal-gold bg-royal-gold/5': $route.path === '/advisors' }"
                    @click="closeMobileMenu">
                    {{ t('nav.findAdvisors') }}
                </router-link>
                <template v-if="authStore.isAuthenticated">
                    <router-link v-if="authStore.isClient" to="/appointments/client"
                        class="text-gray-700 hover:text-royal-gold block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                        :class="{ 'text-royal-gold bg-royal-gold/5': $route.path.includes('/appointments/client') }"
                        @click="closeMobileMenu">
                        {{ t('nav.myAppointments') }}
                    </router-link>
                    <router-link v-if="authStore.isAdvisor" to="/appointments/advisor"
                        class="text-gray-700 hover:text-royal-gold block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                        :class="{ 'text-royal-gold bg-royal-gold/5': $route.path.includes('/appointments/advisor') }"
                        @click="closeMobileMenu">
                        {{ t('nav.mySchedule') }}
                    </router-link>
                    <div class="border-t border-gray-200 pt-4 pb-3">
                        <div class="flex items-center px-3 mb-3">
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-royal-gold to-charcoal rounded-full flex items-center justify-center">
                                <span class="text-white font-semibold">{{ authStore.user?.firstName?.[0] }}</span>
                            </div>
                            <div class="ml-3">
                                <div class="text-base font-medium text-gray-800">{{ authStore.user?.firstName }} {{
                                    authStore.user?.lastName }}</div>
                                <div class="text-sm font-medium text-gray-500">{{ authStore.user?.email }}</div>
                            </div>
                        </div>
                        <router-link :to="authStore.isAdvisor ? '/profile/advisor' : '/profile/client'"
                            class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-royal-gold hover:bg-royal-gold/5 transition-colors duration-200"
                            @click="closeMobileMenu">
                            {{ t('nav.myProfile') }}
                        </router-link>
                        <router-link to="/profile/edit"
                            class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-royal-gold hover:bg-royal-gold/5 transition-colors duration-200"
                            @click="closeMobileMenu">
                            {{ t('nav.editProfile') }}
                        </router-link>
                        <button @click="logout"
                            class="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200">
                            {{ t('nav.signOut') }}
                        </button>
                    </div>
                </template>
                <template v-else>
                    <div class="border-t border-gray-200 pt-4 pb-3 space-y-2">
                        <router-link to="/login"
                            class="block px-3 py-2 text-base font-medium text-royal-gold hover:text-charcoal transition-colors duration-200"
                            @click="closeMobileMenu">
                            {{ t('nav.signIn') }}
                        </router-link>
                        <router-link to="/register" class="block mx-3 btn-legal-primary text-center text-sm"
                            @click="closeMobileMenu">
                            {{ t('nav.getStarted') }}
                        </router-link>
                    </div>
                </template>
            </div>
        </div>
    </nav>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from '@/composables/useI18n'
import LanguageSwitcher from '@/components/LanguageSwitcher.vue'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

const showMobileMenu = ref(false)
const showProfileMenu = ref(false)

const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value
    showProfileMenu.value = false
}

const closeMobileMenu = () => {
    showMobileMenu.value = false
}

const toggleProfileMenu = () => {
    showProfileMenu.value = !showProfileMenu.value
    showMobileMenu.value = false
}

const logout = async () => {
    await authStore.logout()
    showProfileMenu.value = false
    showMobileMenu.value = false
    router.push('/')
}

// Close menus when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.relative')) {
        showProfileMenu.value = false
    }
    if (!e.target.closest('nav')) {
        showMobileMenu.value = false
    }
})
</script>