<script setup lang="ts">
import {
  useOverallEarningsTotal,
  // useEarningsBreakdown,
  // useNetSalaryCalculation,
} from './overallTotal'
import {
  safeCurrencyFormat,
  getHolidayTypeName,
  formatTripDate,
  getMonthDateRange,
} from './helpers'
import { type Holiday } from '@/stores/holidays'
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrint } from './usePayrollPrint'
// import logoCzarles from '@/assets/logos/logo-czarles.png'
import PayrollDeductions from './PayrollDeductions.vue'
import MiniPayrollPrint from './MiniPayrollPrint.vue'
import { fetchEmployeeDeductions } from './computation/benefits'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'
import { fetchHolidaysByDateString } from './computation/holidays'
import type { EmployeeDeduction } from '@/stores/benefits'
import { fetchFilteredTrips } from './computation/trips'
// Props
const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

// Expose functions para ma-access sa parent component
defineExpose({
  initializePayrollCalculations,
  recalculateEarnings,
  reloadAllFunctions,
  // Individual reload functions
  loadTrips,
  fetchEmployeeHolidays,
  updateOverallOvertime,
  updateEmployeeDeductions: () => updateEmployeeDeductions(props.employeeData?.id),
})
// Pinia store for employees
// const employeesStore = useEmployeesStore()
const employeeDeductions = ref<EmployeeDeduction[]>([])
const employeeNonDeductions = ref<EmployeeDeduction[]>([])

// Use fetchEmployeeDeductions from cashAdvance.ts
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

// ...existing code...

// Month date range for display in "Days Regular Work for"
const monthDateRange = computed(() => {
  return getMonthDateRange(props.payrollData.year, props.payrollData.month)
})

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

const address = computed(() => {
  return props.employeeData?.address || 'N/A'
})

// Date formatting computeds
const formattedDate = computed(() => {
  const monthIndex = monthNames.indexOf(props.payrollData.month)
  const date = new Date(props.payrollData.year, monthIndex)
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

// Payroll calculation computeds
const dailyRate = computed(() => props.employeeData?.daily_rate || 0)
const grossSalary = computed(() => props.tableData?.gross_pay || 0)

// Check if field staff to determine if late deduction should be shown
const showLateDeduction = computed(() => !props.employeeData?.is_field_staff)

// Check if employee is field staff
const isFieldStaff = computed(() => props.employeeData?.is_field_staff || false)

// Effective work days (present days based on attendance)
const effectiveWorkDays = computed(() => presentDays?.value || 0)

// Total hours worked for field staff (calculated from regularWorkTotal and hourly rate)
const totalHoursWorked = computed(() => {
  if (props.employeeData?.is_field_staff && employeeDailyRate.value > 0) {
    const hourlyRate = employeeDailyRate.value / 8
    return regularWorkTotal.value / hourlyRate
  }
  return 0
})

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
  isFieldStaff,
)

//debuging porpuses
// const earningsBreakdown = useEarningsBreakdown(
//   regularWorkTotal,
//   computed(() => tripsStore.trips),
//   holidays,
//   dailyRate,
//   employeeDailyRate,
//   overallOvertime,
//   codaAllowance,
// )

// const netSalaryCalculation = useNetSalaryCalculation(
//   overallEarningsTotal,
//   showLateDeduction,
//   lateDeduction,
//   employeeDeductions,
// )

// Additional computed values para better display sa useOverallEarningsTotal results
const displayTotalEarnings = computed(() => {
  // Ensure na ma-trigger ang useOverallEarningsTotal computation
  return overallEarningsTotal.value || 0
})

// const displayEarningsBreakdown = computed(() => {
//   // Display breakdown gikan sa earningsBreakdown composable
//   return earningsBreakdown.value
// })

// const displayNetSalary = computed(() => {
//   // Display net salary calculation results
//   return netSalaryCalculation.value
// })

// Use imported safeCurrencyFormat from helpers.ts

// Alias to avoid naming conflict with imported function
// const safeCurrencyFormatRaw = safeCurrencyFormat

// Function to recalculate total earnings - trigger useOverallEarningsTotal calculation
function recalculateEarnings() {
  // This triggers the computed value recalculation para sa useOverallEarningsTotal
  reactiveTotalEarnings.value = overallEarningsTotal.value

  // Log para makita kung na-trigger ang calculation
  /* console.log('[PayrollPrint] Overall earnings recalculated:', overallEarningsTotal.value) */
}

// Function to initialize and trigger useOverallEarningsTotal on mount
async function initializePayrollCalculations() {
  try {
    // console.log('[PayrollPrint] Starting payroll calculations initialization...')

    // Reset loading states
    isTripsLoading.value = true
    isHolidaysLoading.value = true

    // Reset data arrays para fresh start
    holidays.value = []
    overallOvertime.value = 0
    employeeDeductions.value = []
    employeeNonDeductions.value = []

    // Load employee deductions first
    if (props.employeeData?.id) {
      await updateEmployeeDeductions(props.employeeData.id)
    }

    // Load all required data simultaneously
    await Promise.all([loadTrips(), fetchEmployeeHolidays(), updateOverallOvertime()])

    // Force trigger ang useOverallEarningsTotal computation after all data is loaded
    recalculateEarnings()

    console.log('[PayrollPrint] Payroll calculations initialized successfully')
    console.log('[PayrollPrint] Final totals:', {
      isFieldStaff: isFieldStaff.value,
      regularWork: regularWorkTotal.value,
      totalHoursWorked: isFieldStaff.value ? totalHoursWorked.value : 'N/A (Office Staff)',
      trips: tripsStore.trips?.length || 0,
      holidays: holidays.value?.length || 0,
      overtime: overallOvertime.value,
      totalEarnings: overallEarningsTotal.value
    })
  } catch (error) {
    console.error('[PayrollPrint] Error initializing payroll calculations:', error)
    // Reset loading states on error
    isTripsLoading.value = false
    isHolidaysLoading.value = false
  }
}

// Comprehensive reload function para sa lahat ng functions
async function reloadAllFunctions() {
  try {
    // console.log('[PayrollPrint] Reloading all payroll functions - comprehensive reload...')

    // Clear all existing data
    tripsStore.trips = []
    holidays.value = []
    overallOvertime.value = 0
    employeeDeductions.value = []
    employeeNonDeductions.value = []
    reactiveTotalEarnings.value = 0

    // Reset loading states
    isTripsLoading.value = true
    isHolidaysLoading.value = true

    // Re-initialize everything from scratch
    await initializePayrollCalculations()

    // console.log('[PayrollPrint] All functions reloaded successfully')
  } catch (error) {
    console.error('[PayrollPrint] Error during comprehensive reload:', error)
  }
}

// Holiday fetching function
async function fetchEmployeeHolidays() {
  if (!props.employeeData?.id) {
    holidays.value = []
    isHolidaysLoading.value = false
    return
  }

  try {
    //  console.log('[PayrollPrint] Fetching holidays for employee:', props.employeeData.id)
    holidays.value = await fetchHolidaysByDateString(
      holidayDateString.value,
      String(props.employeeData.id),
    )
    //  console.log('[PayrollPrint] Holidays fetched:', holidays.value?.length || 0)
  } catch (error) {
    console.error('Error fetching holidays:', error)
    holidays.value = []
  } finally {
    isHolidaysLoading.value = false
  }
}

// Trip loading function
async function loadTrips() {
  if (!props.employeeData?.id) {
    isTripsLoading.value = false
    return
  }

  //console.log('[PayrollPrint] Loading trips for employee:', props.employeeData.id, 'with date:', filterDateString.value)
  isTripsLoading.value = true

  try {
    const fetchedTrips = await fetchFilteredTrips(filterDateString.value, props.employeeData.id)
    tripsStore.trips = fetchedTrips
   // console.log('[PayrollPrint] Trips loaded:', tripsStore.trips?.length || 0, 'trips:', fetchedTrips)
  } catch (error) {
    console.error('[PayrollPrint] Error loading trips:', error)
    tripsStore.trips = []
  } finally {
    isTripsLoading.value = false
  }
}

// Overtime calculation function
async function updateOverallOvertime() {
  try {
    // console.log('[PayrollPrint] Calculating overtime for employee:', props.employeeData?.id)
    overallOvertime.value = await computeOverallOvertimeCalculation()
    // console.log('[PayrollPrint] Overtime calculated:', overallOvertime.value)
  } catch (error) {
    console.error('Error calculating overtime:', error)
    overallOvertime.value = 0
  }
}

// Enhanced mounted hook - properly trigger useOverallEarningsTotal
onMounted(async () => {
  // Call ang initialization function na mag-trigger sa useOverallEarningsTotal
  await initializePayrollCalculations()
})

// Watch for changes in all earning components - trigger useOverallEarningsTotal recalculation
watch(
  [
    regularWorkTotal,
    () => tripsStore.trips,
    holidays,
    overallOvertime,
    employeeDailyRate,
    dailyRate,
    codaAllowance,
    employeeNonDeductions, // Include non-deductions in watch para ma-trigger ang useOverallEarningsTotal
  ],
  () => {
    // Trigger ang useOverallEarningsTotal computation whenever may changes
    recalculateEarnings()
  },
  { deep: true, immediate: true },
)

// Enhanced watchers for better reactivity - re-trigger useOverallEarningsTotal calculations
watch(
  [
    () => props.employeeData?.id,
    () => filterDateString.value,
    () => props.payrollData?.month,
    () => props.payrollData?.year,
  ],
  async () => {
    // Re-initialize all calculations including useOverallEarningsTotal when key data changes
    await initializePayrollCalculations()
  },
  { deep: true },
)

// Individual watchers for specific data changes
watch([filterDateString, () => props.employeeData?.id], async () => {
  await loadTrips()
})

watch([holidayDateString, () => props.employeeData?.id], () => {
  fetchEmployeeHolidays()
})

// Additional watcher para monitor ang useOverallEarningsTotal changes
// watch(
//   () => overallEarningsTotal.value,
//   (newTotal, oldTotal) => {
//     console.log('[PayrollPrint] useOverallEarningsTotal updated:', { oldTotal, newTotal })
//     // Update ang reactive total earnings
//     reactiveTotalEarnings.value = newTotal
//   },
//   { immediate: true },
// )

// // Debug logging (uncomment for debugging)
console.log('[PayrollPrint] filterDateString:', filterDateString.value, '| employeeId:', props.employeeData?.id, '| trips:', tripsStore.trips)
//console.log('[PayrollPrint] Overall Earnings Total (useOverallEarningsTotal):', overallEarningsTotal.value)
// console.log('[PayrollPrint] Earnings Breakdown:', earningsBreakdown.value)
// console.log('[PayrollPrint] Net Salary Calculation:', netSalaryCalculation.value)
</script>

<template>
  <v-container fluid class="pa-4 payroll-main-content">
    <!-- Header Section -->
    <v-row dense no-gutters>
      <v-col cols="12" sm="9" class="d-flex justify-center align-center">
        <v-img src="/image-header-title.png"></v-img>
      </v-col>
      <v-col cols="12" sm="3" class="d-flex justify-center align-center">
        <h1 class="text-h5 font-weight-black text-primary">PAY SLIP</h1>
      </v-col>
    </v-row>

    <!-- Employee Information Table -->
    <v-table class="mt-6 text-body-2" density="compact">
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

    <!-- Payroll Details Table -->
    <v-table class="mt-3 text-body-2 border" density="compact">
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
              @ {{ safeCurrencyFormat((employeeDailyRate ?? 0) / 8, formatCurrency) }}/hr
            </span>
            <span v-else>
              @ {{ safeCurrencyFormat(employeeDailyRate ?? 0, formatCurrency) }}
            </span>
          </td>
          <td class="pa-2">
            <span v-if="props.employeeData?.is_field_staff">
              {{ totalHoursWorked.toFixed(2) }} hours
            </span>
            <span v-else>
              x {{ effectiveWorkDays }}
            </span>
          </td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="regular">
            {{ safeCurrencyFormat(regularWorkTotal, formatCurrency) }}
          </td>
        </tr>

        <!-- Unified Loading State for Trips and Holidays -->
        <tr v-if="isTripsLoading || isHolidaysLoading">
          <td class="text-center pa-2" colspan="5">
            <v-progress-circular indeterminate color="primary" size="32" class="mx-auto mb-2" />
            Loading payroll data...
          </td>
        </tr>

        <!-- Show trips and holidays only when both are loaded -->
        <template v-else>
          <!-- Trips Rows -->
          <template v-if="tripsStore.trips && tripsStore.trips.length > 0">
            <tr v-for="trip in tripsStore.trips" :key="'trip-' + trip.id">
              <td class="pa-2">-</td>
              <td class="border-b-thin text-center pa-2">
                {{ trip.trip_location?.location || 'N/A' }} for {{ formatTripDate(trip.trip_at) }}
              </td>
              <td class="pa-2">@{{ safeCurrencyFormat(trip.per_trip ?? 0, formatCurrency) }}</td>
              <td class="pa-2">x {{ trip.trip_no ?? 1 }}</td>
              <td
                class="text-grey-darken-1 border-b-thin border-s-sm text-end pa-2 total-cell"
                data-total="trip"
              >
                {{ safeCurrencyFormat((trip.per_trip ?? 0) * (trip.trip_no ?? 1), formatCurrency) }}
              </td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">
                No trips to preview for this payroll period.
              </td>
            </tr>
          </template>

          <!-- Holidays Rows -->
          <template v-if="holidays.length > 0">
            <tr v-for="holiday in holidays" :key="'holiday-' + holiday.id">
              <td class="pa-2">-</td>
              <td class="border-b-thin text-center pa-2">
                {{ holiday.name }} ({{ getHolidayTypeName(holiday.type ?? undefined) }})
              </td>
              <td class="pa-2">
                <span v-if="holiday.type && holiday.type.toLowerCase().includes('rh')">
                  @ {{ safeCurrencyFormat(dailyRate ?? 0, formatCurrency) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('snh')">
                  @ {{ safeCurrencyFormat(dailyRate ?? 0, formatCurrency) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('swh')">
                  @ {{ safeCurrencyFormat(dailyRate ?? 0, formatCurrency) }}
                </span>
                <span v-else> @ {{ safeCurrencyFormat(dailyRate ?? 0, formatCurrency) }} </span>
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
                    ? safeCurrencyFormat(dailyRate * 2, formatCurrency)
                    : holiday.type && holiday.type.toLowerCase().includes('snh')
                      ? safeCurrencyFormat(dailyRate * 1.5, formatCurrency)
                      : holiday.type && holiday.type.toLowerCase().includes('swh')
                        ? safeCurrencyFormat(dailyRate * 1.3, formatCurrency)
                        : safeCurrencyFormat(dailyRate, formatCurrency)
                }}
              </td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">No holidays for this payroll period.</td>
            </tr>
          </template>
        </template>

        <!-- Overtime -->
        <tr>
          <td class="border-b-thin text-center pa-2" colspan="2">Overtime Work</td>
          <td class="pa-2"></td>
          <td class="pa-2">{{ safeCurrencyFormat(overallOvertime, formatCurrency) }} / hour</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overtime">
            <!-- overtime pay: daily rate / 8 * 1.25 * overtime hours -->
            {{
              safeCurrencyFormat((employeeDailyRate / 8) * 1.25 * overallOvertime, formatCurrency)
            }}
          </td>
        </tr>

        <!-- Non-deductions (benefits) before Monthly Trippings -->
        <template v-if="employeeNonDeductions.length > 0">
          <tr v-for="benefit in employeeNonDeductions" :key="'benefit-' + benefit.id">
            <td class="border-b-thin text-center pa-2" colspan="2">
              {{ benefit.benefit.benefit || 'Other Benefit' }}
            </td>
            <td class="pa-2"></td>
            <td class="pa-2">-</td>
            <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="benefit">
              {{ safeCurrencyFormat(benefit.amount ?? 0, formatCurrency) }}
            </td>
          </tr>
        </template>
        <!-- Monthly trippings -->
        <tr>
          <td class="border-b-thin text-center pa-2" colspan="2">Monthly Trippings</td>
          <td class="pa-2"></td>
          <td class="pa-2">
            {{
              safeCurrencyFormat(
                tripsStore.trips.reduce(
                  (sum: number, trip: { per_trip?: number; trip_no?: number }) =>
                    sum + (trip.per_trip ?? 0) * (trip.trip_no ?? 1),
                  0,
                ),
                formatCurrency,
              )
            }}/month
          </td>
          <td
            class="border-b-thin border-s-sm text-end pa-2 total-cell"
            data-total="monthly-trippings"
          >
            {{
              safeCurrencyFormat(
                tripsStore.trips.reduce(
                  (sum: number, trip: { per_trip?: number; trip_no?: number }) =>
                    sum + (trip.per_trip ?? 0) * (trip.trip_no ?? 1),
                  0,
                ),
                formatCurrency,
              )
            }}
          </td>
        </tr>

        <!-- Salary Calculation Rows -->
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold pa-2">Gross Salary</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overall">
            {{ safeCurrencyFormat(displayTotalEarnings, formatCurrency) }}
          </td>
        </tr>
        <PayrollDeductions
          :showLateDeduction="showLateDeduction"
          :monthLateDeduction="monthLateDeduction"
          :formatCurrency="formatCurrency"
          :employeeId="props.employeeData?.id"
          :employeeDeductions="employeeDeductions"
          :filterDateString="filterDateString"
          :overallEarningsTotal="overallEarningsTotal"
          :lateDeduction="lateDeduction"
        />
      </tbody>
    </v-table>

    <!-- Signatures Section -->
    <v-row dense no-gutters>
      <v-col cols="12" sm="3" class="d-flex justify-center align-center">
        <v-table class="mt-3 text-caption border" density="compact">
          <tbody>
            <tr>
              <td class="pa-2">Prepared by:</td>
              <td class="border-b-thin pa-2"></td>
              <td class="pa-2">Date:</td>
              <td class="border-b-thin pa-2"></td>
            </tr>
            <tr>
              <td class="pa-2">Approved by:</td>
              <td class="border-b-thin pa-2"></td>
              <td class="pa-2">Date:</td>
              <td class="border-b-thin pa-2"></td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col cols="12" sm="9" class="d-flex justify-center align-center"></v-col>
    </v-row>

    <!-- Mini Payroll Print Section - Hidden by default, only visible during printing -->
    <div id="mini-payroll-section" class="mini-payroll-hidden">
      <MiniPayrollPrint
        :employeeData="employeeData"
        :payrollData="payrollData"
        :tableData="tableData"
      />
    </div>
  </v-container>
</template>

<style scoped>
/* Hide mini payroll section by default */
.mini-payroll-hidden {
  display: none;
}
</style>
