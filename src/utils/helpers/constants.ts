// 👉 Form Action Utils
type FormAction = {
  formProcess: boolean
  formAlert: boolean
  formStatus: number
  formMessage: string
}
export const formActionDefault: FormAction = {
  formProcess: false,
  formAlert: false,
  formStatus: 200,
  formMessage: '',
}

// 👉 Type for Holiday
export const itemHolidayTypes = [
  { title: 'Regular Holiday', value: 'RH' },
  { title: 'Special (Non-working) Holiday', value: 'SNH' },
  { title: 'Special (Working) Holiday', value: 'SWH' },
  { title: 'Local Holiday', value: 'LH' },
  { title: 'Company Holiday', value: 'CH' },
]

// 👉 Display Holiday Type
export const displayHolidayTypes = {
  RH: 'Regular Holiday',
  SNH: 'Special (Non-working) Holiday',
  SWH: 'Special (Working) Holiday',
  LH: 'Local Holiday',
  CH: 'Company Holiday',
}

// 👉 Type for Request Status
export const requestStatusColors = {
  Approved: 'success',
  Rejected: 'error',
  Pending: 'warning',
}

// 👉 // List of emails to skip for notifications
export const emailsSkipped = ['centmarde@gmail.com']
