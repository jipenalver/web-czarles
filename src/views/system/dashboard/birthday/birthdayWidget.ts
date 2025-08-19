import { useEmployeesStore, type Employee, type EmployeeTableFilter } from '@/stores/employees'
import { useUsersStore, type AdminUser } from '@/stores/users'
import profileDefault from '@/assets/misc/profile-default.jpg'
import type { TableOptions } from '@/utils/helpers/tables'
import type { Ref } from 'vue'

export async function loadEmployees(
  employeesStore: ReturnType<typeof useEmployeesStore>,
  tableOptions: Ref<TableOptions & { isLoading?: boolean }>,
  tableFilters: Ref<EmployeeTableFilter>,
  usersStore?: ReturnType<typeof useUsersStore>,
) {
  tableOptions.value.isLoading = true
  await employeesStore.getEmployeesExport(tableOptions.value, tableFilters.value)

  // If a usersStore is provided, ensure we have admin users loaded
  // and refresh any matching users by id so avatars are available.
  if (usersStore) {
    try {
      if (!usersStore.users || usersStore.users.length === 0) {
        // load all users once
        await usersStore.getUsers()
      }

      const emps = employeesStore.employeesExport || []

      // For employees without avatar, try to find a matching admin user and refresh by id
      for (const emp of emps) {
        const p = emp as Partial<Employee>
        if (p.avatar) continue

        let found: AdminUser | undefined | null = null
        if (p.email) found = usersStore.users.find((u: AdminUser) => u.email === p.email)
        if (!found)
          found = usersStore.users.find(
            (u: AdminUser) => u.firstname === p.firstname && u.lastname === p.lastname,
          )

        if (found?.id) {
          // fetch latest user data and update the users store entry
          await usersStore.getUsersId(found.id)
        }
      }
    } catch {
      // ignore errors and continue; avatar fallback will be used
    }
  }

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
  } catch {
    return ''
  }
}

export function getAvatar(emp: Partial<Employee>, users?: AdminUser[]) {
  // Prefer employee's own avatar if present
  if (emp?.avatar) return emp.avatar

  // Try to find a matching admin user by email
  if (users && users.length) {
    try {
      if (emp?.email) {
        const byEmail = users.find((u: AdminUser) => u.email === emp.email)
        if (byEmail?.avatar) return byEmail.avatar
      }

      // Fallback to matching by name
      const byName = users.find(
        (u: AdminUser) => u.firstname === emp.firstname && u.lastname === emp.lastname,
      )
      if (byName?.avatar) return byName.avatar
    } catch {
      // ignore and fallback to default
    }
  }

  return profileDefault
}

export function isToday(emp: Partial<Employee>) {
  if (!emp?.birthdate) return false
  try {
    const b = new Date(emp.birthdate)
    const now = new Date()
    return b.getMonth() === now.getMonth() && b.getDate() === now.getDate()
  } catch {
    return false
  }
}
