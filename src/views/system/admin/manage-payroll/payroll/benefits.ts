import { ref } from 'vue'
import { useEmployeesStore } from "@/stores/employees"
// Fetch and filter employee deductions when employeeId changes
export async function fetchEmployeeDeductions(employeeId: number | undefined) {
  const employeesStore = useEmployeesStore()
  const employeeDeductions = ref<any[]>([])
  const employeeNonDeductions = ref<any[]>([])
  if (employeeId !== undefined) {
    const employee = await employeesStore.getEmployeeById(employeeId)
    if (employee && Array.isArray(employee.employee_deductions)) {
      // filter ang deductions nga is_deduction === true
      const filtered = employee.employee_deductions.filter(
        (deduction: any) => deduction.employee_benefit?.is_deduction === true,
      )
      // filter ang deductions nga is_deduction === false
      const filteredFalse = employee.employee_deductions.filter(
        (deduction: any) => deduction.employee_benefit?.is_deduction === false,
      )
      //i-log ang benefit name ug benefit value para ma-check
      filtered.forEach((deduction: any) => {
        console.log('Deduction benefit:', {
          benefit: deduction.employee_benefit?.benefit,
        })
      })
      filteredFalse.forEach((deduction: any) => {
        console.log('Non-deduction benefit:', {
          benefit: deduction.employee_benefit?.benefit,
        })
      })
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
  return {
    deductions: employeeDeductions.value,
    nonDeductions: employeeNonDeductions.value,
  }
}


