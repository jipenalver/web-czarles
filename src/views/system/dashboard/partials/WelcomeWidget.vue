<script setup lang="ts">
import MiscWelcomeJohn from '@/assets/misc/illustration-john-light.png'
import { useAuthUserStore } from '@/stores/authUser'
import { useDisplay } from 'vuetify'

const { xs } = useDisplay()

const authUserStore = useAuthUserStore()
</script>

<template>
  <v-card elevation="8" min-height="175">
    <v-card-text>
      <v-row>
        <v-col class="order-2 order-sm-1 pa-4" cols="12" lg="8" sm="9">
          <h2 class="text-h5" :class="xs ? 'text-center' : ''">
            Welcome aboard,
            <b class="font-weight-bold">
              {{ authUserStore.userData?.firstname }} {{ authUserStore.userData?.lastname }}!
            </b>
          </h2>

          <p class="mt-4">
            We’re excited to have you onboard. If you encounter any issues or have any questions
            about the system, feel free to reach out the technical support,
            <b>jianchris2k14@gmail.com</b>. We're here to support you every step of the way.
          </p>
        </v-col>

        <v-col class="order-1 order-sm-2" cols="12" lg="4" sm="3">
          <v-img class="mx-auto" max-width="200" :src="MiscWelcomeJohn"></v-img>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
