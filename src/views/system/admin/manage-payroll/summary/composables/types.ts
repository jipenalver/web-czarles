/**
 * Types and interfaces for monthly payroll computation
 */

/**
 * Interface for database function response row
 */
export interface PayrollDatabaseRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number // Can be decimal for half days (e.g., 0.5, 1.5, 2.0)
  sunday_days: number
  sunday_amount: number
  cola: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  gross_pay: number
  cash_advance: number
  sss: number
  phic: number
  pagibig: number
  sss_loan: number
  savings: number
  salary_deposit: number
  late_deduction: number
  undertime_deduction: number
  total_deductions: number
  net_pay: number
}

export interface MonthlyPayrollRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number
  is_field_staff: boolean // Added to track field staff status
  hours_worked?: number // Added for field staff - stores actual hours worked
  sunday_days: number
  sunday_amount: number
  cola: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  cash_adjustment_addon: number // Cash adjustment add-ons (is_deduction = false)
  gross_pay: number
  deductions: {
    cash_advance: number
    sss: number
    phic: number
    pagibig: number
    sss_loan: number
    savings: number
    salary_deposit: number
    late: number
    undertime: number
    cash_adjustment: number // Cash adjustment deductions (is_deduction = true)
    total: number
  }
  total_deductions: number
  net_pay: number
}

export interface MonthlyPayrollTotals {
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  cash_adjustment_addon: number
  gross_pay: number
  total_deductions: number
  net_pay: number
}
