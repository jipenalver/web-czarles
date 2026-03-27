<script setup lang="ts">
import { monthNames } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { computed } from 'vue'

const props = defineProps<{
  selectedMonth: string
  selectedYear: number
  loading: boolean
  searchQuery: string
  crossMonthEnabled: boolean
  dayFrom: number | null
  dayTo: number | null
  selectedDesignation: number | null
  selectedPaymentOption: boolean | null
  sortOrder: 'asc' | 'desc' | null
  designations: Array<{ id: number; designation: string }>
}>()

const emit = defineEmits<{
  'update:selectedMonth': [value: string]
  'update:selectedYear': [value: number]
  'update:searchQuery': [value: string]
  'update:crossMonthEnabled': [value: boolean]
  'update:dayFrom': [value: number | null]
  'update:dayTo': [value: number | null]
  'update:selectedDesignation': [value: number | null]
  'update:selectedPaymentOption': [value: boolean | null]
  'update:sortOrder': [value: 'asc' | 'desc' | null]
  refresh: []
}>()

// Month options
const monthOptions = computed(() =>
  monthNames.map((month, index) => ({
    title: month,
    value: month,
    index: index,
  })),
)

// Year options (last 5 years)
const currentYear = new Date().getFullYear()
const yearOptions = computed(() => Array.from({ length: 5 }, (_, i) => currentYear - i))

// Computed properties for day options
const daysInSelectedMonth = computed(() => {
  const monthIndex = monthNames.findIndex((m) => m === props.selectedMonth)
  const idx = monthIndex >= 0 ? monthIndex : 0
  return new Date(props.selectedYear, idx + 1, 0).getDate()
})

const daysInPreviousMonth = computed(() => {
  const monthIndex = monthNames.findIndex((m) => m === props.selectedMonth)
  const startIdx = monthIndex >= 0 ? monthIndex : 0
  const prevIdx = startIdx === 0 ? 11 : startIdx - 1
  let prevYear = props.selectedYear
  if (startIdx === 0) prevYear = props.selectedYear - 1
  return new Date(prevYear, prevIdx + 1, 0).getDate()
})

const dayOptionsFrom = computed(() =>
  Array.from({ length: daysInPreviousMonth.value }, (_, i) => i + 1),
)

const dayOptionsTo = computed(() =>
  Array.from({ length: daysInSelectedMonth.value }, (_, i) => i + 1),
)

// Designation options
const designationOptions = computed(() => [
  { title: 'All Designations', value: null },
  ...props.designations.map((d) => ({
    title: d.designation,
    value: d.id,
  })),
])

// Payment option items
const paymentOptions = [
  { title: 'All Payment Options', value: null },
  { title: 'ATM', value: true },
  { title: 'Cash', value: false },
]
</script>

<template>
  <v-card-text>
    <v-row align="center" no-gutters class="ga-2">
      <v-col>
        <v-select
          :model-value="selectedMonth"
          @update:model-value="emit('update:selectedMonth', $event)"
          :items="monthOptions"
          label="Month"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-calendar"
        ></v-select>
      </v-col>

      <v-col>
        <v-select
          :model-value="selectedYear"
          @update:model-value="emit('update:selectedYear', $event)"
          :items="yearOptions"
          label="Year"
          variant="outlined"
          density="compact"
        ></v-select>
      </v-col>

      <v-col style="max-width: 90px">
        <v-select
          :model-value="dayFrom"
          @update:model-value="emit('update:dayFrom', $event)"
          :items="dayOptionsFrom"
          :label="`From (${
            selectedMonth
              ? (() => {
                  const currentIndex = monthNames.indexOf(selectedMonth)
                  if (currentIndex === -1) return 'prev'
                  const prevIndex = (currentIndex - 1 + 12) % 12
                  return monthNames[prevIndex].slice(0, 3)
                })()
              : 'prev'
          })`"
          variant="outlined"
          density="compact"
          :disabled="!crossMonthEnabled"
        ></v-select>
      </v-col>

      <v-col style="max-width: 90px">
        <v-select
          :model-value="dayTo"
          @update:model-value="emit('update:dayTo', $event)"
          :items="dayOptionsTo"
          :label="`To (${selectedMonth ? selectedMonth.slice(0, 3) : 'cur'})`"
          variant="outlined"
          density="compact"
          :disabled="!crossMonthEnabled"
        ></v-select>
      </v-col>

      <v-col>
        <v-select
          :model-value="selectedDesignation"
          @update:model-value="emit('update:selectedDesignation', $event)"
          :items="designationOptions"
          label="Designation"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-briefcase"
          clearable
        ></v-select>
      </v-col>

      <v-col>
        <v-select
          :model-value="selectedPaymentOption"
          @update:model-value="emit('update:selectedPaymentOption', $event)"
          :items="paymentOptions"
          label="Payment"
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-credit-card"
          clearable
        ></v-select>
      </v-col>

      <v-col>
        <v-text-field
          :model-value="searchQuery"
          @update:model-value="emit('update:searchQuery', $event)"
          label="Search"
          placeholder="Employee name..."
          variant="outlined"
          density="compact"
          prepend-inner-icon="mdi-account-search"
          clearable
        ></v-text-field>
      </v-col>

      <v-col style="max-width: 120px">
        <v-select
          :model-value="sortOrder || 'asc'"
          @update:model-value="emit('update:sortOrder', $event)"
          :items="[
            { title: 'A-Z', value: 'asc', icon: 'mdi-sort-alphabetical-ascending' },
            { title: 'Z-A', value: 'desc', icon: 'mdi-sort-alphabetical-descending' },
          ]"
          label="Sort"
          variant="outlined"
          density="compact"
        >
          <template v-slot:selection="{ item }">
            <v-icon :icon="item.raw.icon" size="small" class="me-1"></v-icon>
            {{ item.title }}
          </template>
        </v-select>
      </v-col>
    </v-row>
  </v-card-text>
</template>
