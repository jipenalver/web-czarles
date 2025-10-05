<script setup lang="ts">
import MonthlyPayrollFilters from '@/views/system/admin/manage-payroll/monthlyPayroll/components/MonthlyPayrollFilters.vue'
import MonthlyPayrollTable from '@/views/system/admin/manage-payroll/monthlyPayroll/components/MonthlyPayrollTable.vue'
import { useMonthlyPayroll } from '@/views/system/admin/manage-payroll/monthlyPayroll/composables/monthlyPayroll'
import { monthNames } from '@/views/system/admin/manage-payroll/payroll/helpers'
import AppAlert from '@/components/common/AppAlert.vue'
import { ref, watch, onMounted } from 'vue'

// Use composable for monthly payroll logic
const {
  loading,
  monthlyPayrollData,
  selectedMonth,
  selectedYear,
  loadMonthlyPayroll,
} = useMonthlyPayroll()

// Set default month to current month
onMounted(() => {
  selectedMonth.value = monthNames[new Date().getMonth()]
})

// Watch for changes
watch([selectedMonth, selectedYear], () => {
  if (selectedMonth.value && selectedYear.value) {
    loadMonthlyPayroll()
  }
})

// Alert state
const formAlert = ref(false)
const formMessage = ref('')
const formStatus = ref<number>(200)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(25)

// Search state
const searchQuery = ref('')

// Reset to first page when data changes or search query changes
watch(monthlyPayrollData, () => {
  currentPage.value = 1
})

watch(searchQuery, () => {
  currentPage.value = 1
})
</script>

<template>
  <div>
    <AppAlert
      v-model:is-alert-visible="formAlert"
      :form-message="formMessage"
      :form-status="formStatus"
    ></AppAlert>

    <!-- Filters Component -->
    <MonthlyPayrollFilters
      v-model:selected-month="selectedMonth"
      v-model:selected-year="selectedYear"
      v-model:search-query="searchQuery"
      :loading="loading"
      @generate="loadMonthlyPayroll"
    />

    <!-- Data Table Component -->
    <MonthlyPayrollTable
      v-if="monthlyPayrollData.length > 0"
      class="mt-4"
      :items="monthlyPayrollData"
      :loading="loading"
      :search-query="searchQuery"
      v-model:current-page="currentPage"
      v-model:items-per-page="itemsPerPage"
    />

    <!-- Empty State -->
    <v-card class="mt-4" v-else-if="!loading">
      <v-card-text>
        <v-alert type="info" variant="tonal">
          <v-icon icon="mdi-information" class="me-2"></v-icon>
          Select a month and year, then click "Generate Report" to view the monthly payroll summary.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
