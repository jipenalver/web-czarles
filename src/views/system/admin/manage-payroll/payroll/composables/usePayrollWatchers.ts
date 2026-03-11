/**
 * usePayrollWatchers - Centralized watchers for payroll calculations
 */
import { watch, type Ref, type ComputedRef } from 'vue'
import type { Trip } from '@/stores/trips'
import type { Holiday } from '@/stores/holidays'
import type { EmployeeDeduction } from '@/stores/benefits'

interface PayrollWatcherCallbacks {
  recalculateEarnings: () => void
  initializePayrollCalculations: () => Promise<void>
  loadTrips: () => Promise<void>
  fetchEmployeeHolidays: () => void
}

/**
 * Setup all watchers for payroll calculations
 */
export function usePayrollWatchers(
  params: {
    regularWorkTotal: Ref<number> | ComputedRef<number>
    trips: ComputedRef<Trip[]>
    holidays: ComputedRef<Holiday[]>
    overallOvertime: Ref<number>
    employeeDailyRate: Ref<number> | ComputedRef<number>
    dailyRate: ComputedRef<number>
    codaAllowance: Ref<number> | ComputedRef<number>
    employeeNonDeductions: Ref<EmployeeDeduction[]>
    employeeId: ComputedRef<number | undefined>
    filterDateString: ComputedRef<string>
    holidayDateString: ComputedRef<string>
    payrollMonth: ComputedRef<string>
    payrollYear: ComputedRef<number>
  },
  callbacks: PayrollWatcherCallbacks,
) {
  // Watch for earnings recalculation - removed immediate: true to prevent initial double calculation
  watch(
    [
      params.regularWorkTotal,
      params.trips,
      params.holidays,
      params.overallOvertime,
      params.employeeDailyRate,
      params.dailyRate,
      params.codaAllowance,
      params.employeeNonDeductions,
    ],
    () => {
      callbacks.recalculateEarnings()
    },
    { deep: true },
  )

  // Watch for full payroll initialization - this will trigger trips and holidays reload
  watch(
    [params.employeeId, params.filterDateString, params.payrollMonth, params.payrollYear],
    async (newVals, oldVals) => {
      // Skip if this is the first run (oldVals is undefined) since onMounted already handles initialization
      if (!oldVals) return

      // Only trigger if values actually changed to prevent infinite loops
      if (JSON.stringify(newVals) !== JSON.stringify(oldVals)) {
        await callbacks.initializePayrollCalculations()
      }
    },
    { deep: true },
  )
}
