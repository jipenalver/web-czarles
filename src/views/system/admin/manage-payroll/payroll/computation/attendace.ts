import { getEmployeeAttendanceById } from './computation'

// 👉 Get Field minutes worked (handles overnight shifts)
const getFieldMinutes = (timeIn: string | Date | null, timeOut: string | Date | null) => {
  const checkIn = new Date(timeIn as string)
  const checkOut = new Date(timeOut as string)

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0

  let diffMs = checkOut.getTime() - checkIn.getTime()

  // Handle overnight shifts: if end time is earlier than start time, assume it's the next day
  if (diffMs < 0) {
    const nextDayEnd = new Date(checkOut)
    nextDayEnd.setDate(nextDayEnd.getDate() + 1)
    diffMs = nextDayEnd.getTime() - checkIn.getTime()
  }

  return Math.max(0, Math.floor(diffMs / (1000 * 60)))
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
  let totalMinutes = 0

  if (isField) {
    // Field staff: Calculate total time worked and apply penalty if under 8 hours
    const amMinutes = getFieldMinutes(amTimeIn, amTimeOut)
    const pmMinutes = getFieldMinutes(pmTimeIn, pmTimeOut)
    const actualMinutes = amMinutes + pmMinutes

    // Apply 8-hour requirement with penalty
    const expectedMinutes = 8 * 60 // 8 hours = 480 minutes
    if (actualMinutes < expectedMinutes) {
      const shortage = expectedMinutes - actualMinutes
      // Apply penalty: deduct the shortage from actual time worked
      totalMinutes = Math.max(0, actualMinutes - shortage)
    }
    // If 8 hours or more, cap at 8 hours
    else totalMinutes = Math.min(actualMinutes, expectedMinutes)
  } else {
    // Office staff: Constrain to office hours (8am-12pm, 1pm-5pm)
    const amMinutes = getOfficeMinutes(amTimeIn, amTimeOut, 8, 12) // 8am-12pm
    const pmMinutes = getOfficeMinutes(pmTimeIn, pmTimeOut, 13, 17) // 1pm-5pm
    totalMinutes = amMinutes + pmMinutes
  }

  return totalMinutes
}

/**
 * Get total minutes worked for entire month - Fetches all attendance records within month range
 * @param filterDateString - Format: "YYYY-MM-01" (e.g., "2024-12-01")
 * @param employeeId - The ID of the employee
 * @param isField - Whether the employee is field staff or office staff
 * @returns Promise<number> - Total minutes worked for the entire month
 * 
 * @example
 * // For office staff in December 2024
 * const totalMinutes = await getTotalMinutesForMonth("2024-12-01", 123, false)
 * 
 * // For field staff in December 2024
 * const totalMinutes = await getTotalMinutesForMonth("2024-12-01", 123, true)
 */
export const getTotalMinutesForMonth = async (
  filterDateString: string, // Format: "YYYY-MM-01"
  employeeId: number,
  isField = false,
): Promise<number> => {

  
  // Extract year-month from filterDateString para sa month range
  const dateStringForQuery = filterDateString.substring(0, 7) // "YYYY-MM"
  
  try {
    // Fetch tanan attendance records para sa specific month
    const attendances = await getEmployeeAttendanceById(employeeId, dateStringForQuery)
    
    if (!Array.isArray(attendances) || attendances.length === 0) {
      return 0
    }

    let totalMonthMinutes = 0

    // Process each attendance record using getTotalMinutes
    attendances.forEach((attendance) => {
      const dailyMinutes = getTotalMinutes(
        attendance.am_time_in,
        attendance.am_time_out,
        attendance.pm_time_in,
        attendance.pm_time_out,
        isField
      )
      totalMonthMinutes += dailyMinutes
    })
    //console.log(`[getTotalMinutesForMonth] Total minutes for employee ${employeeId} in month ${dateStringForQuery}:`, totalMonthMinutes)
    return totalMonthMinutes
  } catch (error) {
    console.error('Error sa getTotalMinutesForMonth:', error)
    return 0
  }
}

// 👉 Convert total minutes to a human-readable string
const convertTimeToString = (totalMinutes: number) => {
  if (totalMinutes === 0) return '0 minutes'

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const hourText = hours === 1 ? 'hour' : 'hours'
  const minuteText = minutes === 1 ? 'minute' : 'minutes'

  if (hours === 0) return `${minutes} ${minuteText}`
  if (minutes === 0) return `${hours} ${hourText}`
  return `${hours} ${hourText} ${minutes} ${minuteText}`
}

// 👉 Convert total minutes to a decimal string
const convertTimeToDecimal = (totalMinutes: number) => {
  if (totalMinutes === 0) return 0

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return Math.round((hours + minutes / 60) * 100) / 100
}

// 👉 Get total work hours (AM + PM) for entire month
export const getWorkHoursStringForMonth = async (
  filterDateString: string,
  employeeId: number,
  isField = false,
) => {
  const totalMinutes = await getTotalMinutesForMonth(filterDateString, employeeId, isField)
  return convertTimeToString(totalMinutes)
}

// 👉 Get total work hours (AM + PM) in decimal for entire month
export const getWorkHoursDecimalForMonth = async (
  filterDateString: string,
  employeeId: number,
  isField = false,
) => {
  const totalMinutes = await getTotalMinutesForMonth(filterDateString, employeeId, isField)
  return convertTimeToDecimal(totalMinutes)
}

// 👉 Get total work hours (AM + PM) - Single day calculation
export const getWorkHoursString = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => convertTimeToString(getTotalMinutes(amTimeIn, amTimeOut, pmTimeIn, pmTimeOut, isField))

// 👉 Get total work hours (AM + PM) in decimal - Single day calculation
export const getWorkHoursDecimal = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => convertTimeToDecimal(getTotalMinutes(amTimeIn, amTimeOut, pmTimeIn, pmTimeOut, isField))

// 👉 Get total overtime hours as string
export const getOvertimeHoursString = (overtimeIn: string | null, overtimeOut: string | null) =>
  convertTimeToString(getFieldMinutes(overtimeIn, overtimeOut))

// 👉 Get total overtime hours as decimal
export const getOvertimeHoursDecimal = (overtimeIn: string | null, overtimeOut: string | null) =>
  convertTimeToDecimal(getFieldMinutes(overtimeIn, overtimeOut))

// 👉 Get total late/undertime hours for entire month as string
export const getLateUndertimeHoursStringForMonth = async (
  filterDateString: string,
  employeeId: number,
  isField = false,
  expectedDailyHours = 8,
) => {
  const totalMinutes = await getTotalMinutesForMonth(filterDateString, employeeId, isField)
  
  // Calculate expected total hours for the month
  const { getEmployeeAttendanceById } = await import('./computation')
  const dateStringForQuery = filterDateString.substring(0, 7)
  const attendances = await getEmployeeAttendanceById(employeeId, dateStringForQuery)
  const workingDays = Array.isArray(attendances) ? attendances.length : 0
  
  const expectedTotalMinutes = workingDays * expectedDailyHours * 60
  const lateUndertime = expectedTotalMinutes - totalMinutes
  return convertTimeToString(Math.max(0, lateUndertime))
}

// 👉 Get total late/undertime hours for entire month as decimal
export const getLateUndertimeHoursDecimalForMonth = async (
  filterDateString: string,
  employeeId: number,
  isField = false,
  expectedDailyHours = 8,
) => {
  const totalMinutes = await getTotalMinutesForMonth(filterDateString, employeeId, isField)
  
  // Calculate expected total hours for the month
  const { getEmployeeAttendanceById } = await import('./computation')
  const dateStringForQuery = filterDateString.substring(0, 7)
  const attendances = await getEmployeeAttendanceById(employeeId, dateStringForQuery)
  const workingDays = Array.isArray(attendances) ? attendances.length : 0
  
  const expectedTotalMinutes = workingDays * expectedDailyHours * 60
  const lateUndertime = expectedTotalMinutes - totalMinutes
  return convertTimeToDecimal(Math.max(0, lateUndertime))
}

// 👉 Get total late/undertime hours as string - Single day calculation
export const getLateUndertimeHoursString = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => {
  const totalMinutes = getTotalMinutes(amTimeIn, amTimeOut, pmTimeIn, pmTimeOut, isField)
  const lateUndertime = 8 * 60 - totalMinutes
  return convertTimeToString(Math.max(0, lateUndertime))
}

// 👉 Get total late/undertime hours as decimal - Single day calculation
export const getLateUndertimeHoursDecimal = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => {
  const totalMinutes = getTotalMinutes(amTimeIn, amTimeOut, pmTimeIn, pmTimeOut, isField)
  const lateUndertime = 8 * 60 - totalMinutes
  return convertTimeToDecimal(Math.max(0, lateUndertime))
}
