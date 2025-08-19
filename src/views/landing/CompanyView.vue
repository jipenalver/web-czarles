<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div class="text-center white--text" style="max-width:900px;">
        <h1 class="text-h3 lg:text-h2 font-weight-bold mb-2">Company</h1>
        <p class="mb-4 text-body-1">We are a leading company with a strong commitment to quality and service.</p>

        <div class="text-caption">
          <RouterLink to="/" class="orange--text">Home</RouterLink>
          <span class="mx-2">/</span>
          <span>Company</span>
        </div>
      </div>
    </template>
    <template #content>
      <v-container class="pa-5">
        <v-row>
          <v-col cols="0" md="3" lg="3"> </v-col>
          <v-col cols="12" md="6" lg="6">
            <div>
              <h1 class="text-h2 font-weight-bold mb-4">Company Overview</h1>
              <p class="text-body-1">
                We are a leading company with over 15 years of experience in delivering high-quality projects. Our expert team is dedicated to ensuring client satisfaction.
              </p>
            </div>
          </v-col>
          <v-col cols="0" md="3" lg="3"> </v-col>
        </v-row>
      </v-container>
    </template>
  </LandingLayout>
</template>