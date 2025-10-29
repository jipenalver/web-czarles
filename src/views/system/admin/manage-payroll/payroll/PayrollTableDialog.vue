<script setup lang="ts">
import { usePayrollTableDialog, type TableData } from './payrollTableDialog'
import { type TableHeader } from '@/utils/helpers/tables'
import PayrollPrintDialog from './PayrollPrintDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Employee } from '@/stores/employees'
import { monthNames } from './currentMonth'
import { useDisplay } from 'vuetify'

import {
  getDateRangeForMonth,
  getDateRangeForMonthNoCross,
  getLastDayOfMonth,
  onCrossMonthChange as onCrossMonthChangeHelper,
  calculateFieldStaffNetPay as calculateFieldStaffNetPayHelper,
  onView as onViewHelper,
} from './helpers'
import { getMoneyText } from '@/utils/helpers/others'
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Employee | null
  dateString?: string
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { smAndDown, mdAndDown } = useDisplay()

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
// Initialize gamit ang payroll_start ug payroll_end from employee data
const dayFrom = ref<number | null>(props.itemData?.payroll_start ?? null)
const dayTo = ref<number | null>(props.itemData?.payroll_end ?? null)
// Cross-month is checked by default
const crossMonthEnabled = ref<boolean>(true)

// Compute days in the currently chosen month (chosenMonth set when clicking a month row)
const daysInSelectedMonth = computed(() => {
  const tf = tableFilters.value as Record<string, unknown> | undefined
  const maybeYear =
    tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()
  const monthName = chosenMonth.value || ''
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const idx = monthIndex >= 0 ? monthIndex : 0
  return new Date(Number(maybeYear), idx + 1, 0).getDate()
})

// Day options for the previous month (From Day should reference previous month)
const daysInPreviousMonth = computed(() => {
  const tf = tableFilters.value as Record<string, unknown> | undefined
  const maybeYear =
    tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()
  const monthName = chosenMonth.value || ''
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const startIdx = monthIndex >= 0 ? monthIndex : 0
  const prevIdx = startIdx === 0 ? 11 : startIdx - 1
  let prevYear = Number(maybeYear)
  if (startIdx === 0) prevYear = Number(maybeYear) - 1
  return new Date(prevYear, prevIdx + 1, 0).getDate()
})

const dayOptionsFrom = computed(() =>
  Array.from({ length: daysInPreviousMonth.value }, (_, i) => i + 1),
)
const dayOptionsTo = computed(() =>
  Array.from({ length: daysInSelectedMonth.value }, (_, i) => i + 1),
)

// (Day-only selects — month is selected via the table rows)

// Watch para ma-update ang day values from employee's payroll_start ug payroll_end
watch(
  () => props.itemData,
  (newData) => {
    // console.log('🔍 PayrollTableDialog - Employee Data:', {
    //   employeeId: newData?.id,
    //   employeeName: `${newData?.firstname || ''} ${newData?.lastname || ''}`,
    //   payroll_start: newData?.payroll_start,
    //   payroll_end: newData?.payroll_end,
    //   fullData: newData
    // })

    // Set ang payroll_start ug payroll_end kung naa, crossmonth is always enabled
    if (newData?.payroll_start !== undefined && newData?.payroll_start !== null) {
      dayFrom.value = newData.payroll_start
      // console.log('✅ Set dayFrom to:', newData.payroll_start)
    } // else {
    //   console.log('⚠️ No payroll_start found')
    // }

    if (newData?.payroll_end !== undefined && newData?.payroll_end !== null) {
      dayTo.value = newData.payroll_end
      // console.log('✅ Set dayTo to:', newData.payroll_end)
    } // else {
    //   console.log('⚠️ No payroll_end found')
    // }

    crossMonthEnabled.value = true
    // console.log('📊 Final values:', { dayFrom: dayFrom.value, dayTo: dayTo.value, crossMonthEnabled: crossMonthEnabled.value })
  },
  { immediate: true },
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
        // default From = payroll_start or last day of previous month if not set
        // default To = payroll_end or last day of current month if not set
        if (dayFrom.value === null || dayFrom.value === undefined)
          dayFrom.value = props.itemData?.payroll_start ?? daysInPreviousMonth.value
        if (dayTo.value === null || dayTo.value === undefined)
          dayTo.value = props.itemData?.payroll_end ?? daysInSelectedMonth.value
      }
    } catch {
      /* ignore storage errors */
    }
  },
  { immediate: true },
)

// Typed handler for checkbox change (delegates to helper)
function onCrossMonthChange(val: boolean) {
  // helper expects refs for dayFrom/dayTo, ug payroll_start/payroll_end from employee
  onCrossMonthChangeHelper(
    val,
    dayFrom,
    dayTo,
    props.itemData?.payroll_start,
    props.itemData?.payroll_end
  )
}

// onView: delegate complex behavior to helper while keeping the component API
function onView(item: TableData) {
  onViewHelper({
    item,
    chosenMonth,
    dayFrom,
    dayTo,
    crossMonthEnabled,
    tableFilters: { value: tableFilters.value as Record<string, unknown> | undefined },
    baseOnView,
  })
}

// Persist selected from/to days to localStorage when changed (or clear when null)
watch(
  () => [dayFrom.value, dayTo.value],
  ([newFrom, newTo]) => {
    const tf = tableFilters.value as Record<string, unknown> | undefined
    const year =
      tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()

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
    const from = newFrom ?? (crossMonthEnabled.value ? daysInPreviousMonth.value : 1)
    // If cross-month is enabled, 'to' defaults to current month's last day; otherwise last day of chosen month
    const to =
      newTo ??
      (crossMonthEnabled.value
        ? daysInSelectedMonth.value
        : getLastDayOfMonth(year, chosenMonth.value))
    const range = crossMonthEnabled.value
      ? getDateRangeForMonth(year, chosenMonth.value, from, to)
      : getDateRangeForMonthNoCross(year, chosenMonth.value, from, to)
    try {
      if (range) {
        localStorage.setItem('czarles_payroll_fromDate', range.fromDate)
        localStorage.setItem('czarles_payroll_toDate', range.toDate)
      }
    } catch {
      /* ignore storage errors */
    }
  },
  { immediate: true },
)

// Compute the sum of net_pay + attendance calculation for field staff (delegates to helper)
const calculateFieldStaffNetPay = (item: TableData) => calculateFieldStaffNetPayHelper(item)

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
            v-model="dayFrom"
            :items="dayOptionsFrom"
            :label="`From Day (${
              chosenMonth
                ? (() => {
                    const currentIndex = monthNames.indexOf(chosenMonth)
                    if (currentIndex === -1) return 'previous month'
                    const prevIndex = (currentIndex - 1 + 12) % 12
                    const isPrevYear = currentIndex === 0
                    return monthNames[prevIndex] + (isPrevYear ? ' (prev year)' : '')
                  })()
                : 'previous month'
            })`"
            :placeholder="props.itemData?.payroll_start ? `Default: ${props.itemData.payroll_start}` : 'Previous Month'"
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
            :label="`To Day (${chosenMonth || '—'} ${tableFilters.year || ''})`"
            :placeholder="props.itemData?.payroll_end ? `Default: ${props.itemData.payroll_end}` : 'Current Month'"
            clearable
            clear-icon="mdi-close"
            dense
            hide-details="auto"
            :disabled="!crossMonthEnabled"
            style="min-width: 240px"
          ></v-select>

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
          :hide-default-header="smAndDown"
          :mobile="smAndDown"
        >
          <template #item.month="{ item }">
            <v-btn class="text-decoration-underline" variant="text" @click="onView(item)">
              {{ item.month }}
            </v-btn>
          </template>
          <template #item.basic_salary="{ item }">
            <div class="d-flex align-center ga-2">
              <span v-if="isCurrentEmployeeFieldStaff"
                >{{
                  getMoneyText(((item.attendanceMinutes || 0) / 60) * (item.employeeDailyRate / 8))
                }}
                <span class="text-caption text-grey"
                  >({{ ((item.attendanceMinutes || 0) / 60).toFixed(2) }} hrs)</span
                >
              </span>
              <span v-else>{{ getMoneyText(item.basic_salary) }}</span>
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
