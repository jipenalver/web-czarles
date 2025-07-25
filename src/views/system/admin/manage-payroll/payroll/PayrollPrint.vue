<script setup lang="ts">

import { fetchHolidaysByDateString, type Holiday } from '@/stores/holidays'
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrint, usePayrollFilters } from './payrollPrint'
import logoCzarles from '@/assets/logos/logo-czarles.png'
import { formatTripDate } from '@/utils/helpers/others'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'




// Props
const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

// Constants
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Reactive references
const isTripsLoading = ref(false)
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

// Composables
const payrollPrint = usePayrollPrint(
  {
    employeeData: props.employeeData,
    payrollData: props.payrollData,
    tableData: props.tableData
  },
  dailyRate,
  grossSalary
)

const holidays = ref<Holiday[]>([])
const isHolidaysLoading = ref(false)

async function fetchEmployeeHolidays() {
  if (!props.employeeData?.id) {
    holidays.value = []
    return
  }
  isHolidaysLoading.value = true
  holidays.value = await fetchHolidaysByDateString(holidayDateString.value, String(props.employeeData.id))
  isHolidaysLoading.value = false
}
const { fetchFilteredTrips } = usePayrollFilters(filterDateString.value, props.employeeData?.id)

// Destructure values from payrollPrint composable
const {
  workDays,
  codaAllowance,
  totalGrossSalary,
  totalDeductions,
  netSalary,
  formatCurrency
} = payrollPrint

// Methods
function loadTrips() {
  isTripsLoading.value = true
  Promise.resolve(fetchFilteredTrips()).finally(() => {
    isTripsLoading.value = false
  })
}

// Lifecycle hooks
onMounted(() => {
  loadTrips()
  fetchEmployeeHolidays()
})

// Watchers
watch([filterDateString, () => props.employeeData?.id], () => {
  loadTrips()
})

watch([holidayDateString, () => props.employeeData?.id], () => {
  fetchEmployeeHolidays()
})

// Debug logging
console.log('[PayrollPrint] filterDateString:', filterDateString.value, '| employeeId:', props.employeeData?.id, '| trips:', tripsStore.trips)
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
          <td class="text-caption pa-2" style="width: auto;">PAID TO</td>
          <td class="pa-2 border-b-sm" style="width: 66%;">{{ fullName }}</td>
          <td class="text-caption pa-2" style="width: auto;">POSITION</td>
          <td class="pa-2 border-b-sm" style="width: 25%;">{{ designation }}</td>
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
        
        <!-- Loading State -->

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
          <template v-if="tripsStore.trips.length > 0">
            <tr v-for="trip in tripsStore.trips" :key="'trip-' + trip.id">
              <td class="pa-2">-</td>
              <td class="border-b-thin text-center pa-2">
                {{ trip.trip_location?.location || 'N/A' }} for {{ formatTripDate(trip.date) }}
              </td>
              <td class="pa-2">@ 450 /per Trip</td>
              <td class="pa-2"></td>
              <td class="border-b-thin border-s-sm text-end pa-2">-</td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">
                <v-img
                  :src="logoCzarles"
                  alt="No trips"
                  max-width="300"
                  class="mx-auto mb-2"
                />
                No trips to preview for this payroll period.
              </td>
            </tr>
          </template>

          <!-- Holidays Rows -->
          <template v-if="holidays.length > 0">
            <tr v-for="holiday in holidays" :key="'holiday-' + holiday.id">
              <td class="pa-2">-</td>
              <td class="border-b-thin text-center pa-2">
                {{ holiday.name }} ({{ holiday.type}})
              </td>
              <td class="pa-2">@</td>
              <td class="pa-2"></td>
              <td class="border-b-thin border-s-sm text-end pa-2">-</td>
            </tr>
          </template>
          <template v-else>
            <tr>
              <td class="text-center pa-2" colspan="5">
                No holidays for this payroll period.
              </td>
            </tr>
          </template>
        </template>

        <!-- Salary Calculation Rows -->
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold pa-2">Gross Salary</td>
          <td class="text-caption font-weight-bold text-end pa-2">Php</td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(totalGrossSalary) }}</td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption pa-2">Less Deductions</td>
          <td class="pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(totalDeductions) }}</td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold border-t-sm border-s-sm pa-2">TOTAL NET SALARY</td>
          <td class="border-t-sm pa-2">Php</td>
          <td class="border-t-sm border-s-sm text-end pa-2">{{ formatCurrency(netSalary) }}</td>
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