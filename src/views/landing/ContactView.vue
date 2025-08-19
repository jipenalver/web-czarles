<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
</script>

<template>
     <LandingLayout>
        <template #content>
          <v-container class="pa-5">
            <v-row>
              <v-col cols="0" md="3" lg="3"> </v-col>
              <v-col cols="12" md="6" lg="6">
                <div>
                  <h1 class="text-h2 font-weight-bold mb-4">Contact Us</h1>
                  <p class="text-body-1">
                    If you have any questions or inquiries, please feel free to reach out to us. Our team is here to assist you.
                  </p>
                </div>
              </v-col>
              <v-col cols="0" md="3" lg="3"> </v-col>
            </v-row>
          </v-container>
        </template>
     </LandingLayout>
</template>