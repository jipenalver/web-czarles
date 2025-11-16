import { isFridayOrSaturday } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, getExcessMinutes, getUndertimeMinutes } from '@/views/system/admin/manage-payroll/payroll/computation/computation'

/**
 * Calculate field staff late and undertime minutes using allowance-based approach
 * Matches PayrollPrint.vue calculateFieldStaffLateUndertime logic
 * AM: 7:00-11:00 with 20min late allowance (7:20 threshold) and 50min early departure allowance (10:10 threshold)
 * PM: 1:00-5:00 strict (no allowances)
 */
function calculateFieldStaffLateUndertime(
  attendances: Array<{ am_time_in?: string | null; pm_time_in?: string | null; am_time_out?: string | null; pm_time_out?: string | null }>
): { lateMinutes: number; undertimeMinutes: number } {
  let totalLateMinutes = 0
  let totalUndertimeMinutes = 0

  attendances.forEach((attendance) => {
    // AM Session: 7:00 AM - 11:00 AM with allowances
    if (attendance.am_time_in && attendance.am_time_out) {
      const amTimeIn = new Date(`1970-01-01T${attendance.am_time_in}`)
      const amTimeOut = new Date(`1970-01-01T${attendance.am_time_out}`)

      // AM start: 7:00 AM + 20min allowance = 7:20 AM
      const amStartWithAllowance = new Date('1970-01-01T07:20:00')

      // AM end: 11:00 AM - 50min allowance = 10:10 AM
      const amEndWithAllowance = new Date('1970-01-01T10:10:00')

      // Calculate late (after 7:20 AM)
      if (amTimeIn > amStartWithAllowance) {
        const lateMinutes = Math.floor((amTimeIn.getTime() - amStartWithAllowance.getTime()) / (1000 * 60))
        totalLateMinutes += lateMinutes
      }

      // Calculate undertime (before 10:10 AM)
      if (amTimeOut < amEndWithAllowance) {
        const undertimeMinutes = Math.floor((amEndWithAllowance.getTime() - amTimeOut.getTime()) / (1000 * 60))
        totalUndertimeMinutes += undertimeMinutes
      }
    }

    // PM Session: 1:00 PM - 5:00 PM (strict, no allowances)
    if (attendance.pm_time_in && attendance.pm_time_out) {
      const pmTimeIn = new Date(`1970-01-01T${attendance.pm_time_in}`)
      const pmTimeOut = new Date(`1970-01-01T${attendance.pm_time_out}`)

      // PM start: 1:00 PM (strict)
      const pmStartThreshold = new Date('1970-01-01T13:00:00')

      // PM end: 5:00 PM (strict)
      const pmEndThreshold = new Date('1970-01-01T17:00:00')

      // Calculate late (after 1:00 PM)
      if (pmTimeIn > pmStartThreshold) {
        const lateMinutes = Math.floor((pmTimeIn.getTime() - pmStartThreshold.getTime()) / (1000 * 60))
        totalLateMinutes += lateMinutes
      }

      // Calculate undertime (before 5:00 PM)
      if (pmTimeOut < pmEndThreshold) {
        const undertimeMinutes = Math.floor((pmEndThreshold.getTime() - pmTimeOut.getTime()) / (1000 * 60))
        totalUndertimeMinutes += undertimeMinutes
      }
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

    if (isFieldStaff) {
      // Use field staff specific calculation with allowances
      const { lateMinutes, undertimeMinutes } = calculateFieldStaffLateUndertime(attendances)
      totalLateMinutes = lateMinutes
      totalUndertimeMinutes = undertimeMinutes
    } else {
      // Office staff calculation with Friday/Saturday rules
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

      totalLateMinutes = totalLateAM + totalLatePM
      totalUndertimeMinutes = totalUndertimeAM + totalUndertimePM
    }

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
