import { fetchHolidaysByDateString } from '@/stores/holidays'
import { ref, type Ref } from 'vue'
import type { Holiday } from '@/stores/holidays'
/**
 * Composable: usePayrollHolidays
 * Fetch holidays for a given dateString (YYYY-MM or YYYY-MM-DD)
 * @param dateString - string pattern for holiday_at column
 * @returns { holidays, isLoading, fetchHolidays }
 */
export function usePayrollHolidays(dateString: string) {
  const holidays: Ref<Holiday[]> = ref([])
  const isLoading = ref(false)

  async function fetchHolidays() {
    isLoading.value = true
    holidays.value = await fetchHolidaysByDateString(dateString)
    isLoading.value = false
  }

  return { holidays, isLoading, fetchHolidays }
}

import type { PayrollData } from '@/views/system/admin/manage-payroll/payroll/payrollTableDialog'
import { usePayrollComputation } from './payrollComputation'
import { useTripsStore, type Trip } from '@/stores/trips'
import { useAttendancesStore, type Attendance } from '@/stores/attendances'
import type { Employee } from '@/stores/employees'
import { computed, toRef } from 'vue'
import type { ComputedRef } from 'vue'



type UsePayrollRefsProps = {
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: any
}

// Returns refs for dailyRate, grossSalary, and tableData
export function usePayrollRefs(
  props: UsePayrollRefsProps,
  dailyRate: ComputedRef<number>,
  grossSalary: ComputedRef<number>
) {
  const dailyRateRef = computed(() => dailyRate.value)
  const grossSalaryRef = computed(() => grossSalary.value)
  const tableDataRef = toRef(props, 'tableData')
  return { dailyRateRef, grossSalaryRef, tableDataRef }
}

// Composable to be used in PayrollPrint.vue
export function usePayrollPrint(
  props: UsePayrollRefsProps,
  dailyRate: ComputedRef<number>,
  grossSalary: ComputedRef<number>
) {
  const { dailyRateRef, grossSalaryRef, tableDataRef } = usePayrollRefs(props, dailyRate, grossSalary)
  // Use payrollComputation composable and expose its return
  return usePayrollComputation(dailyRateRef, grossSalaryRef, tableDataRef)
}

/**
 * Composable: usePayrollFilters
 * Filter trips and employees for payrolls based on selected date (YYYY-MM-DD) and employeeId
 * @param dateString - YYYY-MM-DD string (e.g., '2025-07-01')
 * @param employeeId - Employee ID to filter
 */
export function usePayrollFilters(dateString: string, employeeId: number | undefined) {
  const tripsStore = useTripsStore()

  // Instance sa attendances store
  const attendancesStore = useAttendancesStore()

  /**
   * Fetch trips for payroll filter using store action
   * @returns Promise<Trip[]>
   */
  async function fetchFilteredTrips() {
    // Tawag sa store action para fetch ug update sa trips
    return await tripsStore.fetchFilteredTrips(dateString, employeeId)
  }

  /**
   * Fetch attendances for payroll filter using store action
   * @returns Promise<Attendance[] | null>
   */
  async function fetchFilteredAttendances() {
    // Tawag sa store action para fetch attendances by am_time_in ug employeeId
    if (!employeeId) return null
    // Query sa attendances table kung asa ang am_time_in = dateString ug employee_id = employeeId
    const { data, error } = await attendancesStore.getAttendancesByDateString(dateString)
    if (error) {
      // Handle error if needed
      return null
    }
    // Filter pa gyud by employee_id kung naa pa
    return data?.filter((item) => item.employee_id == String(employeeId)) ?? null
  }

  return {
    fetchFilteredTrips,
    fetchFilteredAttendances,
  }
}

