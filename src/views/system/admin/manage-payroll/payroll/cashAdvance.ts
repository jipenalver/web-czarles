import { supabase } from '@/utils/supabase'

export async function fetchCashAdvances(filterDateString: string, employeeId: number | undefined) {
  if (!employeeId) return []
  // kuhaon ang cash advances para sa employee ug payroll month
  const { data, error } = await supabase
    .from('cash_advances')
    .select('*')
    .eq('employee_id', employeeId)
    .gte('request_at', filterDateString)
    .lte('request_at', filterDateString.replace(/-01$/, '-31'))
  if (error) {
    console.error('Error fetching cash advances:', error)
    return []
  }
 /*  console.log('Fetched cash advances data:', data) */
  return data || []
}
