<script setup lang="ts">
import { monthNames } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { computed } from 'vue'

const props = defineProps<{
  selectedMonth: string
  selectedYear: number
  loading: boolean
}>()

const emit = defineEmits<{
  'update:selectedMonth': [value: string]
  'update:selectedYear': [value: number]
  generate: []
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

const isGenerateDisabled = computed(() => {
  return !props.selectedMonth || !props.selectedYear
})
</script>

<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon icon="mdi-calendar-month" class="me-2"></v-icon>
      <span>Monthly Payroll Summary</span>
    </v-card-title>

    <v-card-text>
      <v-row>
        <v-col cols="12" md="4">
          <v-select
            :model-value="selectedMonth"
            @update:model-value="emit('update:selectedMonth', $event)"
            :items="monthOptions"
            label="Select Month"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-calendar"
          ></v-select>
        </v-col>

        <v-col cols="12" md="4">
          <v-select
            :model-value="selectedYear"
            @update:model-value="emit('update:selectedYear', $event)"
            :items="yearOptions"
            label="Select Year"
            variant="outlined"
            density="compact"
            prepend-inner-icon="mdi-calendar-range"
          ></v-select>
        </v-col>

        <v-col cols="12" md="4" class="d-flex align-center">
          <v-btn
            color="primary"
            @click="emit('generate')"
            :loading="loading"
            :disabled="isGenerateDisabled"
            block
          >
            <v-icon icon="mdi-refresh" class="me-2"></v-icon>
            Generate Report
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>
