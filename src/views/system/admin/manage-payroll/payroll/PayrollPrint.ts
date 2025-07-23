import type { PayrollData } from '@/views/system/admin/manage-payroll/payroll/payrollTableDialog'
import type { Employee } from '@/stores/employees'
import { computed, toRef } from 'vue'
import type { ComputedRef } from 'vue'

interface UsePayrollRefsProps {
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: any
}

// 'kuhaon ang ref sa dailyRate, grossSalary, ug tableData gamit composable'
export function usePayrollRefs(
  props: UsePayrollRefsProps,
  dailyRate: ComputedRef<number>,
  grossSalary: ComputedRef<number>
) {
  // Ang computed values, dapat i-wrap sa computed para reactive gihapon
  const dailyRateRef = computed(() => dailyRate.value)
  const grossSalaryRef = computed(() => grossSalary.value)
  // Table data is already a prop, so toRef for reactivity
  const tableDataRef = toRef(props, 'tableData')
  return { dailyRateRef, grossSalaryRef, tableDataRef }
}
