// 👉 Fix v-date-input; prepare local dates in form
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prepareFormDates = (formData: { [key: string]: any }, dateColumns: string[] = []) => {
  dateColumns.forEach((dateColumn) => {
    if (formData[dateColumn]) {
      const dateValue = new Date(formData[dateColumn])
      formData[dateColumn] = dateValue.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
    }
  })

  return formData
}

// 👉 Fix v-date-input; prepare local date in form
export const prepareDate = (date: Date | string) => {
  const dateValue = new Date(date)
  return dateValue.toLocaleDateString('en-US', { timeZone: 'Asia/Manila' })
}

// 👉 Fix v-date-input; prepare local date in form
export const prepareDateTime = (date: Date | string) => {
  const dateValue = new Date(date)
  return dateValue.toLocaleString('en-US', { timeZone: 'Asia/Manila' })
}

// 👉 Fix v-date-input; prepare date range
export const prepareDateRange = (dateRange: Date[], isRange = false) => {
  if (dateRange.length === 0) return { startDate: null, endDate: null }

  const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

  const startDate = dateRange[0]
  const endDate = isRange
    ? new Date(dateRange[dateRange.length - 1].getTime() + MILLISECONDS_PER_DAY)
    : new Date(startDate.getTime() + MILLISECONDS_PER_DAY)

  return { startDate: prepareDate(startDate), endDate: prepareDate(endDate) }
}

// 👉 Get date in ISO format without UTC conversion
export const getDateISO = (date: Date | string | null) => {
  if (!date) return null

  const dateString = typeof date === 'string' ? date.replace(/[+\-]\d{2}:?\d{0,2}$/, '') : date
  const dateValue = new Date(dateString)

  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 👉 Get date and time in ISO format without UTC conversion
export const getDateTimeISO = (date: Date | string | null) => {
  if (!date) return null

  const dateString = typeof date === 'string' ? date.replace(/[+\-]\d{2}:?\d{0,2}$/, '') : date
  const dateValue = new Date(dateString)

  const year = dateValue.getFullYear()
  const month = String(dateValue.getMonth() + 1).padStart(2, '0')
  const day = String(dateValue.getDate()).padStart(2, '0')
  const hours = String(dateValue.getHours()).padStart(2, '0')
  const minutes = String(dateValue.getMinutes()).padStart(2, '0')
  const seconds = String(dateValue.getSeconds()).padStart(2, '0')

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 👉 Get formatted date with weekday and full month name
export const getDate = (date: Date | string | null) => {
  if (!date) return null

  const dateString = typeof date === 'string' ? date.replace(/[+\-]\d{2}:?\d{0,2}$/, '') : date
  const dateValue = new Date(dateString)

  const month = dateValue.toLocaleDateString('en-US', { month: 'long' })
  const day = dateValue.getDate()
  const year = dateValue.getFullYear()

  return `${month} ${day}, ${year}`
}

// 👉 Get formatted date with weekday and full month name
export const getDateWithWeekday = (date: Date | string | null) => {
  if (!date) return null

  const dateString = typeof date === 'string' ? date.replace(/[+\-]\d{2}:?\d{0,2}$/, '') : date
  const dateValue = new Date(dateString)

  const weekday = dateValue.toLocaleDateString('en-US', { weekday: 'long' })
  const month = dateValue.toLocaleDateString('en-US', { month: 'long' })
  const day = dateValue.getDate()
  const year = dateValue.getFullYear()

  return `${weekday}, ${month} ${day}, ${year}`
}

// 👉 Get formatted time in 12-hour format without UTC conversion
export const getTime = (date: Date | string | null) => {
  if (!date) return null

  const dateString = typeof date === 'string' ? date.replace(/[+\-]\d{2}:?\d{0,2}$/, '') : date
  const dateValue = new Date(dateString)

  let hours = dateValue.getHours()
  const minutes = String(dateValue.getMinutes()).padStart(2, '0')

  const ampm = hours >= 12 ? 'PM' : 'AM'

  hours = hours % 12
  hours = hours ? hours : 12

  return `${hours}:${minutes} ${ampm}`
}

// 👉 Get formatted time in 24-hour format without UTC conversion
export const getTime24Hour = (date: Date | string | null) => {
  if (!date) return null

  const dateString = typeof date === 'string' ? date.replace(/[+\-]\d{2}:?\d{0,2}$/, '') : date
  const dateValue = new Date(dateString)

  const hours = String(dateValue.getHours()).padStart(2, '0')
  const minutes = String(dateValue.getMinutes()).padStart(2, '0')

  return `${hours}:${minutes}`
}

// 👉 Get Years of Service
export const getYearsOfService = (hiredAt: string) => {
  if (!hiredAt) return 'n/a'

  const hiredDate = new Date(hiredAt)
  const currentDate = new Date()

  let years = currentDate.getFullYear() - hiredDate.getFullYear()
  let months = currentDate.getMonth() - hiredDate.getMonth()

  if (months < 0) {
    years--
    months += 12
  }

  if (currentDate.getDate() < hiredDate.getDate()) {
    months--
    if (months < 0) {
      years--
      months += 12
    }
  }

  let result = ''
  if (years > 0) result += `${years} year${years !== 1 ? 's' : ''}`
  if (months > 0) {
    if (result) result += ' & '
    result += `${months} month${months !== 1 ? 's' : ''}`
  }

  return result || 'Less than 1 month'
}

// 👉 Get first date and last date of the month
export const getFirstAndLastDateOfMonth = (date: Date = new Date()) => {
  const firstDate = new Date(date.getFullYear(), date.getMonth(), 1)
  const lastDate = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  return [firstDate, lastDate]
}
