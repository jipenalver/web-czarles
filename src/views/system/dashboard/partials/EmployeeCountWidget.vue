<script setup lang="ts">
import { useEmployeesStore } from '@/stores/employees'
import { onMounted } from 'vue'

const employeesStore = useEmployeesStore()

onMounted(async () => {
  if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
})
</script>

<template>
  <v-card elevation="8">
    <template #prepend>
      <v-chip color="primary">
        <v-icon icon="mdi-account-star"></v-icon>
      </v-chip>
    </template>

    <v-card-text class="text-center">
      <h2 class="text-h3">{{ employeesStore.employees.length }}</h2>
      <p class="mb-3">Total Employees</p>

      <v-chip class="font-weight-bold" density="compact" color="primary"> System Wide </v-chip>
    </v-card-text>
  </v-card>
</template>
