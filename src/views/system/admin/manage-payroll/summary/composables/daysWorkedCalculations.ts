import { getPaidLeaveDaysForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeeAttendanceById } from '@/views/system/admin/manage-payroll/payroll/computation/computation'
import { fetchHolidaysByRange, fetchHolidaysByDateString } from '@/views/system/admin/manage-payroll/payroll/computation/holidays'

/**
 * Check if an employee has actual attendance records on regular holidays
 * Returns the count of regular holidays where the employee actually came to work
 */
export async function countActualAttendanceOnRegularHolidays(
  employeeId: number,
  dateStringForCalculation: string,
  fromDate?: string,
  toDate?: string
): Promise<number> {
  try {
    // Get attendance data
    const attendances = await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7), fromDate, toDate)

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return 0
    }

    // Fetch holidays for the date range to check for Regular Holidays
    let holidays: Array<{ holiday_at: string; type: string | null }> = []
    if (fromDate && toDate) {
      holidays = await fetchHolidaysByRange(fromDate, toDate)
    } else {
      holidays = await fetchHolidaysByDateString(dateStringForCalculation)
    }

    let actualRHAttendanceCount = 0

    attendances.forEach((attendance) => {
      // Get the attendance date for Regular Holiday checking
      const attendanceDate = attendance.am_time_in?.split('T')[0] || attendance.pm_time_in?.split('T')[0] || ''

      // Check if this date is a Regular Holiday
      const isRegularHoliday = holidays.some(
        (h) => h.holiday_at === attendanceDate && h.type?.toUpperCase().includes('RH')
      )

      if (isRegularHoliday) {
        // Check if there's any actual attendance record
        const hasAnyAttendance =
          attendance.am_time_in || attendance.am_time_out || attendance.pm_time_in || attendance.pm_time_out

        if (hasAnyAttendance) {
          actualRHAttendanceCount += 1
          console.log(`[RH Actual Attendance] Employee ${employeeId} worked on Regular Holiday: ${attendanceDate}`)
        }
      }
    })

    return actualRHAttendanceCount
  } catch (error) {
    console.error('[countActualAttendanceOnRegularHolidays] Error:', error)
    return 0
  }
}

/**
 * Calculate accurate days worked using client-side attendance logic
 * This matches the calculation used in PayrollPrint.vue for consistency
 * NOTE: All employees get 1 day for each Regular Holiday in the period, regardless of attendance
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

    // Count Regular Holidays in the period - ALL employees get these days
    const regularHolidaysCount = holidays.filter(h => h.type?.toUpperCase().includes('RH')).length
    console.log(`[RH Days] Adding ${regularHolidaysCount} Regular Holiday days for employee ${employeeId}`)

    let employeePresentDays = 0

    // Track which dates are regular holidays for exclusion from regular attendance counting
    const regularHolidayDates = new Set(
      holidays.filter(h => h.type?.toUpperCase().includes('RH')).map(h => h.holiday_at)
    )

    // Use the same logic as payrollComputation.ts
    attendances.forEach((attendance) => {
      // Get the attendance date for Regular Holiday checking
      const attendanceDate = attendance.am_time_in?.split('T')[0] || attendance.pm_time_in?.split('T')[0] || ''

      // Skip counting attendance on Regular Holidays since we already counted them above
      if (regularHolidayDates.has(attendanceDate)) {
        return
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

      // Full day: both AM and PM data are available
      if (hasAmData && hasPmData) {
        employeePresentDays += 1
      }
      // Half day: only AM data or only PM data is available
      else if (hasAmData || hasPmData) {
        employeePresentDays += 0.5
      }
    })

    // Don't add regularHolidaysCount to employeePresentDays - RH is handled separately in holiday rows
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
 * NOTE: All employees get 1 day for each Regular Holiday in the period, regardless of attendance
 */
export async function calculateDaysWorkedForAdminByAmOnly(
  employeeId: number,
  dateStringForCalculation: string,
  fromDate?: string,
  toDate?: string
): Promise<number> {
  try {
    // Fetch holidays for the date range first
    let holidays: Array<{ holiday_at: string; type: string | null }> = []
    if (fromDate && toDate) {
      holidays = await fetchHolidaysByRange(fromDate, toDate)
    } else {
      holidays = await fetchHolidaysByDateString(dateStringForCalculation)
    }

    // Count Regular Holidays in the period - ALL employees get these days
    const regularHolidaysCount = holidays.filter(h => h.type?.toUpperCase().includes('RH')).length
    console.log(`[RH Days - Admin] Adding ${regularHolidaysCount} Regular Holiday days for employee ${employeeId}`)

    // Use standard attendance fetch but apply admin-specific logic
    const attendances = await getEmployeeAttendanceById(
      employeeId,
      dateStringForCalculation.substring(0, 7),
      fromDate,
      toDate
    )

    // Get paid leave days
    const paidLeaveDays = await getPaidLeaveDaysForMonth(dateStringForCalculation, employeeId, fromDate, toDate)

    if (!Array.isArray(attendances) || attendances.length === 0) {
      // Return regular holidays + paid leave days even if no attendance
      return regularHolidaysCount + (paidLeaveDays || 0)
    }

    let employeePresentDays = 0

    // Track which dates are regular holidays for exclusion from regular attendance counting
    const regularHolidayDates = new Set(
      holidays.filter(h => h.type?.toUpperCase().includes('RH')).map(h => h.holiday_at)
    )

    attendances.forEach((attendance) => {
      // Get the attendance date for Regular Holiday checking
      const attendanceDate = attendance.am_time_in?.split('T')[0] || attendance.pm_time_in?.split('T')[0] || ''

      // Skip counting attendance on Regular Holidays since we already counted them above
      if (regularHolidayDates.has(attendanceDate)) {
        return
      }

      const hasAmTimeIn =
        attendance.am_time_in !== null &&
        attendance.am_time_in !== undefined &&
        attendance.am_time_in !== ''

      if (hasAmTimeIn) {
        // Count as full day when AM time-in is present
        employeePresentDays += 1
      }
    })

    // Don't add regularHolidaysCount to employeePresentDays - RH is handled separately in holiday rows
    employeePresentDays += paidLeaveDays

    return employeePresentDays
  } catch (error) {
    console.error('[calculateDaysWorkedForAdminByAmOnly] Error calculating days worked for admin:', error)
    return 0
  }
}
