<script setup lang="ts">
import { useOverallEarningsTotal } from './overallTotal'
import { getHolidayTypeName, getMonthDateRange, hasBenefitAmount } from './helpers'
import { getMoneyText } from '@/utils/helpers/others'
import { type PayrollData } from './payrollTableDialog'
import { type TableData } from './payrollComputation'
import { usePayrollPrint } from './usePayrollPrint'
import { usePayrollData } from './usePayrollData'
import { useEmployeeDisplay, usePayrollFormatting, useHoursCalculation } from './composables/usePayrollDisplay'
import { usePayrollWatchers } from './composables/usePayrollWatchers'
import { getPayrollFromDate, getHolidayDateString, getMonthDateRangeFromStorage } from './composables/payrollStorage'
import PayrollDeductions from './PayrollDeductions.vue'
import MiniPayrollPrint from './MiniPayrollPrint.vue'
import PayrollPrintFooter from './PayrollPrintFooter.vue'
import AttendanceDaysTooltip from './AttendanceDaysTooltip.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { computed, watch, onMounted, ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { useTripsStore } from '@/stores/trips'

const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: TableData
}>()

const filterDateString = computed(() =>
  getPayrollFromDate(props.payrollData.year, props.payrollData.month)
)

const holidayDateString = computed(() =>
  getHolidayDateString(props.payrollData.year, props.payrollData.month)
)

// Create params para sa composable
const payrollDataParams = computed(() => {
  const params = {
    employeeId: props.employeeData?.id,
    filterDateString: filterDateString.value,
    holidayDateString: holidayDateString.value,
  }
  return params
})

// Use payroll data composable for all data fetching
const {
  holidays,
  overallOvertime,
  cashAdjustmentsAdditions,
  employeeDeductions,
  employeeNonDeductions,
  sundayDutyDays,
  sundayDutyAmount,

  isTripsLoading,
  isHolidaysLoading,
  isUtilizationsLoading,
  isAllowancesLoading,
  isCashAdjustmentsLoading,
  isDeductionsLoading,
  isOvertimeLoading,
  isSundayLoading,
  isCalculationsCompleting,
  isPayrollCalculating,
  monthlyTrippingsTotal,
  monthlyUtilizationsTotal,
  monthlyAllowancesTotal,
  monthlyCashAdjustmentsTotal,
  loadTrips,
  loadUtilizations,
  loadAllowances,
  loadCashAdjustments,
  loadSundayDuty,
  fetchEmployeeHolidays,
  updateEmployeeDeductions,
  initializePayrollCalculations: initializeDataCalculations,
  reloadAllFunctions: reloadAllData,
} = usePayrollData(payrollDataParams)

// Watch kuha sa employee deductions when employee changes
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
  const fallbackRange = getMonthDateRange(props.payrollData.year, props.payrollData.month)
  return getMonthDateRangeFromStorage(fallbackRange)
})

const reactiveTotalEarnings = ref(0)
const tripsStore = useTripsStore()

// Employee display composables
const { fullName, designation, address, dailyRate, isFieldStaff, isAdmin } = useEmployeeDisplay(
  computed(() => props.employeeData)
)
const { formattedDate, showLateDeduction } = usePayrollFormatting(isAdmin)

const grossSalary = computed(() => 0)

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
  lateDeduction,
  monthLateDeduction,
  monthUndertimeDeduction,
  undertimeDeduction,
  computeOverallOvertimeCalculation,
  netSalary,
  attendanceRecords,
} = payrollPrint

// Computed property to ensure holidays reactivity
const holidaysArray = computed(() => holidays.value || [])

// Function to calculate holiday amount based on type
const calculateHolidayAmount = (holiday: { type?: string | null; attendance_fraction?: number }) => {
  const rate = dailyRate.value || 0
  const fraction = holiday.attendance_fraction || 0

  if (!holiday.type) return 0

  const type = holiday.type.toLowerCase()

  if (type.includes('rh')) {
    return rate * 1.0 * fraction
  } else if (type.includes('snh')) {
    return rate * 0.3 * fraction
  } else if (type.includes('lh')) {
    return rate * 0.3 * fraction
  } else if (type.includes('ch')) {
    return rate * 0.0 * fraction
  } else if (type.includes('swh')) {
    return rate * 0.3 * fraction
  }

  return rate * 0.0 * fraction
}

// Hours calculation for field staff
const { totalHoursWorked } = useHoursCalculation(isFieldStaff, employeeDailyRate, regularWorkTotal)

// Monthly totals from composable are already available

const overallEarningsTotal = useOverallEarningsTotal(
  regularWorkTotal,
  computed(() => tripsStore.trips),
  holidaysArray,
  dailyRate,
  computed(() => employeeDailyRate.value),
  overallOvertime,
  codaAllowance,
  employeeNonDeductions,
  monthlyUtilizationsTotal,
  monthlyAllowancesTotal,
  monthlyCashAdjustmentsTotal,
  sundayDutyAmount,
)

const displayTotalEarnings = computed(() => {
  return overallEarningsTotal.value || 0
})

// Helper function to format Sunday duty text


// Recalculate earnings function
function recalculateEarnings() {
  reactiveTotalEarnings.value = overallEarningsTotal.value
}

// Wrapper function para sa full initialization including overtime and Sunday duty
async function initializePayrollCalculations() {
  try {
    // Call composable initialization with overtime callback
    await initializeDataCalculations(computeOverallOvertimeCalculation)

    // Load Sunday duty data - ensure dailyRate is available
    if (dailyRate.value > 0) {
      await loadSundayDuty(dailyRate.value)
    } else {
      // console.warn('[PayrollPrint] Skipping Sunday duty load - dailyRate not available:', dailyRate.value)
      // Reset Sunday values if rate not available
      sundayDutyDays.value = 0
      sundayDutyAmount.value = 0
    }

    recalculateEarnings()
  } catch (error) {
    console.error('[PayrollPrint] Error initializing payroll calculations:', error)
    // Don't rethrow - let component continue with partial data
  }
}

// Wrapper function para sa full reload including overtime and Sunday duty
async function reloadAllFunctions() {
  try {
    tripsStore.trips = []
    reactiveTotalEarnings.value = 0
    // Call composable reload with overtime callback
    await reloadAllData(computeOverallOvertimeCalculation)

    // Reload Sunday duty data - ensure dailyRate is available
    if (dailyRate.value > 0) {
      await loadSundayDuty(dailyRate.value)
    } else {
      // console.warn('[PayrollPrint] Skipping Sunday duty reload - dailyRate not available:', dailyRate.value)
      sundayDutyDays.value = 0
      sundayDutyAmount.value = 0
    }

    recalculateEarnings()
  } catch (error) {
    console.error('[PayrollPrint] Error during comprehensive reload:', error)
    // Don't rethrow - let component continue with partial data
  }
}

async function updateOverallOvertime() {
  try {
    overallOvertime.value = await computeOverallOvertimeCalculation()
  } catch (error) {
    console.error('Error calculating overtime:', error)
    overallOvertime.value = 0
  }
}

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

// Setup watchers using composable
usePayrollWatchers(
  {
    regularWorkTotal,
    trips: computed(() => tripsStore.trips),
    holidays: holidaysArray,
    overallOvertime,
    employeeDailyRate,
    dailyRate,
    codaAllowance,
    employeeNonDeductions,
    employeeId: computed(() => props.employeeData?.id),
    filterDateString,
    holidayDateString,
    payrollMonth: computed(() => props.payrollData?.month),
    payrollYear: computed(() => props.payrollData?.year),
  },
  {
    recalculateEarnings,
    initializePayrollCalculations,
    loadTrips,
    fetchEmployeeHolidays,
  }
)

// Track if initial load is complete to prevent dialog from showing again
const hasCompletedInitialLoad = ref(false)

// Only show loading dialog during initial calculations, not subsequent loads
const showLoadingDialog = computed(() => {
  return isCalculationsCompleting.value && !hasCompletedInitialLoad.value
})

// Watch for when initial calculations complete
watch(() => isCalculationsCompleting.value, (isCompleting) => {
  if (!isCompleting && !hasCompletedInitialLoad.value) {
    hasCompletedInitialLoad.value = true
  }
})

// Debug: Watch for deduction value changes
watch([monthLateDeduction, monthUndertimeDeduction, lateDeduction, undertimeDeduction],
  () => {
    // console.warn(`[PAYROLL PROPS DEBUG] Employee ${props.employeeData?.id} - monthLate: ${late}, monthUndertime: ${undertime}, lateDeduction: ₱${lateAmount}, undertimeDeduction: ₱${undertimeAmount}`)
  }, { immediate: true }
)

onMounted(async () => {
  await initializePayrollCalculations()
})
</script>

<template>
  <!-- Loading overlay for initial payroll calculations only -->
  <LoadingDialog
    v-model:is-visible="showLoadingDialog"
    title="Calculating Payroll..."
    subtitle="Processing employee data and computations"
    description="This may take a few moments while we calculate all payroll components"
    :progress-size="64"
    :progress-width="4"
    progress-color="primary"
  ></LoadingDialog>

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
            Days Regular Work for <span class="font-weight-bold">{{ monthDateRange }}</span>
          </td>
          <td class="pa-2">
            @ {{ getMoneyText(employeeDailyRate ?? 0) }}
          </td>
          <td class="pa-2">
            <span>
              x
              <AttendanceDaysTooltip
                :attendance-records="attendanceRecords || []"
                :total-hours-worked="totalHoursWorked"
                :is-field-staff="props.employeeData?.is_field_staff"
                :month-late-deduction="monthLateDeduction"
                :month-undertime-deduction="monthUndertimeDeduction"
                :holidays="holidaysArray"
              />
            </span>
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
              <span v-else-if="isSundayLoading">Calculating Sunday duty...</span>
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

          <template v-if="holidaysArray.length > 0">
            <tr
              v-for="holiday in holidaysArray"
              :key="'holiday-' + holiday.id"
              v-show="calculateHolidayAmount(holiday) > 0"
            >
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
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('lh')">
                  @ {{ getMoneyText(dailyRate ?? 0) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('ch')">
                  @ {{ getMoneyText(dailyRate ?? 0) }}
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('swh')">
                  @ {{ getMoneyText(dailyRate ?? 0) }}
                </span>
                <span v-else> @ {{ getMoneyText(dailyRate ?? 0) }} </span>
              </td>
              <td class="pa-2">
                <span v-if="holiday.type && holiday.type.toLowerCase().includes('rh')">
                  x 200%
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('snh')">
                  x 130%<span v-if="holiday.attendance_fraction === 0.5"> (Half Day)</span>
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('lh')">
                  x 130%<span v-if="holiday.attendance_fraction === 0.5"> (Half Day)</span>
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('ch')">
                  x 100%<span v-if="holiday.attendance_fraction === 0.5"> (Half Day)</span>
                </span>
                <span v-else-if="holiday.type && holiday.type.toLowerCase().includes('swh')">
                  x 130%<span v-if="holiday.attendance_fraction === 0.5"> (Half Day)</span>
                </span>
              </td>
              <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="holiday">
                {{ getMoneyText(calculateHolidayAmount(holiday)) }}
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
          <td class="pa-2">{{ overallOvertime.toFixed(2) }} hours</td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="overtime">
            {{ getMoneyText((employeeDailyRate / 8) * 1.25 * overallOvertime) }}
          </td>
        </tr>

        <tr v-show="sundayDutyDays > 0">
          <td class="border-b-thin text-center pa-2" colspan="2">Sunday Work</td>
          <td class="pa-2">@ {{ getMoneyText(dailyRate ?? 0) }}</td>
          <td class="pa-2">
            {{ sundayDutyDays }} day<span v-if="sundayDutyDays > 1">s</span>
            <!--<span v-if="formatSundayDutyText" class="text-caption ml-1">{{ formatSundayDutyText }}</span>-->
          </td>
          <td class="border-b-thin border-s-sm text-end pa-2 total-cell" data-total="sunday">
            {{ getMoneyText(sundayDutyAmount) }}
          </td>
        </tr>

        <template v-if="employeeNonDeductions.length > 0">
          <tr
            v-for="benefit in employeeNonDeductions"
            :key="'benefit-' + benefit.id"
            v-show="hasBenefitAmount(benefit.amount)"
          >
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
          <td
            class="border-b-thin border-s-sm text-end pa-2 total-cell"
            data-total="cash-adjustment"
          >
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
/* visuals paras sa mini payslip UWU */
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
