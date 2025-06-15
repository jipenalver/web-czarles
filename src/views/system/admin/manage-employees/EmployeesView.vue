<script setup lang="ts">
import SideNavigation from '@/components/layout/navigation/SideNavigation.vue'
import DesignationsTable from './designations/DesignationsTable.vue'
import HeaderPanel from '@/components/common/HeaderPanel.vue'
import EmployeesTable from './employees/EmployeesTable.vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import AreasTable from './areas/AreasTable.vue'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const { xs } = useDisplay()

const tabsItems = [
  {
    icon: 'mdi-account-multiple',
    text: 'Employees',
    value: 'employees',
  },
  {
    icon: 'mdi-account-tag',
    text: 'Designations',
    value: 'designations',
  },
  {
    icon: 'mdi-map-marker',
    text: 'Areas',
    value: 'areas',
  },
]

const tabWindow = ref('employees')
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
          :header-items="['Employees Management', 'List of Employees']"
          header-icon="mdi-account-multiple"
          headline="Onboard and manage employees."
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
          <v-tabs-window-item value="employees">
            <EmployeesTable component-view="employees"></EmployeesTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="designations">
            <DesignationsTable></DesignationsTable>
          </v-tabs-window-item>

          <v-tabs-window-item value="areas">
            <AreasTable></AreasTable>
          </v-tabs-window-item>
        </v-tabs-window>
      </v-container>
    </template>
  </AppLayout>
</template>
