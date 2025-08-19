<template>
  <div>
    <!-- Hero Section (content only) - parallax moved to LandingLayout.vue -->
    <div class="hero-parallax-content d-flex align-center justify-center">
      <v-container>
        <v-row class="fill-height" align="center" justify="center">
          <v-col cols="12" md="12" lg="12">
            <div class="text-center text-white">
              <!-- Main Hero Title -->
              <h1 class="text-h2 text-md-h2 font-weight-bold my-6 px-2" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.7);">
                Building Excellence Through Professional Construction Services
              </h1>
              
              <!-- Hero Description -->
              <p class="text-h6 text-md-h6 mb-8 mx-auto" style="max-width: 800px; text-shadow: 1px 1px 2px rgba(0,0,0,0.7);">
                We deliver comprehensive construction solutions with unwavering commitment to 
                quality, safety, and timely completion. Trust our experienced team to bring your 
                vision to life with precision and professionalism.
              </p>
              
              <!-- Action Buttons -->
              <div class="d-flex flex-column flex-sm-row gap-4 justify-center align-center">
                <v-btn
                  color="orange-darken-1"
                  size="large"
                  class="px-8 py-3"
                  elevation="4"
                  @click="requestQuote"
                >
                  <v-icon start>mdi-file-document-edit</v-icon>
                  REQUEST QUOTE
                </v-btn>
                
                <v-btn
                  variant="outlined"
                  color="white"
                  size="large"
                  class="px-8 py-3"
                  @click="viewProjects"
                >
                  <v-icon start>mdi-eye</v-icon>
                  VIEW PROJECTS
                </v-btn>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Statistics Section: Single rounded card with mirror/reflection -->
    <v-container class="py-16">
      <v-row align="center" justify="center">
        <v-col cols="12" md="12" lg="12">
          <v-card class="stats-card mx-auto" elevation="6" color="rgba(255,255,255,0.04)">
            <div class="stats-grid pa-6 d-flex align-center justify-space-between">
              <div
                v-for="stat in statistics"
                :key="stat.label"
                class="stat-item text-center"
              >
                <div class="text-h3 text-md-h2 font-weight-bold text-primary mb-2">{{ stat.number }}</div>
                <div class="text-body-1 text-md-h6 font-weight-medium text-primary mb-1">{{ stat.label }}</div>
                <div class="text-primary text-md-body-2 text-grey">{{ stat.description }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

   
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'


// Statistics data
const statistics = ref([
  {
    number: '250',
    label: 'PROJECTS',
    description: 'COMPLETED'
  },
  {
    number: '15',
    label: 'YEARS',
    description: ' EXPERIENCEs'
  },
  {
    number: '98',
    label: '% CLIENT',
    description: 'SATISFACTION'
  },
  {
    number: '50',
    label: 'EXPERT TEAM',
    description: 'MEMBERS'
  }
])

// Event handlers
const requestQuote = () => {
  // Handle quote request - you can add navigation or modal logic here
  console.log('Request quote clicked')
  // Example: router.push('/quote') or emit an event
}

const viewProjects = () => {
  // Handle view projects - you can add navigation logic here
  console.log('View projects clicked')
  // Example: router.push('/projects')
}
</script>

<style scoped>
/* Custom styles for better responsiveness and visual appeal */
.gap-4 {
  gap: 1rem;
}

@media (max-width: 600px) {
  .gap-4 {
    gap: 0.5rem;
  }
}
</style>

<style scoped>
.stats-card {
  border-radius: 16px;
  overflow: visible; /* allow reflection to show */
  position: relative;
  padding:3rem;
}

.stats-card::after {
  /* Chromium reflection */
  -webkit-box-reflect: below 1px linear-gradient(transparent, rgba(255,255,255,0.02));
  content: '';
}

.stats-grid {
  display: flex;
  gap: 1rem;
}

.stat-item {
  flex: 1 1 0;
  min-width: 0;
}

/* Fallback reflection for non-WebKit browsers using a pseudo element */
@supports not (-webkit-box-reflect: below 0px) {
  .stats-card::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -100%;
    height: 100%;
    background: linear-gradient(to bottom, rgba(255,255,255,0.08), rgba(255,255,255,0.02));
    transform: scaleY(-1);
    mask-image: linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.0));
    pointer-events: none;
    border-bottom-left-radius: 16px;
    border-bottom-right-radius: 16px;
  }
}

</style>
