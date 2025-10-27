<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import CashAdjustmentsTable from './adjustments/CashAdjustmentsTable.vue'
import UtilizationsTable from './utilizations/UtilizationsTable.vue'
import TripLocationsTable from './locations/TripLocationsTable.vue'
import AllowancesTable from './allowances/AllowancesTable.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UnitsTable from './units/UnitsTable.vue'
import TripsTable from './trips/TripsTable.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const { xs } = useDisplay()

const tabsItems = [
  {
    icon: 'mdi-cash-plus',
    text: 'Adjustments',
    value: 'adjustments',
  },
  {
    icon: 'mdi-highway',
    text: 'Trips',
    value: 'trips',
  },
  {
    icon: 'mdi-fuel',
    text: 'Utilizations',
    value: 'utilizations',
  },
  {
    icon: 'mdi-cash-multiple',
    text: 'Allowances',
    value: 'allowances',
  },
  {
    icon: 'mdi-dump-truck',
    text: 'Units',
    value: 'units',
  },
  {
    icon: 'mdi-office-building-marker',
    text: 'Locations',
    value: 'locations',
  },
]

const tabWindow = ref('adjustments')
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
          :header-items="['Payroll Management', 'Salary Add-ons']"
          header-icon="mdi-cash-multiple"
          headline="Manage employee's salary add-ons on monthly payroll."
        ></HeaderPanel>

        <v-tabs v-model="tabWindow" class="mb-5">
          <template v-for="(item, index) in tabsItems" :key="item.value">
            <v-divider
              v-if="index === 4 || index === 1"
              class="border-opacity-100 mx-2"
              thickness="2"
              color="primary"
              vertical
            ></v-divider>

            <v-tab
              class="mx-1"
              :prepend-icon="item.icon"
              :text="item.text"
              :value="item.value"
              min-width="200"
              color="primary"
              variant="flat"
              rounded="lg"
            ></v-tab>
          </template>
        </v-tabs>

        <v-tabs-window v-model="tabWindow">
          <v-tabs-window-item value="adjustments">
            <CashAdjustmentsTable></CashAdjustmentsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="trips">
            <TripsTable></TripsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="utilizations">
            <UtilizationsTable></UtilizationsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="allowances">
            <AllowancesTable></AllowancesTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="units">
            <UnitsTable></UnitsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="locations">
            <TripLocationsTable></TripLocationsTable>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </template>
  </AppLayout>
</template>
