<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import { ref, onMounted} from 'vue'

const isVisible = ref(false)

onMounted(() => {

    isVisible.value = true

})
</script>

<template>
  <LandingLayout :hideBg="true">
     <template #hero>
      <div class="text-center white--text animate-hero-container" :class="{ 'animate-hero-container-visible': isVisible }" style="max-width: 900px">
        <div class="hero-content">
          <h1 class="text-h3 lg:text-h2 font-weight-bold mb-4 text-white animate-hero-title" :class="{ 'animate-hero-title-visible': isVisible }">Privacy Policy</h1>
          <p class="mb-6 text-h6 text-white font-weight-light animate-hero-subtitle" :class="{ 'animate-hero-subtitle-visible': isVisible }">
            We respect your privacy. This Privacy Policy explains the personal information we collect, how we use and protect it, and your rights regarding your data.
          </p>
        </div>

        <div class="text-caption text-white animate-hero-breadcrumb" :class="{ 'animate-hero-breadcrumb-visible': isVisible }">
          <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
          <RouterLink to="/" class="text-white text-decoration-none hover-orange">Home</RouterLink>
          <span class="mx-2 text-white">/</span>
          <span class="text-white">Privacy Policy</span>
        </div>
      </div>
    </template>
    <template #content >
      <v-container class="pa-0" fluid>
        <v-row>
          <!-- Birahi dri Elro -->
        </v-row>
      </v-container>
    </template>
  </LandingLayout>
</template>

  <style scoped>
/* Hero Animations */
.animate-hero-container {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}
.animate-hero-container-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-hero-title {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out 0.2s;
}
.animate-hero-title-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-hero-subtitle {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out 0.4s;
}
.animate-hero-subtitle-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-hero-breadcrumb {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out 0.6s;
}
.animate-hero-breadcrumb-visible {
  opacity: 1;
  transform: translateY(0);
}
  /* Minimal hero animation: single keyframe, small translate, staggered delays */
  .animate-hero-container,
  .animate-hero-container .hero-content h1,
  .animate-hero-container .hero-content p,
  .animate-hero-breadcrumb {
    opacity: 0;
    transform: translateY(12px);
    will-change: opacity, transform;
  }

  /* visible state on the container triggers child animations with small delays */
  .animate-hero-container-visible {
    animation: fadeIn .45s ease 0s forwards;
  }
  .animate-hero-container-visible .hero-content h1 { animation: slideUp .48s ease .08s forwards; }
  .animate-hero-container-visible .hero-content p  { animation: slideUp .48s ease .18s forwards; }
  .animate-hero-container-visible .animate-hero-breadcrumb { animation: slideUp .48s ease .28s forwards; }

  @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn  { to { opacity: 1; transform: none; } }

  @media (prefers-reduced-motion: reduce) {
    .animate-hero-container,
    .animate-hero-container .hero-content h1,
    .animate-hero-container .hero-content p,
    .animate-hero-breadcrumb,
    .animate-hero-container-visible { animation: none !important; opacity: 1 !important; transform: none !important; }
  }
  </style>