<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text" style="max-width: 900px">
        <h1 class="text-h3 lg:text-h2 font-weight-bold mb-2">About</h1>
        <p class="mb-4 text-body-1">
          Esse dolorum voluptatem ullam est sint nemo et est ipsa porro placeat quibusdam quia
          assumenda numquam molestias.
        </p>

        <div class="text-caption">
          <RouterLink to="/" class="orange--text">Home</RouterLink>
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
            <h1 class="text-h3 sm:text-h5 lg:text-h2 font-weight-bold mb-6">
              Built on Excellence, Driven by Vision
            </h1>
            <p class="text-body-1 mb-4">
              Lorem ipsum dolor sit amet consectetur adipisicing elit sed eiusmod tempor incididunt
              labore dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco
              laboris nisi ut aliquip.
            </p>

            <p class="text-body-2 grey--text text--darken-1 mb-6">
              Duis aute irure dolor in reprehenderit voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident sunt in culpa qui
              officia deserunt mollit anim id est laborum. Sed ut perspiciatis unde omnis iste natus
              error sit voluptatem accusantium doloremque laudantium totam rem aperiam eaque ipsa
              quae ab illo inventore veritatis et quasi architecto beatae.
            </p>

            <!-- metrics row para sa experience, projects, satisfaction -->
            <v-row class="mt-6">
              <v-col cols="12" sm="4" class="text-center">
                <div class="text-h4 orange--text font-weight-medium">25+</div>
                <div class="text-caption grey--text text--darken-1">YEARS EXPERIENCE</div>
              </v-col>

              <v-col cols="12" sm="4" class="text-center">
                <div class="text-h4 orange--text font-weight-medium">500+</div>
                <div class="text-caption grey--text text--darken-1">PROJECTS COMPLETED</div>
              </v-col>

              <v-col cols="12" sm="4" class="text-center">
                <div class="text-h4 orange--text font-weight-medium">98%</div>
                <div class="text-caption grey--text text--darken-1">CLIENT SATISFACTION</div>
              </v-col>
            </v-row>

            <div class="mt-6">
              <v-btn variant="text" class="orange--text" to="/services"
                >Explore Our Services →</v-btn
              >
            </div>
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
