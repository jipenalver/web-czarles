<script setup lang="ts">
import { useOverallEarningsTotal } from './overallTotal'
import { getHolidayTypeName, /* formatTripDate, */ getMonthDateRange, hasBenefitAmount, convertHoursToDays, formatHoursOneDecimal } from './helpers'
import { getMoneyText } from '@/utils/helpers/others'
import { type Holiday } from '@/stores/holidays'
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrint } from './usePayrollPrint'
import PayrollDeductions from './PayrollDeductions.vue'
import MiniPayrollPrint from './MiniPayrollPrint.vue'
import PayrollPrintFooter from './PayrollPrintFooter.vue'
import { fetchEmployeeDeductions } from './computation/benefits'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'
import { fetchHolidaysByDateString, fetchHolidaysByRange } from './computation/holidays'
import type { EmployeeDeduction } from '@/stores/benefits'
import { fetchFilteredTrips, fetchTripsByRange } from './computation/trips'
import type { Utilization } from '@/stores/utilizations'
import { fetchFilteredUtilizations, fetchUtilizationsByRange } from './computation/utilizations'
import type { Allowance } from '@/stores/allowances'
import { fetchFilteredAllowances, fetchAllowancesByRange } from './computation/allowances'
import type { CashAdjustment } from '@/stores/cashAdjustments'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from './helpers'

const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

const employeeDeductions = ref<EmployeeDeduction[]>([])
const employeeNonDeductions = ref<EmployeeDeduction[]>([])
const isDeductionsLoading = ref(false)

async function updateEmployeeDeductions(employeeId: number | undefined) {
  isDeductionsLoading.value = true
  try {
    const result = await fetchEmployeeDeductions(employeeId)
    employeeDeductions.value = result.deductions
    employeeNonDeductions.value = result.nonDeductions
  } catch (error) {
    console.error('Error updating employee deductions:', error)
    employeeDeductions.value = []
    employeeNonDeductions.value = []
  } finally {
    isDeductionsLoading.value = false
  }
}

watch(
  () => props.employeeData?.id,
  async (id) => {
    if (id) {
      await updateEmployeeDeductions(id)
    }
  },
  { immediate: true },
)

const monthDateRange = computed(() => {
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

const isTripsLoading = ref(false)
const isHolidaysLoading = ref(false)
const isOvertimeLoading = ref(false)
const isUtilizationsLoading = ref(false)
const isAllowancesLoading = ref(false)
const isCalculationsCompleting = ref(false)
const holidays = ref<Holiday[]>([])
const overallOvertime = ref<number>(0)
const reactiveTotalEarnings = ref(0)
const tripsStore = useTripsStore()
const utilizations = ref<Utilization[]>([])
const allowances = ref<Allowance[]>([])
const cashAdjustmentsAdditions = ref<CashAdjustment[]>([])
const isCashAdjustmentsLoading = ref(false)

// Comprehensive loading state that tracks ALL calculations
const isPayrollCalculating = computed(() => {
  return isTripsLoading.value ||
         isHolidaysLoading.value ||
         isOvertimeLoading.value ||
         isUtilizationsLoading.value ||
         isAllowancesLoading.value ||
         isCashAdjustmentsLoading.value ||
         isDeductionsLoading.value ||
         isCalculationsCompleting.value
})

// Expose methods and state to parent components
defineExpose({
  initializePayrollCalculations,
  recalculateEarnings,
  reloadAllFunctions,
  loadTrips,
  loadUtilizations,
  loadAllowances,
  loadCashAdjustments,
  fetchEmployeeHolidays,
  updateOverallOvertime,
  updateEmployeeDeductions: () => updateEmployeeDeductions(props.employeeData?.id),
  isPayrollCalculating, // Expose comprehensive loading state
})

const fullName = computed(() => {
  if (!props.employeeData) return 'N/A'
  const middleName = props.employeeData.middlename ? ` ${props.employeeData.middlename} ` : ' '
  return `${props.employeeData.firstname}${middleName}${props.employeeData.lastname}`
})

const designation = computed(() => {
  return props.employeeData?.designation?.designation || 'N/A'
})

const address = computed(() => {
  return props.employeeData?.address || 'N/A'
})

const formattedDate = computed(() => {
  // Use the current system date for the printed pay slip date
  const date = new Date()
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const filterDateString = computed(() => {
  const month = (monthNames.indexOf(props.payrollData.month) + 1).toString().padStart(2, '0')
  return `${props.payrollData.year}-${month}-01`
})

const holidayDateString = computed(() => {
  const month = (monthNames.indexOf(props.payrollData.month) + 1).toString().padStart(2, '0')
  return `${props.payrollData.year}-${month}`
})

const dailyRate = computed(() => props.employeeData?.daily_rate || 0)
const grossSalary = computed(() => props.tableData?.gross_pay || 0)
const showLateDeduction = computed(() => !props.employeeData?.is_field_staff)
// const isFieldStaff = computed(() => props.employeeData?.is_field_staff || false)
const effectiveWorkDays = computed(() => presentDays?.value || 0)
const totalHoursWorked = computed(() => {
  if (props.employeeData?.is_field_staff && employeeDailyRate.value > 0) {
    const hourlyRate = employeeDailyRate.value / 8
    return regularWorkTotal.value / hourlyRate
  }
  return 0
})

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

const {
  codaAllowance,
  formatCurrency,
  employeeDailyRate,
  regularWorkTotal,
  presentDays,
  lateDeduction,
  monthLateDeduction,
  monthUndertimeDeduction,
  undertimeDeduction,
  computeOverallOvertimeCalculation,
  netSalary,
} = payrollPrint

const monthlyTrippingsTotal = computed(() => {
  return tripsStore.trips.reduce((sum, trip) => {
    return sum + (trip.per_trip ?? 0) * (trip.trip_no ?? 1)
  }, 0)
})

const monthlyUtilizationsTotal = computed(() => {
  const total = utilizations.value.reduce((sum, utilization) => {
    const totalHours = utilization.hours ?? 0
    const overtimeHours = utilization.overtime_hours ?? 0
    const perHour = utilization.per_hour ?? 0
    const lineTotal = (totalHours + overtimeHours) * perHour

    // console.log('[monthlyUtilizationsTotal] Calculating:', {
    //   utilizationId: utilization.id,
    //   unit: utilization.unit?.name,
    //   totalHours,
    //   overtimeHours,
    //   perHour,
    //   lineTotal,
    //   runningSum: sum + lineTotal
    // })

    return sum + lineTotal
  }, 0)

  // console.log('[monthlyUtilizationsTotal] Final total:', {
  //   utilizationsCount: utilizations.value.length,
  //   total
  // })

  return total
})

const monthlyAllowancesTotal = computed(() => {
  const total = allowances.value.reduce((sum, allowance) => {
    const amount = allowance.amount ?? 0

    // console.log('[monthlyAllowancesTotal] Calculating:', {
    //   allowanceId: allowance.id,
    //   tripLocation: allowance.trip_location?.location,
    //   amount,
    //   runningSum: sum + amount
    // })

    return sum + amount
  }, 0)

  // console.log('[monthlyAllowancesTotal] Final total:', {
  //   allowancesCount: allowances.value.length,
  //   total
  // })

  return total
})

const monthlyCashAdjustmentsTotal = computed(() => {
  const total = cashAdjustmentsAdditions.value.reduce((sum, adjustment) => {
    const amount = adjustment.amount ?? 0
    return sum + amount
  }, 0)

  return total
})

const overallEarningsTotal = useOverallEarningsTotal(
  regularWorkTotal,
  computed(() => tripsStore.trips),
  holidays,
  dailyRate,
  computed(() => employeeDailyRate.value),
  overallOvertime,
  codaAllowance,
  employeeNonDeductions,
  monthlyUtilizationsTotal,
  monthlyAllowancesTotal,
  monthlyCashAdjustmentsTotal,
)

const displayTotalEarnings = computed(() => {
  return overallEarningsTotal.value || 0
})

function recalculateEarnings() {
  reactiveTotalEarnings.value = overallEarningsTotal.value
}

async function initializePayrollCalculations() {
  isCalculationsCompleting.value = true
  try {
    isTripsLoading.value = true
    isHolidaysLoading.value = true
    isOvertimeLoading.value = true
    isUtilizationsLoading.value = true
    isAllowancesLoading.value = true
    isCashAdjustmentsLoading.value = true
    isDeductionsLoading.value = true
    holidays.value = []
    overallOvertime.value = 0
    utilizations.value = []
    allowances.value = []
    cashAdjustmentsAdditions.value = []
    employeeDeductions.value = []
    employeeNonDeductions.value = []
    if (props.employeeData?.id) {
      await updateEmployeeDeductions(props.employeeData.id)
    }
    await Promise.all([loadTrips(), loadUtilizations(), loadAllowances(), loadCashAdjustments(), fetchEmployeeHolidays(), updateOverallOvertime()])
    recalculateEarnings()
  } catch (error) {
    console.error('[PayrollPrint] Error initializing payroll calculations:', error)
  } finally {
    // Ensure all individual loading states are false
    isTripsLoading.value = false
    isHolidaysLoading.value = false
    isOvertimeLoading.value = false
    isUtilizationsLoading.value = false
    isAllowancesLoading.value = false
    isCashAdjustmentsLoading.value = false
    isDeductionsLoading.value = false
    isCalculationsCompleting.value = false
  }
}

async function reloadAllFunctions() {
  isCalculationsCompleting.value = true
  try {
    tripsStore.trips = []
    holidays.value = []
    overallOvertime.value = 0
    utilizations.value = []
    allowances.value = []
    cashAdjustmentsAdditions.value = []
    employeeDeductions.value = []
    employeeNonDeductions.value = []
    reactiveTotalEarnings.value = 0
    isTripsLoading.value = true
    isHolidaysLoading.value = true
    isOvertimeLoading.value = true
    isUtilizationsLoading.value = true
    isAllowancesLoading.value = true
    isCashAdjustmentsLoading.value = true
    isDeductionsLoading.value = true
    await initializePayrollCalculations()
  } catch (error) {
    console.error('[PayrollPrint] Error during comprehensive reload:', error)
  } finally {
    isCalculationsCompleting.value = false
  }
}

async function fetchEmployeeHolidays() {
  if (!props.employeeData?.id) {
    holidays.value = []
    isHolidaysLoading.value = false
    return
  }
  try {
    // Prefer explicit from/to range saved in localStorage (persisted from PayrollTableDialog)
    let fromDate: string | null = null
    let toDate: string | null = null
    try {
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate')
        toDate = localStorage.getItem('czarles_payroll_toDate')
      }
    } catch {
      fromDate = null
      toDate = null
    }

    if (fromDate && toDate) {
      // Use range-based fetch
      holidays.value = await fetchHolidaysByRange(fromDate, toDate, String(props.employeeData.id))
    } else {
      // Fallback to month-based fetch
      holidays.value = await fetchHolidaysByDateString(
        holidayDateString.value,
        String(props.employeeData.id),
      )
    }
  } catch (error) {
    console.error('Error fetching holidays:', error)
    holidays.value = []
  } finally {
    isHolidaysLoading.value = false
  }
}

async function loadTrips() {
  if (!props.employeeData?.id) {
    isTripsLoading.value = false
    return
  }
  isTripsLoading.value = true
  try {
    // Prefer explicit from/to range saved in localStorage (persisted from PayrollTableDialog)
    let fromDate: string | null = null
    let toDate: string | null = null
    try {
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate')
        toDate = localStorage.getItem('czarles_payroll_toDate')
      }
    } catch {
      fromDate = null
      toDate = null
    }

    let fetchedTrips
    if (fromDate && toDate) {
      fetchedTrips = await fetchTripsByRange(fromDate, toDate, props.employeeData.id)
    } else {
      fetchedTrips = await fetchFilteredTrips(filterDateString.value, props.employeeData.id)
    }

    tripsStore.trips = fetchedTrips
  } catch (error) {
    console.error('[PayrollPrint] Error loading trips:', error)
    tripsStore.trips = []
  } finally {
    isTripsLoading.value = false
  }
}

async function loadUtilizations() {
  if (!props.employeeData?.id) {
    // console.warn('[loadUtilizations] No employee ID, skipping')
    isUtilizationsLoading.value = false
    return
  }

  // console.log('[loadUtilizations] Starting...', {
  //   employeeId: props.employeeData.id,
  //   employeeName: `${props.employeeData.firstname} ${props.employeeData.lastname}`,
  //   filterDateString: filterDateString.value
  // })

  isUtilizationsLoading.value = true
  try {
    // Prefer explicit from/to range saved in localStorage (persisted from PayrollTableDialog)
    let fromDate: string | null = null
    let toDate: string | null = null
    try {
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate')
        toDate = localStorage.getItem('czarles_payroll_toDate')
      }
    } catch {
      fromDate = null
      toDate = null
    }

    // console.log('[loadUtilizations] Date range from localStorage:', { fromDate, toDate })

    let fetchedUtilizations
    if (fromDate && toDate) {
      // console.log('[loadUtilizations] Using range-based fetch')
      fetchedUtilizations = await fetchUtilizationsByRange(fromDate, toDate, props.employeeData.id)
    } else {
      // console.log('[loadUtilizations] Using month-based fetch')
      fetchedUtilizations = await fetchFilteredUtilizations(filterDateString.value, props.employeeData.id)
    }

    utilizations.value = fetchedUtilizations

    // console.log('[loadUtilizations] Utilizations loaded:', {
    //   count: fetchedUtilizations.length,
    //   utilizations: fetchedUtilizations
    // })
  } catch (error) {
    console.error('[PayrollPrint] Error loading utilizations:', error)
    utilizations.value = []
  } finally {
    isUtilizationsLoading.value = false
  }
}

async function loadAllowances() {
  if (!props.employeeData?.id) {
    // console.warn('[loadAllowances] No employee ID, skipping')
    isAllowancesLoading.value = false
    return
  }

  // console.log('[loadAllowances] Starting...', {
  //   employeeId: props.employeeData.id,
  //   employeeName: `${props.employeeData.firstname} ${props.employeeData.lastname}`,
  //   filterDateString: filterDateString.value
  // })

  isAllowancesLoading.value = true
  try {
    // Prefer explicit from/to range saved in localStorage (persisted from PayrollTableDialog)
    let fromDate: string | null = null
    let toDate: string | null = null
    try {
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate')
        toDate = localStorage.getItem('czarles_payroll_toDate')
      }
    } catch {
      fromDate = null
      toDate = null
    }

    // console.log('[loadAllowances] Date range from localStorage:', { fromDate, toDate })

    let fetchedAllowances
    if (fromDate && toDate) {
      // console.log('[loadAllowances] Using range-based fetch')
      fetchedAllowances = await fetchAllowancesByRange(fromDate, toDate, props.employeeData.id)
    } else {
      // console.log('[loadAllowances] Using month-based fetch')
      fetchedAllowances = await fetchFilteredAllowances(filterDateString.value, props.employeeData.id)
    }

    allowances.value = fetchedAllowances

    // console.log('[loadAllowances] Allowances loaded:', {
    //   count: fetchedAllowances.length,
    //   allowances: fetchedAllowances
    // })
  } catch (error) {
    console.error('[PayrollPrint] Error loading allowances:', error)
    allowances.value = []
  } finally {
    isAllowancesLoading.value = false
  }
}

async function loadCashAdjustments() {
  if (!props.employeeData?.id) {
    isCashAdjustmentsLoading.value = false
    return
  }

  isCashAdjustmentsLoading.value = true
  try {
    // Prefer explicit from/to range saved in localStorage
    let fromDate: string | null = null
    let toDate: string | null = null
    try {
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate')
        toDate = localStorage.getItem('czarles_payroll_toDate')
      }
    } catch {
      fromDate = null
      toDate = null
    }

    let startDate: string
    let endDate: string

    if (fromDate && toDate) {
      startDate = fromDate
      endDate = toDate
    } else {
      startDate = filterDateString.value
      endDate = getLastDateOfMonth(startDate)
    }

    // Fetch cash adjustments with is_deduction=false (additions/earnings)
    const { data, error } = await supabase
      .from('cash_adjustments')
      .select('*')
      .eq('employee_id', props.employeeData.id)
      .eq('is_deduction', false)
      .gte('adjustment_at', startDate)
      .lt('adjustment_at', endDate)

    if (error) {
      console.error('[PayrollPrint] Error loading cash adjustments:', error)
      cashAdjustmentsAdditions.value = []
    } else {
      cashAdjustmentsAdditions.value = data || []
    }
  } catch (error) {
    console.error('[PayrollPrint] Error loading cash adjustments:', error)
    cashAdjustmentsAdditions.value = []
  } finally {
    isCashAdjustmentsLoading.value = false
  }
}

async function updateOverallOvertime() {
  isOvertimeLoading.value = true
  try {
    overallOvertime.value = await computeOverallOvertimeCalculation()
  } catch (error) {
    console.error('Error calculating overtime:', error)
    overallOvertime.value = 0
  } finally {
    isOvertimeLoading.value = false
  }
}

onMounted(async () => {
  await initializePayrollCalculations()
})

watch(
  [
    regularWorkTotal,
    () => tripsStore.trips,
    holidays,
    overallOvertime,
    employeeDailyRate,
    dailyRate,
    codaAllowance,
    employeeNonDeductions,
  ],
  () => {
    recalculateEarnings()
  },
  { deep: true, immediate: true },
)

watch(
  [
    () => props.employeeData?.id,
    () => filterDateString.value,
    () => props.payrollData?.month,
    () => props.payrollData?.year,
  ],
  async () => {
    await initializePayrollCalculations()
  },
  { deep: true },
)

watch([filterDateString, () => props.employeeData?.id], async () => {
  await loadTrips()
})

watch([holidayDateString, () => props.employeeData?.id], () => {
  fetchEmployeeHolidays()
})

// Debug logging for loading states (can be removed in production)
watch(
  () => isPayrollCalculating.value,
  (isLoading) => {
    console.log('[PayrollPrint] Comprehensive loading state:', isLoading, {
      trips: isTripsLoading.value,
      holidays: isHolidaysLoading.value,
      overtime: isOvertimeLoading.value,
      utilizations: isUtilizationsLoading.value,
      allowances: isAllowancesLoading.value,
      cashAdjustments: isCashAdjustmentsLoading.value,
      deductions: isDeductionsLoading.value,
      completing: isCalculationsCompleting.value
    })
  },
  { immediate: true }
)
</script>

<template>
  <v-container fluid class="pa-4 payroll-main-content">
    <v-row dense no-gutters>
      <v-col cols="12" sm="9" class="d-flex justify-center align-center">
        <v-img src="/image-header-title.png"></v-img>
      </v-col>
      <v-col cols="12" sm="3" class="d-flex justify-center align-center">
        <h1 class="text-h5 font-weight-black text-primary">CASH VOUCHER</h1>
      </v-col>
    </v-row>

    <v-table class="mt-6 text-body-2 thick-border" density="compact">
      <tbody>
        <tr>
          <td class="text-caption pa-2" style="width: auto">PAID TO</td>
          <td class="pa-2 border-b-sm" style="width: 66%">{{ fullName }}</td>
          <td class="text-caption pa-2" style="width: auto">POSITION</td>
          <td class="pa-2 border-b-sm" style="width: 25%">{{ designation }}</td>
        </tr>
        <tr>
          <td class="text-caption pa-2">ADDRESS</td>
          <td class="pa-2 border-b-sm">{{ address }}</td>
          <td class="text-caption pa-2">DATE</td>
          <td class="pa-2 border-b-sm">{{ formattedDate }}</td>
        </tr>
      </tbody>
    </v-table>

    <v-table class="mt-3 text-body-2 border thick-border" density="compact">
      <tbody>
        <tr>
          <td class="text-caption text-center border-b-sm pa-2" colspan="4">PARTICULARS</td>
          <td class="text-caption text-center border-b-sm border-s-sm pa-2">AMOUNT</td>
        </tr>

        <tr>
          <td class="pa-2">-</td>
          <td class="border-b-thin text-center pa-2">
            <span v-if="props.employeeData?.is_field_staff">
              Actual Hours Worked for <span class="font-weight-bold">{{ monthDateRange }}</span>
            </span>
            <span v-else>
              Days Regular Work for <span class="font-weight-bold">{{ monthDateRange }}</span>
            </span>
          </td>
          <td class="pa-2">
            <span v-if="props.employeeData?.is_field_staff">
              @ {{ getMoneyText((employeeDailyRate ?? 0) / 8) }}/hr
            </span>
            <span v-else> @ {{ getMoneyText(employeeDailyRate ?? 0) }} </span>
          </td>
          <td class="pa-2">
            <span v-if="props.employeeData?.is_field_staff">
              x {{ convertHoursToDays(totalHoursWorked) }} days
            </span>
            <span v-else> x {{ effectiveWorkDays }} days</span>
          </td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="regular">
            {{ getMoneyText(regularWorkTotal) }}
          </td>
        </tr>

        <tr v-if="isPayrollCalculating">
          <td class="text-center pa-2" colspan="5">
            <v-progress-circular indeterminate color="primary" size="32" class="mx-auto mb-2" />
            <div>
              <span v-if="isCalculationsCompleting">Initializing payroll calculations...</span>
              <span v-else-if="isTripsLoading">Loading trips data...</span>
              <span v-else-if="isUtilizationsLoading">Loading utilizations data...</span>
              <span v-else-if="isAllowancesLoading">Loading allowances data...</span>
              <span v-else-if="isCashAdjustmentsLoading">Loading cash adjustments data...</span>
              <span v-else-if="isHolidaysLoading">Loading holidays data...</span>
              <span v-else-if="isOvertimeLoading">Calculating overtime...</span>
              <span v-else-if="isDeductionsLoading">Loading deductions...</span>
              <span v-else>Loading payroll data...</span>
            </div>
          </td>
        </tr>

        <template v-else>
          <template v-if="tripsStore.trips && tripsStore.trips.length > 0">
           <!--  <tr v-for="trip in tripsStore.trips" :key="'trip-' + trip.id">
              <td class="pa-2">-</td>
              <td class="border-b-thin text-center pa-2">
                {{ trip.trip_location?.location || 'N/A' }} for {{ formatTripDate(trip.trip_at) }}
              </td>
              <td class="pa-2">@ {{ getMoneyText(trip.per_trip ?? 0) }}</td>
              <td class="pa-2">x {{ trip.trip_no ?? 1 }}</td>
              <td
                class="text-grey-darken-1 border-b-thin border-s-sm text-end pa-2 total-cell"
                data-total="trip"
              >
                {{ getMoneyText((trip.per_trip ?? 0) * (trip.trip_no ?? 1)) }}
              </td>
            </tr> -->
          </template>
         <!--  <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">
                No trips to preview for this payroll period.
              </td>
            </tr>
          </template> -->

          <template v-if="holidays.length > 0">
            <tr v-for="holiday in holidays" :key="'holiday-' + holiday.id">
              <td class="pa-2">-</td>
              <td class="border-b-thin text-center pa-2">
                {{ holiday.name }} ({{ getHolidayTypeName(holiday.type ?? undefined) }})
              </td>
              <td class="pa-2">
                <span v-if="holiday.type && holiday.type.toLowerCase().includes('rh')">
                  @ {{ getMoneyText(dailyRate ?? 0) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('snh')">
                  @ {{ getMoneyText(dailyRate ?? 0) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('swh')">
                  @ {{ getMoneyText(dailyRate ?? 0) }}
                </span>
                <span v-else> @ {{ getMoneyText(dailyRate ?? 0) }} </span>
              </td>
              <td class="pa-2">
                <span v-if="holiday.type && holiday.type.toLowerCase().includes('rh')">x 200%</span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('snh')"
                  >x 150%</span
                >
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('swh')"
                  >x 130%</span
                >
              </td>
              <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="holiday">
                {{
                  holiday.type && holiday.type.toLowerCase().includes('rh')
                    ? getMoneyText(dailyRate * 2)
                    : holiday.type && holiday.type.toLowerCase().includes('snh')
                      ? getMoneyText(dailyRate * 1.5)
                      : holiday.type && holiday.type.toLowerCase().includes('swh')
                        ? getMoneyText(dailyRate * 1.3)
                        : getMoneyText(dailyRate)
                }}
              </td>
            </tr>
          </template>
         <!--  <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">No holidays for this payroll period.</td>
            </tr>
          </template> -->
        </template>

        <tr v-show="overallOvertime > 0">
          <td class="border-b-thin text-center pa-2" colspan="2">Overtime Work</td>
          <td class="pa-2"></td>
          <td class="pa-2">{{ formatHoursOneDecimal(overallOvertime) }} hours</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overtime">
            {{ getMoneyText((employeeDailyRate / 8) * 1.25 * overallOvertime) }}
          </td>
        </tr>

        <template v-if="employeeNonDeductions.length > 0">
          <tr v-for="benefit in employeeNonDeductions" :key="'benefit-' + benefit.id" v-show="hasBenefitAmount(benefit.amount)">
            <td class="border-b-thin text-center pa-2" colspan="2">
              {{ benefit.benefit.benefit || 'Other Benefit' }}
            </td>
            <td class="pa-2"></td>
            <td class="pa-2">-</td>
            <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="benefit">
              {{ getMoneyText(benefit.amount ?? 0) }}
            </td>
          </tr>
        </template>
        <tr v-show="monthlyTrippingsTotal > 0">
          <td class="border-b-thin text-center pa-2" colspan="2">Monthly Trippings</td>
          <td class="pa-2"></td>
          <td class="pa-2"></td>
          <td
            class="border-b-thin border-s-sm text-end pa-2 total-cell"
            data-total="monthly-trippings"
          >
            {{ getMoneyText(monthlyTrippingsTotal) }}
          </td>
        </tr>

        <tr v-show="monthlyUtilizationsTotal > 0">
          <td class="border-b-thin text-center pa-2" colspan="2">Monthly Utilizations</td>
          <td class="pa-2"></td>
          <td class="pa-2"></td>
          <td
            class="border-b-thin border-s-sm text-end pa-2 total-cell"
            data-total="monthly-utilizations"
          >
            {{ getMoneyText(monthlyUtilizationsTotal) }}
          </td>
        </tr>

        <tr v-show="monthlyAllowancesTotal > 0">
          <td class="border-b-thin text-center pa-2" colspan="2">Allowance</td>
          <td class="pa-2"></td>
          <td class="pa-2"></td>
          <td
            class="border-b-thin border-s-sm text-end pa-2 total-cell"
            data-total="monthly-allowances"
          >
            {{ getMoneyText(monthlyAllowancesTotal) }}
          </td>
        </tr>

        <tr v-for="adj in cashAdjustmentsAdditions" :key="'cashadjustment-' + adj.id">
          <td class="border-b-thin text-center pa-2" colspan="2">
            {{ adj.name || 'Cash Adjustment' }}
            <span v-if="adj.remarks" class="text-caption"> ({{ adj.remarks }})</span>
          </td>
          <td class="pa-2"></td>
          <td class="pa-2">-</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="cash-adjustment">
            {{ getMoneyText(adj.amount ?? 0) }}
          </td>
        </tr>

        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold pa-2">Gross Salary</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overall">
            {{ getMoneyText(displayTotalEarnings) }}
          </td>
        </tr>
        <PayrollDeductions
          :showLateDeduction="showLateDeduction"
          :monthLateDeduction="monthLateDeduction"
          :monthUndertimeDeduction="monthUndertimeDeduction"
          :formatCurrency="formatCurrency"
          :employeeId="props.employeeData?.id"
          :employeeDeductions="employeeDeductions"
          :filterDateString="filterDateString"
          :overallEarningsTotal="overallEarningsTotal"
          :lateDeduction="lateDeduction"
          :undertimeDeduction="undertimeDeduction"
        />
      </tbody>
    </v-table>

  <PayrollPrintFooter :price="getMoneyText(netSalary)"></PayrollPrintFooter>

    <div id="mini-payroll-section" class="mini-payroll-hidden">
      <MiniPayrollPrint
        :employeeData="props.employeeData"
        :payrollData="props.payrollData"
        :tableData="props.tableData"
      />
    </div>
  </v-container>
</template>

<style scoped>
.mini-payroll-hidden {
  display: none;
}

.thick-border {
  border: 1px solid !important;
}

/* Apply thick border only when printing */
@media print {
  .thick-border {
    border: 3px solid !important;
  }
}


</style>
