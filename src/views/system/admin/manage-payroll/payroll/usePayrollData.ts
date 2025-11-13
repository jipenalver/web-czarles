import { ref, computed, type Ref } from 'vue'
import { useTripsStore } from '@/stores/trips'
import { fetchHolidaysByDateString, fetchHolidaysByRange, type HolidayWithAttendance } from './computation/holidays'
import { fetchFilteredTrips, fetchTripsByRange } from './computation/trips'
import { fetchFilteredUtilizations, fetchUtilizationsByRange } from './computation/utilizations'
import { fetchFilteredAllowances, fetchAllowancesByRange } from './computation/allowances'
import { fetchEmployeeDeductions } from './computation/benefits'
import { getSundayDutyDaysForMonth } from './computation/attendance'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from './helpers'
import type { EmployeeDeduction } from '@/stores/benefits'
import type { Utilization } from '@/stores/utilizations'
import type { Allowance } from '@/stores/allowances'
import type { CashAdjustment } from '@/stores/cashAdjustments'

interface PayrollDataParams {
  employeeId: number | undefined
  filterDateString: string
  holidayDateString: string
}

/**
 * Composable para sa pag-fetch ug pag-manage sa tanan payroll data
 * Consolidates all data fetching logic para sa trips, holidays, utilizations, allowances, ug cash adjustments
 */
export function usePayrollData(params: Ref<PayrollDataParams>) {
  const tripsStore = useTripsStore()

  // State refs
  const holidays = ref<HolidayWithAttendance[]>([])
  const utilizations = ref<Utilization[]>([])
  const allowances = ref<Allowance[]>([])
  const cashAdjustmentsAdditions = ref<CashAdjustment[]>([])
  const employeeDeductions = ref<EmployeeDeduction[]>([])
  const employeeNonDeductions = ref<EmployeeDeduction[]>([])
  const overallOvertime = ref<number>(0)
  const sundayDutyDays = ref<number>(0)
  const sundayDutyAmount = ref<number>(0)

  // Loading states
  const isTripsLoading = ref(false)
  const isHolidaysLoading = ref(false)
  const isUtilizationsLoading = ref(false)
  const isAllowancesLoading = ref(false)
  const isCashAdjustmentsLoading = ref(false)
  const isDeductionsLoading = ref(false)
  const isOvertimeLoading = ref(false)
  const isSundayLoading = ref(false)
  const isCalculationsCompleting = ref(false)

  // Comprehensive loading state
  const isPayrollCalculating = computed(() => {
    return (
      isTripsLoading.value ||
      isHolidaysLoading.value ||
      isUtilizationsLoading.value ||
      isAllowancesLoading.value ||
      isCashAdjustmentsLoading.value ||
      isDeductionsLoading.value ||
      isOvertimeLoading.value ||
      isSundayLoading.value ||
      isCalculationsCompleting.value
    )
  })

  // Helper para kuha ang date range from localStorage
  function getDateRangeFromStorage(): { fromDate: string | null; toDate: string | null } {
    try {
      if (typeof window !== 'undefined') {
        return {
          fromDate: localStorage.getItem('czarles_payroll_fromDate'),
          toDate: localStorage.getItem('czarles_payroll_toDate'),
        }
      }
    } catch {
      // ignore
    }
    return { fromDate: null, toDate: null }
  }

  // Fetch trips
  async function loadTrips() {
    if (!params.value.employeeId) {
      isTripsLoading.value = false
      return
    }
    isTripsLoading.value = true
    try {
      const { fromDate, toDate } = getDateRangeFromStorage()
      const fetchedTrips =
        fromDate && toDate
          ? await fetchTripsByRange(fromDate, toDate, params.value.employeeId)
          : await fetchFilteredTrips(params.value.filterDateString, params.value.employeeId)
      tripsStore.trips = fetchedTrips
    } catch (error) {
      console.error('[PayrollData] Error loading trips:', error)
      tripsStore.trips = []
    } finally {
      isTripsLoading.value = false
    }
  }

  // Fetch holidays
  async function fetchEmployeeHolidays() {
    if (!params.value.employeeId) {
      holidays.value = []
      isHolidaysLoading.value = false
      return
    }
    isHolidaysLoading.value = true
    try {
      const { fromDate, toDate } = getDateRangeFromStorage()

      holidays.value =
        fromDate && toDate
          ? await fetchHolidaysByRange(fromDate, toDate, String(params.value.employeeId))
          : await fetchHolidaysByDateString(params.value.holidayDateString, String(params.value.employeeId))
    } catch (error) {
      console.error('[PayrollData] Error fetching holidays:', error)
      holidays.value = []
    } finally {
      isHolidaysLoading.value = false
    }
  }

  // Fetch utilizations
  async function loadUtilizations() {
    if (!params.value.employeeId) {
      isUtilizationsLoading.value = false
      return
    }
    isUtilizationsLoading.value = true
    try {
      const { fromDate, toDate } = getDateRangeFromStorage()
      const fetchedUtilizations =
        fromDate && toDate
          ? await fetchUtilizationsByRange(fromDate, toDate, params.value.employeeId)
          : await fetchFilteredUtilizations(params.value.filterDateString, params.value.employeeId)
      utilizations.value = fetchedUtilizations
    } catch (error) {
      console.error('[PayrollData] Error loading utilizations:', error)
      utilizations.value = []
    } finally {
      isUtilizationsLoading.value = false
    }
  }

  // Fetch allowances
  async function loadAllowances() {
    if (!params.value.employeeId) {
      isAllowancesLoading.value = false
      return
    }
    isAllowancesLoading.value = true
    try {
      const { fromDate, toDate } = getDateRangeFromStorage()
      const fetchedAllowances =
        fromDate && toDate
          ? await fetchAllowancesByRange(fromDate, toDate, params.value.employeeId)
          : await fetchFilteredAllowances(params.value.filterDateString, params.value.employeeId)
      allowances.value = fetchedAllowances
    } catch (error) {
      console.error('[PayrollData] Error loading allowances:', error)
      allowances.value = []
    } finally {
      isAllowancesLoading.value = false
    }
  }

  // Fetch cash adjustments (is_deduction = false)
  async function loadCashAdjustments() {
    if (!params.value.employeeId) {
      isCashAdjustmentsLoading.value = false
      return
    }
    isCashAdjustmentsLoading.value = true
    try {
      const { fromDate, toDate } = getDateRangeFromStorage()
      const startDate = fromDate || params.value.filterDateString
      const endDate = toDate || getLastDateOfMonth(params.value.filterDateString)

      const { data, error } = await supabase
        .from('cash_adjustments')
        .select('*')
        .eq('employee_id', params.value.employeeId)
        .eq('is_deduction', false)
        .gte('adjustment_at', startDate)
        .lt('adjustment_at', endDate)

      if (error) {
        console.error('[PayrollData] Error loading cash adjustments:', error)
        cashAdjustmentsAdditions.value = []
      } else {
        cashAdjustmentsAdditions.value = data || []
      }
    } catch (error) {
      console.error('[PayrollData] Error loading cash adjustments:', error)
      cashAdjustmentsAdditions.value = []
    } finally {
      isCashAdjustmentsLoading.value = false
    }
  }

  // Fetch Sunday duty days and calculate amount
  async function loadSundayDuty(dailyRate: number) {
    if (!params.value.employeeId) {
      isSundayLoading.value = false
      return
    }
    isSundayLoading.value = true
    try {
      const days = await getSundayDutyDaysForMonth(
        params.value.filterDateString,
        params.value.employeeId
      )
      sundayDutyDays.value = days
      // Sunday amount: only the 30% premium (0.3x daily rate per Sunday worked)
      // The base daily rate is already included in regular work calculation
      sundayDutyAmount.value = days * dailyRate * 0.3
    } catch (error) {
      console.error('[PayrollData] Error loading Sunday duty:', error)
      sundayDutyDays.value = 0
      sundayDutyAmount.value = 0
    } finally {
      isSundayLoading.value = false
    }
  }

  // Fetch employee deductions
  async function updateEmployeeDeductions(employeeId: number | undefined) {
    isDeductionsLoading.value = true
    try {
      const result = await fetchEmployeeDeductions(employeeId)
      employeeDeductions.value = result.deductions
      employeeNonDeductions.value = result.nonDeductions
    } catch (error) {
      console.error('[PayrollData] Error updating employee deductions:', error)
      employeeDeductions.value = []
      employeeNonDeductions.value = []
    } finally {
      isDeductionsLoading.value = false
    }
  }

  // Initialize all payroll calculations
  async function initializePayrollCalculations(
    computeOvertimeCallback: () => Promise<number>,
  ) {
    isCalculationsCompleting.value = true
    try {
      // Reset all loading states
      isTripsLoading.value = true
      isHolidaysLoading.value = true
      isOvertimeLoading.value = true
      isUtilizationsLoading.value = true
      isAllowancesLoading.value = true
      isCashAdjustmentsLoading.value = true
      isDeductionsLoading.value = true
      isSundayLoading.value = true

      // Reset all data
      holidays.value = []
      overallOvertime.value = 0
      utilizations.value = []
      allowances.value = []
      cashAdjustmentsAdditions.value = []
      employeeDeductions.value = []
      employeeNonDeductions.value = []
      sundayDutyDays.value = 0
      sundayDutyAmount.value = 0

      // Fetch employee deductions first
      if (params.value.employeeId) {
        await updateEmployeeDeductions(params.value.employeeId)
      }

      // Fetch all data in parallel
      await Promise.all([
        loadTrips(),
        loadUtilizations(),
        loadAllowances(),
        loadCashAdjustments(),
        fetchEmployeeHolidays(),
      ])

      // Compute overtime
      isOvertimeLoading.value = true
      try {
        overallOvertime.value = await computeOvertimeCallback()
      } catch (error) {
        console.error('[PayrollData] Error calculating overtime:', error)
        overallOvertime.value = 0
      } finally {
        isOvertimeLoading.value = false
      }
    } catch (error) {
      console.error('[PayrollData] Error initializing payroll calculations:', error)
    } finally {
      // Ensure all loading states are false
      isTripsLoading.value = false
      isHolidaysLoading.value = false
      isOvertimeLoading.value = false
      isUtilizationsLoading.value = false
      isAllowancesLoading.value = false
      isCashAdjustmentsLoading.value = false
      isDeductionsLoading.value = false
      isSundayLoading.value = false
      isCalculationsCompleting.value = false
    }
  }

  // Reload all data
  async function reloadAllFunctions(computeOvertimeCallback: () => Promise<number>) {
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
      sundayDutyDays.value = 0
      sundayDutyAmount.value = 0

      isTripsLoading.value = true
      isHolidaysLoading.value = true
      isOvertimeLoading.value = true
      isUtilizationsLoading.value = true
      isAllowancesLoading.value = true
      isCashAdjustmentsLoading.value = true
      isDeductionsLoading.value = true
      isSundayLoading.value = true

      await initializePayrollCalculations(computeOvertimeCallback)
    } catch (error) {
      console.error('[PayrollData] Error during comprehensive reload:', error)
    } finally {
      isCalculationsCompleting.value = false
    }
  }

  // Computed totals
  const monthlyTrippingsTotal = computed(() => {
    return tripsStore.trips.reduce((sum, trip) => {
      return sum + (trip.per_trip ?? 0) * (trip.trip_no ?? 1)
    }, 0)
  })

  const monthlyUtilizationsTotal = computed(() => {
    return utilizations.value.reduce((sum, utilization) => {
      const totalHours = utilization.hours ?? 0
      const overtimeHours = utilization.overtime_hours ?? 0
      const perHour = utilization.per_hour ?? 0
      return sum + (totalHours + overtimeHours) * perHour
    }, 0)
  })

  const monthlyAllowancesTotal = computed(() => {
    return allowances.value.reduce((sum, allowance) => {
      return sum + (allowance.amount ?? 0)
    }, 0)
  })

  const monthlyCashAdjustmentsTotal = computed(() => {
    return cashAdjustmentsAdditions.value.reduce((sum, adjustment) => {
      return sum + (adjustment.amount ?? 0)
    }, 0)
  })

  return {
    // State
    holidays,
    utilizations,
    allowances,
    cashAdjustmentsAdditions,
    employeeDeductions,
    employeeNonDeductions,
    overallOvertime,
    sundayDutyDays,
    sundayDutyAmount,
    tripsStore,

    // Loading states
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

    // Computed totals
    monthlyTrippingsTotal,
    monthlyUtilizationsTotal,
    monthlyAllowancesTotal,
    monthlyCashAdjustmentsTotal,

    // Functions
    loadTrips,
    loadUtilizations,
    loadAllowances,
    loadCashAdjustments,
    loadSundayDuty,
    fetchEmployeeHolidays,
    updateEmployeeDeductions,
    initializePayrollCalculations,
    reloadAllFunctions,
  }
}
