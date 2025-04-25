<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UsersTable from './partials/UsersTable.vue'
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
          :header-items="['Users Management', 'List of Users']"
          header-icon="mdi-list-box"
          headline="Manage user accounts and assign roles dynamically."
        ></HeaderPanel>

        <UsersTable></UsersTable>
      </v-container>
    </template>
  </AppLayout>
</template>
