import { isFridayOrSaturday } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, getExcessMinutes, getUndertimeMinutes } from '@/views/system/admin/manage-payroll/payroll/computation/computation'

/**
 * Calculate unified late and undertime minutes for both field staff and office staff
 * Uses the same logic as payrollComputation.ts and AttendanceDaysTooltip.vue
 * Field staff: 7:20 AM start, 11:50 AM end, PM same as office
 * Office staff: 8:12 AM start, 11:50 AM end, PM varies by day
 */
function calculateUnifiedLateUndertime(
  attendances: Array<{ am_time_in?: string | null; pm_time_in?: string | null; am_time_out?: string | null; pm_time_out?: string | null; attendance_date?: string }>,
  isFieldStaff: boolean
): { lateMinutes: number; undertimeMinutes: number } {
  let totalLateMinutes = 0
  let totalUndertimeMinutes = 0

  attendances.forEach((attendance) => {
    const attendanceDate = attendance.attendance_date
    const isFriSat = attendanceDate ? isFridayOrSaturday(attendanceDate) : false

    // Determine time rules based on staff type and day of week
    let amStartTime, pmStartTime, amEndTime, pmEndTime

    if (isFieldStaff) {
      // Field staff time rules: 7:20 AM start, 11:50 AM end, PM same as office
      amStartTime = '07:20'
      pmStartTime = isFriSat ? '13:00' : '13:00'
      amEndTime = '11:50'
      pmEndTime = isFriSat ? '16:30' : '17:00'
    } else {
      // Office staff time rules: 8:12 AM start
      amStartTime = isFriSat ? '08:12' : '08:12'
      pmStartTime = isFriSat ? '13:00' : '13:00'
      amEndTime = isFriSat ? '11:50' : '11:50'
      pmEndTime = isFriSat ? '16:30' : '17:00'
    }

    // Calculate late minutes using helper functions
    if (attendance.am_time_in) {
      const lateMinutes = getExcessMinutes(amStartTime, attendance.am_time_in)
      totalLateMinutes += lateMinutes
    }
    if (attendance.pm_time_in) {
      const lateMinutes = getExcessMinutes(pmStartTime, attendance.pm_time_in)
      totalLateMinutes += lateMinutes
    }

    // Calculate undertime minutes using helper functions
    if (attendance.am_time_out) {
      const undertimeMinutes = getUndertimeMinutes(amEndTime, attendance.am_time_out)
      totalUndertimeMinutes += undertimeMinutes
    }
    if (attendance.pm_time_out) {
      const undertimeMinutes = getUndertimeMinutes(pmEndTime, attendance.pm_time_out)
      totalUndertimeMinutes += undertimeMinutes
    }
  })

  return { lateMinutes: totalLateMinutes, undertimeMinutes: totalUndertimeMinutes }
}

/**
 * Calculate client-side late and undertime deductions using PayrollPrint.vue logic
 * Returns { lateDeductionAmount, undertimeDeductionAmount }
 * Supports both field staff and office staff calculations
 */
export async function calculateLateAndUndertimeDeductions(
  employeeId: number,
  dateStringForCalculation: string,
  dailyRate: number,
  isFieldStaff: boolean,
  fromDate?: string,
  toDate?: string,
  isAdmin: boolean = false
): Promise<{ lateDeductionAmount: number; undertimeDeductionAmount: number }> {
  try {
    // Get attendance data using the same logic as PayrollPrint.vue
    const attendances = isAdmin
      ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForCalculation.substring(0, 7), fromDate, toDate)
      : await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7), fromDate, toDate)

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
    }

    let totalLateMinutes = 0
    let totalUndertimeMinutes = 0

    // Use unified calculation for both field staff and office staff
    const { lateMinutes, undertimeMinutes } = calculateUnifiedLateUndertime(attendances, isFieldStaff)
    totalLateMinutes = lateMinutes
    totalUndertimeMinutes = undertimeMinutes

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
