import { useEmployeesStore } from '@/stores/employees'
import { computed, type Ref } from 'vue'


export interface PayrollData {
  month: string
  year: number
}

export interface TableData {
  gross_pay?: number
  deductions?: number
  net_pay?: number
  coda_allowance?: number
  overtime_hours?: number
  sss_deduction?: number
  philhealth_deduction?: number
  pagibig_deduction?: number
  tax_deduction?: number
  other_deductions?: number
}

export function usePayrollComputation(
  dailyRate: Ref<number>,
  grossSalary: Ref<number>,
  tableData: Ref<TableData | null>,
  employeeId?: number,
  payrollMonth?: string,
  payrollYear?: number
) {
  const employeesStore = useEmployeesStore()

  // Basic calculations
  const codaAllowance = computed(() => tableData.value?.coda_allowance || 0)
  const totalGrossSalary = computed(() => grossSalary.value + codaAllowance.value)
  const totalDeductions = computed(() => tableData.value?.deductions || 0)
  const netSalary = computed(() => totalGrossSalary.value - totalDeductions.value)

  // Work days calculation
  const workDays = computed(() => {
    if (!payrollMonth || !payrollYear) return 0
    const monthIndex = new Date(`${payrollMonth} 1, ${payrollYear}`).getMonth()
    const start = new Date(payrollYear, monthIndex, 1)
    const end = new Date(payrollYear, monthIndex + 1, 0)
    let count = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day >= 1 && day <= 5) count++
    }
    return count
  })

  // Employee daily rate
  const employeeDailyRate = computed(() => {
    if (!employeeId) return dailyRate.value
    const emp = employeesStore.getEmployeeById(employeeId)
    return emp?.daily_rate || dailyRate.value
  })

  // Regular work total (future-proof for deductions, etc.)
  // Gamiton ang getEmployeeById ug i-filter by employeeId (props.employeeData?.id)
const regularWorkTotal = computed(() => {
  let daily = dailyRate.value
  let source = 'fallback'
  if (employeeId) {
    // kuhaon ang employee gamit ang getEmployeeById
    const emp = employeesStore.getEmployeeById(employeeId)
    if (emp) {
      daily = emp.daily_rate
      source = 'employee'
    }
  }
  const total = (daily ?? 0) * workDays.value
  // Gamiton ang other_deductions gikan sa deductions computed
  const otherDeduction = 5000
  console.log('regularWorkTotal:', total, '| employeeId:', employeeId, '| daily_rate:', daily, '| source:', source, '| other_deductions:', otherDeduction)
  // I-subtract ang other_deductions sa total para sakto ang regular work total
  return total - otherDeduction
})

  // Overtime calculations
  const overtimeHours = computed(() => tableData.value?.overtime_hours || 0)
  const overtimePay = computed(() => {
    const hourlyRate = dailyRate.value / 8
    const overtimeRate = hourlyRate * 1.25
    return overtimeHours.value * overtimeRate
  })
  const totalEarnings = computed(() => totalGrossSalary.value + overtimePay.value)

  // Dynamic deduction variables for future extensibility
  // Magamit ni for any deduction type, dili lang fixed fields
  const deductionFields = [
    'sss_deduction',
    'philhealth_deduction',
    'pagibig_deduction',
    'tax_deduction',
    'other_deductions',
    // add more deduction keys diri in the future
  ] as const

  type DeductionKey = typeof deductionFields[number]

  // Dynamic deductions object
  const deductions = computed(() => {
    const result: Record<DeductionKey, number> = {
      sss_deduction: 0,
      philhealth_deduction: 0,
      pagibig_deduction: 0,
      tax_deduction: 0,
      other_deductions: 20000,
    }
    if (tableData.value) {
      deductionFields.forEach((key) => {
        // kuhaon ang value per deduction, default 0 kung wala
        result[key] = tableData.value?.[key] || 0
      })
    }
    return result
  })

  // For backward compatibility, keep individual computed
  const sssDeduction = computed(() => deductions.value.sss_deduction)
  const philhealthDeduction = computed(() => deductions.value.philhealth_deduction)
  const pagibigDeduction = computed(() => deductions.value.pagibig_deduction)
  const taxDeduction = computed(() => deductions.value.tax_deduction)
  const otherDeductions = computed(() => deductions.value.other_deductions)

  // Calculation functions
  const calculateIncomeTax = (taxableIncome: number): number => {
    return 0
  }

  const calculateSSS = (monthlyBasicSalary: number): number => {
    return 0
  }

  const calculatePhilHealth = (monthlyBasicSalary: number): number => {
    return 0
  }

  const calculatePagIbig = (monthlyBasicSalary: number): number => {
    return 0
  }

  const calculateTotalDeductions = (): number => {
    return (
      sssDeduction.value +
      philhealthDeduction.value +
      pagibigDeduction.value +
      taxDeduction.value +
      otherDeductions.value
    )
  }

  // Utility functions
  const formatCurrency = (amount: number): string => amount.toFixed(2)
  const formatNumber = (num: number): string => num.toString()

  return {
    // Basic
    workDays,
    codaAllowance,
    totalGrossSalary,
    totalDeductions,
    netSalary,
    regularWorkTotal,

    // Overtime
    overtimeHours,
    overtimePay,
    totalEarnings,

    // Deductions
    sssDeduction,
    philhealthDeduction,
    pagibigDeduction,
    taxDeduction,
    otherDeductions,

    // Calculations
    calculateIncomeTax,
    calculateSSS,
    calculatePhilHealth,
    calculatePagIbig,
    calculateTotalDeductions,

    // Utilities
    formatCurrency,
    formatNumber,
    employeeDailyRate,
  }
}