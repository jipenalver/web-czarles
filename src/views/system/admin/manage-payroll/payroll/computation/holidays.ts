import type { Holiday } from '@/stores/holidays'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from '../helpers'

export async function fetchHolidaysByDateString(
  dateString: string,
  employeeId?: string,
): Promise<Holiday[]> {
  /*  console.log('Fetching holidays for dateString:', dateString, 'and employeeId:', employeeId) */
  // Query sa holidays table gamit ang %ilike% sa holiday_at column

  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select()
    .gte('holiday_at', `${dateString}-01`)
    .lt('holiday_at', getLastDateOfMonth(dateString))

  if (holidaysError || !holidays) {
    // Handle error if needed, for now return empty array
    return []
  }

  // If no employeeId, return all holidays for the dateString
  if (!employeeId) {
    return holidays as Holiday[]
  }

  // Fetch attendances for the employee within the dateString month
  const { data: attendances, error: attendancesError } = await supabase
    .from('attendances')
    .select('am_time_in')
    // For any month in YYYY-MM format
    .gte('am_time_in', `${dateString}-01`)
    .lt('am_time_in', getLastDateOfMonth(dateString))
    .eq('employee_id', employeeId)

  if (attendancesError || !attendances) return []

  // Create a Set of attendance dates (YYYY-MM-DD only)
  const attendanceDates = new Set(
    attendances
      .map((a: { am_time_in: string | null }) => a.am_time_in?.slice(0, 10))
      .filter(Boolean),
  )

  // Filter holidays where holiday_at matches any attendance date
  const matchedHolidays = (holidays as Holiday[]).filter((h) =>
    attendanceDates.has(h.holiday_at.slice(0, 10)),
  )

  /*  console.log('Matched Holidays:', matchedHolidays) */
  return matchedHolidays
}

// New: fetch holidays using an explicit from/to date range (YYYY-MM-DD)
export async function fetchHolidaysByRange(
  fromDate: string,
  toDate: string,
  employeeId?: string,
): Promise<Holiday[]> {
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
    return holidays as Holiday[]
  }

  // Fetch attendances for the employee within the date range
  const { data: attendances, error: attendancesError } = await supabase
    .from('attendances')
    .select('am_time_in')
    .gte('am_time_in', fromDate)
    .lte('am_time_in', toDate)
    .eq('employee_id', employeeId)

  if (attendancesError || !attendances) return []

  const attendanceDates = new Set(
    attendances
      .map((a: { am_time_in: string | null }) => a.am_time_in?.slice(0, 10))
      .filter(Boolean),
  )

  const matchedHolidays = (holidays as Holiday[]).filter((h) =>
    attendanceDates.has(h.holiday_at.slice(0, 10)),
  )

  return matchedHolidays
}
