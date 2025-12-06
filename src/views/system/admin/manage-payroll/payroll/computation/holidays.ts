import type { Holiday } from '@/stores/holidays'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from '../helpers'

export type HolidayWithAttendance = Holiday & {
  attendance_fraction?: number // 0, 0.5, or 1.0
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

      let attendance_fraction = 0
      if (attendance) {
        // Check if this is a Regular Holiday (RH)
        const isRegularHoliday = holiday.type?.toUpperCase().includes('RH')

        // For Regular Holidays, any attendance record counts as full day
        if (isRegularHoliday) {
          const hasAnyAttendance = attendance.am_time_in || attendance.am_time_out ||
                                   attendance.pm_time_in || attendance.pm_time_out
          if (hasAnyAttendance) {
            attendance_fraction = 1.0 // Full day for RH with any attendance
          }
        } else {
          // For other holidays, use the normal calculation
          const hasAM = attendance.am_time_in && attendance.am_time_out
          const hasPM = attendance.pm_time_in && attendance.pm_time_out

          if (hasAM && hasPM) {
            attendance_fraction = 1.0 // Full day
          } else if (hasAM || hasPM) {
            attendance_fraction = 0.5 // Half day
          }
        }
      }

      return {
        ...holiday,
        attendance_fraction
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

      let attendance_fraction = 0
      if (attendance) {
        // Check if this is a Regular Holiday (RH)
        const isRegularHoliday = holiday.type?.toUpperCase().includes('RH')

        // For Regular Holidays, any attendance record counts as full day
        if (isRegularHoliday) {
          const hasAnyAttendance = attendance.am_time_in || attendance.am_time_out ||
                                   attendance.pm_time_in || attendance.pm_time_out
          if (hasAnyAttendance) {
            attendance_fraction = 1.0 // Full day for RH with any attendance
          }
        } else {
          // For other holidays, use the normal calculation
          const hasAM = attendance.am_time_in && attendance.am_time_out
          const hasPM = attendance.pm_time_in && attendance.pm_time_out

          if (hasAM && hasPM) {
            attendance_fraction = 1.0 // Full day
          } else if (hasAM || hasPM) {
            attendance_fraction = 0.5 // Half day
          }
        }
      }

      return {
        ...holiday,
        attendance_fraction
      } as HolidayWithAttendance
    })
  )

  return holidaysWithAttendance
}
