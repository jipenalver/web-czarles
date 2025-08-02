<script setup lang="ts">
import {
  useOverallEarningsTotal,
  useEarningsBreakdown,
  useNetSalaryCalculation,
} from './overallTotal'
import {
  safeCurrencyFormat,
  getHolidayTypeName,
  formatTripDate,
  getMonthDateRange,
} from './helpers'
import { fetchHolidaysByDateString, type Holiday } from '@/stores/holidays'
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrint, usePayrollFilters } from './usePayrollPrint'
// import logoCzarles from '@/assets/logos/logo-czarles.png'
import PayrollDeductions from './PayrollDeductions.vue'
import { useEmployeesStore } from '@/stores/employees'
import { fetchEmployeeDeductions } from './benefits'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'
// Props
const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

// Pinia store for employees
const employeesStore = useEmployeesStore()
const employeeDeductions = ref<any[]>([])
const employeeNonDeductions = ref<any[]>([])

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

const { fetchFilteredTrips } = usePayrollFilters(filterDateString.value, props.employeeData?.id)

// Destructure values from payrollPrint composable
const {
  workDays,
  codaAllowance,
  totalGrossSalary,
  totalDeductions,
  netSalary,
  formatCurrency,
  employeeDailyRate,
  regularWorkTotal,
  absentDays,
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

//debuging porpuses
const earningsBreakdown = useEarningsBreakdown(
  regularWorkTotal,
  computed(() => tripsStore.trips),
  holidays,
  dailyRate,
  employeeDailyRate,
  overallOvertime,
  codaAllowance,
)

const netSalaryCalculation = useNetSalaryCalculation(
  overallEarningsTotal,
  showLateDeduction,
  lateDeduction,
  employeeDeductions,
)

// Computed values for mini payroll display
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

const projectSiteAllowances = computed(() => {
  return tripsStore.trips?.filter(trip => trip.trip_location?.location?.includes('Project Site')) || []
})

const sundayWorkTrips = computed(() => {
  return tripsStore.trips?.filter(trip => {
    const tripDate = new Date(trip.date)
    return tripDate.getDay() === 0 // Sunday
  }) || []
})

const regularHolidays = computed(() => {
  return holidays.value?.filter(holiday => holiday.type === 'regular') || []
})

const specialHolidays = computed(() => {
  return holidays.value?.filter(holiday => holiday.type === 'special') || []
})

// Total deductions calculation
const totalDeductionsAmount = computed(() => {
  let total = 0
  
  // Late deduction if applicable
  if (showLateDeduction.value) {
    total += lateDeduction.value || 0
  }
  
  // Employee deductions
  employeeDeductions.value.forEach(deduction => {
    total += deduction.amount || 0
  })
  
  return total
})

// Net pay calculation
const netPay = computed(() => {
  return overallEarningsTotal.value - totalDeductionsAmount.value
})

// Use imported safeCurrencyFormat from helpers.ts

// Alias to avoid naming conflict with imported function
const safeCurrencyFormatRaw = safeCurrencyFormat

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

// Debug logging (uncomment for debugging)
console.log('[PayrollPrint] filterDateString:', filterDateString.value, '| employeeId:', props.employeeData?.id, '| trips:', tripsStore.trips)
// console.log('[PayrollPrint] Earnings Breakdown:', earningsBreakdown.value)
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
            Days Regular Work for <span class="font-weight-bold">{{ monthDateRange }}</span>
        
          </td>
          <td class="pa-2">@ {{ safeCurrencyFormat(employeeDailyRate ?? 0, formatCurrency) }}</td>
          <td class="pa-2">x {{ effectiveWorkDays }}</td>
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
                {{ trip.trip_location?.location || 'N/A' }} for {{ formatTripDate(trip.date) }}
              </td>
              <td class="pa-2">@{{ safeCurrencyFormat(trip.per_trip ?? 0, formatCurrency) }}</td>
              <td class="pa-2">x {{ trip.trip_no ?? 1 }}</td>
              <td class="text-grey-darken-1 border-b-thin border-s-sm text-end pa-2 total-cell" data-total="trip">
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
              {{ benefit.employee_benefit?.benefit || 'Other Benefit' }}
            </td>
            <td class="pa-2"></td>
            <td class="pa-2">
              -
            </td>
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
                  (sum, trip) => sum + (trip.per_trip ?? 0) * (trip.trip_no ?? 1),
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
                  (sum, trip) => sum + (trip.per_trip ?? 0) * (trip.trip_no ?? 1),
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
           ₱{{ safeCurrencyFormat(overallEarningsTotal, formatCurrency) }}
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
      <v-container fluid class="pa-4" style="max-width: 400px;">
        <!-- Header -->
        <v-card class="border pa-3 mb-3">
          <v-card-title class="text-center text-h6 font-weight-bold pa-2">
            PAYSLIP
          </v-card-title>
          
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
            <v-row dense class="mb-1" v-for="(trip, index) in projectSiteAllowances" :key="'mini-trip-' + trip.id">
              <v-col cols="6" class="text-caption pa-1">Project Site Allowance</v-col>
              <v-col cols="3" class="text-body-2 text-center pa-1">
                {{ trip.trip_no || 1 }}
              </v-col>
              <v-col cols="3" class="text-body-2 text-end pa-1">
                {{ safeCurrencyFormat((trip.per_trip ?? 0) * (trip.trip_no ?? 1), formatCurrency) }}
              </v-col>
            </v-row>
          </template>
          
          <!-- Sunday Work Rate -->
          <template v-if="sundayWorkTrips.length > 0">
            <v-row dense class="mb-1" v-for="(trip, index) in sundayWorkTrips" :key="'mini-sunday-' + trip.id">
              <v-col cols="6" class="text-caption pa-1">Sunday Work Rate</v-col>
              <v-col cols="3" class="text-body-2 text-center pa-1">
                {{ trip.trip_no || 1 }}
              </v-col>
              <v-col cols="3" class="text-body-2 text-end pa-1">
                {{ safeCurrencyFormat((trip.per_trip ?? 0) * (trip.trip_no ?? 1) * 1.3, formatCurrency) }}
              </v-col>
            </v-row>
          </template>
          <template v-else>
            <v-row dense class="mb-1">
              <v-col cols="6" class="text-caption pa-1">Sunday Work Rate</v-col>
              <v-col cols="3" class="pa-1"></v-col>
              <v-col cols="3" class="text-body-2 text-end pa-1">-</v-col>
            </v-row>
          </template>
          
          <!-- Holiday Work (Special) -->
          <template v-if="specialHolidays.length > 0">
            <v-row dense class="mb-1" v-for="(holiday, index) in specialHolidays" :key="'mini-special-' + holiday.id">
              <v-col cols="6" class="text-caption pa-1">Holiday Work (Special)</v-col>
              <v-col cols="3" class="text-body-2 text-center pa-1">1</v-col>
              <v-col cols="3" class="text-body-2 text-end pa-1">
                {{ safeCurrencyFormat(employeeDailyRate * 1.3, formatCurrency) }}
              </v-col>
            </v-row>
          </template>
          <template v-else>
            <v-row dense class="mb-1">
              <v-col cols="6" class="text-caption pa-1">Holiday Work (Special)</v-col>
              <v-col cols="3" class="pa-1"></v-col>
              <v-col cols="3" class="text-body-2 text-end pa-1">-</v-col>
            </v-row>
          </template>
          
          <!-- Holiday Work (Regular) -->
          <v-row dense class="mb-1">
            <v-col cols="6" class="text-caption pa-1">Holiday Work (Regular)</v-col>
            <v-col cols="3" class="pa-1"></v-col>
            <v-col cols="3" class="text-body-2 text-end pa-1">
              <template v-if="regularHolidays.length > 0">
                {{ safeCurrencyFormat((employeeDailyRate * regularHolidays.length * 2), formatCurrency) }}
              </template>
              <template v-else>-</template>
            </v-col>
          </v-row>
          
          <!-- Overtime Work -->
          <v-row dense class="mb-1">
            <v-col cols="6" class="text-caption pa-1">Overtime Work</v-col>
            <v-col cols="3" class="pa-1"></v-col>
            <v-col cols="3" class="text-body-2 text-end pa-1">
              <template v-if="overallOvertime > 0">
                {{ safeCurrencyFormat((employeeDailyRate / 8) * 1.25 * overallOvertime, formatCurrency) }}
              </template>
              <template v-else>-</template>
            </v-col>
          </v-row>
          
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
              LESS : DEDUCTION
            </v-col>
          </v-row>
          
          <!-- SSS -->
          <v-row dense class="mb-1">
            <v-col cols="3" class="text-caption pa-1">SSS</v-col>
            <v-col cols="4" class="text-caption pa-1">DEC&JAN 405+450</v-col>
            <v-col cols="5" class="text-body-2 text-end pa-1">
              {{ 
                employeeDeductions.find(d => d.benefit?.benefit_name?.toLowerCase().includes('sss'))?.amount 
                ? safeCurrencyFormat(employeeDeductions.find(d => d.benefit?.benefit_name?.toLowerCase().includes('sss')).amount, formatCurrency)
                : '500.00'
              }}
            </v-col>
          </v-row>
          
          <!-- PHIC -->
          <v-row dense class="mb-1">
            <v-col cols="3" class="text-caption pa-1">PHIC</v-col>
            <v-col cols="4" class="text-caption pa-1">DEC&JAN 250+250</v-col>
            <v-col cols="5" class="text-body-2 text-end pa-1">
              {{ 
                employeeDeductions.find(d => d.benefit?.benefit_name?.toLowerCase().includes('phic') || d.benefit?.benefit_name?.toLowerCase().includes('philhealth'))?.amount 
                ? safeCurrencyFormat(employeeDeductions.find(d => d.benefit?.benefit_name?.toLowerCase().includes('phic') || d.benefit?.benefit_name?.toLowerCase().includes('philhealth')).amount, formatCurrency)
                : '250.00'
              }}
            </v-col>
          </v-row>
          
          <!-- HDMF -->
          <v-row dense class="mb-1">
            <v-col cols="3" class="text-caption pa-1">HDMF</v-col>
            <v-col cols="4" class="pa-1"></v-col>
            <v-col cols="5" class="text-body-2 text-end pa-1">-</v-col>
          </v-row>
          
          <!-- SSS LOAN -->
          <v-row dense class="mb-1">
            <v-col cols="6" class="text-caption pa-1">SSS LOAN (24 MOS) 1 OF 24</v-col>
            <v-col cols="6" class="text-body-2 text-end pa-1">-</v-col>
          </v-row>
          
          <!-- HDMF LOAN -->
          <v-row dense class="mb-1">
            <v-col cols="6" class="text-caption pa-1">HDMF LOAN (24 MOS) 1 OF 24</v-col>
            <v-col cols="6" class="text-body-2 text-end pa-1">-</v-col>
          </v-row>
          
          <!-- Cash Advance -->
          <v-row dense class="mb-1">
            <v-col cols="6" class="text-caption pa-1">Cash Advance</v-col>
            <v-col cols="6" class="text-body-2 text-end pa-1">
              {{ 
                employeeDeductions.find(d => d.benefit?.benefit_name?.toLowerCase().includes('cash advance'))?.amount 
                ? safeCurrencyFormat(employeeDeductions.find(d => d.benefit?.benefit_name?.toLowerCase().includes('cash advance')).amount, formatCurrency)
                : '3,000.00'
              }}
            </v-col>
          </v-row>
          
          <!-- Salary deposit -->
          <v-row dense class="mb-1">
            <v-col cols="6" class="text-caption pa-1">Salary deposit</v-col>
            <v-col cols="6" class="text-body-2 text-end pa-1"></v-col>
          </v-row>
          
          <!-- Others -->
          <v-row dense class="mb-2">
            <v-col cols="6" class="text-caption pa-1">Others <span class="text-body-2">Cedula</span></v-col>
            <v-col cols="6" class="text-body-2 text-end pa-1">
              <span class="text-decoration-line-through">213</span>
            </v-col>
          </v-row>
          
          <!-- Total Deduction -->
          <v-row dense class="mb-2">
            <v-col cols="6" class="text-caption font-weight-bold pa-1">Total Deduction</v-col>
            <v-col cols="3" class="text-caption pa-1">Php</v-col>
            <v-col cols="3" class="text-body-2 text-end font-weight-bold border-b-sm pa-1">
              {{ safeCurrencyFormat(totalDeductionsAmount, formatCurrency) }}
            </v-col>
          </v-row>
          
          <!-- Net Pay -->
          <v-row dense>
            <v-col cols="6" class="text-h6 font-weight-bold pa-1">NET PAY</v-col>
            <v-col cols="6" class="text-h6 text-end font-weight-bold pa-1">
              {{ safeCurrencyFormat(netPay, formatCurrency) }}
            </v-col>
          </v-row>
        </v-card>
      </v-container>
    </div>
  </v-container>
</template>

<style scoped>
/* Hide mini payroll section by default */
.mini-payroll-hidden {
  display: none;
}

@media print {
  /* Reset and ensure content is visible */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Make the main payroll content bigger */
  .v-container {
    max-width: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    transform: scale(1.2) !important;
    transform-origin: top left;
  }
  
  /* Show mini payroll section during printing */
  .mini-payroll-hidden {
    display: block !important;
    margin-top: -100px; /* Bring it closer to main content */
  }
  
  /* Rotate mini payroll section 90 degrees and make it bigger */
  #mini-payroll-section {
    transform: rotate(90deg) scale(0.8) !important;
    transform-origin: top left;
    position: absolute;
    top: 150px;
    left: 450px;
    width: 600px;
    height: 400px;
  }
  
  /* Ensure page content fits */
  body {
    margin: 0 !important;
    padding: 0 !important;
  }
  
  /* Make content appropriately sized for bigger scale */
  .v-table {
    font-size: 1em !important;
  }
  
  .v-table td {
    padding: 3px 6px !important;
  }
  
  .text-body-2 {
    font-size: 0.95em !important;
  }
  
  .text-caption {
    font-size: 0.85em !important;
  }
  
  .text-h5 {
    font-size: 1.3em !important;
  }
  
  .text-h6 {
    font-size: 1.1em !important;
  }
  
  .mt-6 {
    margin-top: 12px !important;
  }
  
  .mt-3 {
    margin-top: 8px !important;
  }
  
  .pa-2 {
    padding: 4px !important;
  }
  
  .pa-4 {
    padding: 8px !important;
  }
  
  .pa-3 {
    padding: 6px !important;
  }
  
  .pa-1 {
    padding: 3px !important;
  }
  
  .mb-2 {
    margin-bottom: 6px !important;
  }
  
  .mb-3 {
    margin-bottom: 8px !important;
  }
}

.border-b-sm {
  border-bottom: 1px solid #000;
}
</style>
