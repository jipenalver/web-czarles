import { useEmployeesStore, type Employee } from '@/stores/employees'
import { getTime } from '@/utils/helpers/dates'
import { supabase } from '@/utils/supabase'

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
}> | null> {
  // query sa attendance records for the given employee ug month
  const startOfMonth = `${dateString}-01T00:00:00.000Z`
  const [year, month] = dateString.split('-')
  const nextMonth = new Date(parseInt(year), parseInt(month), 1)
  const endOfMonth = nextMonth.toISOString()

  const { data, error } = await supabase
    .from('attendances')
    .select('am_time_in, am_time_out, pm_time_in, pm_time_out, overtime_in, overtime_out')
    .eq('employee_id', employeeId)
    .gte('am_time_in', startOfMonth) // Filter by am_time_in for the month
    .lt('am_time_in', endOfMonth)
    .order('created_at', { ascending: false })
  if (error) {
    console.error('getEmployeeAttendanceById error:', error)
    return null
  }
  //kuhaon tanan attendance records para sa employee, i-strip ang date, time ra ibalik (HH:MM)
  return Array.isArray(data)
    ? data.map((row) => ({
        am_time_in: getTime(row.am_time_in),
        am_time_out: getTime(row.am_time_out),
        pm_time_in: getTime(row.pm_time_in),
        pm_time_out: getTime(row.pm_time_out),
        overtime_in: getTime(row.overtime_in),
        overtime_out: getTime(row.overtime_out),
      }))
    : null
}

export function getEmployeeByIdemp(id: number): Employee | undefined {
  const employeesStore = useEmployeesStore()
  const employees = employeesStore.employees
  return employees.find((emp: Employee) => emp.id === id)
}
