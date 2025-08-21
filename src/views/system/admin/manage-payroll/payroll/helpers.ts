export function safeCurrencyFormat(
  amount: number | string | null | undefined,
  formatCurrency: (n: number) => string,
): string {
  const numAmount = Number(amount) || 0
  return formatCurrency(numAmount)
}

// Global month names used throughout payroll helpers
export const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function getHolidayTypeName(type: string | undefined): string {
  if (!type) return 'Unknown'
  const t = type.toLowerCase()
  if (t.includes('rh')) return 'Regular Holiday'
  if (t.includes('snh')) return 'Special Non-Working Holiday'
  if (t.includes('swh')) return 'Special Working Holiday'
  return type
}

export function formatTripDate(date: string | Date): string {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function getMonthDateRange(year: number, month: string): string {
  const monthIndex = monthNames.indexOf(month)
  if (monthIndex === -1) return ''
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)
  return `${month} ${start.getDate()}-${end.getDate()}, ${year}`
}

// 👉 Format date string to YYYY-MM (for payroll month storage)
export const getYearMonthString = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

// 👉 Get start and end date of a month as 'Month DD, YYYY'
export const getMonthDateRangeNextMonth = (year: number, monthName: string): string => {
  const monthIndex = monthNames.indexOf(monthName)
  if (monthIndex === -1) return ''
  const start = new Date(year, monthIndex, 1)
  const end = new Date(year, monthIndex + 1, 0)
  const startStr = start.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const endStr = end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return `${startStr} to ${endStr}`
}

// 👉 Format trip date as 'JAN. -- DD -- YYYY' (for PayrollPrint.vue)
export const formatTripDateFullDate = (dateStr: string): string => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return dateStr
  const month = getMonthShortText(date)
  const day = String(date.getDate()).padStart(2, '0')
  const year = date.getFullYear()
  return `${month} -- ${day} -- ${year}`
}

// 👉 Get short month text (e.g., JAN.)
export const getMonthShortText = (date: Date | string | null) => {
  if (!date) return ''
  const dateValue = new Date(date)
  if (isNaN(dateValue.getTime())) return ''
  const months = [
    'JAN.',
    'FEB.',
    'MAR.',
    'APR.',
    'MAY.',
    'JUN.',
    'JUL.',
    'AUG.',
    'SEP.',
    'OCT.',
    'NOV.',
    'DEC.',
  ]
  return months[dateValue.getMonth()]
}

export const getTimeHHMM = (val: string | null): string | null => {
  if (!val) return null
  // If ISO string, extract time part (HH:mm:ss)
  let time = null
  const match = val.match(/T(\d{2}:\d{2}:\d{2})/)
  if (match) time = match[1]
  // If already time-only, or space-separated, get last part
  if (!time) {
    if (/^\d{2}:\d{2}:\d{2}$/.test(val)) time = val
    else if (val.includes(' ')) time = val.split(' ').pop() || null
    else time = val
  }
  // Only return HH:MM
  if (time && /^\d{2}:\d{2}:\d{2}$/.test(time)) return time.slice(0, 5)
  if (time && /^\d{2}:\d{2}$/.test(time)) return time
  return null
}

export const getLastDateOfMonth = (dateString: string): string => {
  const [year, month] = dateString.split('-').map(Number)
  if (month === 12) {
    // December -> January of next year
    return `${year + 1}-01-01`
  } else {
    // Any other month -> next month same year
    return `${year}-${String(month + 1).padStart(2, '0')}-01`
  }
}

/**
 * Build full YYYY-MM-DD range for the provided year + monthName using dayFrom/dayTo (inclusive).
 * NOTE: In the payroll UI the "To Day" selector references the next month, so when a toDay
 * is provided we interpret it as a day in the next month (handling year rollover). If toDay
 * is not provided, the end date defaults to the last day of the start month.
 */
export function getDateRangeForMonth(year: number | undefined, monthName: string, fromDay?: number | null, toDay?: number | null) {
  const y = year || new Date().getFullYear()
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const month = monthIndex >= 0 ? monthIndex : 0

  // start month/year
  const startYear = Number(y)
  const startMonth = month // 0-based

  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
  const from = fromDay && fromDay > 0 ? Math.min(Math.max(1, fromDay), daysInStartMonth) : 1

  // end month/year: if toDay is provided, interpret it as a day in the NEXT month.
  // If toDay is not provided, default to the last day of the start month.
  let endYear = startYear
  let endMonth = startMonth
  if (toDay === undefined || toDay === null) {
    // default to last day of start month
    endMonth = startMonth
  } else {
    // interpret toDay as day in the next month (handle year rollover)
    if (startMonth === 11) {
      endMonth = 0
      endYear = startYear + 1
    } else {
      endMonth = startMonth + 1
    }
  }

  const daysInEndMonth = new Date(endYear, endMonth + 1, 0).getDate()
  const toRaw = toDay && toDay > 0 ? toDay : daysInEndMonth
  const to = Math.min(Math.max(1, toRaw), daysInEndMonth)

  const pad = (n: number) => String(n).padStart(2, '0')

  const fromDate = `${startYear}-${pad(startMonth + 1)}-${pad(from)}`
  const toDate = `${endYear}-${pad(endMonth + 1)}-${pad(to)}`

  // compute inclusive days difference using UTC to avoid timezone issues
  const s = new Date(`${fromDate}T00:00:00Z`).getTime()
  const e = new Date(`${toDate}T00:00:00Z`).getTime()
  const msPerDay = 24 * 60 * 60 * 1000
  const totalDays = Math.floor((e - s) / msPerDay) + 1

  return { fromDate, toDate, totalDays }
}

/**
 * Like `getDateRangeForMonth` but the `toDay` is always interpreted inside the
 * same month (no cross-month). Useful when you want an end date that never
 * rolls into the next month.
 */
export function getDateRangeForMonthNoCross(year: number | undefined, monthName: string, fromDay?: number | null, toDay?: number | null) {
  const y = year || new Date().getFullYear()
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const month = monthIndex >= 0 ? monthIndex : 0

  // start month/year (0-based month)
  const startYear = Number(y)
  const startMonth = month

  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
  const from = fromDay && fromDay > 0 ? Math.min(Math.max(1, fromDay), daysInStartMonth) : 1

  // In this variant the end month/year is always the same as the start month/year
  const endYear = startYear
  const endMonth = startMonth

  const daysInEndMonth = daysInStartMonth
  const toRaw = toDay && toDay > 0 ? toDay : daysInEndMonth
  const to = Math.min(Math.max(1, toRaw), daysInEndMonth)

  const pad = (n: number) => String(n).padStart(2, '0')

  const fromDate = `${startYear}-${pad(startMonth + 1)}-${pad(from)}`
  const toDate = `${endYear}-${pad(endMonth + 1)}-${pad(to)}`

  // compute inclusive days difference using UTC to avoid timezone issues
  const s = new Date(`${fromDate}T00:00:00Z`).getTime()
  const e = new Date(`${toDate}T00:00:00Z`).getTime()
  const msPerDay = 24 * 60 * 60 * 1000
  const totalDays = Math.floor((e - s) / msPerDay) + 1

  return { fromDate, toDate, totalDays }
}

// --- Payroll dialog helpers (moved from PayrollPrintDialog.vue)
import { nextTick } from 'vue'
import type { Ref } from 'vue'

/**
 * Force-reload payroll functions inside the `PayrollPrint` component.
 * Accepts refs from the calling component so this helper stays pure.
 */
export async function reloadAllPayrollFunctions(
  payrollPrintRef: Ref<unknown | null>,
  payrollPrintKey: Ref<number>,
  isReloadingData: Ref<boolean>,
) {
  try {
    // mark loading
    isReloadingData.value = true

    // Option 1: Force re-render of the PayrollPrint component by bumping the key
    payrollPrintKey.value++

    // Wait for next tick so the new instance is mounted
    await nextTick()

    // Option 2: if the component instance exposes a reload method, call it
    const inst = payrollPrintRef.value as { reloadAllFunctions?: () => Promise<void> } | null
    if (inst && typeof inst.reloadAllFunctions === 'function') {
      await inst.reloadAllFunctions()
    }
  } catch (error) {
    // keep logging behaviour similar to original
    console.error('[PayrollPrintDialog] Error reloading payroll functions:', error)
  } finally {
    isReloadingData.value = false
  }
}

/**
 * Manually refresh specific pieces of payroll data by calling methods on the
 * `PayrollPrint` component instance. The helper will set/clear the loading ref.
 */
export async function manualRefreshPayroll(payrollPrintRef: Ref<unknown | null>, isReloadingData: Ref<boolean>) {
  if (!payrollPrintRef.value) return
  try {
    isReloadingData.value = true

    // Call individual reload functions if present
    const inst = payrollPrintRef.value as {
      loadTrips?: () => Promise<void>
      fetchEmployeeHolidays?: () => Promise<void>
      updateOverallOvertime?: () => Promise<void>
      updateEmployeeDeductions?: () => Promise<void>
      recalculateEarnings?: () => void
    } | null

    await Promise.all([
      inst?.loadTrips?.() ?? Promise.resolve(),
      inst?.fetchEmployeeHolidays?.() ?? Promise.resolve(),
      inst?.updateOverallOvertime?.() ?? Promise.resolve(),
      inst?.updateEmployeeDeductions?.() ?? Promise.resolve(),
    ])

    // Force recalculation if available
    inst?.recalculateEarnings?.()
  } catch (error) {
    console.error('[PayrollPrintDialog] Error during manual refresh:', error)
  } finally {
    isReloadingData.value = false
  }
}
