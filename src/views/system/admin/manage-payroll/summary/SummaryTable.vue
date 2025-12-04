<script setup lang="ts">
import MonthlyPayrollTable from '@/views/system/admin/manage-payroll/summary/components/MonthlyPayrollTable.vue'
import MonthlyPayrollPDF from '@/views/system/admin/manage-payroll/summary/pdf/MonthlyPayrollPDF.vue'
import { useMonthlyPayroll } from '@/views/system/admin/manage-payroll/summary/composables/monthlyPayroll'
import { useMonthlyPayrollPDF } from '@/views/system/admin/manage-payroll/summary/pdf/monthlyPayrollPDF'
import { useMonthlyPayrollCSV } from '@/views/system/admin/manage-payroll/summary/composables/monthlyPayrollCSV'
import { monthNames, getDateRangeForMonth } from '@/views/system/admin/manage-payroll/payroll/helpers'
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

// Computed properties for day options
const daysInSelectedMonth = computed(() => {
  const monthIndex = monthNames.findIndex((m) => m === selectedMonth.value)
  const idx = monthIndex >= 0 ? monthIndex : 0
  return new Date(selectedYear.value, idx + 1, 0).getDate()
})

const daysInPreviousMonth = computed(() => {
  const monthIndex = monthNames.findIndex((m) => m === selectedMonth.value)
  const startIdx = monthIndex >= 0 ? monthIndex : 0
  const prevIdx = startIdx === 0 ? 11 : startIdx - 1
  let prevYear = selectedYear.value
  if (startIdx === 0) prevYear = selectedYear.value - 1
  return new Date(prevYear, prevIdx + 1, 0).getDate()
})

const dayOptionsFrom = computed(() =>
  Array.from({ length: daysInPreviousMonth.value }, (_, i) => i + 1),
)
const dayOptionsTo = computed(() =>
  Array.from({ length: daysInSelectedMonth.value }, (_, i) => i + 1),
)

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
        dayTo.value
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

// Filtered items based on search query and designation
const filteredMonthlyPayrollData = computed(() => {
  let filtered = monthlyPayrollData.value

  // Filter by designation
  if (selectedDesignation.value !== null) {
    filtered = filtered.filter((item) => item.designation_id === selectedDesignation.value)
  }

  // Filter by search query
  if (searchQuery.value && searchQuery.value.trim() !== '') {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter((item) => item.employee_name.toLowerCase().includes(query))
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
      monthlyPayrollData.value.map(async (item: { employee_id?: number; id?: number; days_worked_calculated?: number | null; is_admin?: boolean; is_field_staff?: boolean }) => {
        try {
          const employeeId = item.employee_id || item.id
          if (!employeeId) return

          // Find the employee in the store to get the flags
          const employee = employeesStore.employees.find(emp => emp.id === employeeId)

          // Set employee flags for proper late/undertime calculation
          if (employee) {
            item.is_admin = employee.is_admin || false
            item.is_field_staff = employee.is_field_staff || false

            if (employee.is_admin) {
              console.log(`[Admin Calculation] Calculating days for admin employee: ${employee.firstname} ${employee.lastname} (ID: ${employeeId})`)

              const days = await calculateDaysWorkedForAdminByAmOnly(
                employeeId,
                monthStr,
                fromDate,
                toDate
              )
              item.days_worked_calculated = days

              console.log(`[Admin Calculation] Admin employee ${employee.firstname} ${employee.lastname}: ${days} days calculated`)
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
      })
    )
  },
  { immediate: true }
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
    dayTo.value
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
      <v-card-text>
        <v-row>
          <v-col cols="12" md="2">
            <v-select
              v-model="selectedMonth"
              :items="
                monthNames.map((month, index) => ({
                  title: month,
                  value: month,
                  index: index,
                }))
              "
              label="Select Month"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar"
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="selectedYear"
              :items="Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
              label="Select Year"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar-range"
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="dayFrom"
              :items="dayOptionsFrom"
              :label="`From Day (${
                selectedMonth
                  ? (() => {
                      const currentIndex = monthNames.indexOf(selectedMonth)
                      if (currentIndex === -1) return 'prev month'
                      const prevIndex = (currentIndex - 1 + 12) % 12
                      const isPrevYear = currentIndex === 0
                      return monthNames[prevIndex].slice(0, 3) + (isPrevYear ? ' (prev)' : '')
                    })()
                  : 'prev month'
              })`"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar-start"
              clearable
              :disabled="!crossMonthEnabled"
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="dayTo"
              :items="dayOptionsTo"
              :label="`To Day (${selectedMonth ? selectedMonth.slice(0, 3) : 'month'})`"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar-end"
              clearable
              :disabled="!crossMonthEnabled"
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="selectedDesignation"
              :items="[
                { title: 'All Designations', value: null },
                ...designationsStore.designations.map((d) => ({
                  title: d.designation,
                  value: d.id,
                })),
              ]"
              label="Filter by Designation"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-briefcase"
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-text-field
              v-model="searchQuery"
              label="Search Employee"
              placeholder="Enter employee name..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-account-search"
              clearable
            ></v-text-field>
          </v-col>
        </v-row>


      </v-card-text>

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
