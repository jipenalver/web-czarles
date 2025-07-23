
import type { PayrollData } from '@/views/system/admin/manage-payroll/payroll/payrollTableDialog'
import { usePayrollComputation } from './payrollComputation'
import type { Employee } from '@/stores/employees'
import { computed, toRef } from 'vue'
import type { ComputedRef } from 'vue'



interface UsePayrollRefsProps {
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
