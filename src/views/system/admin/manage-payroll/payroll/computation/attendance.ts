import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, type AttendanceRecord } from './computation'
// this script is naka connect sa computation.ts file IMPORTANT
// 👉 Get total paid leave days para sa employee sa specific month
// 👉 Get Field minutes worked (handles overnight shifts) - Time-only calculation
const getFieldMinutes = (timeIn: string | Date | null, timeOut: string | Date | null) => {
  // console.log('[getFieldMinutes] Input:', { timeIn, timeOut })

  try {
    // Handle null or undefined inputs
    if (!timeIn || !timeOut) {
      console.warn('[getFieldMinutes] Missing timeIn or timeOut:', { timeIn, timeOut })
      return 0
    }

    // Helper function to convert time input to minutes since midnight
    const timeToMinutes = (timeInput: string | Date): number => {
      let hours: number, minutes: number

      if (timeInput instanceof Date) {
        hours = timeInput.getHours()
        minutes = timeInput.getMinutes()
      } else if (typeof timeInput === 'string') {
        // Handle HH:MM format
        if (/^\d{1,2}:\d{2}$/.test(timeInput.trim())) {
          ;[hours, minutes] = timeInput.trim().split(':').map(Number)
        } else {
          // Handle full datetime string - extract time part
          const date = new Date(timeInput)
          if (isNaN(date.getTime())) {
            throw new Error(`Invalid time format: ${timeInput}`)
          }
          hours = date.getHours()
          minutes = date.getMinutes()
        }
      } else {
        throw new Error(`Unsupported time input type: ${typeof timeInput}`)
      }

      return hours * 60 + minutes
    }

    const startMinutes = timeToMinutes(timeIn)
    const endMinutes = timeToMinutes(timeOut)

    /*  console.log('[getFieldMinutes] Time converted to minutes:', {
      startMinutes,
      endMinutes,
      startTime: `${Math.floor(startMinutes / 60)}:${(startMinutes % 60).toString().padStart(2, '0')}`,
      endTime: `${Math.floor(endMinutes / 60)}:${(endMinutes % 60).toString().padStart(2, '0')}`
    }) */

    let totalMinutes: number

    // Handle overnight shifts: if end time is earlier than start time
    if (endMinutes < startMinutes) {
      // console.log('[getFieldMinutes] Detected overnight shift')
      // Add 24 hours (1440 minutes) to end time for overnight calculation
      totalMinutes = endMinutes + 1440 - startMinutes
    } else {
      // Regular same-day shift
      totalMinutes = endMinutes - startMinutes
    }

    // Ensure non-negative result
    totalMinutes = Math.max(0, totalMinutes)

    //console.log('[getFieldMinutes] Calculated minutes:', totalMinutes)

    return totalMinutes
  } catch (error) {
    console.error('[getFieldMinutes] Error processing time:', error, { timeIn, timeOut })
    return 0
  }
}

// 👉 Get Office minutes worked with penalties for late arrivals and early departures
const getOfficeMinutes = (
  timeIn: string | Date | null,
  timeOut: string | Date | null,
  sessionStart: number,
  sessionEnd: number,
) => {
  // Strip timezone information and parse as local time
  const parseLocalTime = (timeString: string | Date) => {
    if (typeof timeString === 'string') {
      // Remove timezone offset (+00:00, +08:00, etc.)
      const localTimeString = timeString.replace(/[+\-]\d{2}:?\d{0,2}$/, '')
      return new Date(localTimeString)
    }
    return new Date(timeString)
  }

  const checkIn = parseLocalTime(timeIn as string)
  const checkOut = parseLocalTime(timeOut as string)

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0

  // Ensure check-in and check-out are within the same day
  const sessionStartTime = new Date(
    checkIn.getFullYear(),
    checkIn.getMonth(),
    checkIn.getDate(),
    sessionStart,
  )
  const sessionEndTime = new Date(
    checkIn.getFullYear(),
    checkIn.getMonth(),
    checkIn.getDate(),
    sessionEnd,
  )

  // If check-out is before session start or check-in is after session end, no overlap
  if (checkOut <= sessionStartTime || checkIn >= sessionEndTime) return 0

  // Calculate effective times with penalties
  let effectiveIn = sessionStartTime // Always start from session start
  let effectiveOut = sessionEndTime // Always end at session end

  // Late arrival penalty: If arrived late, start from actual check-in time
  if (checkIn > sessionStartTime) effectiveIn = checkIn

  // Early departure penalty: If left early, end at actual check-out time
  if (checkOut < sessionEndTime) effectiveOut = checkOut

  // Calculate minutes within session bounds with deductions applied
  const diffMs = effectiveOut.getTime() - effectiveIn.getTime()

  // If negative, it means no valid time worked
  return Math.max(0, Math.floor(diffMs / (1000 * 60)))
}

// 👉 Get total minutes worked (AM + PM) - Single day calculation
export const getTotalMinutes = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => {
  //   console.log('[getTotalMinutes] Input:', {
  //     amTimeIn,
  //     amTimeOut,
  //     pmTimeIn,
  //     pmTimeOut,
  //     isField
  //   })

  let totalMinutes = 0

  if (isField) {
    // Field staff: Calculate total time worked and apply penalty if under 8 hours
    const amMinutes = getFieldMinutes(amTimeIn, amTimeOut)
    const pmMinutes = getFieldMinutes(pmTimeIn, pmTimeOut)
    const actualMinutes = amMinutes + pmMinutes

    // console.log('[getTotalMinutes] Field staff - amMinutes:', amMinutes, 'pmMinutes:', pmMinutes, 'actualMinutes:', actualMinutes)

    // Return actual minutes worked, cap at 8 hours
    totalMinutes = Math.min(actualMinutes, 8 * 60) // Cap at 8 hours maximum
  } else {
    // Office staff: Constrain to office hours (8am-12pm, 1pm-5pm)
    const amMinutes = getOfficeMinutes(amTimeIn, amTimeOut, 8, 12) // 8am-12pm
    const pmMinutes = getOfficeMinutes(pmTimeIn, pmTimeOut, 13, 17) // 1pm-5pm
    totalMinutes = amMinutes + pmMinutes
    // console.log('[getTotalMinutes] Office staff amMinutes:', amMinutes, 'pmMinutes:', pmMinutes, 'totalMinutes:', totalMinutes)
  }

  // console.log('[getTotalMinutes] Output totalMinutes:', totalMinutes)
  return totalMinutes
}

export const getTotalMinutesForMonth = async (
  filterDateString: string, // Format: "YYYY-MM-01"
  employeeId: number,
  isField = false,
  fromDateISO?: string, // Optional: Custom start date for crossmonth (YYYY-MM-DD)
  toDateISO?: string, // Optional: Custom end date for crossmonth (YYYY-MM-DD)
): Promise<number> => {
  // Extract year-month from filterDateString para sa month range
  const dateStringForQuery = filterDateString.substring(0, 7) // "YYYY-MM"

  try {
    // Fetch tanan attendance records para sa specific month
    // Use special function for employee 55, regular function for others
    // If custom date range is provided, pass it to the query function
    const attendances = employeeId === 55
      ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForQuery)
      : await getEmployeeAttendanceById(employeeId, dateStringForQuery, fromDateISO, toDateISO)

    // console.log(`[getTotalMinutesForMonth] Debug info:`, {
    //   employeeId,
    //   dateStringForQuery,
    //   attendancesCount: attendances?.length || 0,
    //   isField
    // })

    if (!Array.isArray(attendances) || attendances.length === 0) {
      //para sa payrollPrintDialog
      /* console.log(
        `[getTotalMinutesForMonth] No attendance records found for employee ${employeeId} in ${dateStringForQuery}`,
      ) */
      return 0
    }

    let totalMonthMinutes = 0

    // Process each attendance record using getTotalMinutes
    attendances.forEach((attendance, /* index */) => {
     /*  console.log(`[getTotalMinutesForMonth] Processing attendance ${index + 1}:`, {
         am_time_in: attendance.am_time_in,
         am_time_out: attendance.am_time_out,
         pm_time_in: attendance.pm_time_in,
         pm_time_out: attendance.pm_time_out
       }) */

      const dailyMinutes = getTotalMinutes(
        attendance.am_time_in,
        attendance.am_time_out,
        attendance.pm_time_in,
        attendance.pm_time_out,
        isField,
      )

      // console.log(`[getTotalMinutesForMonth] Daily minutes calculated:`, dailyMinutes)
      totalMonthMinutes += dailyMinutes
    })

    // console.log(`[getTotalMinutesForMonth] Total minutes for employee ${employeeId} in month ${dateStringForQuery}:`, totalMonthMinutes)
    return totalMonthMinutes
  } catch (error) {
    console.error('Error sa getTotalMinutesForMonth:', error)
    return 0
  }
}

export const getPaidLeaveDaysForMonth = async (
  filterDateString: string, // Format: "YYYY-MM-01"
  employeeId: number,
  fromDateISO?: string, // Optional: Custom start date for crossmonth (YYYY-MM-DD)
  toDateISO?: string, // Optional: Custom end date for crossmonth (YYYY-MM-DD)
): Promise<number> => {
  // Extract year-month from filterDateString para sa month range
  const dateStringForQuery = filterDateString.substring(0, 7) // "YYYY-MM"

  try {
    // Fetch tanan attendance records para sa specific month
    // Use special function for employee 55, regular function for others
    const attendancesResult = employeeId === 55
      ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForQuery)
      : await getEmployeeAttendanceById(employeeId, dateStringForQuery, fromDateISO, toDateISO)
    const attendances: AttendanceRecord[] = attendancesResult || []

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return 0
    }

    let paidLeaveDaysCounter = 0

    // Simple iteration: if is_leave_with_pay is true, count it and use am_time_in as day indicator
    attendances.forEach((attendance) => {
      // Console log para check kung may data ang is_leave_with_pay
     /*  console.log(`[getPaidLeaveDaysForMonth] Checking attendance record:`, {
        am_time_in: attendance.am_time_in,
        is_leave_with_pay: attendance.is_leave_with_pay,
        has_leave_data:
          attendance.is_leave_with_pay !== undefined && attendance.is_leave_with_pay !== null,
      }) */

      if (attendance.is_leave_with_pay === true) {
        paidLeaveDaysCounter++
        // Use am_time_in as day indicator para sa paid leave
       /*  console.log(`[getPaidLeaveDaysForMonth] Paid leave day found:`, {
          day_indicator: attendance.am_time_in,
          leave_type: attendance.leave_type,
          leave_reason: attendance.leave_reason,
        }) */
      }
    })

    /* console.log(
      `[getPaidLeaveDaysForMonth] Total paid leave days for employee ${employeeId} in month ${dateStringForQuery}:`,
      paidLeaveDaysCounter,
    ) */
    return paidLeaveDaysCounter
  } catch (error) {
    console.error('Error sa getPaidLeaveDaysForMonth:', error)
    return 0
  }
}

// Helper function to check if a date is Friday or Saturday
export function isFridayOrSaturday(dateString: string): boolean {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay() // 0 = Sunday, 1 = Monday, ..., 5 = Friday, 6 = Saturday
  return dayOfWeek === 5 || dayOfWeek === 6 // Friday or Saturday
}

// Helper function to check if a date is Sunday
export function isSunday(dateString: string): boolean {
  const date = new Date(dateString)
  const dayOfWeek = date.getDay() // 0 = Sunday
  return dayOfWeek === 0
}

// Type for Sunday duty with attendance fraction
export type SundayDutyRecord = {
  date: string
  attendance_fraction: number // 0, 0.5, or 1.0
}

// 👉 Get Sunday duty records with fractions para sa employee sa specific month
export const getSundayDutyRecordsForMonth = async (
  filterDateString: string, // Format: "YYYY-MM-01"
  employeeId: number,
  fromDateISO?: string, // Optional: Custom start date for crossmonth (YYYY-MM-DD)
  toDateISO?: string, // Optional: Custom end date for crossmonth (YYYY-MM-DD)
): Promise<SundayDutyRecord[]> => {
  // Extract year-month from filterDateString para sa month range
  const dateStringForQuery = filterDateString.substring(0, 7) // "YYYY-MM"

  try {
    // Fetch tanan attendance records para sa specific month
    // Use special function for employee 55, regular function for others
    const attendancesResult = employeeId === 55
      ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForQuery, fromDateISO, toDateISO)
      : await getEmployeeAttendanceById(employeeId, dateStringForQuery, fromDateISO, toDateISO)
    const attendances: AttendanceRecord[] = attendancesResult || []

    if (!Array.isArray(attendances) || attendances.length === 0) {
      return []
    }

    const sundayDutyRecords: SundayDutyRecord[] = []

    // Iterate through all attendance records and check if the date is Sunday
    attendances.forEach((attendance) => {
      // Check if attendance has a date and if it's a Sunday
      if (attendance.date && isSunday(attendance.date)) {
        // Check if there's actual time-in recorded
        if (attendance.am_time_in || attendance.pm_time_in) {
          let attendance_fraction = 0

          // Calculate fraction based on AM/PM attendance
          const hasAM = attendance.am_time_in && attendance.am_time_out
          const hasPM = attendance.pm_time_in && attendance.pm_time_out

          if (hasAM && hasPM) {
            attendance_fraction = 1.0 // Full day
          } else if (hasAM || hasPM) {
            attendance_fraction = 0.5 // Half day
          }

          if (attendance_fraction > 0) {
            sundayDutyRecords.push({
              date: attendance.date,
              attendance_fraction
            })
          }

          /* console.log(`[getSundayDutyRecordsForMonth] Sunday duty found:`, {
            date: attendance.date,
            attendance_fraction,
            am_time_in: attendance.am_time_in,
            am_time_out: attendance.am_time_out,
            pm_time_in: attendance.pm_time_in,
            pm_time_out: attendance.pm_time_out,
          }) */
        }
      }
    })

 /*    console.log(
      `[getSundayDutyRecordsForMonth] Sunday duty records for employee ${employeeId} in month ${dateStringForQuery}:`,
      sundayDutyRecords,
    ) */
    return sundayDutyRecords
  } catch (error) {
    console.error('Error sa getSundayDutyRecordsForMonth:', error)
    return []
  }
}

// 👉 Get total Sunday duty days para sa employee sa specific month (backward compatibility)
export const getSundayDutyDaysForMonth = async (
  filterDateString: string, // Format: "YYYY-MM-01"
  employeeId: number,
  fromDateISO?: string, // Optional: Custom start date for crossmonth (YYYY-MM-DD)
  toDateISO?: string, // Optional: Custom end date for crossmonth (YYYY-MM-DD)
): Promise<number> => {
  try {
    const sundayRecords = await getSundayDutyRecordsForMonth(filterDateString, employeeId, fromDateISO, toDateISO)

    // Sum up all attendance fractions to get total days
    const totalDays = sundayRecords.reduce((sum, record) => sum + record.attendance_fraction, 0)

    return totalDays
  } catch (error) {
    console.error('Error sa getSundayDutyDaysForMonth:', error)
    return 0
  }
}
