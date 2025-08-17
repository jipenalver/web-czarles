<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDate } from 'vuetify'
import { useEmployeesStore, type EmployeeTableFilter } from '@/stores/employees'
import { type TableHeader } from '@/utils/helpers/tables'
import profileDefault from '@/assets/misc/profile-default.jpg'

const employeesStore = useEmployeesStore()
const date = useDate()

const tableOptions = ref({ page: 1, itemsPerPage: 1000, sortBy: [], isLoading: false })
const tableFilters = ref<EmployeeTableFilter>({ search: '', designation_id: null })

const tableHeaders: TableHeader[] = [
  { title: 'Fullname', key: 'lastname', align: 'start' },
  { title: 'Birthdate', key: 'birthdate', align: 'start' },
  { title: 'Age', key: 'age', align: 'center' },
]

// Load employees export which we will filter locally for birthdays
const loadEmployees = async () => {
  tableOptions.value.isLoading = true
  await employeesStore.getEmployeesExport(tableOptions.value, tableFilters.value)
  tableOptions.value.isLoading = false
}

onMounted(async () => {
  if (employeesStore.employeesExport.length === 0) await loadEmployees()
})

watch(
  () => tableFilters.value.search,
  async () => {
    // refresh export when searching
    await loadEmployees()
  },
)

function getAge(birthdate?: string) {
  if (!birthdate) return ''
  try {
    const b = new Date(birthdate)
    const now = new Date()
    let age = now.getFullYear() - b.getFullYear()
    const m = now.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
    return age >= 0 ? age.toString() : ''
  } catch (e) {
    return ''
  }
}

function getAvatar(emp: any) {
  return emp?.avatar ?? profileDefault
}

function isToday(emp: any) {
  if (!emp?.birthdate) return false
  try {
    const b = new Date(emp.birthdate)
    const now = new Date()
    return b.getMonth() === now.getMonth() && b.getDate() === now.getDate()
  } catch (e) {
    return false
  }
}

const currentMonth = new Date().getMonth()

const birthdays = computed(() => {
  return employeesStore.employeesExport
    .filter((e) => e.birthdate)
    .filter((e) => new Date(e.birthdate).getMonth() === currentMonth)
    .sort((a, b) => new Date(a.birthdate).getDate() - new Date(b.birthdate).getDate())
})
</script>

<template>
  <v-card>
    <v-card-title> Birthdays This Month </v-card-title>

    <v-card-text>
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="birthdays"
        :items-length="birthdays.length"
        :hide-default-header="false"
      >
        <template #item.lastname="{ item }">
          <div :class="['d-flex align-center', isToday(item) ? 'bg-primary text-white rounded px-3 py-2' : '']">
            <v-avatar :size="isToday(item) ? 44 : 36" class="me-3" :image="getAvatar(item)" color="primary"></v-avatar>
            <span class="font-weight-bold">{{ item.lastname }}, {{ item.firstname }}</span>
            <v-chip v-if="isToday(item)" small color="pink" text-color="white" class="ms-2">Today</v-chip>
          </div>
        </template>

        <template #item.birthdate="{ item }">
          <span class="d-flex align-center">
            <span>{{ item.birthdate ? date.format(item.birthdate, 'fullDate') : '' }}</span>
            <v-icon v-if="isToday(item)" class="ms-2">mdi-cake</v-icon>
          </span>
        </template>

        <template #item.age="{ item }">
          <span class="font-weight-bold">{{ getAge(item.birthdate) }}</span>
        </template>

        <template #no-data>
          <v-row class="pa-4" justify="center">
            <div>No birthdays found for this month.</div>
          </v-row>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>
</template>
