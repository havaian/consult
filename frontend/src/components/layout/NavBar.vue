<template>
    <nav class="bg-white/95 backdrop-blur-md shadow-lg border-b border-legal-blue/10 sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <!-- Logo and main navigation -->
                <div class="flex items-center">
                    <!-- Logo -->
                    <router-link to="/" class="flex items-center space-x-3">
                        <div class="bg-gradient-to-r from-legal-blue to-legal-teal rounded-xl p-2 shadow-lg">
                            <svg class="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <span class="text-xl font-bold">
                            ONLINE-<span
                                class="bg-gradient-to-r from-legal-blue to-legal-teal bg-clip-text text-transparent">CONSULT</span><span
                                class="text-legal-green">.COM</span>
                        </span>
                    </router-link>

                    <!-- Desktop Navigation -->
                    <div class="hidden sm:ml-8 sm:flex sm:space-x-8">
                        <router-link to="/"
                            class="text-gray-700 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors duration-200"
                            :class="{ 'text-legal-blue border-b-2 border-legal-blue': $route.path === '/' }">
                            Home
                        </router-link>
                        <router-link to="/advisors"
                            class="text-gray-700 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors duration-200"
                            :class="{ 'text-legal-blue border-b-2 border-legal-blue': $route.path === '/advisors' }">
                            Find Advisors
                        </router-link>
                        <template v-if="authStore.isAuthenticated">
                            <router-link v-if="authStore.isClient" to="/appointments/client"
                                class="text-gray-700 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors duration-200"
                                :class="{ 'text-legal-blue border-b-2 border-legal-blue': $route.path.includes('/appointments/client') }">
                                My Appointments
                            </router-link>
                            <router-link v-if="authStore.isAdvisor" to="/appointments/advisor"
                                class="text-gray-700 hover:text-legal-blue px-3 py-2 text-sm font-medium transition-colors duration-200"
                                :class="{ 'text-legal-blue border-b-2 border-legal-blue': $route.path.includes('/appointments/advisor') }">
                                My Schedule
                            </router-link>
                        </template>
                    </div>
                </div>

                <!-- Mobile menu button -->
                <div class="sm:hidden flex items-center">
                    <button @click="toggleMobileMenu" type="button"
                        class="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-legal-blue hover:bg-legal-blue/5 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-legal-blue transition-colors duration-200">
                        <span class="sr-only">Open main menu</span>
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
                    <template v-if="authStore.isAuthenticated">
                        <div class="relative">
                            <button @click="toggleProfileMenu"
                                class="flex items-center space-x-3 px-4 py-2 rounded-xl bg-gradient-to-r from-legal-blue/10 to-legal-teal/10 hover:from-legal-blue/20 hover:to-legal-teal/20 transition-all duration-200 border border-legal-blue/20">
                                <div
                                    class="w-8 h-8 bg-gradient-to-r from-legal-blue to-legal-teal rounded-full flex items-center justify-center">
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
                                class="absolute right-0 mt-2 w-56 rounded-xl shadow-lg bg-white/95 backdrop-blur-md ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 border border-legal-blue/10">
                                <div class="py-1">
                                    <router-link :to="authStore.isAdvisor ? '/profile/advisor' : '/profile/client'"
                                        class="block px-4 py-3 text-sm text-gray-700 hover:bg-legal-blue/5 hover:text-legal-blue transition-colors duration-200">
                                        <div class="flex items-center space-x-3">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>My Profile</span>
                                        </div>
                                    </router-link>
                                    <router-link to="/profile/edit"
                                        class="block px-4 py-3 text-sm text-gray-700 hover:bg-legal-blue/5 hover:text-legal-blue transition-colors duration-200">
                                        <div class="flex items-center space-x-3">
                                            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            <span>Edit Profile</span>
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
                                            <span>Sign Out</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template v-else>
                        <router-link to="/login"
                            class="text-legal-blue hover:text-legal-teal font-medium px-4 py-2 rounded-xl transition-colors duration-200">
                            Sign In
                        </router-link>
                        <router-link to="/register" class="btn-legal-primary text-sm">
                            Get Started
                        </router-link>
                    </template>
                </div>
            </div>
        </div>

        <!-- Mobile menu -->
        <div v-if="showMobileMenu" class="sm:hidden bg-white/95 backdrop-blur-md border-t border-legal-blue/10">
            <div class="px-2 pt-2 pb-3 space-y-1">
                <router-link to="/"
                    class="text-gray-700 hover:text-legal-blue block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    :class="{ 'text-legal-blue bg-legal-blue/5': $route.path === '/' }" @click="closeMobileMenu">
                    Home
                </router-link>
                <router-link to="/advisors"
                    class="text-gray-700 hover:text-legal-blue block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                    :class="{ 'text-legal-blue bg-legal-blue/5': $route.path === '/advisors' }"
                    @click="closeMobileMenu">
                    Find Advisors
                </router-link>
                <template v-if="authStore.isAuthenticated">
                    <router-link v-if="authStore.isClient" to="/appointments/client"
                        class="text-gray-700 hover:text-legal-blue block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                        :class="{ 'text-legal-blue bg-legal-blue/5': $route.path.includes('/appointments/client') }"
                        @click="closeMobileMenu">
                        My Appointments
                    </router-link>
                    <router-link v-if="authStore.isAdvisor" to="/appointments/advisor"
                        class="text-gray-700 hover:text-legal-blue block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200"
                        :class="{ 'text-legal-blue bg-legal-blue/5': $route.path.includes('/appointments/advisor') }"
                        @click="closeMobileMenu">
                        My Schedule
                    </router-link>
                    <div class="border-t border-gray-200 pt-4 pb-3">
                        <div class="flex items-center px-3 mb-3">
                            <div
                                class="w-10 h-10 bg-gradient-to-r from-legal-blue to-legal-teal rounded-full flex items-center justify-center">
                                <span class="text-white font-semibold">{{ authStore.user?.firstName?.[0] }}</span>
                            </div>
                            <div class="ml-3">
                                <div class="text-base font-medium text-gray-800">{{ authStore.user?.firstName }} {{
                                    authStore.user?.lastName }}</div>
                                <div class="text-sm font-medium text-gray-500">{{ authStore.user?.email }}</div>
                            </div>
                        </div>
                        <router-link :to="authStore.isAdvisor ? '/profile/advisor' : '/profile/client'"
                            class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-legal-blue hover:bg-legal-blue/5 transition-colors duration-200"
                            @click="closeMobileMenu">
                            My Profile
                        </router-link>
                        <router-link to="/profile/edit"
                            class="block px-3 py-2 text-base font-medium text-gray-700 hover:text-legal-blue hover:bg-legal-blue/5 transition-colors duration-200"
                            @click="closeMobileMenu">
                            Edit Profile
                        </router-link>
                        <button @click="logout"
                            class="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors duration-200">
                            Sign Out
                        </button>
                    </div>
                </template>
                <template v-else>
                    <div class="border-t border-gray-200 pt-4 pb-3 space-y-2">
                        <router-link to="/login"
                            class="block px-3 py-2 text-base font-medium text-legal-blue hover:text-legal-teal transition-colors duration-200"
                            @click="closeMobileMenu">
                            Sign In
                        </router-link>
                        <router-link to="/register" class="block mx-3 btn-legal-primary text-center text-sm"
                            @click="closeMobileMenu">
                            Get Started
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