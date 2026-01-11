<script setup lang="ts">
import {
  useOverallEarningsTotal,
  // useEarningsBreakdown,
  useNetSalaryCalculation,
} from './overallTotal'
import {
  safeCurrencyFormat,
  getHolidayTypeName,
  getMonthDateRange,
} from './helpers'
import { type PayrollData } from './payrollTableDialog'
import { type TableData } from './payrollComputation'
import { usePayrollPrint } from './usePayrollPrint'
import { usePayrollData } from './usePayrollData'
import { fetchCashAdvances } from './computation/cashAdvance'
import { fetchEmployeeDeductions } from './computation/benefits'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'
import { useCashAdjustmentsStore, type CashAdjustment } from '@/stores/cashAdjustments'
import type { EmployeeDeduction } from '@/stores/benefits'
import type { CashAdvance } from '@/stores/cashAdvances'
import type { HolidayWithAttendance } from './computation/holidays'
import { fetchFilteredTrips } from './computation/trips'
import { getLastDateOfMonth } from './helpers'

// Props
const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

// Pinia stores
// const employeesStore = useEmployeesStore()
const cashAdjustmentsStore = useCashAdjustmentsStore()
const employeeDeductions = ref<EmployeeDeduction[]>([])
const employeeNonDeductions = ref<EmployeeDeduction[]>([])
const cashAdvances = ref<CashAdvance[]>([])
const cashAdjustments = ref<CashAdjustment[]>([])

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
  try {
    if (typeof window !== 'undefined') {
      const from = localStorage.getItem('czarles_payroll_fromDate')
      const to = localStorage.getItem('czarles_payroll_toDate')
      if (from && to) {
        const start = new Date(from)
        const end = new Date(to)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' }
          return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
        }
      }
    }
  } catch {
    /* ignore and fallback */
  }
  return getMonthDateRange(props.payrollData.year, props.payrollData.month)
})

const filterDateString = computed(() => {
  // Use localStorage for cross-month support
  try {
    if (typeof window !== 'undefined') {
      const fromDate = localStorage.getItem('czarles_payroll_fromDate')
      if (fromDate) {
        return fromDate
      }
    }
  } catch (error) {
    console.error('Error reading fromDate from localStorage:', error)
  }
  // Fallback to default month-based calculation
  const month = (monthNames.indexOf(props.payrollData.month) + 1).toString().padStart(2, '0')
  return `${props.payrollData.year}-${month}-01`
})

const holidayDateString = computed(() => {
  // Use localStorage for cross-month support
  try {
    if (typeof window !== 'undefined') {
      const fromDate = localStorage.getItem('czarles_payroll_fromDate')
      if (fromDate) {
        return fromDate.substring(0, 7) // Returns YYYY-MM format
      }
    }
  } catch (error) {
    console.error('Error extracting holidayDateString:', error)
  }
  // Fallback to default month-based calculation
  const month = (monthNames.indexOf(props.payrollData.month) + 1).toString().padStart(2, '0')
  return `${props.payrollData.year}-${month}`
})

// Create params for composable
const payrollDataParams = computed(() => ({
  employeeId: props.employeeData?.id,
  filterDateString: filterDateString.value,
  holidayDateString: holidayDateString.value,
}))

// Use payroll data composable for ALL data fetching including holidays
const {
  holidays,
  sundayDutyDays,
  sundayDutyAmount,
  sundayDutyRecords, // New: Sunday duty records with fractions
  monthlyAllowancesTotal,
  loadAllowances,
  loadSundayDuty,
  fetchEmployeeHolidays,
  // isHolidaysLoading - available but not used in mini print
  cashAdjustmentsAdditions,
  monthlyCashAdjustmentsTotal,
  loadCashAdjustments,
} = usePayrollData(payrollDataParams)

// Use fetchEmployeeDeductions from benefits.ts
async function updateEmployeeDeductions(employeeId: number | undefined) {
  const result = await fetchEmployeeDeductions(employeeId)
  employeeDeductions.value = result.deductions
  employeeNonDeductions.value = result.nonDeductions
}

// Fetch cash adjustments (deductions only) using store
async function fetchCashAdjustmentsDeductions(filterDateString: string, employeeId: number) {
  const startDate = `${filterDateString}`

  // Get the end date from localStorage for cross-month support, fallback to last day of month
  let endDate = getLastDateOfMonth(startDate)
  try {
    const storedToDate = localStorage.getItem('czarles_payroll_toDate')
    if (storedToDate) {
      endDate = storedToDate
    }
  } catch (error) {
    console.error('Error reading toDate from localStorage:', error)
  }

  // Convert dates to Date objects for store filter
  const adjustmentDates = [new Date(startDate), new Date(endDate)]

  // Fetch using store with filters
  await cashAdjustmentsStore.getCashAdjustmentsExport(
    { page: 1, itemsPerPage: -1, sortBy: [] },
    { employee_id: employeeId, adjustment_at: adjustmentDates }
  )

  // Filter for deductions only (is_deduction = true)
  return cashAdjustmentsStore.cashAdjustmentsExport.filter(adj => adj.is_deduction === true)
}

// Watch for employeeId changes to fetch deductions
watch(
  () => props.employeeData?.id,
  (id) => {
    updateEmployeeDeductions(id)
  },
  { immediate: true },
)

// Fetch cash advances and cash adjustments when employeeId or filterDateString changes
watch(
  () => [filterDateString.value, props.employeeData?.id],
  async ([filterDateString, employeeId]) => {
    if (typeof employeeId === 'number' && filterDateString) {
      // kuhaon ang cash advances ug cash adjustments para sa employee ug payroll month
      const fetchedCashAdvances = await fetchCashAdvances(filterDateString as string, employeeId)
      const fetchedCashAdjustments = await fetchCashAdjustmentsDeductions(filterDateString as string, employeeId)

      // Filter out dummy entries with amount: 0
      cashAdvances.value = fetchedCashAdvances.filter(ca => ca.amount && ca.amount > 0)
      cashAdjustments.value = fetchedCashAdjustments
    } else {
      cashAdvances.value = []
      cashAdjustments.value = []
    }
  },
  { immediate: true },
)

// Compute total cash advance from all ca.amount
const totalCashAdvance = computed(() =>
  cashAdvances.value.reduce((sum, ca) => sum + (Number(ca.amount) || 0), 0),
)

// Compute total cash adjustments (deductions only)
const totalCashAdjustments = computed(() =>
  cashAdjustments.value.reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0),
)

// Reactive references
const isTripsLoading = ref(false)
// isHolidaysLoading and holidays are now from usePayrollData composable
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
const isAdmin = computed(() => props.employeeData?.is_admin || false)

// Check if field staff to determine if late deduction should be shown
// Admin employees should not have late/undertime deductions
const showLateDeduction = computed(() => !isAdmin.value)

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
  filterDateString,
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
  monthUndertimeDeduction,
  undertimeDeduction,
  computeOverallOvertimeCalculation,
} = payrollPrint

// Use helpers for payroll calculations
const overallEarningsTotal = useOverallEarningsTotal(
  regularWorkTotal,
  computed(() => tripsStore.trips),
  holidays,
  dailyRate,
  computed(() => employeeDailyRate.value),
  overallOvertime,
  codaAllowance,
  employeeNonDeductions,
  computed(() => 0), // monthlyUtilizationsTotal - not used in mini print
  monthlyAllowancesTotal,
  monthlyCashAdjustmentsTotal,
  sundayDutyAmount,
)

// Helper function to format Sunday duty text
const formatSundayDutyText = computed(() => {
  if (!sundayDutyRecords.value || sundayDutyRecords.value.length === 0) return ''

  const fullDays = sundayDutyRecords.value.filter(r => r.attendance_fraction === 1.0).length
  const halfDays = sundayDutyRecords.value.filter(r => r.attendance_fraction === 0.5).length

  const parts: string[] = []
  if (fullDays > 0) {
    parts.push(`${fullDays}fd`)
  }
  if (halfDays > 0) {
    parts.push(`${halfDays}hd`)
  }

  return parts.length > 0 ? `(${parts.join(', ')})` : ''
})

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
  computed(() => totalCashAdvance.value + totalCashAdjustments.value), // Combine both cash deductions
  undertimeDeduction,
)

// Use imported safeCurrencyFormat from helpers.ts
// const safeCurrencyFormatRaw = safeCurrencyFormat

// Function to recalculate total earnings
function recalculateEarnings() {
  reactiveTotalEarnings.value = overallEarningsTotal.value
}

// fetchEmployeeHolidays is now provided by usePayrollData composable

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
  await Promise.all([loadTrips(), fetchEmployeeHolidays(), updateOverallOvertime(), loadAllowances(), loadCashAdjustments(), loadSundayDuty(dailyRate.value)])
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
    monthlyAllowancesTotal,
    sundayDutyAmount,
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
    await Promise.all([updateOverallOvertime(), loadTrips(), fetchEmployeeHolidays(), loadAllowances(), loadCashAdjustments(), loadSundayDuty(dailyRate.value)])
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

// Helper function to calculate holiday pay (added value only, not base rate)
function calculateHolidayPay(holiday: HolidayWithAttendance): number {
  const type = holiday.type?.toLowerCase() || ''
  const fraction = holiday.attendance_fraction || 0
  const rate = dailyRate.value || 0

  // Return only the premium/additional amount, not including the base 100%
  if (type.includes('rh')) return rate * 1.0 * fraction  // 200% - 100% = 100% premium
  if (type.includes('snh')) return rate * 0.3 * fraction // 130% - 100% = 30% premium
  if (type.includes('lh')) return rate * 0.3 * fraction  // 130% - 100% = 30% premium
  if (type.includes('ch')) return rate * 0.0 * fraction  // 100% - 100% = 0% premium (no additional)
  if (type.includes('swh')) return rate * 0.3 * fraction // 130% - 100% = 30% premium
  return rate * 0.0 * fraction // Default: no premium
}

// Helper function to get holiday multiplier text
function getHolidayMultiplier(holiday: HolidayWithAttendance): string {
  const type = holiday.type?.toLowerCase() || ''
  const fraction = holiday.attendance_fraction || 0
  const halfDayText = fraction === 0.5 ? ' (Half)' : ''

  if (type.includes('rh')) return `200%${halfDayText}`
  if (type.includes('snh')) return `130%${halfDayText}`
  if (type.includes('lh')) return `130%${halfDayText}`
  if (type.includes('ch')) return `100%${halfDayText}`
  if (type.includes('swh')) return `130%${halfDayText}`
  return `100%${halfDayText}`
}

// Computed values for holidays display - filter only holidays with attendance
const displayableHolidays = computed(() => {
  return holidays.value?.filter((holiday) => (holiday.attendance_fraction || 0) > 0) || []
})

// Debug logging (uncomment for debugging)
// console.log('[MiniPayrollPrint] filterDateString:', filterDateString.value, '| employeeId:', props.employeeData?.id, '| trips:', tripsStore.trips)
// console.log('[MiniPayrollPrint] Earnings Breakdown:', earningsBreakdown.value)
</script>

<template>
  <v-container fluid class="pa-4" style="max-width: 400px">
    <!-- Header -->
    <v-card class="thick-border pa-3 mb-3">
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

      <!-- Consolidated Trips -->
      <template v-if="tripsStore.trips && tripsStore.trips.length > 0">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">Monthly Trippings</v-col>
          <v-col cols="3" class="pa-1"></v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(tripsStore.trips.reduce((total, trip) => total + ((trip.per_trip ?? 0) * (trip.trip_no ?? 1)), 0), formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Holiday Work (All Types) -->
      <template v-if="displayableHolidays.length > 0">
        <v-row dense class="mb-1" v-for="holiday in displayableHolidays" :key="'holiday-' + holiday.id">
          <v-col cols="6" class="text-caption pa-1">
            {{ holiday.name }} ({{ getHolidayTypeName(holiday.type || '') }})
          </v-col>
          <v-col cols="3" class="text-body-2 text-center pa-1">
            {{ getHolidayMultiplier(holiday) }}
          </v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(calculateHolidayPay(holiday), formatCurrency) }}
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

      <!-- Sunday Duty Premium -->
      <template v-if="sundayDutyDays > 0">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">Sunday Duty Premium</v-col>
          <v-col cols="3" class="text-body-2 text-center pa-1">
            30% {{ formatSundayDutyText || `(${sundayDutyDays}d)` }}
          </v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(sundayDutyAmount, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Allowance -->
      <template v-if="monthlyAllowancesTotal > 0">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">Allowance</v-col>
          <v-col cols="3" class="pa-1"></v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(monthlyAllowancesTotal, formatCurrency) }}
          </v-col>
        </v-row>
      </template>

      <!-- Employee Non-Deductions (Benefits) -->
      <template v-if="employeeNonDeductions && employeeNonDeductions.length > 0">
        <v-row dense class="mb-1" v-for="benefit in employeeNonDeductions" :key="'benefit-' + benefit.id" v-show="(benefit.amount || 0) > 0">
          <v-col cols="6" class="text-caption pa-1">{{ benefit.benefit.benefit || 'Other Benefit' }}</v-col>
          <v-col cols="3" class="pa-1"></v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">{{ safeCurrencyFormat(benefit.amount || 0, formatCurrency) }}</v-col>
        </v-row>
      </template>

      <!-- Cash Adjustments (Additions) -->
      <template v-if="cashAdjustmentsAdditions && cashAdjustmentsAdditions.length > 0">
        <v-row dense class="mb-1" v-for="adj in cashAdjustmentsAdditions" :key="'cashadjustment-add-' + adj.id">
          <v-col cols="6" class="text-caption pa-1">{{ adj.name || 'Cash Adjustment' }}
            <span v-if="adj.remarks" class="text-caption font-weight-bold ms-1">({{ adj.remarks }})</span>
          </v-col>
          <v-col cols="3" class="pa-1"></v-col>
          <v-col cols="3" class="text-body-2 text-end pa-1">{{ safeCurrencyFormat(adj.amount || 0, formatCurrency) }}</v-col>
        </v-row>
      </template>




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

      <!-- Undertime Deduction -->
      <template v-if="showLateDeduction && undertimeDeduction > 0">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">
            Undertime Deduction
            <span
              v-if="monthUndertimeDeduction !== undefined && monthUndertimeDeduction > 0"
              class="text-caption ms-1"
            >
              ({{ monthUndertimeDeduction }} min.)
            </span>
          </v-col>
          <v-col cols="6" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(undertimeDeduction, formatCurrency) }}
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

      <!-- Cash Adjustments (Deductions) -->
      <template v-for="adj in cashAdjustments" :key="'cashadjustment-' + adj.id">
        <v-row dense class="mb-1">
          <v-col cols="6" class="text-caption pa-1">
            {{ adj.name || 'Cash Adjustment' }}
            <span v-if="adj.remarks" class="text-caption font-weight-bold ms-1">
              ({{ adj.remarks }})
            </span>
          </v-col>
          <v-col cols="6" class="text-body-2 text-end pa-1">
            {{ safeCurrencyFormat(adj.amount || 0, formatCurrency) }}
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

/* copied from PayrollPrintFooter: consistent thick border used for print/pdf */
.thick-border {
  border: 1px solid;
}

@media print {
  .thick-border {
    border: 1px solid !important;
  }
}

/* Programmatic hook: add .pdf-print-active to a parent during html2pdf run */
.pdf-print-active .thick-border {
  border: 1px solid !important;
}
</style>
