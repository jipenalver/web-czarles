/**
 * PayrollStorage - Handles localStorage operations for payroll dates
 */
import { monthNames } from '../helpers'

/**
 * Get payroll date from localStorage with fallback
 */
export function getPayrollFromDate(fallbackYear: number, fallbackMonth: string): string {
  try {
    if (typeof window !== 'undefined') {
      const fromDate = localStorage.getItem('czarles_payroll_fromDate')
      if (fromDate) {
        return fromDate
      }
    }
  } catch (error) {
    console.error('Error reading fromDate from localStorage:', error)
  }

  // Fallback calculation
  const month = (monthNames.indexOf(fallbackMonth) + 1).toString().padStart(2, '0')
  return `${fallbackYear}-${month}-01`
}

/**
 * Get holiday date string from localStorage with fallback
 */
export function getHolidayDateString(fallbackYear: number, fallbackMonth: string): string {
  try {
    if (typeof window !== 'undefined') {
      const fromDate = localStorage.getItem('czarles_payroll_fromDate')
      if (fromDate) {
        return fromDate.substring(0, 7) // Returns YYYY-MM format
      }
    }
  } catch (error) {
    console.error('Error extracting holidayDateString:', error)
  }

  // Fallback calculation
  const month = (monthNames.indexOf(fallbackMonth) + 1).toString().padStart(2, '0')
  return `${fallbackYear}-${month}`
}

/**
 * Get date range from localStorage with fallback
 */
export function getMonthDateRangeFromStorage(fallbackRange: string): string {
  try {
    if (typeof window !== 'undefined') {
      const from = localStorage.getItem('czarles_payroll_fromDate')
      const to = localStorage.getItem('czarles_payroll_toDate')
      if (from && to) {
        const start = new Date(from)
        const end = new Date(to)
        if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
          const opts: Intl.DateTimeFormatOptions = {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }
          return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`
        }
      }
    }
  } catch (error) {
    console.error('Error calculating monthDateRange:', error)
  }
  return fallbackRange
}
