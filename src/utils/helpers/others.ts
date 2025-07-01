// 👉 Avatar Text Initials
export const getAvatarText = (name: string) => {
  const nameParts = name.trim().split(' ').filter(Boolean)

  const initials = nameParts.slice(0, 2).map((part) => part[0].toUpperCase())

  return initials.join('')
}

// 👉 Slug Name
export const getSlugText = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 23)
}

// 👉 Money Format Text
export const getMoneyText = (value: string | number) => {
  if (isNaN(Number(value))) return '₱0.00'

  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

// 👉 Pad String
export const getPaddedText = (
  value: string | number,
  length = 4,
  char = '0',
  direction = 'left' as 'left' | 'right',
) => {
  value = String(value)
  if (value.length >= length) return value

  if (direction === 'right') return value + char.repeat(length - value.length)

  return char.repeat(length - value.length) + value
}

// 👉 Precise Number
export const getPreciseNumber = (value: number) => {
  return Math.round(value * 100) / 100
}

// 👉 Accumulated Number
export const getAccumulatedNumber = (object: Record<string, unknown>[], key: string) => {
  return object.reduce((acc, cur) => acc + (isNaN(Number(cur[key])) ? 0 : Number(cur[key])), 0)
}

// 👉 Get Employee ID Number
export const getIDNumber = (hiredAt: string, employeeId: number) => {
  if (!hiredAt || !employeeId) return 'n/a'

  const hiredDate = new Date(hiredAt)

  const year = hiredDate.getFullYear().toString().slice(-2)

  return `2${year}-${getPaddedText(employeeId)}`
}

// 👉 Alpha-numeric Random Code
export const getRandomCode = (length = 6, isAllCaps = false) => {
  const chars = isAllCaps
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  return Array.from({ length }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join(
    '',
  )
}

// 👉 Get File Size Display
export const getFileSize = (fileSize: number) => {
  const fileSizeInKB = fileSize / 1024

  if (fileSizeInKB < 1000) return fileSizeInKB.toFixed(2) + ' KB'
  else {
    const fileSizeInMB = fileSizeInKB / 1024
    return fileSizeInMB.toFixed(2) + ' MB'
  }
}

// 👉 File Extraction of Object, for 1 File/Image
export const fileExtract = (event: Event): Promise<{ fileObject: File; fileUrl: string }> => {
  return new Promise((resolve, reject) => {
    const { files } = event.target as HTMLInputElement

    if (!files || !files.length || files.length === 0) return reject(new Error('No files selected'))

    const fileReader = new FileReader()
    fileReader.readAsDataURL(files[0])

    fileReader.onload = () => {
      if (typeof fileReader.result === 'string')
        resolve({ fileObject: files[0], fileUrl: fileReader.result })
      else reject(new Error('Failed to read file as Data URL'))
    }

    fileReader.onerror = () => reject(new Error('Error reading file'))
  })
}

// 👉 File Extraction of Object, for Multiple Files/Images
export const filesExtract = (event: Event) => {
  return new Promise((resolve, reject) => {
    const { files } = event.target as HTMLInputElement

    if (!files || !files.length || files.length === 0) return reject(new Error('No files selected'))

    const fileObjects = Array.from(files)
    const fileReaders = fileObjects.map((file) => {
      return new Promise<{ fileObject: File; fileUrl: string }>((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.readAsDataURL(file)

        fileReader.onload = () => {
          if (typeof fileReader.result === 'string')
            resolve({ fileObject: file, fileUrl: fileReader.result })
          else reject(new Error('Failed to read file as Data URL'))
        }

        fileReader.onerror = () => reject(new Error('Error reading file'))
      })
    })

    Promise.all(fileReaders)
      .then((results) => {
        const fileUrls = results.map((result) => result.fileUrl)
        resolve({ fileObjects, fileUrls })
      })
      .catch((error) => reject(error))
  })
}

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

// 👉 Fix v-date-input; prepare date range
export const prepareDateRange = (daterange: string[] | null) => {
  if (daterange === null) return null

  const formattedDates = daterange.map((date) => getDateISO(new Date(date)))

  const dates =
    formattedDates.length > 1
      ? `${formattedDates[0]} to ${formattedDates[formattedDates.length - 1]}`
      : formattedDates[0]

  return dates
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

// 👉 Get total work hours (AM + PM sessions combined)
export const getTotalWorkHours = (
  amTimeIn: string | Date | null,
  amTimeOut: string | Date | null,
  pmTimeIn: string | Date | null,
  pmTimeOut: string | Date | null,
  isDecimal = false,
) => {
  const getMinutes = (startTime: string | Date | null, endTime: string | Date | null) => {
    if (!startTime || !endTime) return 0

    const start = new Date(startTime)
    const end = new Date(endTime)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

    const diffMs = end.getTime() - start.getTime()
    return diffMs < 0 ? 0 : Math.floor(diffMs / (1000 * 60))
  }

  const amMinutes = getMinutes(amTimeIn, amTimeOut)
  const pmMinutes = getMinutes(pmTimeIn, pmTimeOut)
  const totalMinutes = amMinutes + pmMinutes

  if (totalMinutes === 0) return isDecimal ? '0 hours' : '0 minutes'

  if (isDecimal) {
    const decimalHours = totalMinutes / 60
    const formatted = decimalHours.toFixed(2).replace(/\.00$/, '')
    const hourText = decimalHours === 1 ? 'hour' : 'hours'
    return `${formatted} ${hourText}`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const hourText = hours === 1 ? 'hour' : 'hours'
  const minuteText = minutes === 1 ? 'minute' : 'minutes'

  if (hours === 0) return `${minutes} ${minuteText}`
  if (minutes === 0) return `${hours} ${hourText}`
  return `${hours} ${hourText} ${minutes} ${minuteText}`
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

// 👉 Generate CSV
export const generateCSV = (filename: string, csvData: string) => {
  const blob = new Blob([csvData], { type: 'text/csv; charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')

  link.href = url
  link.setAttribute('download', `${filename}.csv`)

  document.body.appendChild(link)
  link.click()

  document.body.removeChild(link)
  link.remove()

  URL.revokeObjectURL(url)
}

// 👉 CSV Text Trimming
export const generateCSVTrim = (string: string) => {
  if (typeof string !== 'string' || !string.trim()) return ''

  return string.replace(/,/g, ' ').replace(/\s+/g, ' ').trim()
}

// 👉 Get File Download
export const fileDownload = async (filePath: string, fileName: string) => {
  const response = await fetch(filePath)
  const blob = await response.blob()

  const blobUrl = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = blobUrl
  link.download = fileName

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(blobUrl)
}
