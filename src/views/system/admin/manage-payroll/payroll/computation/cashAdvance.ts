import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from '../helpers'

export async function fetchCashAdvances(filterDateString: string, employeeId: number | undefined) {
  if (!employeeId) return [{ amount: 0 }]

  const startDate = `${filterDateString}`
  const endDate = getLastDateOfMonth(startDate)
  // kuhaon ang cash advances para sa employee ug payroll month
  const { data, error } = await supabase
    .from('cash_advances')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('request_at', startDate)
    .lt('request_at', endDate)
  if (error) {
    console.error('Error fetching cash advances:', error)
    return [{ amount: 0 }]
  }
  // kung walay data, return array with amount 0
  if (!data || data.length === 0) {
    return [{ amount: 0 }]
  }
  return data
}
