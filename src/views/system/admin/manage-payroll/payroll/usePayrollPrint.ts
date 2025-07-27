import type { PayrollData } from '@/views/system/admin/manage-payroll/payroll/payrollTableDialog'
import { type ComputedRef, type Ref, computed, ref, toRef } from 'vue'
import { fetchHolidaysByDateString } from '@/stores/holidays'
import { usePayrollComputation } from './payrollComputation'
import { useTripsStore } from '@/stores/trips'
import type { Employee } from '@/stores/employees'
import type { Holiday } from '@/stores/holidays'

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

type UsePayrollRefsProps = {
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: any
}

// Returns refs for dailyRate, grossSalary, and tableData
export function usePayrollRefs(
  props: UsePayrollRefsProps,
  dailyRate: ComputedRef<number>,
  grossSalary: ComputedRef<number>,
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
  grossSalary: ComputedRef<number>,
) {
  const { dailyRateRef, grossSalaryRef, tableDataRef } = usePayrollRefs(
    props,
    dailyRate,
    grossSalary,
  )
  // Use payrollComputation composable and expose its return
  return usePayrollComputation(
    dailyRateRef,
    grossSalaryRef,
    tableDataRef,
    props.employeeData?.id,
    props.payrollData.month,
    props.payrollData.year,
  )
}

export function usePayrollFilters(dateString: string, employeeId: number | undefined) {
  const tripsStore = useTripsStore()

  async function fetchFilteredTrips() {
    // Tawag sa store action para fetch ug update sa trips
    return await tripsStore.fetchFilteredTrips(dateString, employeeId)
  }

  return {
    fetchFilteredTrips,
  }
}
