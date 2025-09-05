<script setup lang="ts">
import { settingsItemsNav } from '@/components/layout/navigation/sideNavigation'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import PasswordForm from './partials/security/PasswordForm.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import ProfileForm from './partials/account/ProfileForm.vue'
import PictureForm from './partials/account/PictureForm.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UserBioPanel from './partials/UserBioPanel.vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { onMounted, ref } from 'vue'

const { xs } = useDisplay()
const route = useRoute()

const tabWindow = ref('account')
const isDrawerVisible = ref(xs.value ? false : true)

onMounted(() => {
  switch (route.params.tab) {
    case 'account':
      tabWindow.value = 'account'
      break
    case 'security':
      tabWindow.value = 'security'
      break
  }
})
</script>

<template>
  <AppLayout :is-with-app-bar-icon="true" @is-drawer-visible="isDrawerVisible = !isDrawerVisible">
    <template #navigation>
      <SideNavigation v-model:is-drawer-visible="isDrawerVisible"></SideNavigation>
    </template>

    <template #content>
      <v-container fluid>
        <HeaderPanel
          :header-items="['Settings', 'Account Information']"
          header-icon="mdi-wrench"
          headline="Edit profile information, update profile picture and change password."
        ></HeaderPanel>

        <v-row>
          <v-col cols="12" xl="4" lg="4" sm="5">
            <UserBioPanel></UserBioPanel>
          </v-col>

          <v-col cols="12" xl="8" lg="8" sm="7">
            <v-tabs v-model="tabWindow" class="mb-5">
              <v-tab
                v-for="([title, icon, , to], i) in settingsItemsNav"
                :key="i"
                :value="title.toLowerCase().replace(/\s+/g, '-')"
                :prepend-icon="icon"
                :to="to"
                class="mx-1"
                color="primary"
                variant="flat"
                rounded="lg"
              >
                {{ title }}
              </v-tab>
            </v-tabs>

            <v-tabs-window v-model="tabWindow">
              <v-tabs-window-item value="account">
                <v-card class="mb-5" title="Profile Picture">
                  <v-card-text>
                    <PictureForm></PictureForm>
                  </v-card-text>
                </v-card>

                <v-card class="mb-5" title="Profile Information">
                  <v-card-text>
                    <ProfileForm></ProfileForm>
                  </v-card-text>
                </v-card>
              </v-tabs-window-item>

              <v-tabs-window-item value="security">
                <v-card class="mb-5" title="Change Password">
                  <v-card-text>
                    <PasswordForm></PasswordForm>
                  </v-card-text>
                </v-card>
              </v-tabs-window-item>
            </v-tabs-window>
          </v-col>
        </v-row>
      </v-container>
    </template>
  </AppLayout>
</template>
