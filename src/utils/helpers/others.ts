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
