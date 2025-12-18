<script setup lang="ts">
import { usePayrollTableDialog, type TableData } from './payrollTableDialog'
import PayrollPrintDialog from './PayrollPrintDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Employee } from '@/stores/employees'
import { monthNames } from './currentMonth'
import { useDisplay } from 'vuetify'

import {
  getDateRangeForMonth,
  getDateRangeForMonthNoCross,
  getLastDayOfMonth,
  onView as onViewHelper,
} from './helpers'
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Employee | null
  dateString?: string
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

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

const chosenMonth = ref<string>('')

const dayFrom = ref<number | null>(props.itemData?.payroll_start ?? null)
const dayTo = ref<number | null>(props.itemData?.payroll_end ?? null)
const crossMonthEnabled = ref<boolean>(
  Boolean(props.itemData?.payroll_start && props.itemData?.payroll_end)
)

const daysInSelectedMonth = computed(() => {
  const tf = tableFilters.value as Record<string, unknown> | undefined
  const maybeYear =
    tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()
  const monthName = chosenMonth.value || ''
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const idx = monthIndex >= 0 ? monthIndex : 0
  return new Date(Number(maybeYear), idx + 1, 0).getDate()
})

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

function getDaysInMonth(monthName: string): number {
  const tf = tableFilters.value as Record<string, unknown> | undefined
  const year = tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const idx = monthIndex >= 0 ? monthIndex : 0
  return new Date(Number(year), idx + 1, 0).getDate()
}

watch(
  () => props.itemData,
  (newData) => {
    if (newData?.payroll_start !== undefined && newData?.payroll_start !== null) {
      dayFrom.value = newData.payroll_start
    } else {
      dayFrom.value = null
    }

    if (newData?.payroll_end !== undefined && newData?.payroll_end !== null) {
      dayTo.value = newData.payroll_end
    } else {
      dayTo.value = null
    }

    crossMonthEnabled.value = Boolean(newData?.payroll_start && newData?.payroll_end)
  },
  { immediate: true },
)

watch(
  () => crossMonthEnabled.value,
  (enabled) => {
    if (!enabled) {
      dayFrom.value = null
      dayTo.value = null
    } else {
      if (dayFrom.value === null || dayFrom.value === undefined)
        dayFrom.value = props.itemData?.payroll_start ?? daysInPreviousMonth.value
      if (dayTo.value === null || dayTo.value === undefined)
        dayTo.value = props.itemData?.payroll_end ?? daysInSelectedMonth.value
    }
  },
  { immediate: true },
)

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

watch(
  () => [dayFrom.value, dayTo.value],
  ([newFrom, newTo]) => {
    const tf = tableFilters.value as Record<string, unknown> | undefined
    const year =
      tf && typeof tf['year'] === 'number' ? (tf['year'] as number) : new Date().getFullYear()

    if ((newFrom === null || newFrom === undefined) && (newTo === null || newTo === undefined)) {
      try {
        localStorage.removeItem('czarles_payroll_fromDate')
        localStorage.removeItem('czarles_payroll_toDate')
      } catch {
        /* ignore */
      }
      return
    }

    const from = newFrom ?? (crossMonthEnabled.value ? daysInPreviousMonth.value : 1)
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
        <v-progress-linear v-if="tableOptions.isLoading" indeterminate></v-progress-linear>

        <v-row v-else>
          <v-col
            v-for="item in tableData"
            :key="item.month"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card
              class="month-card"
              hover
              @click="onView(item)"
            >
              <v-card-text class="text-center pa-6">
                <v-icon size="48" class="mb-3" color="primary">
                  mdi-calendar-month
                </v-icon>
                <div class="text-h6 font-weight-bold mb-2">
                  {{ item.month }}
                </div>
                <v-chip
                  v-if="crossMonthEnabled && (dayFrom || dayTo)"
                  color="primary"
                  variant="tonal"
                  size="small"

                >
                  Day {{ dayFrom || props.itemData?.payroll_start || '?' }} - {{ dayTo || props.itemData?.payroll_end || '?' }}
                </v-chip>
                <v-chip
                  v-else
                  color="secondary"
                  variant="tonal"
                  size="small"

                >
                  Day 1 - {{ getDaysInMonth(item.month) }}
                </v-chip>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
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
