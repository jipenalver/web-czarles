<script setup lang="ts">
import { usePayrollTableDialog, type TableData } from './payrollTableDialog'
import { type TableHeader } from '@/utils/helpers/tables'
import PayrollPrintDialog from './PayrollPrintDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Employee } from '@/stores/employees'
import { monthNames } from './currentMonth'
import { useDisplay } from 'vuetify'

import { getYearMonthString } from './helpers'
import { getMoneyText } from '@/utils/helpers/others'
import { ref } from 'vue'

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

// Helper function: convert year + month name to YYYY-MM-DD
function getMonthYearAsDateString(year: number, monthName: string): string {
  // Pangitaon ang month index (0-based)
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const month = (monthIndex + 1).toString().padStart(2, '0')
  return `${year}-${month}-01`
}

// Wrapper function para sa onView, para ma-save ug ma-console.log ang month ug date string
function onView(item: TableData) {
  chosenMonth.value = item.month
  // isave nato ang month na gipili, then i-console.log para sa debugging
  const dateString = getMonthYearAsDateString(tableFilters.value.year, chosenMonth.value)
  // I-format ang dateString to YYYY-MM before saving to localStorage
  const yearMonth = getYearMonthString(dateString)
  localStorage.setItem('czarles_payroll_dateString', yearMonth)

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

// Compute the sum of net_pay + attendance calculation for field staff
const calculateFieldStaffNetPay = (item: TableData) => {
  const netPay = item.net_pay || 0
  const attendanceCalculation = ((item.attendanceMinutes || 0) / 60) * (item.employeeDailyRate / 8)
  return netPay + attendanceCalculation
}
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
            v-model="tableFilters.year"
            label="Year"
            :items="availableYears"
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
