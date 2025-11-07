import type { PayrollDatabaseRow, MonthlyPayrollRow } from './types'

/**
 * Transform database response to MonthlyPayrollRow format
 */
export function transformPayrollData(data: PayrollDatabaseRow[]): MonthlyPayrollRow[] {
  return (data || []).map((row: PayrollDatabaseRow) => ({
    employee_id: row.employee_id,
    employee_name: row.employee_name,
    daily_rate: Number(row.daily_rate) || 0,
    days_worked: Number(row.days_worked) || 0,
    is_field_staff: false, // Will be updated later
    hours_worked: undefined, // Will be calculated for field staff
    sunday_days: Number(row.sunday_days) || 0,
    sunday_amount: Number(row.sunday_amount) || 0,
    cola: Number(row.cola) || 0,
    overtime_hrs: Number(row.overtime_hrs) || 0,
    basic_pay: Number(row.basic_pay) || 0,
    overtime_pay: Number(row.overtime_pay) || 0,
    trips_pay: Number(row.trips_pay) || 0,
    utilizations_pay: Number(row.utilizations_pay) || 0,
    holidays_pay: Number(row.holidays_pay) || 0,
    cash_adjustment_addon: 0, // Will be calculated client-side
    gross_pay: Number(row.gross_pay) || 0,
    deductions: {
      cash_advance: Number(row.cash_advance) || 0,
      sss: Number(row.sss) || 0,
      phic: Number(row.phic) || 0,
      pagibig: Number(row.pagibig) || 0,
      sss_loan: Number(row.sss_loan) || 0,
      savings: Number(row.savings) || 0,
      salary_deposit: Number(row.salary_deposit) || 0,
      late: Number(row.late_deduction) || 0,
      undertime: Number(row.undertime_deduction) || 0,
      cash_adjustment: 0, // Will be calculated client-side
      total: Number(row.total_deductions) || 0,
    },
    total_deductions: Number(row.total_deductions) || 0,
    net_pay: Number(row.net_pay) || 0,
  }))
}

/**
 * Create date string for calculations in YYYY-MM-01 format
 */
export function createDateStringForCalculation(selectedMonth: string, selectedYear: number): string {
  const monthIndex = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ].indexOf(selectedMonth)

  return `${selectedYear}-${String(monthIndex + 1).padStart(2, '0')}-01`
}

/**
 * Separate employees by field staff status
 */
export function separateEmployeesByType(
  employees: MonthlyPayrollRow[]
): { fieldStaff: MonthlyPayrollRow[]; nonFieldStaff: MonthlyPayrollRow[] } {
  const fieldStaff: MonthlyPayrollRow[] = []
  const nonFieldStaff: MonthlyPayrollRow[] = []

  employees.forEach(employee => {
    if (employee.is_field_staff) {
      fieldStaff.push(employee)
    } else {
      nonFieldStaff.push(employee)
    }
  })

  return { fieldStaff, nonFieldStaff }
}
