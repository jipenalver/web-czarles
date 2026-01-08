import { getTotalMinutesForMonth, getSundayDutyDaysForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { calculateOvertimeHours } from './overtimeCalculations'
import { calculateDaysWorked } from './daysWorkedCalculations'
import { calculateLateAndUndertimeDeductions } from './lateUndertimeCalculations'
import type { MonthlyPayrollRow } from './types'

/**
 * Process field staff employees with special calculations
 */
export async function processFieldStaffEmployees(
  fieldStaffEmployees: MonthlyPayrollRow[],
  dateStringForCalculation: string,
  fromDate?: string,
  toDate?: string
): Promise<void> {
  await Promise.all(
    fieldStaffEmployees.map(async (employee: MonthlyPayrollRow) => {
      // Calculate accurate days worked using client-side logic (matches PayrollPrint.vue)
      const accurateDaysWorked = await calculateDaysWorked(
        employee.employee_id,
        dateStringForCalculation,
        fromDate,
        toDate
      )
      employee.days_worked = Number(accurateDaysWorked.toFixed(1))

      // Calculate actual hours worked for field staff
      const totalWorkMinutes = await getTotalMinutesForMonth(
        dateStringForCalculation,
        employee.employee_id,
        true, // isField = true
        fromDate,
        toDate
      )
      employee.hours_worked = totalWorkMinutes / 60 // Convert minutes to hours

      // Calculate Sunday duty days and amount
      const sundayDays = await getSundayDutyDaysForMonth(
        dateStringForCalculation,
        employee.employee_id,
        fromDate,
        toDate
      )
      employee.sunday_days = sundayDays
      // Sunday amount is 30% premium (0.3x daily rate per Sunday worked)
      // Base daily rate is already counted in regular work
      employee.sunday_amount = sundayDays * employee.daily_rate * 0.3

      // Calculate client-side overtime hours (matches PayrollPrint.vue)
      const clientOvertimeHours = await calculateOvertimeHours(
        employee.employee_id,
        dateStringForCalculation,
        fromDate,
        toDate
      )
      employee.overtime_hrs = clientOvertimeHours

      // Calculate overtime pay: overtime hours * (hourly rate * 1.25)
      const hourlyRate = employee.daily_rate / 8
      const clientOvertimePay = clientOvertimeHours * (hourlyRate * 1.25)
      employee.overtime_pay = clientOvertimePay

      // Calculate basic_pay based on days_worked (matching PayrollPrint.vue field staff logic)
      // PayrollPrint calculates: regularWorkTotal = daily_rate * employeePresentDays
      // Where employeePresentDays is calculated from attendance records (full days + half days)
      const newBasicPay = employee.days_worked * employee.daily_rate

      // Calculate client-side late and undertime deductions for field staff
      // Field staff uses updated unified time rules: 7:20 AM start, 11:50 AM end
      const { lateDeductionAmount, undertimeDeductionAmount } = await calculateLateAndUndertimeDeductions(
        employee.employee_id,
        dateStringForCalculation,
        employee.daily_rate,
        true, // isFieldStaff = true
        fromDate,
        toDate,
        employee.is_admin || false // isAdmin parameter
      )

      // Update deductions with client-side calculated values
      employee.deductions.late = lateDeductionAmount
      employee.deductions.undertime = undertimeDeductionAmount

      // Recalculate gross_pay: basic_pay + allowance + overtime_pay + trips_pay + holidays_pay + sunday_amount + utilizations_pay
      // Sunday amount is the 30% premium for Sundays worked (separate from basic pay)
      const newGrossPay =
        newBasicPay +
        employee.allowance +
        clientOvertimePay +
        employee.trips_pay +
        (employee.holidays_pay || 0) +
        employee.sunday_amount +
        (employee.utilizations_pay || 0)
      employee.gross_pay = Number(newGrossPay.toFixed(2))

      // Recalculate total deductions with client-side calculated late/undertime values
      const newTotalDeductions =
        (employee.deductions.cash_advance || 0) +
        (employee.deductions.sss || 0) +
        (employee.deductions.phic || 0) +
        (employee.deductions.pagibig || 0) +
        (employee.deductions.sss_loan || 0) +
        (employee.deductions.savings || 0) +
        (employee.deductions.salary_deposit || 0) +
        lateDeductionAmount +
        undertimeDeductionAmount

      employee.total_deductions = Number(newTotalDeductions.toFixed(2))

      // Recalculate net_pay: gross_pay - total_deductions
      const newNetPay = newGrossPay - newTotalDeductions
      employee.net_pay = Number(newNetPay.toFixed(2))

      // Update basic_pay
      employee.basic_pay = Number(newBasicPay.toFixed(2))
    })
  )
}
