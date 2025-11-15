import { isFridayOrSaturday } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, getExcessMinutes, getUndertimeMinutes } from '@/views/system/admin/manage-payroll/payroll/computation/computation'

/**
 * Calculate client-side late and undertime deductions using PayrollPrint.vue logic
 * Returns { lateDeductionAmount, undertimeDeductionAmount }
 * Note: Field staff late/undertime deductions are calculated in SQL function
 */
export async function calculateLateAndUndertimeDeductions(
  employeeId: number,
  dateStringForCalculation: string,
  dailyRate: number,
  isFieldStaff: boolean,
  isAdmin: boolean = false
): Promise<{ lateDeductionAmount: number; undertimeDeductionAmount: number }> {
  // Field staff late/undertime deductions are calculated server-side in SQL function
  if (isFieldStaff) {
    return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
  }

  try {
    // Get attendance data using the same logic as PayrollPrint.vue
    const attendances = isAdmin
      ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForCalculation.substring(0, 7))
      : await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7))

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
    }

    // Calculate late and undertime minutes using the same logic as PayrollPrint.vue
    let totalLateAM = 0
    let totalLatePM = 0
    let totalUndertimeAM = 0
    let totalUndertimePM = 0

    attendances.forEach((attendance) => {
      const attendanceDate = attendance.attendance_date
      const isFriSat = attendanceDate ? isFridayOrSaturday(attendanceDate) : false

      // Determine time rules based on day of week (same as PayrollPrint.vue)
      const amStartTime = isFriSat ? '08:12' : '08:12'
      const pmStartTime = isFriSat ? '13:00' : '13:00'
      const amEndTime = isFriSat ? '11:50' : '11:50'
      const pmEndTime = isFriSat ? '16:30' : '17:00'

      // Calculate late minutes
      if (attendance.am_time_in) {
        const lateMinutes = getExcessMinutes(amStartTime, attendance.am_time_in)
        totalLateAM += lateMinutes
      }
      if (attendance.pm_time_in) {
        const lateMinutes = getExcessMinutes(pmStartTime, attendance.pm_time_in)
        totalLatePM += lateMinutes
      }

      // Calculate undertime minutes
      if (attendance.am_time_out) {
        const undertimeMinutes = getUndertimeMinutes(amEndTime, attendance.am_time_out)
        totalUndertimeAM += undertimeMinutes
      }
      if (attendance.pm_time_out) {
        const undertimeMinutes = getUndertimeMinutes(pmEndTime, attendance.pm_time_out)
        totalUndertimePM += undertimeMinutes
      }
    })

    const totalLateMinutes = totalLateAM + totalLatePM
    const totalUndertimeMinutes = totalUndertimeAM + totalUndertimePM

    // Convert minutes to monetary deductions using same formula as PayrollPrint.vue
    // Formula: (dailyRate / 8 hours / 60 minutes) * total minutes
    const perMinuteRate = dailyRate / 8 / 60
    const lateDeductionAmount = perMinuteRate * totalLateMinutes
    const undertimeDeductionAmount = perMinuteRate * totalUndertimeMinutes

    return {
      lateDeductionAmount: Number(lateDeductionAmount.toFixed(2)),
      undertimeDeductionAmount: Number(undertimeDeductionAmount.toFixed(2))
    }
  } catch (error) {
    console.error('[calculateLateAndUndertimeDeductions] Error calculating deductions:', error)
    return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
  }
}
