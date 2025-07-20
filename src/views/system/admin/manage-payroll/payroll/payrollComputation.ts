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
  // Future properties for extended functionality
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
  tableData: Ref<TableData | null>
) {
  // Basic Salary Calculations
  const codaAllowance = computed(() => {
    return tableData.value?.coda_allowance || 0
  })

  const totalGrossSalary = computed(() => {
    return grossSalary.value + codaAllowance.value
  })

  const totalDeductions = computed(() => {
    return tableData.value?.deductions || 0
  })

  const netSalary = computed(() => {
    return totalGrossSalary.value - totalDeductions.value
  })

  const workDays = computed(() => {
    // Logic: Calculate work days based on gross pay and daily rate
    // TODO: Add validation for leap years, holidays, leaves
    if (dailyRate.value === 0) return 0
    return Math.round(grossSalary.value / dailyRate.value)
  })

  // Overtime Calculations
  const overtimeHours = computed(() => {
    return tableData.value?.overtime_hours || 0
  })

  const overtimePay = computed(() => {
    // Logic: Calculate overtime pay based on daily rate and overtime hours
    // Formula: (daily_rate / 8) * overtime_hours * overtime_multiplier
    const hourlyRate = dailyRate.value / 8
    const overtimeRate = hourlyRate * 1.25 // Placeholder multiplier
    return overtimeHours.value * overtimeRate
  })

  const totalEarnings = computed(() => {
    return totalGrossSalary.value + overtimePay.value
  })

  // Deduction Breakdown Calculations
  const sssDeduction = computed(() => {
    return tableData.value?.sss_deduction || 0
  })

  const philhealthDeduction = computed(() => {
    return tableData.value?.philhealth_deduction || 0
  })

  const pagibigDeduction = computed(() => {
    return tableData.value?.pagibig_deduction || 0
  })

  const taxDeduction = computed(() => {
    return tableData.value?.tax_deduction || 0
  })

  const otherDeductions = computed(() => {
    return tableData.value?.other_deductions || 0
  })

  // Tax Calculation Functions
  const calculateIncomeTax = (taxableIncome: number): number => {
    // Logic: Calculate Philippine income tax based on tax brackets
    // TODO: Implement actual tax calculation based on BIR tax table
    return 0 // Placeholder
  }

  const calculateSSS = (monthlyBasicSalary: number): number => {
    // Logic: Calculate SSS contribution based on salary brackets
    // TODO: Implement actual SSS contribution table
    return 0 // Placeholder
  }

  const calculatePhilHealth = (monthlyBasicSalary: number): number => {
    // Logic: Calculate PhilHealth contribution (percentage of basic salary)
    // TODO: Implement actual PhilHealth calculation
    return 0 // Placeholder
  }

  const calculatePagIbig = (monthlyBasicSalary: number): number => {
    // Logic: Calculate Pag-IBIG contribution (percentage based)
    // TODO: Implement actual Pag-IBIG calculation
    return 0 // Placeholder
  }

  // Utility Functions
  const formatCurrency = (amount: number): string => {
    return amount.toFixed(2)
  }

  const formatNumber = (num: number): string => {
    return num.toString()
  }

  const calculateTotalDeductions = (): number => {
    // Logic: Sum all deduction types
    // TODO: Add validation and business rules for deductions
    return sssDeduction.value + 
           philhealthDeduction.value + 
           pagibigDeduction.value + 
           taxDeduction.value + 
           otherDeductions.value
  }

  return {
    // Basic Calculations
    workDays,
    codaAllowance,
    totalGrossSalary,
    totalDeductions,
    netSalary,

    // Overtime Calculations
    overtimeHours,
    overtimePay,
    totalEarnings,

    // Deduction Breakdown
    sssDeduction,
    philhealthDeduction,
    pagibigDeduction,
    taxDeduction,
    otherDeductions,

    // Calculation Functions
    calculateIncomeTax,
    calculateSSS,
    calculatePhilHealth,
    calculatePagIbig,
    calculateTotalDeductions,

    // Utility Functions
    formatCurrency,
    formatNumber
  }
}
