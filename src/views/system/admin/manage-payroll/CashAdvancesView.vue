<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import CashAdvancesTable from './advances/CashAdvancesTable.vue'
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
          :header-items="['Payroll Management', 'Cash Advances']"
          header-icon="mdi-cash-refund"
          headline="Manage employee's cash advances."
        ></HeaderPanel>

        <CashAdvancesTable></CashAdvancesTable>
      </v-container>
    </template>
  </AppLayout>
</template>
