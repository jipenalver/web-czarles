import type { Holiday } from '@/stores/holidays'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from '../helpers'

export async function fetchHolidaysByDateString(
  dateString: string,
  employeeId?: string,
): Promise<Holiday[]> {
  console.log('[fetchHolidaysByDateString] Starting fetch with:', {
    dateString,
    employeeId,
    startDate: `${dateString}-01`,
    endDate: getLastDateOfMonth(dateString)
  })

  // Query sa holidays table gamit ang %ilike% sa holiday_at column

  const { data: holidays, error: holidaysError } = await supabase
    .from('holidays')
    .select()
    .gte('holiday_at', `${dateString}-01`)
    .lt('holiday_at', getLastDateOfMonth(dateString))

  if (holidaysError || !holidays) {
    console.error('[fetchHolidaysByDateString] Error fetching holidays:', holidaysError)
    // Handle error if needed, for now return empty array
    return []
  }

  console.log('[fetchHolidaysByDateString] Found holidays from database:', holidays.length)

  // If no employeeId, return all holidays for the dateString
  if (!employeeId) {
    console.log('[fetchHolidaysByDateString] No employeeId, returning all holidays')
    return holidays as Holiday[]
  }

  // Return all holidays for the employee regardless of attendance
  // (Holidays are paid days off, so they should appear even if no attendance record exists)

  console.log('[fetchHolidaysByDateString] Returning all holidays for employee:', {
    count: holidays.length,
    holidays: holidays.map((h: Holiday) => ({ name: h.name, date: h.holiday_at, type: h.type }))
  })

  return holidays as Holiday[]
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

  // Return all holidays for the employee regardless of attendance
  // (Holidays are paid days off, so they should appear even if no attendance record exists)
  return holidays as Holiday[]
}
