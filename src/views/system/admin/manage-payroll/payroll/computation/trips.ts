import type { Trip } from '@/stores/trips'
import { supabase } from '@/utils/supabase'

export async function fetchFilteredTrips(
  dateString: string = new Date().toISOString().slice(0, 7), // Default to current month YYYY-MM
  employeeId: number | undefined = undefined,
): Promise<Trip[]> {
  console.log('[fetchFilteredTrips] Called with:', { dateString, employeeId })
  
  if (!employeeId) {
    console.log('[fetchFilteredTrips] No employeeId provided, returning empty array')
    return []
  }
  
  // Extract YYYY-MM for filtering
  const yearMonth = dateString.slice(0, 7)
  console.log('[fetchFilteredTrips] Using yearMonth:', yearMonth)
  
  // Compute next month for range filtering
  const [year, month] = yearMonth.split('-').map(Number)
  let nextYear = year
  let nextMonth = month + 1
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`
  
  console.log('[fetchFilteredTrips] Date range:', `${yearMonth}-01 to ${nextMonthStr}-01`)
  
  // Use join/alias as in store for trip_location and employees
  const { data, error } = await supabase
    .from('trips')
    .select(
      '*, employee:employee_id (id, firstname, lastname, middlename), unit:unit_id (*), trip_location:trip_location_id (*)',
    )
    .eq('employee_id', employeeId)
    .gte('trip_at', `${yearMonth}-01`)
    .lt('trip_at', `${nextMonthStr}-01`)
    .order('trip_at', { ascending: true })

  if (error) {
    //error pag fetch sa trips para payroll filter
    console.error('[fetchFilteredTrips] error:', error)
    return []
  }
  
  console.log('[fetchFilteredTrips] fetched trips from supabase:', data?.length || 0, 'trips')
  return data as Trip[]
}
