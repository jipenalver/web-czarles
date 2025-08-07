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
       
      }))
    : null
}

export function getEmployeeByIdemp(id: number): Employee | undefined {
  const employeesStore = useEmployeesStore()
  const employees = employeesStore.employees
  return employees.find((emp: Employee) => emp.id === id)
}
