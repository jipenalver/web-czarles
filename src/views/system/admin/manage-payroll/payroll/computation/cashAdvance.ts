import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from '../helpers'

export async function fetchCashAdvances(filterDateString: string, employeeId: number | undefined) {
  if (!employeeId) return [{ amount: 0 }]

  const startDate = `${filterDateString}`

  // Read persisted toDate from localStorage for cross-month support
  let toDate = getLastDateOfMonth(filterDateString)
  try {
    const storedToDate = localStorage.getItem('czarles_payroll_toDate')
    if (storedToDate) {
      toDate = storedToDate
    }
  } catch (error) {
    console.error('Error reading toDate from localStorage:', error)
  }

  // Fetch all cash advances for employee within date range
  const { data, error } = await supabase
    .from('cash_advances')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('request_at', startDate)
    .lte('request_at', toDate) // Changed from .lt() to .lte() for inclusive end date
    .order('request_at', { ascending: false })

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
