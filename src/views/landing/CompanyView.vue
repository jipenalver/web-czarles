<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import { ref, onMounted } from 'vue'

// const companyStats = ref([
//   { icon: 'mdi-calendar-check', value: '15+', label: 'Years of Excellence' },
//   { icon: 'mdi-account-group', value: '200+', label: 'Projects Completed' },
//   { icon: 'mdi-star', value: '99%', label: 'Client Satisfaction' },
//   { icon: 'mdi-shield-check', value: '100%', label: 'Safety Record' }
// ])

const coreValues = ref([
  {
    icon: 'mdi-handshake',
    title: 'Integrity',
    description: 'We build trust through honest communication and ethical business practices.',
  },
  {
    icon: 'mdi-diamond-stone',
    title: 'Quality',
    description: 'Excellence in every detail, from materials to craftsmanship.',
  },
  {
    icon: 'mdi-account-multiple',
    title: 'Teamwork',
    description: 'Collaborative approach ensuring seamless project execution.',
  },
  {
    icon: 'mdi-shield-account',
    title: 'Safety',
    description: 'Zero-compromise safety standards protecting our team and clients.',
  },
])

// const leadership = ref([
//   {
//     name: 'John Doe',
//     position: 'Chief Executive Officer',
//     image: '/src/assets/misc/illustration-john-light.png',
//     description: 'Leading with 20+ years of construction industry expertise.',
//   },
//   {
//     name: 'Daisy Smith',
//     position: 'Operations Director',
//     image: '/src/assets/misc/illustration-daisy-light.png',
//     description: 'Ensuring operational excellence and project delivery.',
//   },
// ])

const isVisible = ref(false)
const missionVisible = ref(false)
const valuesVisible = ref(false)
const ctaVisible = ref(false)

onMounted(() => {
  // trigger hero animation
  setTimeout(() => {
    isVisible.value = true
  }, 300)

  // trigger mission section animation
  setTimeout(() => {
    missionVisible.value = true
  }, 800)

  // trigger values section animation
  setTimeout(() => {
    valuesVisible.value = true
  }, 1200)

  // trigger CTA section animation
  setTimeout(() => {
    ctaVisible.value = true
  }, 1600)
})


</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text animate-hero-container" :class="{ 'animate-hero-container-visible': isVisible }" style="max-width: 900px">
        <div class="hero-content">
          <h1 class="text-h3 lg:text-h2 font-weight-bold mb-4 text-white animate-hero-title" :class="{ 'animate-hero-title-visible': isVisible }">About C'zarles</h1>
          <p class="mb-6 text-h6 text-white font-weight-light animate-hero-subtitle" :class="{ 'animate-hero-subtitle-visible': isVisible }">
            Building Excellence. Delivering Dreams. Creating Lasting Value.
          </p>
        </div>

        <div class="text-caption text-white animate-hero-breadcrumb" :class="{ 'animate-hero-breadcrumb-visible': isVisible }">
          <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
          <RouterLink to="/" class="text-white text-decoration-none hover-orange">Home</RouterLink>
          <span class="mx-2 text-white">/</span>
          <span class="text-white">Company</span>
        </div>
      </div>
    </template>

    <template #content>
      <!-- Company Stats Section -->
      <!--  <v-container class="py-12">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="12">
            <v-row>
              <v-col 
                v-for="stat in companyStats" 
                :key="stat.label"
                cols="6" 
                md="3"
              >
                <v-card 
                  class="text-center pa-4 h-100" 
                  elevation="2"
                  hover
                >
                  <v-icon 
                    :icon="stat.icon" 
                    size="48" 
                    color="primary"
                    class="mb-3"
                  ></v-icon>
                  <h2 class="text-h4 font-weight-bold text-primary mb-1">
                    {{ stat.value }}
                  </h2>
                  <p class="text-body-2 text-medium-emphasis">
                    {{ stat.label }}
                  </p>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container> -->

      <!-- Mission & Vision Section -->
      <v-container class="py-8 animate-container" :class="{ 'animate-slide-up-container': missionVisible }">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8" class="animate-card-left" :class="{ 'animate-card-left-visible': missionVisible }">
            <v-card class="pa-8" elevation="3" style="height: 100%">
              <div class="text-center mb-8 animate-fade-in" :class="{ 'animate-fade-in-visible': missionVisible }">
                <h2 class="text-h4 font-weight-bold text-primary mb-4">Our Mission & Commitment</h2>
                <v-divider
                  class="mx-auto animate-expand"
                  :class="{ 'animate-expand-visible': missionVisible }"
                  style="max-width: 100px; height: 3px"
                  color="secondary"
                ></v-divider>
              </div>

              <v-row align="center">
                <v-col cols="12" md="6" class="animate-slide-right" :class="{ 'animate-slide-right-visible': missionVisible }">
                  <h3 class="text-h5 font-weight-bold mb-4 text-primary">
                    <v-icon class="mr-2" color="secondary">mdi-target</v-icon>
                    Our Mission
                  </h3>
                  <p class="text-body-1 mb-4">
                    C'zarles Construction & Supply's mission is to form a
                    <strong>TEAM</strong> dedicated to providing exceptional construction services
                    in a professional manner. We undertake and complete quality construction
                    projects to a standard that constantly exceeds the needs and expectations of our
                    clients.
                  </p>
                </v-col>
                <v-col cols="12" md="6" class="animate-slide-left" :class="{ 'animate-slide-left-visible': missionVisible }">
                  <h3 class="text-h5 font-weight-bold mb-4 text-primary">
                    <v-icon class="mr-2" color="secondary">mdi-handshake</v-icon>
                    Our Commitment
                  </h3>
                  <p class="text-body-1">
                    We are committed to building long-term relationships based on
                    <strong>integrity, quality, performance, teamwork, safety,</strong> and client
                    satisfaction.
                  </p>
                  <v-alert type="info" variant="tonal" class="mt-4 animate-pulse-subtle" icon="mdi-shield-star">
                    <div class="font-weight-bold">
                      RIGHT THE FIRST TIME, EVERYTIME and ALL THE TIME.
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
          <v-col cols="12" md="10" lg="4" class="animate-card-right" :class="{ 'animate-card-right-visible': valuesVisible }">
            <v-row>
              <v-col 
                v-for="(value, index) in coreValues" 
                :key="value.title" 
                cols="12" 
                sm="6" 
                md="3" 
                lg="6"
                class="animate-scale-up"
                :class="{ 'animate-scale-up-visible': valuesVisible }"
                :style="{ 'animation-delay': `${index * 0.2}s` }"
              >
                <v-card class="text-center pa-6 h-100 animate-hover-lift" elevation="2" hover>
                  <v-avatar size="80" color="secondary" class="mb-4 animate-bounce-in">
                    <v-icon :icon="value.icon" size="40" color="white"></v-icon>
                  </v-avatar>
                  <h3 class="text-h6 font-weight-bold mb-3 text-primary">
                    {{ value.title }}
                  </h3>
                  <p class="text-body-2 text-medium-emphasis">
                    {{ value.description }}
                  </p>
                </v-card>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>

      <!-- Leadership Section -->
      <v-container fluid class="py-12 animate-gradient-bg" :class="{ 'animate-gradient-bg-visible': ctaVisible }"  style="background: linear-gradient(135deg, #352c73 0%, #6159a9 100%)">
        <v-row justify="center">
         <!--  <v-col cols="12" md="10" lg="4">
            <div class="text-center mb-8 ">
              <h2 class="text-h4 font-weight-bold text-white mb-4">Leadership Team</h2>
              <p class="text-h6 font-weight-light  text-white">
                Experienced professionals leading our vision forward
              </p>
            </div>

            <v-row justify="center">
              <v-col v-for="leader in leadership" :key="leader.name" cols="12" sm="6" md="6" lg="6">
                <v-card class="text-center pa-6" elevation="3" hover>
                  <v-avatar size="120" class="mb-4">
                    <v-img :src="leader.image" :alt="leader.name"></v-img>
                  </v-avatar>
                  <h3 class="text-h6 font-weight-bold mb-2 text-primary">
                    {{ leader.name }}
                  </h3>
                  <p class="text-body-2 text-secondary font-weight-medium mb-3">
                    {{ leader.position }}
                  </p>
                  <p class="text-body-2 text-medium-emphasis">
                    {{ leader.description }}
                  </p>
                </v-card>
              </v-col>
            </v-row>
          </v-col> -->

          <v-col cols="12" md="12" lg="12" class="animate-zoom-in" :class="{ 'animate-zoom-in-visible': ctaVisible }">
            <div class="text-center text-white">
              <h2 class="text-h4 font-weight-bold mb-4 animate-text-glow">Ready to Build Your Dream Project?</h2>
              <p class="text-h6 font-weight-light mb-6 opacity-90 px-5 animate-slide-up" :class="{ 'animate-slide-up-visible': ctaVisible }">
                Let's discuss how we can bring your vision to life with our expertise and commitment
                to excellence.
              </p>
              <div class="d-flex flex-column flex-sm-row justify-center ga-4 animate-buttons" :class="{ 'animate-buttons-visible': ctaVisible }">
                <v-btn
                  color="secondary"
                  size="large"
                  rounded="pill"
                  to="/contact"
                  prepend-icon="mdi-phone"
                  class="animate-btn-primary"
                >
                  Contact Us Today
                </v-btn>
                <v-btn
                  variant="outlined"
                  color="white"
                  size="large"
                  rounded="pill"
                  prepend-icon="mdi-home"
                  to="/about"
                  class="animate-btn-secondary"
                >
                  About Us
                </v-btn>
              </div>
            </div>
          </v-col>
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

/* Container Animations */
.animate-container {
  opacity: 0;
  transform: translateY(50px);
  transition: all 0.8s ease-out;
}
.animate-slide-up-container {
  opacity: 1;
  transform: translateY(0);
}

/* Card Animations */
.animate-card-left {
  opacity: 0;
  transform: translateX(-100px);
  transition: all 1s ease-out;
}
.animate-card-left-visible {
  opacity: 1;
  transform: translateX(0);
}

.animate-card-right {
  opacity: 0;
  transform: translateX(100px);
  transition: all 1s ease-out;
}
.animate-card-right-visible {
  opacity: 1;
  transform: translateX(0);
}

/* Content Animations */
.animate-fade-in {
  opacity: 0;
  transition: opacity 1s ease-out;
}
.animate-fade-in-visible {
  opacity: 1;
}

.animate-slide-right {
  opacity: 0;
  transform: translateX(-50px);
  transition: all 0.8s ease-out 0.3s;
}
.animate-slide-right-visible {
  opacity: 1;
  transform: translateX(0);
}

.animate-slide-left {
  opacity: 0;
  transform: translateX(50px);
  transition: all 0.8s ease-out 0.5s;
}
.animate-slide-left-visible {
  opacity: 1;
  transform: translateX(0);
}

/* Divider Animation */
.animate-expand {
  width: 0;
  transition: width 1.2s ease-out 0.5s;
}
.animate-expand-visible {
  width: 100px !important;
}

/* Values Cards Animation */
.animate-scale-up {
  opacity: 0;
  transform: scale(0.8) translateY(30px);
  transition: all 0.6s ease-out;
}
.animate-scale-up-visible {
  opacity: 1;
  transform: scale(1) translateY(0);
}

/* Avatar Bounce Animation */
.animate-bounce-in {
  animation: bounceIn 0.8s ease-out;
}

/* Hover Effects */
.animate-hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.animate-hover-lift:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15) !important;
}

/* Pulse Effect */
.animate-pulse-subtle {
  animation: pulseSubtle 3s ease-in-out infinite;
}

/* CTA Section Animations */
.animate-gradient-bg {
  opacity: 0;
  transform: scale(0.95);
  transition: all 1s ease-out;
}
.animate-gradient-bg-visible {
  opacity: 1;
  transform: scale(1);
}

.animate-zoom-in {
  opacity: 0;
  transform: scale(0.9);
  transition: all 0.8s ease-out;
}
.animate-zoom-in-visible {
  opacity: 1;
  transform: scale(1);
}

.animate-text-glow {
  animation: textGlow 2s ease-in-out infinite alternate;
}

.animate-slide-up {
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s ease-out 0.3s;
}
.animate-slide-up-visible {
  opacity: 1;
  transform: translateY(0);
}

.animate-buttons {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.8s ease-out 0.6s;
}
.animate-buttons-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Button Animations */
.animate-btn-primary {
  transition: all 0.3s ease;
}
.animate-btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 107, 53, 0.4);
}

.animate-btn-secondary {
  transition: all 0.3s ease;
}
.animate-btn-secondary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(255, 255, 255, 0.3);
  background-color: rgba(255, 255, 255, 0.1);
}

/* Keyframe Animations */
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) }
  to { opacity: 1; transform: translateY(0) }
}

@keyframes bounceIn {
  0% { 
    opacity: 0;
    transform: scale(0.3);
  }
  50% { 
    opacity: 1;
    transform: scale(1.05);
  }
  70% { transform: scale(0.9); }
  100% { 
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulseSubtle {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(33, 150, 243, 0.3);
  }
  50% { 
    transform: scale(1.02);
    box-shadow: 0 0 20px 10px rgba(33, 150, 243, 0.1);
  }
}

@keyframes textGlow {
  0% { 
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
  }
  100% { 
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.8), 0 0 30px rgba(255, 255, 255, 0.4);
  }
}

/* Responsive Animations */
@media (max-width: 768px) {
  .animate-card-left,
  .animate-card-right {
    transform: translateY(50px);
  }
  
  .animate-card-left-visible,
  .animate-card-right-visible {
    transform: translateY(0);
  }
  
  .animate-slide-right,
  .animate-slide-left {
    transform: translateY(30px);
  }
  
  .animate-slide-right-visible,
  .animate-slide-left-visible {
    transform: translateY(0);
  }
}

/* Utility Classes */
.gradient-text {
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.orange-underline {
  width: 80px;
  height: 4px;
  background: linear-gradient(45deg, #ff6b35, #f7931e);
  border-radius: 2px;
  margin: 0.5rem auto 0 0;
}

.hover-orange:hover {
  color: #ff6b35 !important;
}

/* Performance Optimization */
.animate-container,
.animate-card-left,
.animate-card-right,
.animate-fade-in,
.animate-slide-right,
.animate-slide-left,
.animate-scale-up,
.animate-zoom-in,
.animate-gradient-bg,
.animate-hero-container,
.animate-hero-title,
.animate-hero-subtitle,
.animate-hero-breadcrumb {
  will-change: transform, opacity;
}
</style>