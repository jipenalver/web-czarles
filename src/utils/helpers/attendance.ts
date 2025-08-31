// 👉 Strip timezone information and parse as local time
const parseLocalTime = (timeString: string | Date) => {
  if (typeof timeString === 'string') {
    // Remove timezone offset (+00:00, +08:00, etc.)
    const localTimeString = timeString.replace(/[+\-]\d{2}:?\d{0,2}$/, '')
    return new Date(localTimeString)
  }
  return new Date(timeString)
}

// 👉 Get Field minutes worked (handles overnight shifts)
const getFieldMinutes = (timeIn: string | Date | null, timeOut: string | Date | null) => {
  const checkIn = parseLocalTime(timeIn as string)
  const checkOut = parseLocalTime(timeOut as string)

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

// 👉 Get Office minutes with allowance
const getOfficeMinutesWithAllowance = (
  timeIn: string | Date | null,
  timeOut: string | Date | null,
  sessionStart: number,
  sessionEnd: number,
  lateAllowanceMinutes = 0,
  earlyDepartureAllowanceMinutes = 0,
) => {
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

  // Calculate effective times with penalties AND allowances
  let effectiveIn = sessionStartTime // Always start from session start
  let effectiveOut = sessionEndTime // Always end at session end

  // ✅ Late arrival penalty WITH allowance: If arrived late beyond allowance, start from actual check-in time
  if (checkIn > sessionStartTime) {
    const lateMinutes = Math.floor((checkIn.getTime() - sessionStartTime.getTime()) / (1000 * 60))

    // Only penalize if late minutes exceed the allowance
    if (lateMinutes > lateAllowanceMinutes) effectiveIn = checkIn
  }

  // ✅ Early departure penalty WITH allowance: If left early beyond allowance, end at actual check-out time
  if (checkOut < sessionEndTime) {
    const earlyMinutes = Math.floor((sessionEndTime.getTime() - checkOut.getTime()) / (1000 * 60))

    // Only penalize if early minutes exceed the allowance
    if (earlyMinutes > earlyDepartureAllowanceMinutes) effectiveOut = checkOut
  }

  // Calculate minutes within session bounds with allowances applied
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
  let totalMinutes = 0

  if (isField) {
    // Field staff: Calculate total time worked
    const amMinutes = getFieldMinutes(amTimeIn, amTimeOut)
    const pmMinutes = getFieldMinutes(pmTimeIn, pmTimeOut)
    const actualMinutes = amMinutes + pmMinutes

    // Return actual minutes worked, cap at 8 hours
    totalMinutes = Math.min(actualMinutes, 8 * 60) // Cap at 8 hours maximum
  } else {
    // Office staff: Constrain to office hours with allowances
    const amMinutes = getOfficeMinutesWithAllowance(amTimeIn, amTimeOut, 8, 12, 10, 0) // 8am-12pm, 10min late allowance

    // Use actual attendance date, not current date
    const attendanceDate = amTimeIn ? new Date(amTimeIn) : new Date(pmTimeIn!)
    const dayOfWeek = attendanceDate.getDay()

    // Monday-Thursday: 1pm-5pm strict, Friday/Saturday: 1pm-5pm with 30min early departure allowance (effectively 4:30pm)
    const isFridayOrSaturday = dayOfWeek === 5 || dayOfWeek === 6
    const pmMinutes = getOfficeMinutesWithAllowance(
      pmTimeIn,
      pmTimeOut,
      13,
      17,
      0,
      isFridayOrSaturday ? 30 : 0,
    )

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
  return Math.floor((hours + minutes / 60) * 100) / 100
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
