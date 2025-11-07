import { supabase } from '@/utils/supabase'

/**
 * Fetch cash adjustments for an employee in a specific month/year
 * Returns { addOnAmount, deductionAmount }
 */
export async function getCashAdjustmentsForEmployee(
  employeeId: number,
  selectedMonth: string,
  selectedYear: number
): Promise<{ addOnAmount: number; deductionAmount: number }> {
  try {
    // Convert month name to month index
    const monthIndex = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ].indexOf(selectedMonth)

    if (monthIndex === -1) {
      console.error('[getCashAdjustmentsForEmployee] Invalid month:', selectedMonth)
      return { addOnAmount: 0, deductionAmount: 0 }
    }

    // Calculate date range for the month
    const startDate = new Date(selectedYear, monthIndex, 1)
    const endDate = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999) // Last day of month

    // Format dates as YYYY-MM-DD for Supabase query
    const startDateString = startDate.toISOString().split('T')[0]
    const endDateString = endDate.toISOString().split('T')[0]

    // Fetch cash adjustments for the employee within the date range
    const { data, error } = await supabase
      .from('cash_adjustments')
      .select('amount, is_deduction')
      .eq('employee_id', employeeId)
      .gte('adjustment_at', startDateString)
      .lte('adjustment_at', endDateString)

    if (error) {
      console.error('[getCashAdjustmentsForEmployee] Error fetching cash adjustments:', error)
      return { addOnAmount: 0, deductionAmount: 0 }
    }

    if (!data || data.length === 0) {
      return { addOnAmount: 0, deductionAmount: 0 }
    }

    // Sum up add-ons (is_deduction = false) and deductions (is_deduction = true)
    let addOnAmount = 0
    let deductionAmount = 0

    data.forEach((adjustment) => {
      if (adjustment.is_deduction) {
        deductionAmount += Number(adjustment.amount) || 0
      } else {
        addOnAmount += Number(adjustment.amount) || 0
      }
    })

    return {
      addOnAmount: Number(addOnAmount.toFixed(2)),
      deductionAmount: Number(deductionAmount.toFixed(2))
    }
  } catch (error) {
    console.error('[getCashAdjustmentsForEmployee] Unexpected error:', error)
    return { addOnAmount: 0, deductionAmount: 0 }
  }
}
