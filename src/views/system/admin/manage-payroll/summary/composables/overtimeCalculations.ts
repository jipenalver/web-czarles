import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, computeOvertimeHours } from '@/views/system/admin/manage-payroll/payroll/computation/computation'

/**
 * Calculate client-side overtime hours using PayrollPrint.vue logic
 * Returns total overtime hours for the month
 */
export async function calculateOvertimeHours(
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

    // Calculate total overtime hours using the same logic as PayrollPrint.vue
    let totalOvertimeHours = 0
    attendances.forEach((attendance) => {
      const overtimeHours = computeOvertimeHours(attendance.overtime_in, attendance.overtime_out)
      totalOvertimeHours += overtimeHours
    })

    return Number(totalOvertimeHours.toFixed(2))
  } catch (error) {
    console.error('[calculateOvertimeHours] Error calculating overtime hours:', error)
    return 0
  }
}
