import { getSundayDutyDaysForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { calculateOvertimeHours } from './overtimeCalculations'
import { calculateDaysWorked } from './daysWorkedCalculations'
import { calculateLateAndUndertimeDeductions } from './lateUndertimeCalculations'
import type { MonthlyPayrollRow } from './types'

/**
 * Process non-field staff employees with late/undertime calculations
 */
export async function processNonFieldStaffEmployees(
  nonFieldStaffEmployees: MonthlyPayrollRow[],
  dateStringForCalculation: string
): Promise<void> {
  await Promise.all(
    nonFieldStaffEmployees.map(async (employee: MonthlyPayrollRow) => {
      // Calculate accurate days worked using client-side logic (matches PayrollPrint.vue)
      const accurateDaysWorked = await calculateDaysWorked(
        employee.employee_id,
        dateStringForCalculation
      )
      employee.days_worked = Number(accurateDaysWorked.toFixed(1))

      // Calculate Sunday duty days and amount
      const sundayDays = await getSundayDutyDaysForMonth(
        dateStringForCalculation,
        employee.employee_id
      )
      employee.sunday_days = sundayDays
      // Sunday amount is 30% premium (0.3x daily rate per Sunday worked)
      // Base daily rate is already counted in regular work
      employee.sunday_amount = sundayDays * employee.daily_rate * 0.3

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

      // Calculate client-side late and undertime deductions (matches PayrollPrint.vue)
      const { lateDeductionAmount, undertimeDeductionAmount } = await calculateLateAndUndertimeDeductions(
        employee.employee_id,
        dateStringForCalculation,
        employee.daily_rate,
        false // non-field staff
      )

      // Update deductions with client-side calculated values
      employee.deductions.late = lateDeductionAmount
      employee.deductions.undertime = undertimeDeductionAmount

      // Recalculate gross_pay: basic_pay + allowance + overtime_pay + trips_pay + holidays_pay + utilizations_pay + sunday_amount
      const newGrossPay =
        employee.basic_pay +
        employee.allowance +
        clientOvertimePay +
        employee.trips_pay +
        employee.holidays_pay +
        (employee.utilizations_pay || 0) +
        employee.sunday_amount
      employee.gross_pay = Number(newGrossPay.toFixed(2))

      // Recalculate total_deductions and net_pay with new late/undertime values
      const newTotalDeductions =
        employee.deductions.cash_advance +
        employee.deductions.sss +
        employee.deductions.phic +
        employee.deductions.pagibig +
        employee.deductions.sss_loan +
        employee.deductions.savings +
        employee.deductions.salary_deposit +
        lateDeductionAmount +
        undertimeDeductionAmount

      employee.total_deductions = Number(newTotalDeductions.toFixed(2))
      employee.net_pay = Number((newGrossPay - newTotalDeductions).toFixed(2))
    })
  )
}
