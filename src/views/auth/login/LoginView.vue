<script setup lang="ts">
import headerCzarles from '@/assets/images/image-header-title.png'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import AppLayout from '@/components/layout/AppLayout.vue'
import LoginForm from './partials/LoginForm.vue'
import { useDisplay } from 'vuetify'

const { mobile } = useDisplay()
</script>

<template>
  <AppLayout>
    <template #content>
      <v-container class="pa-0" fluid>
        <v-row>
          <v-col v-if="!mobile" cols="12" lg="8" class="h-screen pa-0"> </v-col>

          <v-col cols="12" lg="4" sm="7" :class="mobile ? 'mx-auto' : 'bg-background pt-16'">
            <v-card class="bg-background mx-auto mt-10 pa-8" elevation="0">
              <RouterLink to="/">
                <v-img class="mx-auto my-6" max-width="900" :src="headerCzarles"></v-img>
              </RouterLink>

              <v-img class="mx-auto my-6" max-width="225" :src="logoCzarles"></v-img>

              <LoginForm></LoginForm>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
