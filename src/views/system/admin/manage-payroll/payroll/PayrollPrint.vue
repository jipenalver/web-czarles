<script setup lang="ts">
import { fetchHolidaysByDateString, type Holiday } from '@/stores/holidays'
import { formatTripDate, getMonthDateRange } from '@/utils/helpers/others'
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrint, usePayrollFilters } from './usePayrollPrint'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'

// Props
const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

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
  lateDeduction,
  monthLateDeduction,
  computeOverallOvertimeCalculation,
} = payrollPrint

// Improved overall earnings total computation
const overallEarningsTotal = computed(() => {
  let total = 0

  // 1. Regular work earnings - use actual calculated value
  const regularWork = Number(regularWorkTotal.value) || 0
  total += regularWork

  // 2. Trips earnings - ensure safe access and proper calculation
  const tripsEarnings = tripsStore.trips?.reduce((sum, trip) => {
    return sum + (Number(trip.per_trip) || 0)
  }, 0) || 0
  total += tripsEarnings

  // 3. Holiday earnings - improved calculation with proper type checking
  const holidayEarnings = holidays.value?.reduce((sum, holiday) => {
    const baseRate = Number(dailyRate.value) || 0
    const type = holiday.type?.toLowerCase() || ''
    
    let multiplier = 1 // default multiplier
    if (type.includes('rh')) {
      multiplier = 2.0 // Regular Holiday 200%
    } else if (type.includes('snh')) {
      multiplier = 1.5 // Special Non-working Holiday 150%
    } else if (type.includes('swh')) {
      multiplier = 1.3 // Special Working Holiday 130%
    }
    
    return sum + (baseRate * multiplier)
  }, 0) || 0
  total += holidayEarnings

  // 4. Overtime earnings - use proper rate calculation
  const overtimeRate = (Number(employeeDailyRate.value) || 0) / 8 * 1.25
  const overtimeEarnings = overtimeRate * (Number(overallOvertime.value) || 0)
  total += overtimeEarnings

  // 5. Monthly trippings - currently 0 as per your template, but ready for future use
  const monthlyTrippings = 0 // Add logic here when needed
  total += monthlyTrippings

  // 6. Any additional allowances (CODA, etc.)
  const allowances = Number(codaAllowance.value) || 0
  total += allowances

  return total
})

// Enhanced debugging computed to track individual components
const earningsBreakdown = computed(() => {
  const regular = Number(regularWorkTotal.value) || 0
  const trips = tripsStore.trips?.reduce((sum, trip) => sum + (Number(trip.per_trip) || 0), 0) || 0
  const holidayTotal = holidays.value?.reduce((sum, holiday) => {
    const baseRate = Number(dailyRate.value) || 0
    const type = holiday.type?.toLowerCase() || ''
    let multiplier = 1
    if (type.includes('rh')) multiplier = 2.0
    else if (type.includes('snh')) multiplier = 1.5
    else if (type.includes('swh')) multiplier = 1.3
    return sum + (baseRate * multiplier)
  }, 0) || 0
  const overtime = ((Number(employeeDailyRate.value) || 0) / 8) * 1.25 * (Number(overallOvertime.value) || 0)
  const allowances = Number(codaAllowance.value) || 0

  return {
    regular,
    trips,
    holidays: holidayTotal,
    overtime,
    allowances,
    total: regular + trips + holidayTotal + overtime + allowances
  }
})

// Net salary calculation (total earnings minus deductions)
const netSalaryCalculation = computed(() => {
  const totalEarnings = overallEarningsTotal.value
  
  // Calculate actual deductions (currently all showing as 0 in template)
  const deductions = {
    late: showLateDeduction.value ? (Number(lateDeduction.value) || 0) : 0,
    sss: 0, // Add actual SSS calculation when available
    phic: 0, // Add actual PHIC calculation when available  
    hdmf: 0, // Add actual HDMF calculation when available
    cashAdvance: 0, // Add actual cash advance when available
    others: 0 // Add other deductions when available
  }
  
  const totalDeductionsAmount = Object.values(deductions).reduce((sum, amount) => sum + amount, 0)
  
  return {
    grossSalary: totalEarnings,
    deductions,
    totalDeductions: totalDeductionsAmount,
    netSalary: totalEarnings - totalDeductionsAmount
  }
})

// Utility function for safe currency formatting
function safeCurrencyFormat(amount: number | string | null | undefined): string {
  const numAmount = Number(amount) || 0
  return formatCurrency(numAmount)
}

// Function to recalculate total earnings
function recalculateEarnings() {
  reactiveTotalEarnings.value = overallEarningsTotal.value
}

// Extractor for holiday type code to full name
function getHolidayTypeName(type: string | undefined): string {
  if (!type) return ''
  switch (type) {
    case 'RH':
      return 'Regular Holiday'
    case 'SNH':
      return 'Special (Non-working) Holiday'
    case 'SWH':
      return 'Special (Working) Holiday'
    case 'SR':
      return 'Sunday Rate'
    default:
      return type
  }
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
  await Promise.all([
    loadTrips(),
    fetchEmployeeHolidays(),
    updateOverallOvertime()
  ])
  recalculateEarnings()
})

// Watch for changes in all earning components
watch([
  regularWorkTotal,
  () => tripsStore.trips,
  holidays,
  overallOvertime,
  employeeDailyRate,
  dailyRate,
  codaAllowance
], () => {
  recalculateEarnings()
}, { deep: true, immediate: true })

// Enhanced watchers for better reactivity
watch(
  [
    () => props.employeeData?.id,
    () => filterDateString.value,
    () => props.payrollData?.month,
    () => props.payrollData?.year,
  ],
  async () => {
    await Promise.all([
      updateOverallOvertime(),
      loadTrips(),
      fetchEmployeeHolidays()
    ])
    recalculateEarnings()
  },
  { deep: true }
)

// Individual watchers for specific data changes
watch([filterDateString, () => props.employeeData?.id], () => {
  loadTrips()
})

watch([holidayDateString, () => props.employeeData?.id], () => {
  fetchEmployeeHolidays()
})

// Debug logging (uncomment for debugging)
// console.log('[PayrollPrint] filterDateString:', filterDateString.value, '| employeeId:', props.employeeData?.id, '| trips:', tripsStore.trips)
// console.log('[PayrollPrint] Earnings Breakdown:', earningsBreakdown.value)
</script>

<template>
  <v-container fluid class="pa-4">
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
          <td class="pa-2">@ {{ safeCurrencyFormat(employeeDailyRate ?? 0) }}</td>
          <td class="pa-2">x {{ workDays }}</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="regular">
            {{ safeCurrencyFormat(regularWorkTotal) }}
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
              <td class="pa-2">@{{ safeCurrencyFormat(trip.per_trip ?? 0) }}</td>
              <td class="pa-2"></td>
              <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="trip">
                {{ safeCurrencyFormat(trip.per_trip ?? 0) }}
              </td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">
                <v-img :src="logoCzarles" alt="No trips" max-width="300" class="mx-auto mb-2" />
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
                  @ {{ safeCurrencyFormat(dailyRate ?? 0) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('snh')">
                  @ {{ safeCurrencyFormat(dailyRate ?? 0) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('swh')">
                  @ {{ safeCurrencyFormat(dailyRate ?? 0) }}
                </span>
                <span v-else> @ {{ safeCurrencyFormat(dailyRate ?? 0) }} </span>
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
                    ? safeCurrencyFormat(dailyRate * 2)
                    : holiday.type && holiday.type.toLowerCase().includes('snh')
                      ? safeCurrencyFormat(dailyRate * 1.5)
                      : holiday.type && holiday.type.toLowerCase().includes('swh')
                        ? safeCurrencyFormat(dailyRate * 1.3)
                        : safeCurrencyFormat(dailyRate)
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
          <td class="pa-2">@</td>
          <td class="text-caption text-end pa-2">{{ safeCurrencyFormat(overallOvertime) }} / hour</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overtime">
            <!-- overtime pay: daily rate / 8 * 1.25 * overtime hours -->
            {{ safeCurrencyFormat((employeeDailyRate / 8) * 1.25 * overallOvertime) }}
          </td>
        </tr>

        <!-- Monthly trippings -->
        <tr>
          <td class="border-b-thin text-center pa-2" colspan="2">Monthly Trippings</td>
          <td class="pa-2">@</td>
          <td class="text-caption font-weight-bold text-end pa-2">/month</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="monthly-trippings">
            {{ safeCurrencyFormat(0) }}
          </td>
        </tr>

        <!-- Salary Calculation Rows -->
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold pa-2">Gross Salary</td>
          <td class="text-caption font-weight-bold text-end pa-2">Php</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overall">
            {{ safeCurrencyFormat(overallEarningsTotal) }}
          </td>
        </tr>
        <tr v-if="showLateDeduction">
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption text-disabled pa-2">Late Deduction</td>
          <td class="text-caption font-weight-bold text-end pa-2">
            <!-- total late minutes for the month -->
            <span v-if="monthLateDeduction !== undefined && monthLateDeduction > 0">
              ({{ monthLateDeduction }} min.)
            </span>
          </td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.deductions.late) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption text-disabled pa-2">SSS</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.deductions.sss) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption text-disabled pa-2">PHIC</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.deductions.phic) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption text-disabled pa-2">HDMF</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.deductions.hdmf) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption text-disabled pa-2">Cash Advance</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.deductions.cashAdvance) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption text-disabled pa-2">Others</td>
          <td class="text-caption font-weight-bold text-end pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.deductions.others) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption pa-2">Less Deductions</td>
          <td class="pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.totalDeductions) }}
          </td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold border-t-sm border-s-sm pa-2">
            TOTAL NET SALARY
          </td>
          <td class="border-t-sm pa-2">Php</td>
          <td class="border-t-sm border-s-sm text-end pa-2">
            {{ safeCurrencyFormat(netSalaryCalculation.netSalary) }}
          </td>
        </tr>
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
  </v-container>
</template>

<style scoped>
@media print {
  .v-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
}
</style>