/**
 * usePayrollDisplay - Composable for display-related computed properties
 */
import { computed, type ComputedRef, type Ref } from 'vue'
import { type Employee } from '@/stores/employees'
import { getFormattedCurrentDate } from '../helpers'

/**
 * Employee display information composable
 */
export function useEmployeeDisplay(employeeData: ComputedRef<Employee | null>) {
  const fullName = computed(() => {
    if (!employeeData.value) return 'N/A'
    const middleName = employeeData.value.middlename
      ? ` ${employeeData.value.middlename} `
      : ' '
    return `${employeeData.value.firstname}${middleName}${employeeData.value.lastname}`
  })

  const designation = computed(() => {
    return employeeData.value?.designation?.designation || 'N/A'
  })

  const address = computed(() => {
    return employeeData.value?.address || 'N/A'
  })

  const dailyRate = computed(() => employeeData.value?.daily_rate || 0)

  const isFieldStaff = computed(() => employeeData.value?.is_field_staff || false)

  return {
    fullName,
    designation,
    address,
    dailyRate,
    isFieldStaff,
  }
}

/**
 * General display formatting composable
 */
export function usePayrollFormatting() {
  const formattedDate = computed(() => getFormattedCurrentDate())

  const showLateDeduction = computed(() => true)

  return {
    formattedDate,
    showLateDeduction,
  }
}

/**
 * Hours calculation for field staff
 */
export function useHoursCalculation(
  isFieldStaff: ComputedRef<boolean>,
  employeeDailyRate: Ref<number> | ComputedRef<number>,
  regularWorkTotal: Ref<number> | ComputedRef<number>,
) {
  const totalHoursWorked = computed(() => {
    if (isFieldStaff.value && employeeDailyRate.value > 0) {
      const hourlyRate = employeeDailyRate.value / 8
      return regularWorkTotal.value / hourlyRate
    }
    return 0
  })

  return {
    totalHoursWorked,
  }
}
