<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import EmployeesTable from '../manage-employees/employees/EmployeesTable.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import HolidaysTable from './holidays/HolidaysTable.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const { xs } = useDisplay()

const tabsItems = [
  {
    icon: 'mdi-account-cash',
    text: 'Payroll',
    value: 'payroll',
  },
  {
    icon: 'mdi-bed',
    text: 'Holidays',
    value: 'holidays',
  },
]

const tabWindow = ref('payroll')
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
          :header-items="['Payroll Management', 'Payroll']"
          header-icon="mdi-account-cash"
          headline="Manage employee's payroll."
        ></HeaderPanel>

        <v-tabs v-model="tabWindow" class="mb-5">
          <v-tab
            v-for="item in tabsItems"
            :key="item.value"
            class="mx-1"
            :prepend-icon="item.icon"
            :text="item.text"
            :value="item.value"
            min-width="200"
            color="primary"
            variant="flat"
            rounded="lg"
          ></v-tab>
        </v-tabs>

        <v-tabs-window v-model="tabWindow">
          <v-tabs-window-item value="payroll">
            <EmployeesTable component-view="payroll"></EmployeesTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="holidays">
            <HolidaysTable></HolidaysTable>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </template>
  </AppLayout>
</template>
