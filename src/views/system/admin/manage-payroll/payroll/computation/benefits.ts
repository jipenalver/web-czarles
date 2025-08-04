import { ref } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import type { EmployeeDeduction } from '@/stores/benefits'

// Fetch and filter employee deductions when employeeId changes
export async function fetchEmployeeDeductions(employeeId: number | undefined) {
  const employeesStore = useEmployeesStore()

  const employeeDeductions = ref<EmployeeDeduction[]>([])
  const employeeNonDeductions = ref<EmployeeDeduction[]>([])

  if (employeeId !== undefined) {
    const employee = employeesStore.getEmployeesById(employeeId)
    if (employee && Array.isArray(employee.employee_deductions)) {
      // filter ang deductions nga is_deduction === true
      const filtered = employee.employee_deductions.filter(
        (deduction: EmployeeDeduction) => deduction.benefit?.is_deduction === true,
      )
      // filter ang deductions nga is_deduction === false
      const filteredFalse = employee.employee_deductions.filter(
        (deduction: EmployeeDeduction) => deduction.benefit?.is_deduction === false,
      )

      employeeDeductions.value = filtered
      employeeNonDeductions.value = filteredFalse
    } else {
      employeeDeductions.value = []
      employeeNonDeductions.value = []
    }
  } else {
    employeeDeductions.value = []
    employeeNonDeductions.value = []
  }
  const result = {
    deductions: employeeDeductions.value,
    nonDeductions: employeeNonDeductions.value,
  }
  // Debug: log the return value
  // console.log('[fetchEmployeeDeductions] return:', result)
  return result
}
