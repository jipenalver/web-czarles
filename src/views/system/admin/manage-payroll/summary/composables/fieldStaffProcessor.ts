import { getTotalMinutesForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { calculateOvertimeHours } from './overtimeCalculations'
import { calculateDaysWorked } from './daysWorkedCalculations'
import type { MonthlyPayrollRow } from './types'

/**
 * Process field staff employees with special calculations
 */
export async function processFieldStaffEmployees(
  fieldStaffEmployees: MonthlyPayrollRow[],
  dateStringForCalculation: string
): Promise<void> {
  await Promise.all(
    fieldStaffEmployees.map(async (employee: MonthlyPayrollRow) => {
      // Calculate accurate days worked using client-side logic (matches PayrollPrint.vue)
      const accurateDaysWorked = await calculateDaysWorked(
        employee.employee_id,
        dateStringForCalculation
      )
      employee.days_worked = Number(accurateDaysWorked.toFixed(1))

      // Calculate actual hours worked for field staff
      const totalWorkMinutes = await getTotalMinutesForMonth(
        dateStringForCalculation,
        employee.employee_id,
        true // isField = true
      )
      employee.hours_worked = totalWorkMinutes / 60 // Convert minutes to hours

      // Calculate client-side overtime hours (matches PayrollPrint.vue)
      const clientOvertimeHours = await calculateOvertimeHours(
        employee.employee_id,
        dateStringForCalculation
      )
      employee.overtime_hrs = clientOvertimeHours

      // Calculate overtime pay: overtime hours * (hourly rate * 1.25)
      const hourlyRate = employee.daily_rate / 8
      const clientOvertimePay = clientOvertimeHours * (hourlyRate * 1.25)
      employee.overtime_pay = Number(clientOvertimePay.toFixed(2))

      // Recalculate basic_pay based on actual hours worked
      // Formula: (hours worked * hourly rate) where hourly rate = daily rate / 8
      const newBasicPay = employee.hours_worked * hourlyRate

      // Recalculate gross_pay: basic_pay + allowance + overtime_pay + trips_pay + holidays_pay + utilizations_pay
      const newGrossPay =
        newBasicPay +
        employee.allowance +
        clientOvertimePay +
        employee.trips_pay +
        employee.holidays_pay +
        (employee.utilizations_pay || 0)

      // Recalculate net_pay: gross_pay - total_deductions
      const newNetPay = newGrossPay - employee.total_deductions

      // Update the employee record with recalculated values
      employee.basic_pay = Number(newBasicPay.toFixed(2))
      employee.gross_pay = Number(newGrossPay.toFixed(2))
      employee.net_pay = Number(newNetPay.toFixed(2))

      // Field staff don't have late/undertime deductions (set to 0)
      employee.deductions.late = 0
      employee.deductions.undertime = 0
    })
  )
}
