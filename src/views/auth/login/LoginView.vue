<script setup lang="ts">
import headerCzarles from '@/assets/images/image-header-title.png'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoginForm from './partials/LoginForm.vue'
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container>
        <v-row class="d-flex justify-center">
          <v-col cols="12" xl="4" lg="5" sm="8">
            <RouterLink to="/">
              <v-img class="mx-auto my-6" max-width="900" :src="headerCzarles"></v-img>
            </RouterLink>

            <v-card class="mx-auto pa-8" elevation="8" rounded="lg">
              <v-img class="mx-auto my-6" max-width="225" :src="logoCzarles"></v-img>

              <LoginForm></LoginForm>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
