<script setup lang="ts">
const icons = ['mdi-facebook', 'mdi-twitter', 'mdi-linkedin', 'mdi-instagram']
</script>

<template>
  <v-footer class="text-center d-flex flex-column ga-2 py-4">
    <div class="d-flex ga-3">
      <v-btn
        v-for="icon in icons"
        :key="icon"
        :icon="icon"
        density="comfortable"
        variant="text"
      ></v-btn>
    </div>

    <!--
    <v-divider class="my-2" thickness="2" width="50"></v-divider>

    <div class="text-caption font-weight-regular opacity-60">
      Czarles Construction and Supplies — Building your future with quality and integrity. Contact us for more information about our services.
    </div>
    -->

    <!-- Footer Links -->
    <div class="d-flex ga-4 flex-wrap justify-center">
      <v-btn to="/privacy-policy" variant="text" size="small" class="text-caption">
        Privacy Policy
      </v-btn>
      <v-btn to="/terms-and-conditions" variant="text" size="small" class="text-caption">
        Terms & Conditions
      </v-btn>
    </div>

    <v-divider></v-divider>

    <div>
      <strong
        >Copyright © {{ new Date().getFullYear() }} | Czarles Construction and Supplies</strong
      >
    </div>
  </v-footer>
</template>
