import type { Allowance } from '@/stores/allowances'
import { supabase } from '@/utils/supabase'

/**
 * Fetch ang allowances para sa specific employee ug date range (month-based)
 */
export async function fetchFilteredAllowances(
  dateString: string = new Date().toISOString().slice(0, 7), // Default to current month YYYY-MM
  employeeId: number | undefined = undefined,
): Promise<Allowance[]> {
  if (!employeeId) {
    console.warn('[fetchFilteredAllowances] No employeeId provided, returning empty array')
    return []
  }

  // Extract YYYY-MM for filtering
  const yearMonth = dateString.slice(0, 7)

  // console.log('[fetchFilteredAllowances] Called with:', { dateString, yearMonth, employeeId })

  // Compute next month for range filtering
  const [year, month] = yearMonth.split('-').map(Number)
  let nextYear = year
  let nextMonth = month + 1
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`

  // console.log('[fetchFilteredAllowances] Date range:', {
  //   from: `${yearMonth}-01`,
  //   to: `${nextMonthStr}-01`
  // })

  // Use join/alias para sa related tables
  const { data, error } = await supabase
    .from('allowances')
    .select(
      '*, employee:employee_id (id, firstname, lastname, middlename), trip_location:trip_location_id (*)',
    )
    .eq('employee_id', employeeId)
    .gte('trip_at', `${yearMonth}-01`)
    .lt('trip_at', `${nextMonthStr}-01`)
    .order('trip_at', { ascending: true })

  if (error) {
    console.error('[fetchFilteredAllowances] error:', error)
    return []
  }

  // console.log('[fetchFilteredAllowances] Fetched allowances:', {
  //   count: data?.length || 0,
  //   data: data
  // })

  return data as Allowance[]
}

/**
 * Fetch ang allowances using explicit from/to date range (for cross-month support)
 */
export async function fetchAllowancesByRange(
  fromDate: string,
  toDate: string,
  employeeId: number | undefined = undefined,
): Promise<Allowance[]> {
  if (!employeeId) {
    console.warn('[fetchAllowancesByRange] No employeeId provided, returning empty array')
    return []
  }

  // console.log('[fetchAllowancesByRange] Called with:', { fromDate, toDate, employeeId })

  // Compute ang next day after toDate para sa inclusive filtering
  const toDateObj = new Date(toDate)
  toDateObj.setDate(toDateObj.getDate() + 1)
  const nextDay = toDateObj.toISOString().slice(0, 10)

  // console.log('[fetchAllowancesByRange] Date range:', {
  //   from: fromDate,
  //   to: nextDay
  // })

  const { data, error } = await supabase
    .from('allowances')
    .select(
      '*, employee:employee_id (id, firstname, lastname, middlename), trip_location:trip_location_id (*)',
    )
    .eq('employee_id', employeeId)
    .gte('trip_at', fromDate)
    .lt('trip_at', nextDay)
    .order('trip_at', { ascending: true })

  if (error) {
    console.error('[fetchAllowancesByRange] error:', error)
    return []
  }

  // console.log('[fetchAllowancesByRange] Fetched allowances:', {
  //   count: data?.length || 0,
  //   data: data
  // })

  return data as Allowance[]
}
