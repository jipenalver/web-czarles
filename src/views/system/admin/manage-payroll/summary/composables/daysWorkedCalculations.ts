import { getPaidLeaveDaysForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeeAttendanceById } from '@/views/system/admin/manage-payroll/payroll/computation/computation'
import { fetchHolidaysByRange, fetchHolidaysByDateString } from '@/views/system/admin/manage-payroll/payroll/computation/holidays'

/**
 * Calculate accurate days worked using client-side attendance logic
 * This matches the calculation used in PayrollPrint.vue for consistency
 */
export async function calculateDaysWorked(
  employeeId: number,
  dateStringForCalculation: string,
  fromDate?: string,
  toDate?: string
): Promise<number> {
  try {
    // Get attendance data using standard fetch for all employees
    const attendances = await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7), fromDate, toDate)

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return 0
    }

    // Get paid leave days
    const paidLeaveDays = await getPaidLeaveDaysForMonth(dateStringForCalculation, employeeId, fromDate, toDate)

    // Fetch holidays for the date range to check for Regular Holidays
    let holidays: Array<{ holiday_at: string; type: string | null }> = []
    if (fromDate && toDate) {
      holidays = await fetchHolidaysByRange(fromDate, toDate)
    } else {
      holidays = await fetchHolidaysByDateString(dateStringForCalculation)
    }

    let employeePresentDays = 0

    // Use the same logic as payrollComputation.ts
    attendances.forEach((attendance) => {
      // Get the attendance date for Regular Holiday checking
      const attendanceDate = attendance.am_time_in?.split('T')[0] || attendance.pm_time_in?.split('T')[0] || ''

      // Check if this date is a Regular Holiday
      const isRegularHoliday = holidays.some(
        (h) => h.holiday_at === attendanceDate && h.type?.toUpperCase().includes('RH')
      )

      if (isRegularHoliday) {
        console.log(`[RH Detection] Found Regular Holiday attendance on ${attendanceDate} for employee ${employeeId}`)
      }

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

      // Check if there's any attendance record
      const hasAnyAttendance =
        attendance.am_time_in || attendance.am_time_out || attendance.pm_time_in || attendance.pm_time_out

      // If it's a Regular Holiday with any attendance, count as full day
      if (isRegularHoliday && hasAnyAttendance) {
        employeePresentDays += 1
      }
      // Full day: both AM and PM data are available
      else if (hasAmData && hasPmData) {
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

/**
 * Calculate days worked for admin employees where only AM time-in counts as a full day.
 * Counts any non-empty am_time_in as 1 day (regardless of am_time_out), plus paid leave days.
 * For Regular Holidays, any attendance counts as a full day.
 */
export async function calculateDaysWorkedForAdminByAmOnly(
  employeeId: number,
  dateStringForCalculation: string,
  fromDate?: string,
  toDate?: string
): Promise<number> {
  try {
    // Use standard attendance fetch but apply admin-specific logic
    const attendances = await getEmployeeAttendanceById(
      employeeId,
      dateStringForCalculation.substring(0, 7),
      fromDate,
      toDate
    )

    if (!Array.isArray(attendances) || attendances.length === 0) {
      // still get paid leave days in case there are none
      const paidLeaveDays = await getPaidLeaveDaysForMonth(dateStringForCalculation, employeeId, fromDate, toDate)
      return paidLeaveDays || 0
    }

    // Get paid leave days
    const paidLeaveDays = await getPaidLeaveDaysForMonth(dateStringForCalculation, employeeId, fromDate, toDate)

    // Fetch holidays for the date range to check for Regular Holidays
    let holidays: Array<{ holiday_at: string; type: string | null }> = []
    if (fromDate && toDate) {
      holidays = await fetchHolidaysByRange(fromDate, toDate)
    } else {
      holidays = await fetchHolidaysByDateString(dateStringForCalculation)
    }

    let employeePresentDays = 0

    attendances.forEach((attendance) => {
      // Get the attendance date for Regular Holiday checking
      const attendanceDate = attendance.am_time_in?.split('T')[0] || attendance.pm_time_in?.split('T')[0] || ''

      // Check if this date is a Regular Holiday
      const isRegularHoliday = holidays.some(
        (h) => h.holiday_at === attendanceDate && h.type?.toUpperCase().includes('RH')
      )

      if (isRegularHoliday) {
        console.log(`[RH Detection - Admin] Found Regular Holiday attendance on ${attendanceDate} for employee ${employeeId}`)
      }

      // Check if there's any attendance record
      const hasAnyAttendance =
        attendance.am_time_in || attendance.am_time_out || attendance.pm_time_in || attendance.pm_time_out

      // If it's a Regular Holiday with any attendance, count as full day
      if (isRegularHoliday && hasAnyAttendance) {
        employeePresentDays += 1
      } else {
        const hasAmTimeIn =
          attendance.am_time_in !== null &&
          attendance.am_time_in !== undefined &&
          attendance.am_time_in !== ''

        if (hasAmTimeIn) {
          // Count as full day when AM time-in is present
          employeePresentDays += 1
        }
      }
    })

    employeePresentDays += paidLeaveDays

    return employeePresentDays
  } catch (error) {
    console.error('[calculateDaysWorkedForAdminByAmOnly] Error calculating days worked for admin:', error)
    return 0
  }
}
