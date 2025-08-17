<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import UserCountWidget from './partials/UserCountWidget.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import WelcomeWidget from './partials/WelcomeWidget.vue'
import BirthdayComponent from './birthday/BirthtdayWidget.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const { xs } = useDisplay()

const isDrawerVisible = ref(xs.value ? false : true)
</script>

<template>
  <AppLayout :is-with-app-bar-icon="true" @is-drawer-visible="isDrawerVisible = !isDrawerVisible">
    <template #navigation>
      <SideNavigation v-model:is-drawer-visible="isDrawerVisible"></SideNavigation>
    </template>

    <template #content>
      <v-container fluid>
        <v-row>
          <v-col cols="12" lg="9">
            <WelcomeWidget></WelcomeWidget>
          </v-col>

          <v-col cols="12" lg="3">
            <UserCountWidget></UserCountWidget>
          </v-col>
          <v-col cols="12" lg="3"> Percent of Projects </v-col>
          <v-col cols="12" lg="9">
            <BirthdayComponent></BirthdayComponent>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
