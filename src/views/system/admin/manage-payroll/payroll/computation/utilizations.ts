import type { Utilization } from '@/stores/utilizations'
import { supabase } from '@/utils/supabase'

/**
 * Fetch ang utilizations para sa specific employee ug date range (month-based)
 */
export async function fetchFilteredUtilizations(
  dateString: string = new Date().toISOString().slice(0, 7), // Default to current month YYYY-MM
  employeeId: number | undefined = undefined,
): Promise<Utilization[]> {
  if (!employeeId) {
    console.warn('[fetchFilteredUtilizations] No employeeId provided, returning empty array')
    return []
  }

  // Extract YYYY-MM for filtering
  const yearMonth = dateString.slice(0, 7)

  // console.log('[fetchFilteredUtilizations] Called with:', { dateString, yearMonth, employeeId })

  // Compute next month for range filtering
  const [year, month] = yearMonth.split('-').map(Number)
  let nextYear = year
  let nextMonth = month + 1
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`

  // console.log('[fetchFilteredUtilizations] Date range:', {
  //   from: `${yearMonth}-01`,
  //   to: `${nextMonthStr}-01`
  // })

  // Use join/alias para sa related tables
  const { data, error } = await supabase
    .from('utilizations')
    .select(
      '*, employee:employee_id (id, firstname, lastname, middlename), unit:unit_id (*), trip_location:trip_location_id (*)',
    )
    .eq('employee_id', employeeId)
    .gte('utilization_at', `${yearMonth}-01`)
    .lt('utilization_at', `${nextMonthStr}-01`)
    .order('utilization_at', { ascending: true })

  if (error) {
    console.error('[fetchFilteredUtilizations] error:', error)
    return []
  }

  // console.log('[fetchFilteredUtilizations] Fetched utilizations:', {
  //   count: data?.length || 0,
  //   data: data
  // })

  return data as Utilization[]
}

/**
 * Fetch ang utilizations using explicit from/to date range (for cross-month support)
 */
export async function fetchUtilizationsByRange(
  fromDate: string,
  toDate: string,
  employeeId: number | undefined = undefined,
): Promise<Utilization[]> {
  if (!employeeId) {
    console.warn('[fetchUtilizationsByRange] No employeeId provided, returning empty array')
    return []
  }

  // console.log('[fetchUtilizationsByRange] Called with:', { fromDate, toDate, employeeId })

  // Compute ang next day after toDate para sa inclusive filtering
  const toDateObj = new Date(toDate)
  toDateObj.setDate(toDateObj.getDate() + 1)
  const nextDay = toDateObj.toISOString().slice(0, 10)

  // console.log('[fetchUtilizationsByRange] Date range:', {
  //   from: fromDate,
  //   to: nextDay
  // })

  const { data, error } = await supabase
    .from('utilizations')
    .select(
      '*, employee:employee_id (id, firstname, lastname, middlename), unit:unit_id (*), trip_location:trip_location_id (*)',
    )
    .eq('employee_id', employeeId)
    .gte('utilization_at', fromDate)
    .lt('utilization_at', nextDay)
    .order('utilization_at', { ascending: true })

  if (error) {
    console.error('[fetchUtilizationsByRange] error:', error)
    return []
  }

  // console.log('[fetchUtilizationsByRange] Fetched utilizations:', {
  //   count: data?.length || 0,
  //   data: data
  // })

  return data as Utilization[]
}
