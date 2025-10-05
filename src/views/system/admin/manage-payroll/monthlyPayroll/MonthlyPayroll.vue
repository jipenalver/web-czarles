<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useEmployeesStore, type Employee } from '@/stores/employees'
import { usePayrollComputation } from '../payroll/payrollComputation'
import { useOverallEarningsTotal, useNetSalaryCalculation } from '../payroll/overallTotal'
import { useTripsStore, type Trip } from '@/stores/trips'
import { useHolidaysStore, type Holiday } from '@/stores/holidays'
import { useCashAdvancesStore } from '@/stores/cashAdvances'
import { type EmployeeDeduction } from '@/stores/benefits'
import { type TableHeader } from '@/utils/helpers/tables'
import { getDateISO } from '@/utils/helpers/dates'
import AppAlert from '@/components/common/AppAlert.vue'

interface MonthlyPayrollRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  holidays_pay: number
  gross_pay: number
  deductions: {
    late: number
    undertime: number
    cash_advance: number
    employee_deductions: number
    total: number
  }
  total_deductions: number
  net_pay: number
}

// Stores
const employeesStore = useEmployeesStore()
const tripsStore = useTripsStore()
const holidaysStore = useHolidaysStore()
const cashAdvancesStore = useCashAdvancesStore()

// State
const selectedMonth = ref<string>('')
const selectedYear = ref<number>(new Date().getFullYear())
const loading = ref(false)
const monthlyPayrollData = ref<MonthlyPayrollRow[]>([])

// Month options
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const monthOptions = computed(() =>
  monthNames.map((month, index) => ({
    title: month,
    value: month,
    index: index
  }))
)

// Year options (last 5 years)
const currentYear = new Date().getFullYear()
const yearOptions = computed(() =>
  Array.from({ length: 5 }, (_, i) => currentYear - i)
)

// Set default month to current month
onMounted(() => {
  selectedMonth.value = monthNames[new Date().getMonth()]
})

// Table headers
const tableHeaders: TableHeader[] = [
  {
    title: 'Employee',
    key: 'employee_name',
    align: 'start',
    sortable: true,
  },
  {
    title: 'Daily Rate',
    key: 'daily_rate',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Days Worked',
    key: 'days_worked',
    align: 'center',
    sortable: true,
  },
  {
    title: 'Basic Pay',
    key: 'basic_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Overtime',
    key: 'overtime_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Trips',
    key: 'trips_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Holidays',
    key: 'holidays_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Gross Pay',
    key: 'gross_pay',
    align: 'end',
    sortable: true,
  },
  {
    title: 'Deductions',
    key: 'deductions',
    align: 'end',
    sortable: false,
  },
  {
    title: 'Net Pay',
    key: 'net_pay',
    align: 'end',
    sortable: true,
  },
]

// Format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}

// Compute date string from selected month and year
const dateString = computed(() => {
  if (!selectedMonth.value || !selectedYear.value) return ''
  const monthIndex = monthNames.indexOf(selectedMonth.value)
  const date = new Date(selectedYear.value, monthIndex, 15)
  return getDateISO(date) || ''
})

// Load payroll data for all employees
async function loadMonthlyPayroll() {
  if (!selectedMonth.value || !selectedYear.value) {
    return
  }

  loading.value = true

  try {
    // Load all employees
    await employeesStore.getEmployees()
    const employees = employeesStore.employees.filter(emp => !emp.deleted_at)

    // Load holidays for the month
    await holidaysStore.getHolidays()

    // Process each employee
    const payrollPromises = employees.map(async (employee) => {
      return await computeEmployeePayroll(employee)
    })

    monthlyPayrollData.value = await Promise.all(payrollPromises)
  } catch (error) {
    console.error('Error loading monthly payroll:', error)
  } finally {
    loading.value = false
  }
}

// Compute payroll for a single employee
async function computeEmployeePayroll(employee: Employee): Promise<MonthlyPayrollRow> {
  const dailyRate = ref(employee.daily_rate || 0)
  const grossSalary = ref(0)
  const tableData = ref<Record<string, unknown> | null>(null)

  // Use payroll computation
  const payrollComp = usePayrollComputation(
    dailyRate,
    grossSalary,
    tableData,
    employee.id,
    selectedMonth.value,
    selectedYear.value,
    dateString.value
  )

  // Wait for computation to complete
  await payrollComp.computeRegularWorkTotal()

  // Get trips for employee
  const monthIndex = monthNames.indexOf(selectedMonth.value)
  const startDate = new Date(selectedYear.value, monthIndex, 1)
  const endDate = new Date(selectedYear.value, monthIndex + 1, 0)

  await tripsStore.getTrips()
  const employeeTrips = ref<Trip[]>(
    tripsStore.trips.filter(trip =>
      trip.employee_id === employee.id &&
      new Date(trip.trip_at) >= startDate &&
      new Date(trip.trip_at) <= endDate
    )
  )

  // Get holidays for the month
  const employeeHolidays = ref<Holiday[]>(
    holidaysStore.holidays.filter(holiday => {
      const holidayDate = new Date(holiday.holiday_at)
      return holidayDate >= startDate && holidayDate <= endDate
    })
  )

  // Get cash advances
  await cashAdvancesStore.getCashAdvances()
  const cashAdvance = ref(
    cashAdvancesStore.cashAdvances
      .filter(ca =>
        ca.employee_id === employee.id &&
        new Date(ca.created_at) >= startDate &&
        new Date(ca.created_at) <= endDate
      )
      .reduce((sum, ca) => sum + (ca.amount || 0), 0)
  )

  // Get employee deductions (from employee_deductions)
  const employeeDeductions = ref<EmployeeDeduction[]>(
    employee.employee_deductions?.filter(ed => ed.benefit?.is_deduction) || []
  )

  // Get non-deductions (benefits)
  const nonDeductions = ref<EmployeeDeduction[]>(
    employee.employee_deductions?.filter(ed => !ed.benefit?.is_deduction) || []
  )

  const codaAllowance = ref(0)
  const overallOvertime = ref(0)

  // Compute overall overtime if available
  if (payrollComp.computeOverallOvertimeCalculation) {
    const overtimeResult = await payrollComp.computeOverallOvertimeCalculation()
    overallOvertime.value = overtimeResult || 0
  }

  // Use overall earnings total
  const dailyRateComputed = computed(() => dailyRate.value)
  const employeeDailyRateComputed = computed(() => payrollComp.employeeDailyRate.value)
  const overallEarningsTotal = useOverallEarningsTotal(
    payrollComp.regularWorkTotal,
    employeeTrips,
    employeeHolidays,
    dailyRateComputed,
    employeeDailyRateComputed,
    overallOvertime,
    codaAllowance,
    nonDeductions
  )

  // Show late deduction
  const showLateDeduction = computed(() => true)

  // Use net salary calculation
  const netSalaryCalc = useNetSalaryCalculation(
    overallEarningsTotal,
    showLateDeduction,
    payrollComp.lateDeduction,
    employeeDeductions,
    cashAdvance,
    payrollComp.undertimeDeduction
  )

  // Calculate breakdown
  const tripsEarnings = employeeTrips.value.reduce((sum, trip) => {
    const perTrip = Number(trip.per_trip) || 0
    const tripNo = Number(trip.trip_no) || 1
    return sum + (perTrip * tripNo)
  }, 0)

  const holidayEarnings = employeeHolidays.value.reduce((sum, holiday) => {
    const baseRate = Number(dailyRate.value) || 0
    const type = holiday.type?.toLowerCase() || ''
    let multiplier = 1
    if (type.includes('rh')) multiplier = 2.0
    else if (type.includes('snh')) multiplier = 1.5
    else if (type.includes('swh')) multiplier = 1.3
    return sum + (baseRate * multiplier)
  }, 0)

  const overtimeRate = ((Number(payrollComp.employeeDailyRate.value) || 0) / 8) * 1.25
  const overtimeEarnings = overtimeRate * (Number(overallOvertime.value) || 0)

  // Calculate detailed deductions
  const lateDeduction = netSalaryCalc.value.deductions.late || 0
  const undertimeDeduction = netSalaryCalc.value.deductions.undertime || 0
  const cashAdvanceDeduction = netSalaryCalc.value.deductions.cashAdvance || 0
  const employeeDeductionsTotal = netSalaryCalc.value.dynamicDeductions?.reduce((sum, d) => sum + d.amount, 0) || 0

  return {
    employee_id: employee.id,
    employee_name: `${employee.firstname} ${employee.lastname}`,
    daily_rate: employee.daily_rate,
    days_worked: payrollComp.presentDays.value,
    basic_pay: payrollComp.regularWorkTotal.value,
    overtime_pay: overtimeEarnings,
    trips_pay: tripsEarnings,
    holidays_pay: holidayEarnings,
    gross_pay: netSalaryCalc.value.grossSalary,
    deductions: {
      late: lateDeduction,
      undertime: undertimeDeduction,
      cash_advance: cashAdvanceDeduction,
      employee_deductions: employeeDeductionsTotal,
      total: netSalaryCalc.value.totalDeductions,
    },
    total_deductions: netSalaryCalc.value.totalDeductions,
    net_pay: netSalaryCalc.value.netSalary,
  }
}

// Compute totals
const totals = computed(() => {
  if (monthlyPayrollData.value.length === 0) {
    return {
      basic_pay: 0,
      overtime_pay: 0,
      trips_pay: 0,
      holidays_pay: 0,
      gross_pay: 0,
      total_deductions: 0,
      net_pay: 0,
    }
  }

  return monthlyPayrollData.value.reduce((acc, item) => ({
    basic_pay: acc.basic_pay + (item.basic_pay || 0),
    overtime_pay: acc.overtime_pay + (item.overtime_pay || 0),
    trips_pay: acc.trips_pay + (item.trips_pay || 0),
    holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
    gross_pay: acc.gross_pay + (item.gross_pay || 0),
    total_deductions: acc.total_deductions + (item.total_deductions || 0),
    net_pay: acc.net_pay + (item.net_pay || 0),
  }), {
    basic_pay: 0,
    overtime_pay: 0,
    trips_pay: 0,
    holidays_pay: 0,
    gross_pay: 0,
    total_deductions: 0,
    net_pay: 0,
  })
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
</script>

<template>
  <div>
    <AppAlert
      v-model:is-alert-visible="formAlert"
      :form-message="formMessage"
      :form-status="formStatus"
    ></AppAlert>

    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-calendar-month" class="me-2"></v-icon>
        <span>Monthly Payroll Summary</span>
      </v-card-title>

      <v-card-text>
        <v-row>
          <v-col cols="12" md="4">
            <v-select
              v-model="selectedMonth"
              :items="monthOptions"
              label="Select Month"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar"
            ></v-select>
          </v-col>

          <v-col cols="12" md="4">
            <v-select
              v-model="selectedYear"
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
              @click="loadMonthlyPayroll"
              :loading="loading"
              :disabled="!selectedMonth || !selectedYear"
              block
            >
              <v-icon icon="mdi-refresh" class="me-2"></v-icon>
              Generate Report
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-card class="mt-4" v-if="monthlyPayrollData.length > 0">
      <v-card-text>
        <v-data-table
          :headers="tableHeaders"
          :items="monthlyPayrollData"
          :loading="loading"
          :items-per-page="50"
          :items-per-page-options="[25, 50, 100, -1]"
          density="compact"
          class="elevation-1"
        >
          <!-- eslint-disable vue/valid-v-slot -->
          <!-- Employee Name -->
          <template #item.employee_name="{ item }">
            <span class="font-weight-medium">{{ item.employee_name }}</span>
          </template>

          <!-- Daily Rate -->
          <template #item.daily_rate="{ item }">
            <span>{{ formatCurrency(item.daily_rate) }}</span>
          </template>

          <!-- Days Worked -->
          <template #item.days_worked="{ item }">
            <v-chip size="small" color="primary">{{ item.days_worked }}</v-chip>
          </template>

          <!-- Basic Pay -->
          <template #item.basic_pay="{ item }">
            <span>{{ formatCurrency(item.basic_pay) }}</span>
          </template>

          <!-- Overtime Pay -->
          <template #item.overtime_pay="{ item }">
            <span>{{ formatCurrency(item.overtime_pay) }}</span>
          </template>

          <!-- Trips Pay -->
          <template #item.trips_pay="{ item }">
            <span>{{ formatCurrency(item.trips_pay) }}</span>
          </template>

          <!-- Holidays Pay -->
          <template #item.holidays_pay="{ item }">
            <span>{{ formatCurrency(item.holidays_pay) }}</span>
          </template>

          <!-- Gross Pay -->
          <template #item.gross_pay="{ item }">
            <span class="font-weight-bold text-success">{{ formatCurrency(item.gross_pay) }}</span>
          </template>

          <!-- Deductions (with breakdown in tooltip) -->
          <template #item.deductions="{ item }">
            <v-tooltip location="left">
              <template #activator="{ props }">
                <span v-bind="props" class="text-error" style="cursor: help; text-decoration: underline dotted;">
                  {{ formatCurrency(item.deductions.total) }}
                </span>
              </template>
              <div class="pa-2">
                <div class="text-caption font-weight-bold mb-2">Deductions Breakdown:</div>
                <div class="text-caption">Late: {{ formatCurrency(item.deductions.late) }}</div>
                <div class="text-caption">Undertime: {{ formatCurrency(item.deductions.undertime) }}</div>
                <div class="text-caption">Cash Advance: {{ formatCurrency(item.deductions.cash_advance) }}</div>
                <div class="text-caption">Other Deductions: {{ formatCurrency(item.deductions.employee_deductions) }}</div>
                <v-divider class="my-1"></v-divider>
                <div class="text-caption font-weight-bold">Total: {{ formatCurrency(item.deductions.total) }}</div>
              </div>
            </v-tooltip>
          </template>

          <!-- Net Pay -->
          <template #item.net_pay="{ item }">
            <span class="font-weight-bold text-primary">{{ formatCurrency(item.net_pay) }}</span>
          </template>
          <!-- eslint-enable vue/valid-v-slot -->

          <!-- Footer totals -->
          <template #bottom>
            <v-divider></v-divider>
            <div class="pa-4">
              <v-row dense class="font-weight-bold">
                <v-col cols="12" md="2">
                  <div class="text-caption text-grey">TOTAL EMPLOYEES</div>
                  <div class="text-h6">{{ monthlyPayrollData.length }}</div>
                </v-col>
                <v-col cols="12" md="2">
                  <div class="text-caption text-grey">BASIC PAY</div>
                  <div class="text-body-1">{{ formatCurrency(totals.basic_pay) }}</div>
                </v-col>
                <v-col cols="12" md="2">
                  <div class="text-caption text-grey">OVERTIME</div>
                  <div class="text-body-1">{{ formatCurrency(totals.overtime_pay) }}</div>
                </v-col>
                <v-col cols="12" md="2">
                  <div class="text-caption text-grey">GROSS PAY</div>
                  <div class="text-body-1 text-success">{{ formatCurrency(totals.gross_pay) }}</div>
                </v-col>
                <v-col cols="12" md="2">
                  <div class="text-caption text-grey">DEDUCTIONS</div>
                  <div class="text-body-1 text-error">{{ formatCurrency(totals.total_deductions) }}</div>
                </v-col>
                <v-col cols="12" md="2">
                  <div class="text-caption text-grey">NET PAY</div>
                  <div class="text-h6 text-primary">{{ formatCurrency(totals.net_pay) }}</div>
                </v-col>
              </v-row>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>

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
