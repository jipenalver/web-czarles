<script setup lang="ts">
import MonthlyPayrollTable from '@/views/system/admin/manage-payroll/summary/components/MonthlyPayrollTable.vue'
import MonthlyPayrollFilters from '@/views/system/admin/manage-payroll/summary/components/MonthlyPayrollFilters.vue'
import MonthlyPayrollPDF from '@/views/system/admin/manage-payroll/summary/pdf/MonthlyPayrollPDF.vue'
import { useMonthlyPayroll } from '@/views/system/admin/manage-payroll/summary/composables/monthlyPayroll'
import { useMonthlyPayrollPDF } from '@/views/system/admin/manage-payroll/summary/pdf/monthlyPayrollPDF'
import { useMonthlyPayrollCSV } from '@/views/system/admin/manage-payroll/summary/composables/monthlyPayrollCSV'
import {
  monthNames,
  getDateRangeForMonth,
} from '@/views/system/admin/manage-payroll/payroll/helpers'
import { calculateDaysWorkedForAdminByAmOnly } from './composables/daysWorkedCalculations'
import { useDesignationsStore } from '@/stores/designations'
import { useEmployeesStore } from '@/stores/employees'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { ref, watch, onMounted, computed } from 'vue'

// Cross-month filter state
const crossMonthEnabled = ref<boolean>(true)
const dayFrom = ref<number | null>(26)
const dayTo = ref<number | null>(25)

// Use composable for monthly payroll logic
const {
  loading,
  monthlyPayrollData,
  selectedMonth,
  selectedYear,
  loadMonthlyPayroll,
  refreshMonthlyPayroll,
} = useMonthlyPayroll()

//  Use PDF composable
const { isLoadingPDF, onExport } = useMonthlyPayrollPDF()

// Use CSV composable
const { isExporting, generatePayrollCSV } = useMonthlyPayrollCSV()

// Use designations store
const designationsStore = useDesignationsStore()

// Use employees store
const employeesStore = useEmployeesStore()

// Set default month to current month and load designations
onMounted(async () => {
  selectedMonth.value = monthNames[new Date().getMonth()]
  await designationsStore.getDesignations()
  await employeesStore.getEmployees() // Load employees to get admin status
})

// Watch for cross-month toggle
watch(crossMonthEnabled, (enabled) => {
  if (!enabled) {
    dayFrom.value = null
    dayTo.value = null
  } else {
    if (dayFrom.value === null) dayFrom.value = 26
    if (dayTo.value === null) dayTo.value = 25
  }
})

// Watch for changes and load payroll with date range
watch([selectedMonth, selectedYear, dayFrom, dayTo, crossMonthEnabled], () => {
  if (selectedMonth.value && selectedYear.value) {
    // Calculate date range
    let fromDate: string | undefined
    let toDate: string | undefined

    if (crossMonthEnabled.value && dayFrom.value && dayTo.value) {
      const range = getDateRangeForMonth(
        selectedYear.value,
        selectedMonth.value,
        dayFrom.value,
        dayTo.value,
      )
      fromDate = range.fromDate
      toDate = range.toDate
    }

    loadMonthlyPayroll(fromDate, toDate)
  }
})

// Alert state
const formAlert = ref(false)
const formMessage = ref('')
const formStatus = ref<number>(200)

// Menu state
const menuOpen = ref(false)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(25)

// Search state
const searchQuery = ref('')

// Designation filter state
const selectedDesignation = ref<number | null>(null)

// Payment option filter state
const selectedPaymentOption = ref<boolean | null>(null)

// Sort order state (default to A-Z)
const sortOrder = ref<'asc' | 'desc' | null>('asc')

// Filtered items based on search query and designation
const filteredMonthlyPayrollData = computed(() => {
  let filtered = monthlyPayrollData.value

  // Filter by designation
  if (selectedDesignation.value !== null) {
    filtered = filtered.filter((item) => item.designation_id === selectedDesignation.value)
  }

  // Filter by payment option
  if (selectedPaymentOption.value !== null) {
    filtered = filtered.filter((item) => {
      // Find the employee in the store to get the payment option
      const employee = employeesStore.employees.find((emp) => emp.id === item.employee_id)
      return employee ? employee.is_atm_payroll === selectedPaymentOption.value : false
    })
  }

  // Filter by search query
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((item) => item.employee_name.toLowerCase().includes(query))
  }

  // Apply sorting
  if (sortOrder.value) {
    filtered = [...filtered].sort((a, b) => {
      const nameA = a.employee_name.toLowerCase()
      const nameB = b.employee_name.toLowerCase()

      if (sortOrder.value === 'asc') {
        return nameA.localeCompare(nameB)
      } else {
        return nameB.localeCompare(nameA)
      }
    })
  }

  return filtered
})

// Compute days worked for admin employees when data or date range changes
watch(
  [monthlyPayrollData, selectedMonth, selectedYear, dayFrom, dayTo, crossMonthEnabled],
  async () => {
    if (!Array.isArray(monthlyPayrollData.value) || monthlyPayrollData.value.length === 0) return

    // Ensure employees are loaded
    if (employeesStore.employees.length === 0) {
      await employeesStore.getEmployees()
    }

    // Determine date string for calculation (use selected month/year)
    const monthIdx = monthNames.indexOf(selectedMonth.value)
    const yearVal = selectedYear.value || new Date().getFullYear()
    const monthVal = monthIdx >= 0 ? monthIdx + 1 : new Date().getMonth() + 1
    const monthStr = `${yearVal}-${String(monthVal).padStart(2, '0')}-01`

    // Optional from/to if cross-month is enabled
    let fromDate: string | undefined
    let toDate: string | undefined
    if (crossMonthEnabled.value && dayFrom.value && dayTo.value) {
      const range = getDateRangeForMonth(yearVal, selectedMonth.value, dayFrom.value, dayTo.value)
      fromDate = range.fromDate
      toDate = range.toDate
    }

    // For each payroll item, check if employee is admin/field staff and compute days_worked_calculated
    await Promise.all(
      monthlyPayrollData.value.map(
        async (item: {
          employee_id?: number
          id?: number
          days_worked_calculated?: number | null
          is_admin?: boolean
          is_field_staff?: boolean
        }) => {
          try {
            const employeeId = item.employee_id || item.id
            if (!employeeId) return

            // Find the employee in the store to get the flags
            const employee = employeesStore.employees.find((emp) => emp.id === employeeId)

            // Set employee flags for proper late/undertime calculation
            if (employee) {
              item.is_admin = employee.is_admin || false
              item.is_field_staff = employee.is_field_staff || false

              if (employee.is_admin) {
                console.log(
                  `[Admin Calculation] Calculating days for admin employee: ${employee.firstname} ${employee.lastname} (ID: ${employeeId})`,
                )

                const days = await calculateDaysWorkedForAdminByAmOnly(
                  employeeId,
                  monthStr,
                  fromDate,
                  toDate,
                )
                item.days_worked_calculated = days

                console.log(
                  `[Admin Calculation] Admin employee ${employee.firstname} ${employee.lastname}: ${days} days calculated`,
                )
              } else {
                // Leave existing value or undefined for non-admins
                item.days_worked_calculated = item.days_worked_calculated ?? null
              }
            } else {
              // Employee not found in store, set defaults
              item.is_admin = false
              item.is_field_staff = false
              item.days_worked_calculated = item.days_worked_calculated ?? null
            }
          } catch {
            // ignore per-item errors
            item.days_worked_calculated = item.days_worked_calculated ?? null
            item.is_admin = false
            item.is_field_staff = false
          }
        },
      ),
    )
  },
  { immediate: true },
)

// Reset to first page when data changes or search query changes
watch(monthlyPayrollData, () => {
  currentPage.value = 1
})

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(selectedDesignation, () => {
  currentPage.value = 1
})

watch(selectedPaymentOption, () => {
  currentPage.value = 1
})

watch(sortOrder, () => {
  currentPage.value = 1
})

// PDF Export handler
const handleExportPDF = async () => {
  menuOpen.value = false
  await onExport({
    selectedMonth: selectedMonth.value,
    selectedYear: selectedYear.value,
  })
}

// CSV Export handler
const handleExportCSV = () => {
  menuOpen.value = false
  generatePayrollCSV(
    filteredMonthlyPayrollData.value,
    selectedMonth.value,
    selectedYear.value,
    crossMonthEnabled.value,
    dayFrom.value,
    dayTo.value,
  )
}
</script>

<template>
  <div>
    <AppAlert
      v-model:is-alert-visible="formAlert"
      :form-message="formMessage"
      :form-status="formStatus"
    ></AppAlert>

    <!-- Loading Dialog for PDF -->
    <LoadingDialog
      v-model:is-visible="isLoadingPDF"
      title="Generating PDF..."
      subtitle="Please wait while we create your payroll report"
      description="This may take a few moments"
    />

    <!-- Loading Dialog for CSV -->
    <LoadingDialog
      v-model:is-visible="isExporting"
      title="Generating CSV..."
      subtitle="Please wait while we prepare your CSV file"
      description="This may take a few moments"
    />

    <!-- PDF Component (Hidden) -->
    <MonthlyPayrollPDF
      :items="filteredMonthlyPayrollData"
      :selected-month="selectedMonth"
      :selected-year="selectedYear"
    />

    <!-- Combined Card with Filters and Table -->
    <v-card>
      <v-card-text class="d-flex align-center">
        <!-- 3-dot menu on the left -->
        <v-menu v-model="menuOpen" :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              v-bind="props"
              :disabled="filteredMonthlyPayrollData.length === 0"
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="handleExportCSV" :disabled="isExporting">
              <template v-slot:prepend>
                <v-icon icon="mdi-file-delimited"></v-icon>
              </template>
              <v-list-item-title>Export to CSV</v-list-item-title>
            </v-list-item>
            <v-list-item @click="handleExportPDF" :disabled="isLoadingPDF">
              <template v-slot:prepend>
                <v-icon icon="mdi-file-pdf-box"></v-icon>
              </template>
              <v-list-item-title>Export to PDF</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <!-- Generate Report Icon -->
        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          @click="refreshMonthlyPayroll"
          :loading="loading"
          :disabled="!selectedMonth || !selectedYear"
        ></v-btn>

        <span class="text-h5">
          <v-icon class="me-2" icon="mdi-calendar-month" size="small"></v-icon>
          Payroll Summary
        </span>
      </v-card-text>

      <!-- Filters Section -->
      <MonthlyPayrollFilters
        v-model:selected-month="selectedMonth"
        v-model:selected-year="selectedYear"
        v-model:search-query="searchQuery"
        v-model:cross-month-enabled="crossMonthEnabled"
        v-model:day-from="dayFrom"
        v-model:day-to="dayTo"
        v-model:selected-designation="selectedDesignation"
        v-model:selected-payment-option="selectedPaymentOption"
        v-model:sort-order="sortOrder"
        :loading="loading"
        :designations="designationsStore.designations"
        @refresh="refreshMonthlyPayroll"
      />

      <v-divider v-if="monthlyPayrollData.length > 0"></v-divider>

      <!-- Table Section -->
      <MonthlyPayrollTable
        v-if="monthlyPayrollData.length > 0"
        :items="filteredMonthlyPayrollData"
        :loading="loading"
        :search-query="searchQuery"
        :selected-designation="selectedDesignation"
        :selected-month="selectedMonth"
        :selected-year="selectedYear"
        :cross-month-enabled="crossMonthEnabled"
        :day-from="dayFrom"
        :day-to="dayTo"
        v-model:current-page="currentPage"
        v-model:items-per-page="itemsPerPage"
      />

      <!-- Empty State -->
      <v-card-text v-else-if="!loading">
        <v-alert type="info" variant="tonal">
          <v-icon icon="mdi-information" class="me-2"></v-icon>
          Select a month and year, then click "Generate Report" to view the monthly payroll summary.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
