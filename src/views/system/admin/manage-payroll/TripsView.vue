<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import UnitsTable from './units/UnitsTable.vue'
import TripsTable from './trips/TripsTable.vue'
import LocationsTable from './locations/LocationsTable.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const { xs } = useDisplay()
//tabs
const tabsItems = [
  {
    icon: 'mdi-highway',
    text: 'Trips',
    value: 'trips',
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

const tabWindow = ref('trips')
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
          :header-items="['Payroll Management', 'Trips']"
          header-icon="mdi-highway"
          headline="Manage employee's trips."
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
          <v-tabs-window-item value="trips">
            <TripsTable></TripsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="units">
            <UnitsTable></UnitsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="locations">
            <LocationsTable></LocationsTable>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </template>
  </AppLayout>
</template>
