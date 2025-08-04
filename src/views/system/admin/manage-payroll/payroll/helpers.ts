export function safeCurrencyFormat(
  amount: number | string | null | undefined,
  formatCurrency: (n: number) => string,
): string {
  const numAmount = Number(amount) || 0
  return formatCurrency(numAmount)
}

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
  const monthNames = [
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
  const monthNames = [
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
