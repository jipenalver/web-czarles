<script setup lang="ts">
import profileDefault from '@/assets/misc/profile-default.jpg'
import { useAuthUserStore } from '@/stores/authUser'

const authUserStore = useAuthUserStore()
</script>

<template>
  <v-row>
    <v-col cols="12">
      <v-card class="border-md border-solid border-opacity-100 border-primary">
        <v-card-text>
          <v-img
            width="50%"
            class="mx-auto rounded-circle"
            color="primary"
            aspect-ratio="1"
            :src="authUserStore.userData?.avatar ?? profileDefault"
            alt="Profile Picture"
            cover
          >
          </v-img>

          <h3 class="d-flex justify-center my-6">
            <v-chip color="primary">
              <v-icon class="me-2" icon="mdi-account-badge"> </v-icon>
              <b class="text-high-emphasis font-weight-black">{{ authUserStore.userRole }}</b>
            </v-chip>
          </h3>

          <h2 class="text-h5">Account Details</h2>

          <v-divider class="my-5" thickness="3"></v-divider>

          <div class="text-start">
            <h4 class="my-2">
              Fullname:
              <b class="text-high-emphasis font-weight-black">
                {{ authUserStore.userData?.firstname + ' ' + authUserStore.userData?.lastname }}
              </b>
            </h4>

            <h4 class="my-2">
              Email:
              <b class="text-high-emphasis font-weight-black">
                {{ authUserStore.userData?.email }}
              </b>
            </h4>
            <h4 class="my-2">
              Contact No.:
              <b class="text-high-emphasis font-weight-black">
                {{ authUserStore.userData?.phone }}
              </b>
            </h4>
          </div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>
