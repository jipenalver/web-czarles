<script setup lang="ts">
import { usePayrollTableDialog, type TableData } from './payrollTableDialog'
import { type TableHeader } from '@/utils/helpers/tables'
import PayrollPrintDialog from './PayrollPrintDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Employee } from '@/stores/employees'
import { monthNames } from './currentMonth'
import { useDisplay } from 'vuetify'

import { getYearMonthString, getDateRangeForMonth, getDateRangeForMonthNoCross } from './helpers'
import { getMoneyText } from '@/utils/helpers/others'
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Employee | null
  dateString?: string
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mobile, mdAndDown } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Month',
    key: 'month',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Basic Salary',
    key: 'basic_salary',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Gross Pay',
    key: 'gross_pay',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Deductions',
    key: 'deductions',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Net Pay',
    key: 'net_pay',
    sortable: false,
    align: 'start',
  },
]

// tableData now uses actual payroll computation from overallTotal.ts composables
const {
  tableOptions,
  tableFilters,
  tableData,
  formAction,
  isPrintDialogVisible,
  payrollData,
  selectedData,
  availableYears,
  isCurrentEmployeeFieldStaff,
  onView: baseOnView,
  onDialogClose,
} = usePayrollTableDialog(props, emit)

// Variable para isave ang month na gipili sa client
const chosenMonth = ref<string>('')

// Day-only selectors (month is selected via the table rows)
const dayFrom = ref<number | null>(null)
const dayTo = ref<number | null>(null)
// If true, 'To Day' refers to the next month (cross-month). If false, the day selectors are disabled.
const crossMonthEnabled = ref<boolean>(true)

// Compute days in the currently chosen month (chosenMonth set when clicking a month row)
const daysInSelectedMonth = computed(() => {
  const tf = tableFilters.value as Record<string, unknown> | undefined
  const maybeYear = tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()
  const monthName = chosenMonth.value || ''
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const idx = monthIndex >= 0 ? monthIndex : 0
  return new Date(Number(maybeYear), idx + 1, 0).getDate()
})

const dayOptions = computed(() => Array.from({ length: daysInSelectedMonth.value }, (_, i) => i + 1))

// Day options for the next month (To Day should reference next month)
const daysInNextMonth = computed(() => {
  const tf = tableFilters.value as Record<string, unknown> | undefined
  const maybeYear = tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()
  const monthName = chosenMonth.value || ''
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const startIdx = monthIndex >= 0 ? monthIndex : 0
  const nextIdx = startIdx === 11 ? 0 : startIdx + 1
  let nextYear = Number(maybeYear)
  if (startIdx === 11) nextYear = Number(maybeYear) + 1
  return new Date(nextYear, nextIdx + 1, 0).getDate()
})

const dayOptionsTo = computed(() => Array.from({ length: daysInNextMonth.value }, (_, i) => i + 1))

// (Day-only selects — month is selected via the table rows)

// When year changes, ensure the from/to stay within that year (clear if not)
watch(
  () => {
    const tf = tableFilters.value as Record<string, unknown> | undefined
    return tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : undefined
  },
  (newYear) => {
    if (!newYear) return
    // clear day selections if they are incompatible with new year + chosenMonth
    dayFrom.value = null
    dayTo.value = null
  },
  { immediate: true }
)

// When cross-month is toggled off, clear and remove persisted values; when enabled, set sensible defaults
watch(
  () => crossMonthEnabled.value,
  (enabled) => {
    try {
      if (!enabled) {
        dayFrom.value = null
        dayTo.value = null
        localStorage.removeItem('czarles_payroll_fromDate')
        localStorage.removeItem('czarles_payroll_toDate')
      } else {
        // default From = 1 if not set, default To = last day of next month (when enabled)
        if (dayFrom.value === null || dayFrom.value === undefined) dayFrom.value = 1
        if (dayTo.value === null || dayTo.value === undefined) dayTo.value = daysInNextMonth.value
      }
    } catch {
      /* ignore storage errors */
    }
  },
  { immediate: true }
)

// Typed handler for checkbox change to avoid implicit `any` in template
function onCrossMonthChange(val: boolean) {
  if (!val) {
    dayFrom.value = null
    dayTo.value = null
  }
}

// Helper function: convert year + month name to YYYY-MM-DD
function getMonthYearAsDateString(year: number, monthName: string): string {
  // Pangitaon ang month index (0-based)
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const month = (monthIndex + 1).toString().padStart(2, '0')
  return `${year}-${month}-01`
}

// Helper: return last day (number) for a given year + month name
function getLastDayOfMonth(year: number, monthName: string): number {
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const idx = monthIndex >= 0 ? monthIndex : 0
  // JS Date: day 0 of next month gives last day of current month
  return new Date(Number(year), idx + 1, 0).getDate()
}

// Wrapper function para sa onView, para ma-save ug ma-console.log ang month ug date string
function onView(item: TableData) {
  chosenMonth.value = item.month
  // default From = 1, To = end of next month when not explicitly chosen
  if (dayFrom.value === null || dayFrom.value === undefined) {
    dayFrom.value = 1
  }
  // If user didn't provide To day, default to last day of the chosen month
  if (dayTo.value === null || dayTo.value === undefined) {
    try {
      const tf = tableFilters.value as { year?: number } | undefined
      const year = (tf && typeof tf.year === 'number' ? tf.year : new Date().getFullYear())
      // If cross-month is enabled, default To to last day of next month; otherwise last day of chosen month
      if (crossMonthEnabled.value) {
        dayTo.value = daysInNextMonth.value
      } else {
        dayTo.value = getLastDayOfMonth(Number(year), chosenMonth.value)
      }
    } catch {
      dayTo.value = daysInNextMonth.value
    }
  }
  // isave nato ang month na gipili, then i-console.log para sa debugging
  const dateString = getMonthYearAsDateString(tableFilters.value.year, chosenMonth.value)
  // I-format ang dateString to YYYY-MM before saving to localStorage
  const yearMonth = getYearMonthString(dateString)
  localStorage.setItem('czarles_payroll_dateString', yearMonth)

  // Compute and log the selected date range (day inputs use the clicked month + selected year)
  const range = (crossMonthEnabled.value
    ? getDateRangeForMonth(tableFilters.value?.year, chosenMonth.value, dayFrom.value, dayTo.value)
    : getDateRangeForMonthNoCross(tableFilters.value?.year, chosenMonth.value, dayFrom.value, dayTo.value))
  console.log('[PAYROLL] Selected date range for view:', { range, chosenMonth: chosenMonth.value })
  // Persist selected range for other components (payroll computation / print)
  try {
    if (typeof window !== 'undefined' && range) {
      localStorage.setItem('czarles_payroll_fromDate', range.fromDate)
      localStorage.setItem('czarles_payroll_toDate', range.toDate)
    }
  } catch {
    // ignore storage errors
  }

  // Enhanced console log para sa field staff debugging
  // if (isCurrentEmployeeFieldStaff.value) {
  //   console.log(`🏃 FIELD STAFF - Month clicked: ${chosenMonth.value}`, {
  //     employee: `${props.itemData?.firstname} ${props.itemData?.lastname}`,
  //     employeeId: props.itemData?.id,
  //     month: chosenMonth.value,
  //     year: tableFilters.value.year,
  //     dateString,
  //     yearMonth,
  //     basicSalary: item.basic_salary,
  //   })
  // } else {
  //   console.log(`🏢 OFFICE STAFF - Month clicked: ${chosenMonth.value}`, {
  //     employee: `${props.itemData?.firstname} ${props.itemData?.lastname}`,
  //     dateString,
  //     basicSalary: item.basic_salary,
  //   })
  // }

  // Pass dateString as prop to composable logic (if needed)
  baseOnView({ ...item, dateString })
}

// Persist selected from/to days to localStorage when changed (or clear when null)
watch(
  () => [dayFrom.value, dayTo.value],
  ([newFrom, newTo]) => {
    const tf = tableFilters.value as Record<string, unknown> | undefined
    const year = tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()

    // If both cleared, remove persisted values
    if ((newFrom === null || newFrom === undefined) && (newTo === null || newTo === undefined)) {
      try {
        localStorage.removeItem('czarles_payroll_fromDate')
        localStorage.removeItem('czarles_payroll_toDate')
      } catch {
        /* ignore */
      }
      return
    }

    // Build range using helpers and persist
    const from = newFrom ?? 1
  // If cross-month is enabled, 'to' defaults to next month's last day; otherwise last day of chosen month
  const to = newTo ?? (crossMonthEnabled.value ? daysInNextMonth.value : getLastDayOfMonth(year, chosenMonth.value))
    const range = (crossMonthEnabled.value
      ? getDateRangeForMonth(year, chosenMonth.value, from, to)
      : getDateRangeForMonthNoCross(year, chosenMonth.value, from, to))
    try {
      if (range) {
        localStorage.setItem('czarles_payroll_fromDate', range.fromDate)
        localStorage.setItem('czarles_payroll_toDate', range.toDate)
      }
    } catch {
      /* ignore storage errors */
    }
  },
  { immediate: true }
)



// Compute the sum of net_pay + attendance calculation for field staff
const calculateFieldStaffNetPay = (item: TableData) => {
  const netPay = item.net_pay || 0
  //const attendanceCalculation = ((item.attendanceMinutes || 0) / 60) * (item.employeeDailyRate / 8)
  //console.error(`[PAYROLL CALCULATION] Employee ${props.itemData?.id} - Month: ${item.month}, Net Pay: ${netPay}, Attendance Calculation: ${attendanceCalculation}`)
  return netPay /* + attendanceCalculation */
}

/**
 * Compute a date range for the given year + monthName using optional from/to day numbers.
 * Returns { fromDate, toDate, totalDays } where dates are YYYY-MM-DD and totalDays is inclusive.
 */
// (moved getDateRangeForMonth to shared helpers.ts)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-dialog
    :max-width="mdAndDown ? undefined : '1200'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card
      prepend-icon="mdi-account-cash"
      :title="`Payslip ${tableFilters.year}`"
      :subtitle="`${props.itemData?.firstname} ${props.itemData?.lastname}${isCurrentEmployeeFieldStaff ? ' • 🏃 Field Staff' : ' • 🏢 Office Staff'}`"
    >
          <template #append>
        <div class="d-flex ga-3 align-center">
          <v-select
            v-model="dayFrom"
            :items="dayOptions"
            :label="`From Day (${chosenMonth || '—'} ${tableFilters.year || ''})`"
            placeholder="Previous Month"
            clearable
            clear-icon="mdi-close"
            dense
            hide-details="auto"
            :disabled="!crossMonthEnabled"
            style="min-width: 240px"
          ></v-select>

          <v-select
            class="me-4"
            v-model="dayTo"
            :items="dayOptionsTo"
            :label="`To Day (${chosenMonth ? (() => {
              const currentIndex = monthNames.indexOf(chosenMonth);
              if (currentIndex === -1) return 'next month';
              const nextIndex = (currentIndex + 1) % 12;
              const isNextYear = currentIndex === 11;
              return monthNames[nextIndex] + (isNextYear ? ' (next year)' : '');
            })() : 'next month'})`"
            placeholder="Next Month"
            clearable
            clear-icon="mdi-close"
            dense
            hide-details="auto"
            :disabled="!crossMonthEnabled"
            style="min-width: 240px"
          ></v-select>

          <v-checkbox
            v-model="crossMonthEnabled"
            class="ms-2"
            label="Cross-month"
            dense
            hide-details
            :true-value="true"
            :false-value="false"
            @change="onCrossMonthChange"
          ></v-checkbox>

          <v-select
            v-model="tableFilters.year"
            label="Year"
            :items="availableYears"
            dense
            hide-details="auto"
            style="min-width: 120px"
          ></v-select>
        </div>
      </template>

      <v-card-text>
        <!-- Field Staff Debug Information -->

        <!-- eslint-disable vue/valid-v-slot -->
        <v-data-table
          v-model:items-per-page="tableOptions.itemsPerPage"
          v-model:page="tableOptions.page"
          v-model:sort-by="tableOptions.sortBy"
          :loading="tableOptions.isLoading"
          :headers="tableHeaders"
          :items="tableData"
          :items-per-page-options="[6, 12]"
          :hide-default-header="mobile"
          :mobile="mobile"
        >
          <template #item.month="{ item }">
            <v-btn class="text-decoration-underline" variant="text" @click="onView(item)">
              {{ item.month }}
            </v-btn>
          </template>
          <template #item.basic_salary="{ item }">
            <div class="d-flex align-center ga-2">
                <span v-if="isCurrentEmployeeFieldStaff"
                  >{{ getMoneyText(((item.attendanceMinutes || 0) / 60) * (item.employeeDailyRate / 8)) }}
                  <span class="text-caption text-grey">({{ ((item.attendanceMinutes || 0) / 60).toFixed(2) }} hrs)</span>
                  </span
                >
                <span v-else
                  >{{ getMoneyText(item.basic_salary) }}</span
                >
            </div>
          </template>
          <template #item.gross_pay="{ item }">
              {{ getMoneyText(item.gross_pay) }}
          </template>
          <template #item.deductions="{ item }">
              {{ getMoneyText(item.deductions) }}
          </template>
          <template #item.net_pay="{ item }">
              <span v-if="isCurrentEmployeeFieldStaff">
                {{ getMoneyText(calculateFieldStaffNetPay(item)) }}
              </span>
              <span v-else>
                {{ getMoneyText(item.net_pay) }}
              </span>
          </template>
        </v-data-table>


      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>

        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onDialogClose"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <PayrollPrintDialog
    v-if="props.itemData && selectedData"
    v-model:is-dialog-visible="isPrintDialogVisible"
    :payroll-data="payrollData"
    :employee-data="props.itemData"
    :table-data="selectedData"
  />
</template>
