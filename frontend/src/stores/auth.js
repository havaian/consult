import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useApi } from '../composables/useApi';

export const useAuthStore = defineStore('auth', () => {
  // Initialize state from localStorage
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)
  const isAdvisor = computed(() => user.value?.role === 'advisor')
  const isClient = computed(() => user.value?.role === 'client')

  async function login(email, password) {
    try {
      const response = await useApi.login({ email, password })
      token.value = response.token
      user.value = response.user

      // Persist to localStorage
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))

      return response
    } catch (error) {
      throw error.response || error.message
    }
  }

  async function register(userData) {
    try {
      const response = await useApi.register('/api/users/register', userData)
      return response
    } catch (error) {
      throw error.response || error.message
    }
  }

  function logout() {
    user.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdvisor,
    isClient,
    login,
    register,
    logout
  }
})