
import type { PayrollData } from '@/views/system/admin/manage-payroll/payroll/payrollTableDialog'
import { usePayrollComputation } from './payrollComputation'
import type { Employee } from '@/stores/employees'
import { computed, toRef } from 'vue'
import type { ComputedRef } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useTripsStore, type Trip } from '@/stores/trips'
import { supabase } from '@/utils/supabase'

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

  /**
   * Fetch trips from Supabase for the given employee and month (YYYY-MM)
   * and update the trips store. Uses the Trip type from the store for schema.
   * @returns Promise<Trip[]>
   */
  async function fetchFilteredTrips() {
    if (!employeeId) return []
    // Extract YYYY-MM for filtering
    const yearMonth = dateString.slice(0, 7)
    // Compute next month for range filtering
    const [year, month] = yearMonth.split('-').map(Number)
    let nextYear = year
    let nextMonth = month + 1
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`
    // Use join/alias as in store for trip_location and employees
    const { data, error } = await supabase
      .from('trips')
      .select('*, units:unit_id(name, created_at), trip_location:trip_location_id(*), employees:employee_id(firstname,middlename,lastname)')
      .eq('employee_id', employeeId)
      .gte('date', `${yearMonth}-01`)
      .lt('date', `${nextMonthStr}-01`)
      .order('date', { ascending: true })

    if (error) {
      //error pag fetch sa trips para payroll filter
      console.error('[usePayrollFilters] fetchFilteredTrips error:', error)
      return []
    }
    // Update the trips store (optional: replace or merge)
    tripsStore.trips = data as Trip[]
    // Debug log
    console.log('[usePayrollFilters] fetched trips from supabase:', data)
    return data as Trip[]
  }

  return {
    fetchFilteredTrips,
  }
}

