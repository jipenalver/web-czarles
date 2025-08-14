import { useEmployeesStore, type Employee } from '@/stores/employees'
import { supabase } from '@/utils/supabase'
import { getTimeHHMM } from '../helpers'

export async function getEmployeeAttendanceById(
  employeeId: number | string,
  dateString: string,
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
  // query sa attendance records for the given employee ug month
  const startOfMonth = `${dateString}-01T00:00:00.000Z`
  const [year, month] = dateString.split('-')
  const nextMonth = new Date(parseInt(year), parseInt(month), 1)
  const endOfMonth = nextMonth.toISOString()

  const { data, error } = await supabase
    .from('attendances')
    .select('am_time_in, am_time_out, pm_time_in, pm_time_out, overtime_in, overtime_out, is_leave_with_pay, leave_type, leave_reason')
    .eq('employee_id', employeeId)
    .gte('am_time_in', startOfMonth) // Filter by am_time_in for the month
    .lt('am_time_in', endOfMonth)
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
export function computeOvertimeHours(overtimeIn: string | null, overtimeOut: string | null): number {
  if (!overtimeIn || !overtimeOut) return 0
  // parse time strings to Date objects (use today as date)
  const today = new Date().toISOString().split('T')[0]
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
): Promise<number> {
  let usedDateString = dateString
  if (!usedDateString && typeof window !== 'undefined') {
    usedDateString = localStorage.getItem('czarles_payroll_dateString') || undefined
  }
  if (employeeId && usedDateString) {
    const attendances = await getEmployeeAttendanceById(employeeId, usedDateString)
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
  const today = new Date().toISOString().split('T')[0]
  const defaultDate = new Date(`${today}T${defaultOut}:00`)
  const actualDate = new Date(`${today}T${actualOut}:00`)
  const diffMs = actualDate.getTime() - defaultDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  return diffMinutes
}

// Helper function to compute undertime minutes (early time-out)
export function getUndertimeMinutes(expectedOut: string, actualOut: string): number {
  if (!actualOut) return 0 // No time-out recorded
  const today = new Date().toISOString().split('T')[0]
  const expectedDate = new Date(`${today}T${expectedOut}:00`)
  const actualDate = new Date(`${today}T${actualOut}:00`)
  const diffMs = expectedDate.getTime() - actualDate.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  return diffMinutes
}
