<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UserRolesList from './partials/UserRolesCards.vue'
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
        <HeaderPanel
          :header-items="['Admin Users', 'User Roles']"
          header-icon="mdi-tag-multiple"
          headline="A role grants access to specific pages and features, ensuring that admin users can
              access what they need based on their assigned role."
        ></HeaderPanel>

        <UserRolesList></UserRolesList>
      </v-container>
    </template>
  </AppLayout>
</template>
