import { getPaidLeaveDaysForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55 } from '@/views/system/admin/manage-payroll/payroll/computation/computation'

/**
 * Calculate accurate days worked using client-side attendance logic
 * This matches the calculation used in PayrollPrint.vue for consistency
 */
export async function calculateDaysWorked(
  employeeId: number,
  dateStringForCalculation: string,
  isAdmin: boolean = false
): Promise<number> {
  try {
    // Get attendance data using the same logic as PayrollPrint.vue
    const attendances = isAdmin
      ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForCalculation.substring(0, 7))
      : await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7))

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return 0
    }

    // Get paid leave days
    const paidLeaveDays = await getPaidLeaveDaysForMonth(dateStringForCalculation, employeeId)

    let employeePresentDays = 0

    // Use the same logic as payrollComputation.ts
    attendances.forEach((attendance) => {
      // Check if both AM time-in and time-out are present and not empty strings
      const hasAmData =
        attendance.am_time_in !== null &&
        attendance.am_time_in !== undefined &&
        attendance.am_time_in !== '' &&
        attendance.am_time_out !== null &&
        attendance.am_time_out !== undefined &&
        attendance.am_time_out !== ''

      // Check if both PM time-in and time-out are present and not empty strings
      const hasPmData =
        attendance.pm_time_in !== null &&
        attendance.pm_time_in !== undefined &&
        attendance.pm_time_in !== '' &&
        attendance.pm_time_out !== null &&
        attendance.pm_time_out !== undefined &&
        attendance.pm_time_out !== ''

      // Full day: both AM and PM data are available
      if (hasAmData && hasPmData) {
        employeePresentDays += 1
      }
      // Half day: only AM data or only PM data is available
      else if (hasAmData || hasPmData) {
        employeePresentDays += 0.5
      }
    })

    // Add paid leave days to present days
    employeePresentDays += paidLeaveDays

    return employeePresentDays
  } catch (error) {
    console.error('[calculateDaysWorked] Error calculating days worked:', error)
    return 0
  }
}
