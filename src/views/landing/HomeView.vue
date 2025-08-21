<script setup lang="ts">
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import LandingLayout from '@/components/landing/LandingLayout.vue'

// Statistics data
const statistics = ref([
  {
    number: '116',
    label: 'PROJECTS',
    description: 'COMPLETED',
  },
  {
    number: '27',
    label: 'YEARS',
    description: ' EXPERIENCEs',
  },
  {
    number: '98',
    label: '% CLIENT',
    description: 'SATISFACTION',
  },
  {
    number: '50',
    label: 'EXPERT TEAM',
    description: 'MEMBERS',
  },
])

// Vuetify breakpoint composable (reactive)
const { smAndDown } = useDisplay()
</script>

<template>
  <LandingLayout>
    <template #content>
      <v-container class="pa-5">
        <v-row>
          <v-col cols="0" md="3" lg="3"> </v-col>
          <v-col cols="`12`" md="6" lg="6">
            <div>
              <!-- Hero Section (content only) - parallax moved to LandingLayout.vue -->
              <div class="hero-parallax-content d-flex align-center justify-center">
                <v-container>
                  <v-row class="fill-height" align="center" justify="center">
                    <v-col cols="12" md="12" lg="12">
                      <div class="text-center text-white">
                        <!-- Main Hero Title -->
                        <h1
                          class="text-h2 text-md-h2 font-weight-bold my-6 px-2"
                          style="text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7)"
                        >
                          Building Excellence Through Professional Construction Services
                        </h1>

                        <!-- Hero Description -->
                        <p
                          class="text-h6 text-md-h6 mb-8 mx-auto"
                          style="max-width: 800px; text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7)"
                        >
                          We deliver comprehensive construction solutions with unwavering commitment
                          to quality, safety, and timely completion. Trust our experienced team to
                          bring your vision to life with precision and professionalism.
                        </p>

                        <!-- Action Buttons -->
                        <div
                          class="d-flex flex-column flex-sm-row gap-4 justify-center align-center"
                        >
                          <v-btn
                            color="orange-darken-1"
                            size="large"
                            class="px-8 py-3"
                            elevation="4"
                            to="/contact"
                          >
                            <v-icon start>mdi-file-phone</v-icon>
                            Contact Us
                          </v-btn>

                          <v-btn
                            variant="outlined"
                            color="white"
                            size="large"
                            class="px-8 py-3"
                            to="/about"
                          >
                            <v-icon start>mdi-group</v-icon>
                            About Us
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
                      <div
                        :class="[
                          'stats-grid',
                          'pa-6',
                          'd-flex',
                          'align-center',
                          'justify-space-between',
                          { 'stats-grid--stacked': smAndDown },
                        ]"
                      >
                        <div
                          v-for="stat in statistics"
                          :key="stat.label"
                          class="stat-item text-center"
                        >
                          <div class="text-h3 text-md-h2 font-weight-bold text-primary mb-2">
                            {{ stat.number }}
                          </div>
                          <div class="text-body-1 text-md-h6 font-weight-medium text-primary mb-1">
                            {{ stat.label }}
                          </div>
                          <div class="text-primary text-md-body-2 text-grey">
                            {{ stat.description }}
                          </div>
                        </div>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-container>
            </div></v-col
          >
          <v-col cols="0" md="3" lg="3"> </v-col>
        </v-row>
      </v-container>
    </template>
  </LandingLayout>
</template>

<style scoped>
/* Minimal styles focused on stats grid and small helpers */
.gap-4 {
  gap: 1rem;
}

.stats-card {
  border-radius: 16px;
  overflow: visible;
  position: relative;
  padding: 3rem;
}

.stats-grid {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stats-grid--stacked {
  flex-direction: column;
  gap: 0.5rem;
  align-items: stretch;
}

.stats-grid--stacked .stat-item {
  padding: 0.5rem 0;
}

.stat-item {
  flex: 1 1 0;
  min-width: 0;
  text-align: center;
}

/* Small mobile adjustments for spacing and typography */
@media (max-width: 600px) {
  .gap-4 {
    gap: 0.5rem;
  }
  .stats-card {
    padding: 1.25rem !important;
  }

  .stat-item .text-h3 {
    font-size: 1.4rem !important;
  }
  .stat-item .text-body-1 {
    font-size: 0.9rem !important;
  }
  .stat-item .text-md-body-2,
  .stat-item .text-grey {
    font-size: 0.8rem !important;
  }

  .px-8 {
    padding-left: 1rem !important;
    padding-right: 1rem !important;
  }
  .py-3 {
    padding-top: 0.5rem !important;
    padding-bottom: 0.5rem !important;
  }

  /* Hero title and description adjustments for small screens */
  .hero-parallax-content .text-center h1 {
    font-size: 1.6rem !important;
    line-height: 1.15 !important;
    margin-top: 0.5rem !important;
    margin-bottom: 0.75rem !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }

  .hero-parallax-content .text-center p {
    font-size: 0.95rem !important;
    max-width: 100% !important;
    padding-left: 0.5rem !important;
    padding-right: 0.5rem !important;
  }
}
</style>
