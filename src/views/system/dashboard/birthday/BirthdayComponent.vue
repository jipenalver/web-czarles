<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDate } from 'vuetify'
import { useEmployeesStore, type EmployeeTableFilter } from '@/stores/employees'
import { type TableHeader } from '@/utils/helpers/tables'

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

watch(() => tableFilters.value.search, async () => {
  // refresh export when searching
  await loadEmployees()
})

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
    <v-card-title>
      Birthdays This Month
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="12" sm="6">
          <v-text-field
            v-model="tableFilters.search"
            density="compact"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search by name or email"
            clearable
          ></v-text-field>
        </v-col>
      </v-row>

      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="birthdays"
        :items-length="birthdays.length"
        :hide-default-header="false"
        show-expand
      >
        <template #item.lastname="{ item }">
          <span class="font-weight-bold">{{ item.lastname }}, {{ item.firstname }}</span>
        </template>

        <template #item.birthdate="{ item }">
          <span>{{ item.birthdate ? date.format(item.birthdate, 'fullDate') : '' }}</span>
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
