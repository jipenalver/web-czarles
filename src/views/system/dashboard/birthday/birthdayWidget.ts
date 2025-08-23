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

        let found: AdminUser | undefined | null = null
        if (p.email) found = usersStore.users.find((u: AdminUser) => u.email === p.email)
        if (!found)
          found = usersStore.users.find(
            (u: AdminUser) => u.firstname === p.firstname && u.lastname === p.lastname,
          )

        if (found?.id) {
          // fetch latest user data and update the users store entry
          await usersStore.getUserById(found.id)
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

export function getZodiacSign(birthdate?: string) {
  if (!birthdate) return '⭐ Unknown Sign'

  try {
    const date = new Date(birthdate)
    const month = date.getMonth() + 1
    const day = date.getDate()

    const signs = [
      { name: '♒ Aquarius', start: [1, 20], end: [2, 18] },
      { name: '♓ Pisces', start: [2, 19], end: [3, 20] },
      { name: '♈ Aries', start: [3, 21], end: [4, 19] },
      { name: '♉ Taurus', start: [4, 20], end: [5, 20] },
      { name: '♊ Gemini', start: [5, 21], end: [6, 20] },
      { name: '♋ Cancer', start: [6, 21], end: [7, 22] },
      { name: '♌ Leo', start: [7, 23], end: [8, 22] },
      { name: '♍ Virgo', start: [8, 23], end: [9, 22] },
      { name: '♎ Libra', start: [9, 23], end: [10, 22] },
      { name: '♏ Scorpio', start: [10, 23], end: [11, 21] },
      { name: '♐ Sagittarius', start: [11, 22], end: [12, 21] },
      { name: '♑ Capricorn', start: [12, 22], end: [1, 19] },
    ]

    for (const sign of signs) {
      const [startMonth, startDay] = sign.start
      const [endMonth, endDay] = sign.end

      if (startMonth === endMonth) {
        if (month === startMonth && day >= startDay && day <= endDay) {
          return sign.name
        }
      } else {
        if ((month === startMonth && day >= startDay) || (month === endMonth && day <= endDay)) {
          return sign.name
        }
      }
    }

    return '⭐ Unknown Sign'
  } catch {
    return '⭐ Unknown Sign'
  }
}

export function getDaysUntilBirthday(birthdate?: string) {
  if (!birthdate) return 0

  try {
    const today = new Date()
    const birthday = new Date(birthdate)

    // Set birthday to current year
    birthday.setFullYear(today.getFullYear())

    // If birthday already passed this year, set to next year
    if (birthday < today) {
      birthday.setFullYear(today.getFullYear() + 1)
    }

    const diffTime = birthday.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    return diffDays
  } catch {
    return 0
  }
}

export function getAgeMilestone(age?: number | string) {
  const ageNum = typeof age === 'string' ? parseInt(age) : age
  if (!ageNum || ageNum < 0) return 'New Journey'

  if (ageNum >= 18 && ageNum < 25) return 'Young Adult'
  if (ageNum >= 25 && ageNum < 30) return 'Quarter Century'
  if (ageNum >= 30 && ageNum < 40) return 'Thriving Thirties'
  if (ageNum >= 40 && ageNum < 50) return 'Fabulous Forties'
  if (ageNum >= 50 && ageNum < 60) return 'Fantastic Fifties'
  if (ageNum >= 60 && ageNum < 70) return 'Sensational Sixties'
  if (ageNum >= 70) return 'Golden Years'

  return 'Growing Strong'
}

export function getBirthdayEmoji(age?: number | string) {
  const ageNum = typeof age === 'string' ? parseInt(age) : age
  if (!ageNum || ageNum < 0) return '🎈'

  if (ageNum < 18) return '🧸'
  if (ageNum >= 18 && ageNum < 25) return '🌟'
  if (ageNum >= 25 && ageNum < 30) return '🚀'
  if (ageNum >= 30 && ageNum < 40) return '💪'
  if (ageNum >= 40 && ageNum < 50) return '🌺'
  if (ageNum >= 50 && ageNum < 60) return '🏆'
  if (ageNum >= 60 && ageNum < 70) return '👑'
  if (ageNum >= 70) return '💎'

  return '🎉'
}
