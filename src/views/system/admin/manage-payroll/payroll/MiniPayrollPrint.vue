<script setup lang="ts">
import {
  useOverallEarningsTotal,
  // useEarningsBreakdown,
  useNetSalaryCalculation,
} from './overallTotal'
import {
  safeCurrencyFormat,
  getHolidayTypeName,
  // formatTripDate,
  // getMonthDateRange,
} from './helpers'
import { type Holiday } from '@/stores/holidays'
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrint } from './usePayrollPrint'
import { fetchCashAdvances } from './computation/cashAdvance'
import { fetchEmployeeDeductions } from './computation/benefits'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore, type Trip } from '@/stores/trips'
import type { EmployeeDeduction } from '@/stores/benefits'
import type { CashAdvance } from '@/stores/cashAdvances'
import { fetchHolidaysByDateString } from './computation/holidays'
import { fetchFilteredTrips } from './computation/trips'

// Props
const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

// Pinia store for employees
// const employeesStore = useEmployeesStore()
const employeeDeductions = ref<EmployeeDeduction[]>([])
const employeeNonDeductions = ref<EmployeeDeduction[]>([])
const cashAdvances = ref<CashAdvance[]>([])

// Month date range for display
// const monthDateRange = computed(() => {
//   return getMonthDateRange(props.payrollData.year, props.payrollData.month)
// })

// Constants
const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

// Date formatting computeds
const formattedPeriod = computed(() => {
  const monthIndex = monthNames.indexOf(props.payrollData.month)
  const startDate = new Date(props.payrollData.year, monthIndex, 21)
  const endDate = new Date(props.payrollData.year, monthIndex + 1, 20)

  const formatDate = (date: Date) => {
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${month}.${day}.${year}`
  }

  return `${formatDate(startDate)}-${formatDate(endDate)}`
})

const filterDateString = computed(() => {
  const month = (monthNames.indexOf(props.payrollData.month) + 1).toString().padStart(2, '0')
  return `${props.payrollData.year}-${month}-01`
})

const holidayDateString = computed(() => {
  const month = (monthNames.indexOf(props.payrollData.month) + 1).toString().padStart(2, '0')
  return `${props.payrollData.year}-${month}`
})

// Use fetchEmployeeDeductions from benefits.ts
async function updateEmployeeDeductions(employeeId: number | undefined) {
  const result = await fetchEmployeeDeductions(employeeId)
  employeeDeductions.value = result.deductions
  employeeNonDeductions.value = result.nonDeductions
}

// Watch for employeeId changes to fetch deductions
watch(
  () => props.employeeData?.id,
  (id) => {
    updateEmployeeDeductions(id)
  },
  { immediate: true },
)

// Fetch cash advances when employeeId or filterDateString changes
watch(
  () => [filterDateString.value, props.employeeData?.id],
  async ([filterDateString, employeeId]) => {
    if (typeof employeeId === 'number' && filterDateString) {
      // kuhaon ang cash advances para sa employee ug payroll month
      cashAdvances.value = await fetchCashAdvances(filterDateString as string, employeeId)
    } else {
      cashAdvances.value = []
    }
  },
  { immediate: true },
)

// Compute total cash advance from all ca.amount
const totalCashAdvance = computed(() =>
  cashAdvances.value.reduce((sum, ca) => sum + (Number(ca.amount) || 0), 0),
)

// Reactive references
const isTripsLoading = ref(false)
const isHolidaysLoading = ref(false)
const holidays = ref<Holiday[]>([])
const overallOvertime = ref<number>(0)
const reactiveTotalEarnings = ref(0)
const tripsStore = useTripsStore()

// Computed properties for employee information
const fullName = computed(() => {
  if (!props.employeeData) return 'N/A'
  const middleName = props.employeeData.middlename ? ` ${props.employeeData.middlename} ` : ' '
  return `${props.employeeData.firstname}${middleName}${props.employeeData.lastname}`
})

const designation = computed(() => {
  return props.employeeData?.designation?.designation || 'N/A'
})

// Payroll calculation computeds
const dailyRate = computed(() => props.employeeData?.daily_rate || 0)
const grossSalary = computed(() => props.tableData?.gross_pay || 0)

// Check if field staff to determine if late deduction should be shown
const showLateDeduction = computed(() => !props.employeeData?.is_field_staff)

// Effective work days (present days based on attendance)
const effectiveWorkDays = computed(() => presentDays?.value || 0)

// Composables
const payrollPrint = usePayrollPrint(
  {
    employeeData: props.employeeData,
    payrollData: props.payrollData,
    tableData: props.tableData,
  },
  dailyRate,
  grossSalary,
)

// const { fetchFilteredTrips } = usePayrollFilters(filterDateString.value, props.employeeData?.id)

// Destructure values from payrollPrint composable
const {
  // workDays,
  codaAllowance,
  // totalGrossSalary,
  // totalDeductions,
  // netSalary,
  formatCurrency,
  employeeDailyRate,
  regularWorkTotal,
  // absentDays,
  presentDays,
  lateDeduction,
  monthLateDeduction,
  computeOverallOvertimeCalculation,
} = payrollPrint

// Use helpers for payroll calculations
const overallEarningsTotal = useOverallEarningsTotal(
  regularWorkTotal,
  computed(() => tripsStore.trips),
  holidays,
  dailyRate,
  employeeDailyRate,
  overallOvertime,
  codaAllowance,
  employeeNonDeductions,
)

// Use earnings breakdown for debugging purposes
// const earningsBreakdown = useEarningsBreakdown(
//   regularWorkTotal,
//   computed(() => tripsStore.trips),
//   holidays,
//   dailyRate,
//   employeeDailyRate,
//   overallOvertime,
//   codaAllowance,
// )

const netSalaryCalculation = useNetSalaryCalculation(
  overallEarningsTotal,
  showLateDeduction,
  lateDeduction,
  employeeDeductions,
  totalCashAdvance,
)

// Use imported safeCurrencyFormat from helpers.ts
// const safeCurrencyFormatRaw = safeCurrencyFormat

// Function to recalculate total earnings
function recalculateEarnings() {
  reactiveTotalEarnings.value = overallEarningsTotal.value
}

// Holiday fetching function
async function fetchEmployeeHolidays() {
  if (!props.employeeData?.id) {
    holidays.value = []
    return
  }
  isHolidaysLoading.value = true
  try {
    holidays.value = await fetchHolidaysByDateString(
      holidayDateString.value,
      String(props.employeeData.id),
    )
  } catch (error) {
    console.error('Error fetching holidays:', error)
    holidays.value = []
  } finally {
    isHolidaysLoading.value = false
  }
}

// Trip loading function
function loadTrips() {
  isTripsLoading.value = true
  Promise.resolve(fetchFilteredTrips()).finally(() => {
    isTripsLoading.value = false
  })
}

// Overtime calculation function
async function updateOverallOvertime() {
  try {
    overallOvertime.value = await computeOverallOvertimeCalculation()
  } catch (error) {
    console.error('Error calculating overtime:', error)
    overallOvertime.value = 0
  }
}

// Enhanced mounted hook
onMounted(async () => {
  await Promise.all([loadTrips(), fetchEmployeeHolidays(), updateOverallOvertime()])
  recalculateEarnings()
})

// Watch for changes in all earning components
watch(
  [
    regularWorkTotal,
    () => tripsStore.trips,
    holidays,
    overallOvertime,
    employeeDailyRate,
    dailyRate,
    codaAllowance,
  ],
  () => {
    recalculateEarnings()
  },
  { deep: true, immediate: true },
)

// Enhanced watchers for better reactivity
watch(
  [
    () => props.employeeData?.id,
    () => filterDateString.value,
    () => props.payrollData?.month,
    () => props.payrollData?.year,
  ],
  async () => {
    await Promise.all([updateOverallOvertime(), loadTrips(), fetchEmployeeHolidays()])
    recalculateEarnings()
  },
  { deep: true },
)

// Individual watchers for specific data changes
watch([filterDateString, () => props.employeeData?.id], () => {
  loadTrips()
})

watch([holidayDateString, () => props.employeeData?.id], () => {
  fetchEmployeeHolidays()
})

// Computed values for trips and holidays display
const projectSiteAllowances = computed(() => {
  return (
    tripsStore.trips?.filter((trip) => trip.trip_location?.location?.includes('Project Site')) || []
  )
})

// const sundayWorkTrips = computed(() => {
//   return (
//     tripsStore.trips?.filter((trip) => {
//       const tripDate = new Date(trip.date)
//       return tripDate.getDay() === 0 // Sunday
//     }) || []
//   )
// })

const regularHolidays = computed(() => {
  return holidays.value?.filter((holiday) => holiday.type === 'regular') || []
})

const specialHolidays = computed(() => {
  return holidays.value?.filter((holiday) => holiday.type === 'special') || []
})

// Debug logging (uncomment for debugging)
// console.log('[MiniPayrollPrint] filterDateString:', filterDateString.value, '| employeeId:', props.employeeData?.id, '| trips:', tripsStore.trips)
// console.log('[MiniPayrollPrint] Earnings Breakdown:', earningsBreakdown.value)
</script>

<template>
  <v-container fluid class="pa-4" style="max-width: 400px">
    <!-- Header -->
    <v-card class="border pa-3 mb-3">
      <v-card-title class="text-center text-h6 font-weight-bold pa-2"> PAYSLIP </v-card-title>

      <!-- Employee Basic Info -->
      <v-row dense class="mb-2">
        <v-col cols="3" class="text-caption font-weight-bold pa-1">NAME</v-col>
        <v-col cols="9" class="text-body-2 border-b-sm pa-1">{{ fullName }}</v-col>
      </v-row>

      <v-row dense class="mb-2">
        <v-col cols="3" class="text-caption font-weight-bold pa-1">POSITION</v-col>
        <v-col cols="9" class="text-body-2 border-b-sm pa-1">{{ designation }}</v-col>
      </v-row>

      <v-row dense class="mb-3">
        <v-col cols="3" class="text-caption font-weight-bold pa-1">PERIOD</v-col>
        <v-col cols="9" class="text-body-2 border-b-sm pa-1">{{ formattedPeriod }}</v-col>
      </v-row>

      <!-- Basic Salary Info -->
      <v-row dense class="mb-2">
        <v-col cols="6" class="text-caption font-weight-bold pa-1">BASIC RATE</v-col>
        <v-col cols="3" class="text-caption pa-1">perday</v-col>
        <v-col cols="3" class="text-body-2 text-end pa-1">
          {{ safeCurrencyFormat(employeeDailyRate ?? 0, formatCurrency) }}
        </v-col>
      </v-row>

      <v-row dense class="mb-2">
        <v-col cols="6" class="text-caption font-weight-bold pa-1">NO. OF DAYS</v-col>
        <v-col cols="3" class="pa-1"></v-col>
        <v-col cols="3" class="text-body-2 text-end pa-1">{{ effectiveWorkDays }}</v-col>
      </v-row>

      <v-row dense class="mb-3">
        <v-col cols="6" class="text-caption font-weight-bold pa-1">BASIC SALARY</v-col>
        <v-col cols="3" class="pa-1"></v-col>
        <v-col cols="3" class="text-body-2 text-end border-b-sm pa-1">
          {{ safeCurrencyFormat(regularWorkTotal, formatCurrency) }}
        </v-col>
      </v-row>

      <!-- Project Site Allowances -->
      <template v-if="projectSiteAllowances.length > 0">
        <v-row dense class="mb-1" v-for="trip in projectSiteAllowances" :key="'trip-' + trip.id">
          <v-col cols="6" class="text-caption pa-1">Project Site Allowance</v-col>
          <v-col cols="3" class="text-body-2 text-center pa-1"> x{{ trip.trip_no || 1 }} </v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat((trip.per_trip ?? 0) * (trip.trip_no ?? 1), formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Other trips (non-project site) -->
      <template
        v-for="trip in tripsStore.trips?.filter(
          (t: Trip) => !t.trip_location?.location?.includes('Project Site'),
        )"
        :key="'other-trip-' + trip.id"
      >
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">{{
            trip.trip_location?.location || 'Trip'
          }}</v-col>
          <v-col cols="3" class="text-body-2 text-center pa-1"> x{{ trip.trip_no || 1 }} </v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat((trip.per_trip ?? 0) * (trip.trip_no ?? 1), formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Holiday Work (Special) -->
      <template v-if="specialHolidays.length > 0">
        <v-row dense class="mb-1" v-for="holiday in specialHolidays" :key="'special-' + holiday.id">
          <v-col cols="6" class="text-caption pa-1"
            >Holiday Work ({{ getHolidayTypeName(holiday.type || '') }})</v-col
          >
          <v-col cols="3" class="text-body-2 text-center pa-1">1</v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(dailyRate * 1.3, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Holiday Work (Regular) -->
      <template v-if="regularHolidays.length > 0">
        <v-row dense class="mb-1" v-for="holiday in regularHolidays" :key="'regular-' + holiday.id">
          <v-col cols="6" class="text-caption pa-1"
            >Holiday Work ({{ getHolidayTypeName(holiday.type || '') }})</v-col
          >
          <v-col cols="3" class="text-body-2 text-center pa-1">1</v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(dailyRate * 2, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Overtime Work -->
      <v-row dense class="mb-1">
        <v-col cols="6" class="text-caption pa-1">Overtime Work</v-col>
        <v-col cols="3" class="text-body-2 text-center pa-1">
          <template v-if="overallOvertime > 0">{{ overallOvertime.toFixed(2) }}h</template>
          <template v-else>0.00h</template>
        </v-col>
        <v-col cols="3" class="text-body-2 text-end pa-1">
          <template v-if="overallOvertime > 0">
            {{
              safeCurrencyFormat((employeeDailyRate / 8) * 1.25 * overallOvertime, formatCurrency)
            }}
          </template>
          <template v-else>-</template>
        </v-col>
      </v-row>

      <!-- Non-deductions (benefits) -->
      <template v-if="employeeNonDeductions.length > 0">
        <v-row
          dense
          class="mb-1"
          v-for="benefit in employeeNonDeductions"
          :key="'benefit-' + benefit.id"
        >
          <v-col cols="6" class="text-caption pa-1">{{
            benefit.benefit.benefit || 'Benefit'
          }}</v-col>
          <v-col cols="3" class="pa-1"></v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(benefit.amount || 0, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Monthly Trippings -->
      <v-row dense class="mb-2">
        <v-col cols="6" class="text-caption pa-1">Monthly Trippings</v-col>
        <v-col cols="3" class="pa-1"></v-col>
        <v-col cols="3" class="text-body-2 text-end pa-1">
          {{ safeCurrencyFormat(codaAllowance, formatCurrency) }}
        </v-col>
      </v-row>

      <!-- Total -->
      <v-row dense class="mb-3">
        <v-col cols="6" class="text-caption font-weight-bold pa-1">TOTAL</v-col>
        <v-col cols="3" class="pa-1"></v-col>
        <v-col cols="3" class="text-body-2 text-end font-weight-bold border-b-sm pa-1">
          {{ safeCurrencyFormat(overallEarningsTotal, formatCurrency) }}
        </v-col>
      </v-row>

      <!-- Deductions Section -->
      <v-row dense class="mb-2">
        <v-col cols="12" class="text-caption font-weight-bold italic pa-1">
          LESS : DEDUCTIONS
        </v-col>
      </v-row>

      <!-- Late Deduction -->
      <template v-if="showLateDeduction && lateDeduction > 0">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">
            Late Deduction
            <span
              v-if="monthLateDeduction !== undefined && monthLateDeduction > 0"
              class="text-caption ms-1"
            >
              ({{ monthLateDeduction }} min.)
            </span>
          </v-col>
          <v-col cols="6" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(lateDeduction, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Employee Deductions -->
      <template v-for="deduction in employeeDeductions" :key="'deduction-' + deduction.id">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">{{
            deduction.benefit.benefit || 'Deduction'
          }}</v-col>
          <v-col cols="6" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(deduction.amount || 0, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Cash Advances -->
      <template v-for="ca in cashAdvances" :key="'cashadvance-' + ca.id">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">
            Cash Advance
            <span class="text-caption font-weight-bold ms-1">{{ ca.request_at }}</span>
          </v-col>
          <v-col cols="6" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(ca.amount || 0, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Total Deduction -->
      <v-row dense class="mb-2">
        <v-col cols="6" class="text-caption font-weight-bold pa-1">Total Deduction</v-col>
        <v-col cols="3" class="text-caption pa-1">Php</v-col>
        <v-col cols="3" class="text-body-2 text-end font-weight-bold border-b-sm pa-1">
          {{ safeCurrencyFormat(netSalaryCalculation.totalDeductions, formatCurrency) }}
        </v-col>
      </v-row>

      <!-- Net Pay -->
      <v-row dense>
        <v-col cols="6" class="text-h6 font-weight-bold pa-1">NET PAY</v-col>
        <v-col cols="6" class="text-h6 text-end font-weight-bold pa-1">
          {{ safeCurrencyFormat(netSalaryCalculation.netSalary, formatCurrency) }}
        </v-col>
      </v-row>
    </v-card>
  </v-container>
</template>

<style scoped>
@media print {
  .v-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
}

.border-b-sm {
  border-bottom: 1px solid #000;
}
</style>
