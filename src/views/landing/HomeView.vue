<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import HomeWidget from './home/HomeWidget.vue'
</script>

<template>
  <LandingLayout>
    <template #content>
      <v-container class="pa-5">
        <v-row>
          <v-col cols="3" md="3" lg="3"> </v-col>
          <v-col cols="6" md="6" lg="6"><HomeWidget /></v-col>
          <v-col cols="3" md="3" lg="3"> </v-col>
        </v-row>
      </v-container>
    </template>
  </LandingLayout>
</template>
