/**
 * Types and interfaces for monthly payroll computation
 */

// Import AttendanceRecord from computation module to ensure type compatibility
import type { AttendanceRecord } from '@/views/system/admin/manage-payroll/payroll/computation/computation'

// Re-export for convenience
export type { AttendanceRecord }

/**
 * Interface for database function response row
 */
export interface PayrollDatabaseRow {
  employee_id: number
  employee_name: string
  designation_id?: number | null
  designation_name?: string
  daily_rate: number
  is_field_staff: boolean
  days_worked: number // Can be decimal for half days (e.g., 0.5, 1.5, 2.0)
  sunday_days: number
  sunday_amount: number
  allowance: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  benefits_pay: number
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

export interface Holiday {
  id?: number
  holiday_at?: string
  type?: string | null
  description?: string
  attendance_fraction?: number
}

export interface MonthlyPayrollRow {
  employee_id: number
  employee_name: string
  designation_id: number | null
  designation_name: string
  daily_rate: number
  days_worked: number
  is_field_staff: boolean // Added to track field staff status
  is_admin?: boolean // Added to track admin staff status
  hours_worked?: number // Added for field staff - stores actual hours worked
  days_worked_calculated?: number | null // Added for admin-specific calculation
  attendance_records?: AttendanceRecord[] // Added for AttendanceDaysTooltip
  holidays?: Holiday[] // Added for holiday tracking in tooltip
  sunday_days: number
  sunday_amount: number
  allowance: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  benefits_pay: number
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
  benefits_pay: number
  cash_adjustment_addon: number
  gross_pay: number
  total_deductions: number
  net_pay: number
}
