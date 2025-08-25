<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { attachOrbitToScroll, type ScrollController } from '@/views/landing/modelHelper'

const isVisible = ref(false)
const countersVisible = ref(false)

// Vuetify display composable
const { mobile, lgAndUp } = useDisplay()

// Computed properties for responsive classes
const heroTitleClass = computed(() => 
  mobile.value ? 'text-h4' : lgAndUp.value ? 'text-h2' : 'text-h3'
)

const heroSubtitleClass = computed(() => 
  mobile.value ? 'text-body-1' : 'text-h6'
)

const contentTitleClass = computed(() => 
  mobile.value ? 'text-h5' : lgAndUp.value ? 'text-h2' : 'text-h3'
)

const sectionTitleClass = computed(() => 
  mobile.value ? 'text-h6' : 'text-h5'
)

const bodyTextClass = computed(() => 
  mobile.value ? 'text-body-2' : 'text-body-1'
)

const cardPadding = computed(() => 
  mobile.value ? 'pa-4' : 'pa-6'
)

// reactive camera orbit that will smoothly interpolate between two states
const cameraOrbit = ref('-76.81deg 80.14deg 20.35m')

let scrollController: ScrollController | undefined

// orbit endpoints
const orbitA = '-76.81deg 80.14deg 20.35m'
const orbitB = '-79.81deg 80.14deg 20.35m'

// animate nga counters
const animatedYears = ref(0)
const animatedProjects = ref(0)
const animatedSatisfaction = ref(0)

const animateCounters = () => {
  // much faster: 1 second total
  const duration = 1000
  const steps = 30
  const stepTime = Math.max(8, Math.floor(duration / steps))

  let currentStep = 0
  const timer = setInterval(() => {
    currentStep++
    const progress = Math.min(1, currentStep / steps)

    animatedYears.value = Math.round(27 * progress)
    animatedProjects.value = Math.round(116 * progress)
    animatedSatisfaction.value = Math.round(98 * progress)

    if (currentStep >= steps) {
      // ensure exact final values
      animatedYears.value = 27
      animatedProjects.value = 116
      animatedSatisfaction.value = 98
      clearInterval(timer)
    }
  }, stepTime)
}

// data para sa commitments
const commitments = [
  {
    icon: 'mdi-clipboard-check-multiple',
    title: 'Thorough Planning',
    description:
      'Plan thoroughly taking into consideration customer needs and stakeholder requirements.',
    color: 'orange',
  },
  {
    icon: 'mdi-account-group',
    title: 'Professional Workforce',
    description: 'Execute plans correctly through well-trained professional workforce cooperation.',
    color: 'blue',
  },
  {
    icon: 'mdi-target',
    title: 'Consistent Results',
    description: 'Meet objectives by identifying risks and maximizing available opportunities.',
    color: 'green',
  },
  {
    icon: 'mdi-handshake',
    title: 'Customer Integrity',
    description: 'Deliver quality operations with integrity to customers and employee well-being.',
    color: 'purple',
  },
]

onMounted(() => {

    isVisible.value = true


  // trigger animation sa counters immediately
  countersVisible.value = true
  animateCounters()

  // attach orbit changes to user scroll (camera moves only when user scrolls)
  scrollController = attachOrbitToScroll((s) => (cameraOrbit.value = s), orbitA, orbitB)
})

onUnmounted(() => {
  if (scrollController) {
    scrollController.detach()
    scrollController = undefined
  }
})
</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text" style="max-width: 900px">
        <div class="hero-content" :class="{ 'animate-fade-in': isVisible }">
          <h1 :class="[heroTitleClass, 'font-weight-bold', 'mb-4', 'text-white', 'animate-slide-up']">
            About Us
          </h1>
          <p :class="[heroSubtitleClass, 'mb-6', 'text-white', 'font-weight-light', 'animate-slide-up', 'delay-1']">
            Welcome to
            <span class="font-weight-bold text-orange-lighten-2"
              >C'ZARLES CONSTRUCTION & SUPPLY</span
            >
            — your trusted partner for quality, safe, and reliable construction services.
          </p>

          <div class="text-caption text-white animate-slide-up delay-2">
            <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
            <RouterLink to="/" class="text-white text-decoration-none hover-orange"
              >Home</RouterLink
            >
            <v-icon size="small" class="mx-2">mdi-chevron-right</v-icon>
            <span class="text-orange-lighten-2">About</span>
          </div>
        </div>
      </div>
    </template>

    <template #content>
      <!-- Main About Section with enhanced visuals -->
      <v-row class="d-flex align-center py-16 px-4">
        <v-col cols="12" lg="1"></v-col>

        <!-- Content Column -->
        <v-col cols="12" md="6" lg="6">
          <div class="about-intro" :class="{ 'animate-slide-left': isVisible }">
            <!-- Company Name with gradient effect -->
            <div class="mb-6">
              <h1 :class="[contentTitleClass, 'font-weight-bold', 'gradient-text', 'mb-2']">
                C'ZARLES CONSTRUCTION & SUPPLY
              </h1>
              <div class="orange-underline"></div>
            </div>

            <!-- Mission Statement -->
            <v-card :class="[cardPadding, 'mb-8', 'mission-card']" elevation="0" color="transparent" outlined>
              <v-icon color="orange" size="large" class="mb-4">mdi-bullseye-arrow</v-icon>
              <h3 :class="[sectionTitleClass, 'mb-4', 'font-weight-medium']">Our Mission</h3>
              <p :class="[bodyTextClass, 'grey--text', 'text--darken-1', 'line-height-relaxed']">
                (CCS) shall endeavor to deliver quality, credible and safe Construction Operations
                with integrity to its customers, and well-being of its employees.
              </p>
            </v-card>

            <!-- Core Commitments -->
            <div class="mb-8">
              <h3 :class="[sectionTitleClass, 'mb-6', 'font-weight-medium']">Our Commitments</h3>
              <v-row>
                <v-col
                  cols="12"
                  md="6"
                  v-for="(commitment, index) in commitments"
                  :key="index"
                  class="mb-4"
                >
                  <v-card :class="[cardPadding, 'h-100', 'commitment-card']" elevation="2" hover>
                    <v-icon :color="commitment.color" size="large" class="mb-3">{{
                      commitment.icon
                    }}</v-icon>
                    <h4 :class="[mobile ? 'text-subtitle-2' : 'text-subtitle-1', 'font-weight-medium', 'mb-2']">{{ commitment.title }}</h4>
                    <p :class="[mobile ? 'text-caption' : 'text-body-2', 'grey--text', 'text--darken-1']">
                      {{ commitment.description }}
                    </p>
                  </v-card>
                </v-col>
              </v-row>
            </div>

            <!-- Enhanced Metrics Section -->
            <v-card :class="[cardPadding, 'metrics-card']" color="grey-lighten-5" elevation="4">
              <h3 :class="[sectionTitleClass, 'mb-6', 'text-center', 'font-weight-medium']">Our Track Record</h3>
              <v-row class="text-center">
                <v-col cols="12" sm="4" class="mb-4">
                  <div class="metric-item" :class="{ 'animate-count-up': countersVisible }">
                    <div :class="[mobile ? 'text-h4' : 'text-h3', 'orange--text', 'font-weight-bold', 'mb-2']">
                      {{ animatedYears }}+
                    </div>
                    <v-icon color="dark" class="mb-2">mdi-calendar-clock</v-icon>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2', 'grey--text', 'text--darken-1', 'font-weight-medium']">
                      Years Experience
                    </div>
                  </div>
                </v-col>

                <v-col cols="12" sm="4" class="mb-4">
                  <div class="metric-item" :class="{ 'animate-count-up': countersVisible }">
                    <div :class="[mobile ? 'text-h4' : 'text-h3', 'orange--text', 'font-weight-bold', 'mb-2']">
                      {{ animatedProjects }}+
                    </div>
                    <v-icon color="dark" class="mb-2">mdi-hammer-screwdriver</v-icon>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2', 'grey--text', 'text--darken-1', 'font-weight-medium']">
                      Projects Completed
                    </div>
                  </div>
                </v-col>

                <v-col cols="12" sm="4" class="mb-4">
                  <div class="metric-item" :class="{ 'animate-count-up': countersVisible }">
                    <div :class="[mobile ? 'text-h4' : 'text-h3', 'orange--text', 'font-weight-bold', 'mb-2']">
                      {{ animatedSatisfaction }}%
                    </div>
                    <v-icon color="dark" class="mb-2">mdi-heart</v-icon>
                    <div :class="[mobile ? 'text-caption' : 'text-body-2', 'grey--text', 'text--darken-1', 'font-weight-medium']">
                      Client Satisfaction
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card>

            <!-- Call to Action -->
            <div class="mt-8 text-center">
              <v-btn variant="outlined" color="orange" size="large" class="mx-2 mb-2" to="/contact">
                <v-icon left>mdi-phone</v-icon>
                Get In Touch
              </v-btn>
              <v-btn variant="flat" color="orange" size="large" class="mx-2 mb-2" to="/company">
                <v-icon left>mdi-office-building</v-icon>
                Learn More
              </v-btn>
            </div>
          </div>
        </v-col>

        <!-- Enhanced Image Column -->
        <v-col
          cols="12"
          md="6"
          lg="5"
          class="hidden-sm-and-down"
          style="position: absolute; right: 0; top: 0; z-index: 1"
        >
          <!-- Ipakita ang 3D model nga mas dako para sa hero section / show larger 3D model -->
          <!-- Tago (hide) ni sa gagmay nga screens gamit ang Vuetify helper class hidden-sm-and-down -->
          <div class="d-flex justify-center align-center mx-auto overflow-visible">
            
           

            <model-viewer
              src="glb/excavator.glb"
              ar-modes="webxr scene-viewer quick-look"
              camera-target="3.85m 0.11m 0.122m"
              tone-mapping="neutral"
              poster="poster.webp"
              min-field-of-view="26deg"
              shadow-intensity="1"
              :camera-orbit="cameraOrbit"
              field-of-view="18.11deg"
              style="width: 100%; height: 100rem; min-width: 150rem; max-width: none"
            >
            </model-viewer>
          </div>
        </v-col>

        <v-col cols="12" lg="1"></v-col>
      </v-row>
    </template>
  </LandingLayout>
</template>

<style scoped>
/* Animations */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out;
}

.delay-1 {
  animation-delay: 0.2s;
  animation-fill-mode: both;
}

.delay-2 {
  animation-delay: 0.4s;
  animation-fill-mode: both;
}

.animate-slide-left {
  animation: slideLeft 1s ease-out;
}

.animate-slide-right {
  animation: slideRight 1s ease-out;
}

.animate-count-up {
  animation: scaleIn 0.5s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(-50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(50px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Enhanced styling */
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
  margin: 0;
}

.line-height-relaxed {
  line-height: 1.8;
}

.mission-card {
  border-left: 4px solid #ff6b35;
  transition: all 0.3s ease;
}

.mission-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 107, 53, 0.15) !important;
}

.commitment-card {
  transition: all 0.3s ease;
  border-top: 3px solid transparent;
}

.commitment-card:hover {
  transform: translateY(-4px);
  border-top-color: #ff6b35;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1) !important;
}

.metrics-card {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
}

.metric-item {
  transition: all 0.3s ease;
  padding: 1rem;
  border-radius: 8px;
}

.metric-item:hover {
  background: rgba(255, 107, 53, 0.05);
  transform: translateY(-2px);
}

.image-card {
  transition: all 0.3s ease;
  overflow: hidden;
}

.image-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15) !important;
}

.image-card:hover .certification-badge {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2) !important;
}

.hover-orange:hover {
  color: #ff6b35 !important;
  transition: color 0.3s ease;
}

.hover-orange:hover {
  color: #ff6b35 !important;
  transition: color 0.3s ease;
}

/* Button hover effects */
.v-btn:hover {
  transform: translateY(-2px);
  transition: all 0.3s ease;
}

/* Enhanced card hover effects */
.v-card {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

/* Loading animation for metrics */
.metric-item.animate-count-up {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
</style>
