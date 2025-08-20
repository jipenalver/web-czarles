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
 * If toDay <= fromDay, the end date is interpreted as the next month (handles year rollover).
 */
export function getDateRangeForMonth(year: number | undefined, monthName: string, fromDay?: number | null, toDay?: number | null) {
  const y = year || new Date().getFullYear()
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
  const monthIndex = monthNames.findIndex((m) => m === monthName)
  const month = monthIndex >= 0 ? monthIndex : 0

  // start month/year
  const startYear = Number(y)
  const startMonth = month // 0-based

  const daysInStartMonth = new Date(startYear, startMonth + 1, 0).getDate()
  const from = fromDay && fromDay > 0 ? Math.min(Math.max(1, fromDay), daysInStartMonth) : 1

  // Decide end month/year: if toDay > from => same month; if toDay <= from => next month
  let endYear = startYear
  let endMonth = startMonth
  if (toDay === undefined || toDay === null) {
    // default to last day of start month
    endMonth = startMonth
  } else if ((toDay || 0) > from) {
    endMonth = startMonth
  } else {
    // next month (handle year rollover)
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
