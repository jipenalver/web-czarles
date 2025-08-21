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

onMounted(() => {
  // trigger hero animation
  setTimeout(() => {
    isVisible.value = true
  }, 300)
})


</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text "  style="max-width: 900px">
        <div class="hero-content" :class="{ 'animate-fade-in': isVisible }">
          <h1 class="text-h3 lg:text-h2 font-weight-bold mb-4 text-white animate-slide-up">About C'zarles</h1>
          <p class="mb-6 text-h6 text-white font-weight-light animate-slide-up delay-1">
            Building Excellence. Delivering Dreams. Creating Lasting Value.
          </p>
        </div>

        <div class="text-caption text-white animate-slide-up delay-2">
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
      <v-container class="py-8">
        <v-row justify="center">
          <v-col cols="12" md="10" lg="8">
            <v-card class="pa-8" elevation="3" style="height: 100%">
              <div class="text-center mb-8">
                <h2 class="text-h4 font-weight-bold text-primary mb-4">Our Mission & Commitment</h2>
                <v-divider
                  class="mx-auto"
                  style="max-width: 100px; height: 3px"
                  color="secondary"
                ></v-divider>
              </div>

              <v-row align="center">
                <v-col cols="12" md="6">
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
                <v-col cols="12" md="6">
                  <h3 class="text-h5 font-weight-bold mb-4 text-primary">
                    <v-icon class="mr-2" color="secondary">mdi-handshake</v-icon>
                    Our Commitment
                  </h3>
                  <p class="text-body-1">
                    We are committed to building long-term relationships based on
                    <strong>integrity, quality, performance, teamwork, safety,</strong> and client
                    satisfaction.
                  </p>
                  <v-alert type="info" variant="tonal" class="mt-4" icon="mdi-shield-star">
                    <div class="font-weight-bold">
                      RIGHT THE FIRST TIME, EVERYTIME and ALL THE TIME.
                    </div>
                  </v-alert>
                </v-col>
              </v-row>
            </v-card>
          </v-col>
          <v-col cols="12" md="10" lg="4">
            <v-row>
              <v-col v-for="value in coreValues" :key="value.title" cols="12" sm="6" md="3" lg="6">
                <v-card class="text-center pa-6 h-100" elevation="2" hover>
                  <v-avatar size="80" color="secondary" class="mb-4">
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
      <v-container fluid class="py-12"  style="background: linear-gradient(135deg, #352c73 0%, #6159a9 100%)">
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

          <v-col cols="12" md="12" lg="12">
            <div class="text-center text-white">
              <h2 class="text-h4 font-weight-bold mb-4">Ready to Build Your Dream Project?</h2>
              <p class="text-h6 font-weight-light mb-6 opacity-90 px-5">
                Let's discuss how we can bring your vision to life with our expertise and commitment
                to excellence.
              </p>
              <div class="d-flex flex-column flex-sm-row justify-center ga-4">
                <v-btn
                  color="secondary"
                  size="large"
                  rounded="pill"
                  to="/contact"
                  prepend-icon="mdi-phone"
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
.animate-slide-up {
  animation: slideUp 0.8s ease-out;
}
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}
.delay-1 {
  animation-delay: 0.2s;
  animation-fill-mode: both;
}
.delay-2 {
  animation-delay: 0.4s;
  animation-fill-mode: both;
}
@keyframes fadeIn {
  from { opacity: 0 }
  to { opacity: 1 }
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px) }
  to { opacity: 1; transform: translateY(0) }
}
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
</style>