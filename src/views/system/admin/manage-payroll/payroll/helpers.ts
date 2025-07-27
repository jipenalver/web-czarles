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
  const d = typeof date === 'string' ? new Date(date) : date
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
