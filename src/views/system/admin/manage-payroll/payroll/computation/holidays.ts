import type { Holiday } from '@/stores/holidays'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from '../helpers'

export type HolidayWithAttendance = Holiday & {
  attendance_fraction?: number // 0, 0.5, or 1.0
  hasActualAttendance?: boolean // true if employee actually worked on this day
}

export async function fetchHolidaysByDateString(
  dateString: string,
  employeeId?: string,
): Promise<HolidayWithAttendance[]> {
  // Query sa holidays table gamit ang %ilike% sa holiday_at column
  // dateString format: YYYY-MM
  const startDate = `${dateString}-01`
  const endDate = getLastDateOfMonth(dateString)

  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select()
    .gte('holiday_at', startDate)
    .lt('holiday_at', endDate)

  if (holidaysError || !holidays) {
    console.error('[fetchHolidaysByDateString] Error fetching holidays:', holidaysError)
    // Handle error if needed, for now return empty array
    return []
  }

  // If no employeeId, return all holidays for the dateString
  if (!employeeId) {
    return holidays as HolidayWithAttendance[]
  }

  // Fetch attendance data for holidays
  const holidaysWithAttendance = await Promise.all(
    holidays.map(async (holiday) => {
      const { data: attendance } = await supabase
        .from('attendances')
        .select('am_time_in, am_time_out, pm_time_in, pm_time_out')
        .eq('employee_id', employeeId)
        .gte('am_time_in', holiday.holiday_at)
        .lt('am_time_in', `${holiday.holiday_at}T23:59:59`)
        .maybeSingle()

      // Check if this is a Regular Holiday (RH)
      const isRegularHoliday = holiday.type?.toUpperCase().includes('RH')

      let attendance_fraction = 0
      let hasActualAttendance = false

      // Check for actual attendance data
      const hasAM = attendance?.am_time_in && attendance?.am_time_out
      const hasPM = attendance?.pm_time_in && attendance?.pm_time_out

      // For Regular Holidays: ALL employees get 1.0 fraction regardless of attendance
      if (isRegularHoliday) {
        attendance_fraction = 1.0 // Full day for all employees on Regular Holidays
        hasActualAttendance = !!(hasAM || hasPM) // Track if employee actually worked
      } else if (attendance) {
        // For other holidays, use the normal calculation based on actual attendance
        if (hasAM && hasPM) {
          attendance_fraction = 1.0 // Full day
          hasActualAttendance = true
        } else if (hasAM || hasPM) {
          attendance_fraction = 0.5 // Half day
          hasActualAttendance = true
        }
      }

      return {
        ...holiday,
        attendance_fraction,
        hasActualAttendance
      } as HolidayWithAttendance
    })
  )

  return holidaysWithAttendance
}

// New: fetch holidays using an explicit from/to date range (YYYY-MM-DD)
export async function fetchHolidaysByRange(
  fromDate: string,
  toDate: string,
  employeeId?: string,
): Promise<HolidayWithAttendance[]> {
  // Query holidays between fromDate and toDate (inclusive)
  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select()
    .gte('holiday_at', fromDate)
    .lte('holiday_at', toDate)

  if (holidaysError || !holidays) {
    return []
  }

  if (!employeeId) {
    return holidays as HolidayWithAttendance[]
  }

  // Fetch attendance data for holidays
  const holidaysWithAttendance = await Promise.all(
    holidays.map(async (holiday) => {
      const { data: attendance } = await supabase
        .from('attendances')
        .select('am_time_in, am_time_out, pm_time_in, pm_time_out')
        .eq('employee_id', employeeId)
        .gte('am_time_in', holiday.holiday_at)
        .lt('am_time_in', `${holiday.holiday_at}T23:59:59`)
        .maybeSingle()

      // Check if this is a Regular Holiday (RH)
      const isRegularHoliday = holiday.type?.toUpperCase().includes('RH')

      let attendance_fraction = 0
      let hasActualAttendance = false

      // Check for actual attendance data
      const hasAM = attendance?.am_time_in && attendance?.am_time_out
      const hasPM = attendance?.pm_time_in && attendance?.pm_time_out

      // For Regular Holidays: ALL employees get 1.0 fraction regardless of attendance
      if (isRegularHoliday) {
        attendance_fraction = 1.0 // Full day for all employees on Regular Holidays
        hasActualAttendance = !!(hasAM || hasPM) // Track if employee actually worked
      } else if (attendance) {
        // For other holidays, use the normal calculation based on actual attendance
        if (hasAM && hasPM) {
          attendance_fraction = 1.0 // Full day
          hasActualAttendance = true
        } else if (hasAM || hasPM) {
          attendance_fraction = 0.5 // Half day
          hasActualAttendance = true
        }
      }

      return {
        ...holiday,
        attendance_fraction,
        hasActualAttendance
      } as HolidayWithAttendance
    })
  )

  return holidaysWithAttendance
}
