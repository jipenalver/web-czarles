<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text" style="max-width: 900px">
        <h1 class="text-h3 lg:text-h2 font-weight-bold mb-2 text-white">About</h1>
        <p class="mb-4 text-body-1 text-white">
          Welcome to C'ZARLES CONSTRUCTION & SUPPLY — your trusted partner for quality, safe, and reliable construction services.
        </p>

        <div class="text-caption text-white">
          <v-icon size="small" class="mr-1">mdi-home</v-icon>
          <RouterLink to="/" class="text-white text-decoration-none">Home</RouterLink>
          <span class="mx-2">/</span>
          <span>About</span>
        </div>
      </div>
    </template>

    <template #content>
      <v-row class="d-flex align-center py-10 about-row px-2">
        <v-col cols="0" lg="2"></v-col>
        <v-col cols="12" md="6" lg="5">
          <div class="about-intro">
            <h1 class="text-h3 sm:text-h5 lg:text-h2 font-weight-bold">
              C'ZARLES CONSTRUCTION & SUPPLY
            </h1>
            <span> (CCS) shall endeavor to </span>
            <p class="text-body-2 grey--text text--darken-1 mt-6">
              deliver quality, credible and safe Construction Operations with integrity to its
              customers, and well-being of its employees. And to achieved this, CCS is committed to:
              Plan thoroughly its activities and processes taking into consideration the needs of
              its customers, employees, regulatory bodies and other
            </p>

            <p class="text-body-2 grey--text text--darken-1 mb-6">
              stakeholders and strive to satisfy their requirements;
            </p>

            <p class="text-body-2 grey--text text--darken-1 mb-6">
              Execute its plan correctly for the first time, every time and all the time through the
              efforts and cooperation of a well-trained professionals workforce;
            </p>

            <p class="text-body-2 grey--text text--darken-1 mb-6">
              Consistently meet the objectives by identifying and addressing the risks and
              maximizing the available opportunities.
            </p>

            <!-- metrics row para sa experience, projects, satisfaction -->
            <v-row class="mt-6">
              <v-col cols="12" sm="4" class="text-center">
                <div class="text-h4 orange--text font-weight-medium">27+</div>
                <div class="text-caption grey--text text--darken-1">YEARS EXPERIENCE</div>
              </v-col>

              <v-col cols="12" sm="4" class="text-center">
                <div class="text-h4 orange--text font-weight-medium">116+</div>
                <div class="text-caption grey--text text--darken-1">PROJECTS COMPLETED</div>
              </v-col>

              <v-col cols="12" sm="4" class="text-center">
                <div class="text-h4 orange--text font-weight-medium">98%</div>
                <div class="text-caption grey--text text--darken-1">CLIENT SATISFACTION</div>
              </v-col>
            </v-row>

            <!-- <div class="mt-6">
              <v-btn variant="text" class="orange--text" to="/services"
                >Explore Our Services →</v-btn
              >
            </div> -->
          </div>
        </v-col>

        <v-col cols="12" md="6" lg="3" class="d-flex justify-center">
          <v-card class="position-relative ma-4" width="520">
            <v-img
              src="/src/assets/images/image-bg.jpg"
              alt="about image"
              class="rounded-lg"
              aspect-ratio="1.6"
              cover
            />

            <v-sheet
              class="position-absolute bottom-4 right-4 pa-3 rounded-lg elevation-6"
              color="white"
            >
              <v-row class="align-center" no-gutters>
                <v-col cols="3" class="d-flex justify-center">
                  <v-icon color="orange">mdi-shield-check</v-icon>
                </v-col>
                <v-col cols="9">
                  <div class="text-subtitle-2 font-weight-medium">Quality Certified</div>
                  <div class="text-caption grey--text text--darken-1">Since 1999</div>
                </v-col>
              </v-row>
            </v-sheet>
          </v-card>
        </v-col>
        <v-col cols="0" lg="2"></v-col>
      </v-row>
    </template>
  </LandingLayout>
</template>

<style scoped>
@media (max-width: 600px) {
  /* Make the image card responsive */
  .about-row .v-card {
    width: 100% !important;
    max-width: 360px;
    margin: 0.5rem auto !important;
    padding: 0.5rem;
  }
}
</style>
