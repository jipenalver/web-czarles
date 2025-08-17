import profileDefault from '@/assets/misc/profile-default.jpg'

export async function loadEmployees(employeesStore: any, tableOptions: any, tableFilters: any) {
  tableOptions.value.isLoading = true
  await employeesStore.getEmployeesExport(tableOptions.value, tableFilters.value)
  tableOptions.value.isLoading = false
}

export function getAge(birthdate?: string) {
  if (!birthdate) return ''
  try {
    const b = new Date(birthdate)
    const now = new Date()
    let age = now.getFullYear() - b.getFullYear()
    const m = now.getMonth() - b.getMonth()
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--
    return age >= 0 ? age.toString() : ''
  } catch (e) {
    return ''
  }
}

export function getAvatar(emp: any) {
  return emp?.avatar ?? profileDefault
}

export function isToday(emp: any) {
  if (!emp?.birthdate) return false
  try {
    const b = new Date(emp.birthdate)
    const now = new Date()
    return b.getMonth() === now.getMonth() && b.getDate() === now.getDate()
  } catch (e) {
    return false
  }
}
