import { useEmployeesStore, type Employee } from '@/stores/employees'
import { supabase } from '@/utils/supabase'
import { getTimeHHMM } from '../helpers'
import { getDateISO } from '@/utils/helpers/dates'

export async function getEmployeeAttendanceById(
  employeeId: number | string,
  dateString: string,
  fromDateISO?: string,
  toDateISO?: string,
): Promise<Array<{
  am_time_in: string | null
  am_time_out: string | null
  pm_time_in: string | null
  pm_time_out: string | null
  overtime_in: string | null
  overtime_out: string | null
  is_leave_with_pay?: boolean
  leave_type?: string
  leave_reason?: string
  attendance_date?: string // Add attendance date to track the actual date
}> | null> {
  // query sa attendance records para sa given employee ug range
  // If explicit from/to ISO dates are provided, use them. They should be YYYY-MM-DD (date-only) or full ISO.
  let startISO: string
  let endISO: string

  if (fromDateISO && toDateISO) {
    // normalize to start of fromDate and exclusive end of toDate (add one day)
    const start = fromDateISO.includes('T')
      ? new Date(fromDateISO)
      : new Date(`${fromDateISO}T00:00:00`)
    const endBase = toDateISO.includes('T')
      ? new Date(toDateISO)
      : new Date(`${toDateISO}T23:59:59`)
    startISO = start.toISOString()
    endISO = endBase.toISOString()
  } else {
    // fallback to using dateString (format: YYYY-MM-DD or YYYY-MM)
    // Extract year and month from dateString
    const parts = dateString.split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])

    // Create start of month (first day at 00:00:00)
    const startOfMonth = new Date(year, month - 1, 1)
    // Create end of month (last day at 23:59:59)
    const endOfMonth = new Date(year, month, 0, 23, 59, 59)

    startISO = startOfMonth.toISOString()
    endISO = endOfMonth.toISOString()
  }

  // debug
  //console.error('[getEmployeeAttendanceById] range:', startISO, endISO)

  const { data, error } = await supabase
    .from('attendances')
    .select(
      'am_time_in, am_time_out, pm_time_in, pm_time_out, overtime_in, overtime_out, is_leave_with_pay, leave_type, leave_reason',
    )
    .eq('employee_id', employeeId)
    .gte('am_time_in', startISO) // Filter by am_time_in for the range
    .lt('am_time_in', endISO)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getEmployeeAttendanceById error:', error)
    return null
  }
  //kuhaon tanan attendance records para sa employee, i-strip ang date, time ra ibalik (HH:MM)

  // console.log('getEmployeeAttendanceById data:', data)
  return Array.isArray(data)
    ? data.map((row) => ({
        am_time_in: getTimeHHMM(row.am_time_in),
        am_time_out: getTimeHHMM(row.am_time_out),
        pm_time_in: getTimeHHMM(row.pm_time_in),
        pm_time_out: getTimeHHMM(row.pm_time_out),
        overtime_in: getTimeHHMM(row.overtime_in),
        overtime_out: getTimeHHMM(row.overtime_out),
        is_leave_with_pay: row.is_leave_with_pay,
        leave_type: row.leave_type,
        leave_reason: row.leave_reason,
        attendance_date: row.am_time_in ? row.am_time_in.split('T')[0] : null, // Extract date from timestamp
      }))
    : null
}

export function getEmployeeByIdemp(id: number): Employee | undefined {
  const employeesStore = useEmployeesStore()
  const employees = employeesStore.employees
  return employees.find((emp: Employee) => emp.id === id)
}

// Helper function to compute overtime hours between two time strings (HH:MM)
export function computeOvertimeHours(
  overtimeIn: string | null,
  overtimeOut: string | null,
): number {
  if (!overtimeIn || !overtimeOut) return 0
  // parse time strings to Date objects (use today as date)
  const today = getDateISO(new Date()) || new Date().toISOString().split('T')[0]
  const inDate = new Date(`${today}T${overtimeIn}:00`)
  const outDate = new Date(`${today}T${overtimeOut}:00`)
  const diffMs = outDate.getTime() - inDate.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  return diffHours > 0 ? diffHours : 0
}

// Async function to compute overall overtime for the month for an employee
export async function computeOverallOvertimeCalculation(
  employeeId?: number,
  dateString?: string,
  fromDateISO?: string,
  toDateISO?: string,
): Promise<number> {
  let usedDateString = dateString
  if (!usedDateString && typeof window !== 'undefined') {
    usedDateString = localStorage.getItem('czarles_payroll_dateString') || undefined
  }
  // fallback for from/to if available in localStorage
  let usedFrom = fromDateISO
  let usedTo = toDateISO
  if ((!usedFrom || !usedTo) && typeof window !== 'undefined') {
    usedFrom =
      usedFrom || (localStorage.getItem('czarles_payroll_fromDate') as string | null) || undefined
    usedTo =
      usedTo || (localStorage.getItem('czarles_payroll_toDate') as string | null) || undefined
  }
  if (employeeId && usedDateString) {
    // Use special function for employee 55, regular function for others
    const attendances = employeeId === 55
      ? await getEmployeeAttendanceForEmployee55(employeeId, usedDateString, usedFrom, usedTo)
      : await getEmployeeAttendanceById(employeeId, usedDateString, usedFrom, usedTo)
    if (Array.isArray(attendances) && attendances.length > 0) {
      // sum all overtime hours for the month
      let totalOvertime = 0
      attendances.forEach((a) => {
        totalOvertime += computeOvertimeHours(a.overtime_in, a.overtime_out)
      })

      return totalOvertime
    }
  }

  return 0
}

// Helper function to compute excess minutes (late)
export function getExcessMinutes(defaultOut: string, actualOut: string): number {
  const today = getDateISO(new Date()) || new Date().toISOString().split('T')[0]
  const defaultDate = new Date(`${today}T${defaultOut}:00`)
  const actualDate = new Date(`${today}T${actualOut}:00`)
  const diffMs = actualDate.getTime() - defaultDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  return diffMinutes
}

// Helper function to compute undertime minutes (early time-out)
export function getUndertimeMinutes(expectedOut: string, actualOut: string): number {
  if (!actualOut) return 0 // No time-out recorded
  const today = getDateISO(new Date()) || new Date().toISOString().split('T')[0]
  const expectedDate = new Date(`${today}T${expectedOut}:00`)
  const actualDate = new Date(`${today}T${actualOut}:00`)
  const diffMs = expectedDate.getTime() - actualDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  return diffMinutes
}

// Special function for employee ID 55 that generates full 8-hour workday records
// When this employee has an am_time_in record, it automatically generates:
// - am_time_out: 4 hours after am_time_in (e.g., if am_time_in is 8:00, am_time_out is 12:00)
// - pm_time_in: 1 hour after am_time_out (lunch break - e.g., 13:00)
// - pm_time_out: 4 hours after pm_time_in (e.g., 17:00)
// This ensures employee 55 always has a complete 8-hour workday when they have any attendance record
export async function getEmployeeAttendanceForEmployee55(
  employeeId: number | string,
  dateString: string,
  fromDateISO?: string,
  toDateISO?: string,
): Promise<Array<{
  am_time_in: string | null
  am_time_out: string | null
  pm_time_in: string | null
  pm_time_out: string | null
  overtime_in: string | null
  overtime_out: string | null
  is_leave_with_pay?: boolean
  leave_type?: string
  leave_reason?: string
  attendance_date?: string
}> | null> {
  // Only apply this special logic for employee ID 55
  if (Number(employeeId) !== 55) {
    return await getEmployeeAttendanceById(employeeId, dateString, fromDateISO, toDateISO)
  }

  // First get the actual attendance records for employee 55
  const actualAttendance = await getEmployeeAttendanceById(employeeId, dateString, fromDateISO, toDateISO)

  if (!Array.isArray(actualAttendance)) {
    return null
  }

  // Process each attendance record to generate full 8-hour workday
  const processedAttendance = actualAttendance.map((record) => {
    // If there's an am_time_in, generate dummy records for full 8-hour workday
    if (record.am_time_in) {
      // Parse the am_time_in to calculate other times
      const amTimeIn = record.am_time_in

      // Generate dummy times for full 8-hour workday
      // Standard schedule: 8:00 AM - 11:50 AM, 1:00 PM - 5:00 PM
      let amTimeOut = '11:50'
      let pmTimeIn = '13:00'
      let pmTimeOut = '17:00'

      // If am_time_in is provided, calculate relative times to ensure 8 hours total
      if (amTimeIn) {
        try {
          const [hours, minutes] = amTimeIn.split(':').map(Number)
          const amInDate = new Date()
          amInDate.setHours(hours, minutes, 0, 0)

          // AM out: 4 hours after AM in
          const amOutDate = new Date(amInDate.getTime() + 4 * 60 * 60 * 1000)
          amTimeOut = `${amOutDate.getHours().toString().padStart(2, '0')}:${amOutDate.getMinutes().toString().padStart(2, '0')}`

          // PM in: 1 hour after AM out (lunch break)
          const pmInDate = new Date(amOutDate.getTime() + 1 * 60 * 60 * 1000)
          pmTimeIn = `${pmInDate.getHours().toString().padStart(2, '0')}:${pmInDate.getMinutes().toString().padStart(2, '0')}`

          // PM out: 4 hours after PM in
          const pmOutDate = new Date(pmInDate.getTime() + 4 * 60 * 60 * 1000)
          pmTimeOut = `${pmOutDate.getHours().toString().padStart(2, '0')}:${pmOutDate.getMinutes().toString().padStart(2, '0')}`

        } catch (error) {
          console.warn('Error parsing am_time_in for employee 55:', error)
          // Use default times if parsing fails
        }
      }

      return {
        ...record,
        am_time_out: amTimeOut,
        pm_time_in: pmTimeIn,
        pm_time_out: pmTimeOut,
      }
    }

    // If no am_time_in, return the record as is
    return record
  })

  return processedAttendance
}
