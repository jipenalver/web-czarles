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

// 👉 Get total minutes worked (AM + PM)
const getTotalMinutes = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => {
  console.log('getTotalMinutes', { amTimeIn, amTimeOut, pmTimeIn, pmTimeOut, isField })

  let totalMinutes = 0

  if (isField) {
    // Field staff: Calculate total time worked
    const amMinutes = getFieldMinutes(amTimeIn, amTimeOut)
    const pmMinutes = getFieldMinutes(pmTimeIn, pmTimeOut)
    const actualMinutes = amMinutes + pmMinutes

    // ✅ Fix: Just return actual minutes worked, cap at 8 hours
    totalMinutes = Math.min(actualMinutes, 8 * 60) // Cap at 8 hours maximum
  } else {
    // Office staff: Constrain to office hours (8am-12pm, 1pm-5pm)
    const amMinutes = getOfficeMinutes(amTimeIn, amTimeOut, 8, 12) // 8am-12pm
    const pmMinutes = getOfficeMinutes(pmTimeIn, pmTimeOut, 13, 17) // 1pm-5pm
    totalMinutes = amMinutes + pmMinutes
  }

  return totalMinutes
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

// 👉 Get total work hours (AM + PM)
export const getWorkHoursString = (
  amTimeIn: string | null,
  amTimeOut: string | null,
  pmTimeIn: string | null = null,
  pmTimeOut: string | null = null,
  isField = false,
) => convertTimeToString(getTotalMinutes(amTimeIn, amTimeOut, pmTimeIn, pmTimeOut, isField))

// 👉 Get total work hours (AM + PM) in decimal
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

// 👉 Get total late/undertime hours as string
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

// 👉 Get total late/undertime hours as decimal
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
