<template>
  <div class="min-h-screen">
    <nav-bar v-if="showNavBar" />
    <main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <app-footer v-if="showFooter" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import NavBar from '@/components/layout/NavBar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'

const route = useRoute()

const showNavBar = computed(() => !route.meta.hideNavBar)
const showFooter = computed(() => !route.meta.hideFooter)
</script>

<style>
/* Global legal design styles */
.royal-gradient {
  background: linear-gradient(135deg, #FFFEF7 0%, #F8F8F8 50%, #FFFFFF 100%);
}

.glow-effect {
  box-shadow: 0 20px 40px rgba(212, 175, 55, 0.15);
}

/* Custom royal button styles */
.btn-royal-primary {
  @apply px-8 py-4 text-white font-semibold rounded-2xl focus:ring-4 transition-all shadow-lg;
  background: linear-gradient(135deg, #D4AF37, #B8941F);
  box-shadow: 0 20px 40px rgba(212, 175, 55, 0.15);
}

.btn-royal-primary:hover {
  background: linear-gradient(135deg, #E5C547, #D4AF37);
  transform: translateY(-2px);
  box-shadow: 0 25px 50px rgba(212, 175, 55, 0.2);
}

.btn-royal-secondary {
  @apply px-8 py-4 bg-white/90 backdrop-blur-sm font-semibold rounded-2xl hover:bg-white focus:ring-4 transition-all shadow-lg border-2;
  color: #1A1A1A;
  border-color: rgba(212, 175, 55, 0.2);
}

.pulse-animation {
  animation: pulse 3s ease-in-out infinite;
}

.float-legal {
  animation: floatLegal 4s ease-in-out infinite;
}

@keyframes floatLegal {

  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }

  25% {
    transform: translateY(-10px) rotate(1deg);
  }

  50% {
    transform: translateY(-15px) rotate(0deg);
  }

  75% {
    transform: translateY(-10px) rotate(-1deg);
  }
}

.slide-in {
  animation: slideIn 1.2s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(50px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-hover {
  transition: all 0.3s ease;
}

.card-hover:hover {
  transform: translateY(-5px);
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
}

.heartbeat {
  animation: heartbeat 2s ease-in-out infinite;
}

@keyframes heartbeat {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}

/* Custom legal button styles */
.btn-legal-primary {
  @apply px-8 py-4 bg-gradient-to-r from-royal-gold to-charcoal text-white font-semibold rounded-2xl hover:from-charcoal hover:to-royal-gold focus:ring-4 focus:ring-royal-gold/30 transition-all shadow-lg;
  box-shadow: 0 20px 40px rgba(14, 165, 233, 0.15);
}

.btn-legal-secondary {
  @apply px-8 py-4 bg-white/90 backdrop-blur-sm text-royal-gold font-semibold rounded-2xl hover:bg-white focus:ring-4 focus:ring-royal-gold/30 transition-all shadow-lg border-2 border-royal-gold/20;
}

/* Page transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>