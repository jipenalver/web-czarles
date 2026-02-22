<script setup lang="ts">
import CashAdvanceRequestsTable from './advance-request/CashAdvanceRequestsTable.vue'
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
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
          :header-items="['Payroll Management', 'Cash Advance Requests']"
          header-icon="mdi-cash-sync"
          headline="Manage employee's cash advance requests."
        ></HeaderPanel>

        <CashAdvanceRequestsTable></CashAdvanceRequestsTable>
      </v-container>
    </template>
  </AppLayout>
</template>
