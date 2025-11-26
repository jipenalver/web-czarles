import { useEmployeesStore, type Employee } from '@/stores/employees'
import { supabase } from '@/utils/supabase'
import { getTimeHHMM } from '../helpers'
import { getDateISO } from '@/utils/helpers/dates'

// ============================================================================
// BATCH FETCHING & CACHING LAYER
// ============================================================================

// Type definition for attendance record
export interface AttendanceRecord {
  am_time_in: string | null
  am_time_out: string | null
  pm_time_in: string | null
  pm_time_out: string | null
  overtime_in: string | null
  overtime_out: string | null
  is_overtime_applied?: boolean
  is_leave_with_pay?: boolean
  leave_type?: string
  leave_reason?: string
  attendance_date?: string | null
  date?: string | null // Alias for attendance_date for compatibility
}

// Cache for storing attendance data to reduce duplicate API calls
const attendanceCache = new Map<string, AttendanceRecord[]>()

// Cache expiration time (5 minutes)
const CACHE_EXPIRY_MS = 5 * 60 * 1000

// Cache metadata to track expiration
const cacheMetadata = new Map<string, number>()

// Clear expired cache entries
function clearExpiredCache() {
  const now = Date.now()
  for (const [key, timestamp] of cacheMetadata.entries()) {
    if (now - timestamp > CACHE_EXPIRY_MS) {
      attendanceCache.delete(key)
      cacheMetadata.delete(key)
    }
  }
}

// Public function to manually clear all cache
export function clearAttendanceCache() {
  attendanceCache.clear()
  cacheMetadata.clear()
}

// Generate cache key for attendance data
function getCacheKey(
  employeeId: number | string,
  dateString: string,
  fromDateISO?: string,
  toDateISO?: string,
): string {
  return `${employeeId}-${dateString}-${fromDateISO || ''}-${toDateISO || ''}`
}

/**
 * Batch fetch attendance for multiple employees (optimized with RPC)
 * This reduces API calls by fetching all employees' attendance in one query
 */
export async function getEmployeesAttendanceBatch(
  employeeIds: (number | string)[],
  dateString: string,
  fromDateISO?: string,
  toDateISO?: string,
): Promise<Map<number, AttendanceRecord[]>> {
  // Calculate date range for filtering
  let startDate: string
  let endDate: string

  if (fromDateISO && toDateISO) {
    // Use the provided ISO dates, extract just the date part (YYYY-MM-DD)
    startDate = fromDateISO.includes('T') ? fromDateISO.split('T')[0] : fromDateISO
    endDate = toDateISO.includes('T') ? toDateISO.split('T')[0] : toDateISO
  } else {
    // fallback to using dateString (format: YYYY-MM-DD or YYYY-MM)
    const parts = dateString.split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])
    const startOfMonth = new Date(year, month - 1, 1)
    const endOfMonth = new Date(year, month, 0)
    startDate = startOfMonth.toISOString().split('T')[0]
    endDate = endOfMonth.toISOString().split('T')[0]
  }

  // Convert all employee IDs to numbers
  const numericIds = employeeIds.map((id) => Number(id))

  try {
    // Convert date strings to ISO format for RPC function
    const startISO = new Date(`${startDate}T00:00:00`).toISOString()
    const endISO = new Date(`${endDate}T23:59:59`).toISOString()

    // Call the RPC function for batch fetching
    const { data, error } = await supabase.rpc('get_attendance_batch', {
      p_employee_ids: numericIds,
      p_start_date: startISO,
      p_end_date: endISO,
    })

    if (error) {
      // console.error('[BATCH] RPC Error:', error)
      // console.error('[BATCH] Function might not exist. Run: supabase/functions/get_attendance_batch.sql')
      // console.error('[BATCH] Parameters:', { numericIds, startISO, endISO })
      return new Map()
    }

    // Group results by employee_id
    const grouped = new Map<number, AttendanceRecord[]>()

    if (Array.isArray(data)) {
      // Deduplicate records by id within each employee
      const deduplicatedByEmployee = new Map<number, Map<number, Record<string, unknown>>>()

      data.forEach((record: Record<string, unknown>) => {
        const empId = Number(record.employee_id)
        if (!deduplicatedByEmployee.has(empId)) {
          deduplicatedByEmployee.set(empId, new Map())
        }
        deduplicatedByEmployee.get(empId)!.set(record.id as number, record)
      })

      // Convert to final format
      deduplicatedByEmployee.forEach((recordsMap, empId) => {
        const records: AttendanceRecord[] = Array.from(recordsMap.values()).map((row: Record<string, unknown>) => {
          // Extract date from am_time_in first, fallback to pm_time_in for PM half-days
          const attendanceDate = row.am_time_in
            ? (row.am_time_in as string).split('T')[0]
            : row.pm_time_in
              ? (row.pm_time_in as string).split('T')[0]
              : null

          return {
            am_time_in: (row.am_time_in as string) || null,
            am_time_out: (row.am_time_out as string) || null,
            pm_time_in: (row.pm_time_in as string) || null,
            pm_time_out: (row.pm_time_out as string) || null,
            overtime_in: (row.overtime_in as string) || null,
            overtime_out: (row.overtime_out as string) || null,
            is_leave_with_pay: row.is_leave_with_pay as boolean | undefined,
            leave_type: row.leave_type as string | undefined,
            leave_reason: row.leave_reason as string | undefined,
            attendance_date: attendanceDate,
            date: attendanceDate, // Alias for compatibility
          }
        })
        grouped.set(empId, records)

        // Update cache for each employee
        const cacheKey = getCacheKey(empId, dateString, fromDateISO, toDateISO)
        attendanceCache.set(cacheKey, records)
        cacheMetadata.set(cacheKey, Date.now())
      })
    }

    return grouped
  } catch (error) {
    console.error('getEmployeesAttendanceBatch error:', error)
    return new Map()
  }
}

// ============================================================================
// ORIGINAL FUNCTIONS (Now with caching support)
// ============================================================================

export async function getEmployeeAttendanceById(
  employeeId: number | string,
  dateString: string,
  fromDateISO?: string,
  toDateISO?: string,
): Promise<AttendanceRecord[] | null> {
  // Clear expired cache entries periodically
  clearExpiredCache()

  // Check cache first
  const cacheKey = getCacheKey(employeeId, dateString, fromDateISO, toDateISO)
  if (attendanceCache.has(cacheKey)) {
    const cachedData = attendanceCache.get(cacheKey)!
    // console.log('[getEmployeeAttendanceById] Cache hit for employee:', employeeId)
    return cachedData
  }

  // Calculate date range for filtering by attendance_date
  let startDate: string
  let endDate: string

  if (fromDateISO && toDateISO) {
    // Use the provided ISO dates, extract just the date part (YYYY-MM-DD)
    startDate = fromDateISO.includes('T') ? fromDateISO.split('T')[0] : fromDateISO
    endDate = toDateISO.includes('T') ? toDateISO.split('T')[0] : toDateISO
  } else {
    // fallback to using dateString (format: YYYY-MM-DD or YYYY-MM)
    // Extract year and month from dateString
    const parts = dateString.split('-')
    const year = parseInt(parts[0])
    const month = parseInt(parts[1])

    // Create start of month (first day)
    const startOfMonth = new Date(year, month - 1, 1)
    // Create end of month (last day)
    const endOfMonth = new Date(year, month, 0)

    startDate = startOfMonth.toISOString().split('T')[0]
    endDate = endOfMonth.toISOString().split('T')[0]
  }

  // debug
  // console.log('[getEmployeeAttendanceById] Fetching attendance data:', {
  //   employeeId,
  //   dateString,
  //   fromDateISO,
  //   toDateISO,
  //   queryRange: {
  //     startDate,
  //     endDate
  //   }
  // })

  // Convert dates to ISO format for filtering
  const startISO = new Date(`${startDate}T00:00:00`).toISOString()
  const endISO = new Date(`${endDate}T23:59:59`).toISOString()

  const { data, error } = await supabase
    .from('attendances')
    .select(
      'id, am_time_in, am_time_out, pm_time_in, pm_time_out, overtime_in, overtime_out, is_overtime_applied, is_leave_with_pay, leave_type, leave_reason',
    )
    .eq('employee_id', employeeId)
    .or(
      `and(am_time_in.gte.${startISO},am_time_in.lt.${endISO}),and(am_time_in.is.null,pm_time_in.gte.${startISO},pm_time_in.lt.${endISO})`,
    )
    .order('am_time_in', { ascending: false })
  if (error) {
    // console.error('getEmployeeAttendanceById error:', error)
    return null
  }
  //kuhaon tanan attendance records para sa employee, i-strip ang date, time ra ibalik (HH:MM)

  // Deduplicate records by id (in case OR query returns duplicates for records with both AM and PM)
  const uniqueData = data ? Array.from(new Map(data.map(item => [item.id, item])).values()) : []

  // console.log('[getEmployeeAttendanceById] Raw attendance records fetched:', {
  //   totalRecords: data?.length || 0,
  //   uniqueRecords: uniqueData.length,
  //   recordIds: uniqueData.map(r => r.id)
  // })

  const result = Array.isArray(uniqueData)
    ? uniqueData.map((row) => {
        // Extract date from am_time_in first, fallback to pm_time_in for PM half-days
        const attendanceDate = row.am_time_in
          ? row.am_time_in.split('T')[0]
          : row.pm_time_in
            ? row.pm_time_in.split('T')[0]
            : null

        // Calculate hours for this day
        let dayHours = 0
        if (row.am_time_in && row.am_time_out) {
          const amIn = new Date(`1970-01-01T${getTimeHHMM(row.am_time_in)}`)
          const amOut = new Date(`1970-01-01T${getTimeHHMM(row.am_time_out)}`)
          dayHours += (amOut.getTime() - amIn.getTime()) / (1000 * 60 * 60)
        }
        if (row.pm_time_in && row.pm_time_out) {
          const pmIn = new Date(`1970-01-01T${getTimeHHMM(row.pm_time_in)}`)
          const pmOut = new Date(`1970-01-01T${getTimeHHMM(row.pm_time_out)}`)
          dayHours += (pmOut.getTime() - pmIn.getTime()) / (1000 * 60 * 60)
        }

        return {
          am_time_in: getTimeHHMM(row.am_time_in),
          am_time_out: getTimeHHMM(row.am_time_out),
          pm_time_in: getTimeHHMM(row.pm_time_in),
          pm_time_out: getTimeHHMM(row.pm_time_out),
          overtime_in: getTimeHHMM(row.overtime_in),
          overtime_out: getTimeHHMM(row.overtime_out),
          is_overtime_applied: row.is_overtime_applied,
          is_leave_with_pay: row.is_leave_with_pay,
          leave_type: row.leave_type,
          leave_reason: row.leave_reason,
          attendance_date: attendanceDate, // Extract date from timestamp
          date: attendanceDate, // Alias for compatibility with Sunday detection
          _debug_dayHours: dayHours // Add debug info
        }
      })
    : null

  // Log detailed breakdown of processed attendance
  if (result && result.length > 0) {
    const totalHours = result.reduce((sum, r) => sum + (r._debug_dayHours || 0), 0)
    const daysWithAttendance = result.filter(r => r.am_time_in || r.pm_time_in).length

     console.log('[getEmployeeAttendanceById] PROCESSED ATTENDANCE BREAKDOWN:', {
      employeeId,
      totalDays: result.length,
      daysWithAttendance,
       totalHours: totalHours.toFixed(2),
      averageHoursPerDay: daysWithAttendance > 0 ? (totalHours / daysWithAttendance).toFixed(2) : '0.00',
      dateRange: {
        from: fromDateISO || dateString,
        to: toDateISO || 'end of month'
       }
     })

    // Create detailed table of each day
    console.table(result.map(r => ({
      Date: r.attendance_date || r.date || 'N/A',
      'AM In': r.am_time_in || '-',
      'AM Out': r.am_time_out || '-',
      'PM In': r.pm_time_in || '-',
      'PM Out': r.pm_time_out || '-',
      'Hours': (r._debug_dayHours || 0).toFixed(2),
      'Leave': r.is_leave_with_pay ? 'Yes' : '-'
    })))
  } else {
    // console.log('[getEmployeeAttendanceById] No attendance records found for employee:', employeeId)
  }

  // Cache the result
  if (result) {
    attendanceCache.set(cacheKey, result)
    cacheMetadata.set(cacheKey, Date.now())
  }

  return result
}

export function getEmployeeByIdemp(id: number): Employee | undefined {
  const employeesStore = useEmployeesStore()
  const employees = employeesStore.employees
  return employees.find((emp: Employee) => emp.id === id)
}

// Helper function to compute overtime hours between two time strings (HH:MM)
// Handles overnight shifts (e.g., 5:00 PM to 1:00 AM next day)
export function computeOvertimeHours(
  overtimeIn: string | null,
  overtimeOut: string | null,
): number {
  if (!overtimeIn || !overtimeOut) {
    // console.log('[computeOvertimeHours] Missing overtime in/out:', { overtimeIn, overtimeOut })
    return 0
  }

  // parse time strings to Date objects (use today as date)
  const today = getDateISO(new Date()) || new Date().toISOString().split('T')[0]
  const inDate = new Date(`${today}T${overtimeIn}:00`)
  const outDate = new Date(`${today}T${overtimeOut}:00`)

  let diffMs = outDate.getTime() - inDate.getTime()

  // Handle overnight shifts: if end time is earlier than start time, add 24 hours
  if (diffMs < 0) {
    // console.log('[computeOvertimeHours] Detected overnight shift:', { overtimeIn, overtimeOut })
    diffMs += 24 * 60 * 60 * 1000 // Add 24 hours in milliseconds
  }

  const diffHours = diffMs / (1000 * 60 * 60)

  // console.log('[computeOvertimeHours] Calculated overtime:', {
  //   overtimeIn,
  //   overtimeOut,
  //   hours: diffHours.toFixed(2),
  //   isOvernight: diffMs >= 24 * 60 * 60 * 1000
  // })

  return diffHours > 0 ? diffHours : 0
}

// Async function to compute overall overtime for the month for an employee
export async function computeOverallOvertimeCalculation(
  employeeId?: number,
  dateString?: string,
  fromDateISO?: string,
  toDateISO?: string,
): Promise<number> {
  // console.log('[computeOverallOvertimeCalculation] Starting calculation:', {
  //   employeeId,
  //   dateString,
  //   fromDateISO,
  //   toDateISO,
  // })

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

  // console.log('[computeOverallOvertimeCalculation] Resolved parameters:', {
  //   employeeId,
  //   usedDateString,
  //   usedFrom,
  //   usedTo,
  // })

  if (employeeId && usedDateString) {
    // Use special function for employee 55, regular function for others
    const attendances = employeeId === 55
      ? await getEmployeeAttendanceForEmployee55(employeeId, usedDateString, usedFrom, usedTo)
      : await getEmployeeAttendanceById(employeeId, usedDateString, usedFrom, usedTo)

    // console.log('[computeOverallOvertimeCalculation] Fetched attendances:', {
    //   employeeId,
    //   attendanceCount: attendances?.length || 0,
    //   isEmployee55: employeeId === 55,
    // })

    if (Array.isArray(attendances) && attendances.length > 0) {
      // sum all overtime hours for the month
      let totalOvertime = 0
      const overtimeDetails: Array<{ date: string; overtimeIn: string | null; overtimeOut: string | null; hours: number; isApplied: boolean }> = []

      attendances.forEach((a) => {
        // Only count overtime if is_overtime_applied is true
        if (a.is_overtime_applied !== true) {
          return
        }

        const hours = computeOvertimeHours(a.overtime_in, a.overtime_out)
        totalOvertime += hours

        if (hours > 0) {
          overtimeDetails.push({
            date: a.attendance_date || a.date || 'N/A',
            overtimeIn: a.overtime_in,
            overtimeOut: a.overtime_out,
            hours,
            isApplied: a.is_overtime_applied || false,
          })
        }
      })

      // console.log('[computeOverallOvertimeCalculation] OVERTIME BREAKDOWN:', {
      //   employeeId,
      //   totalDays: attendances.length,
      //   daysWithOvertime: overtimeDetails.length,
      //   totalOvertimeHours: totalOvertime.toFixed(2),
      // })

      if (overtimeDetails.length > 0) {
        // console.table(overtimeDetails.map(d => ({
        //   Date: d.date,
        //   'OT In': d.overtimeIn || '-',
        //   'OT Out': d.overtimeOut || '-',
        //   'Hours': d.hours.toFixed(2),
        //   'Applied': d.isApplied ? 'Yes' : 'No',
        // })))
      } else {
        // console.log('[computeOverallOvertimeCalculation] No overtime records with is_overtime_applied=true found for date range:', {
        //   fromDate: usedFrom,
        //   toDate: usedTo,
        // })
      }

      return totalOvertime
    } else {
      // console.log('[computeOverallOvertimeCalculation] No attendances found for employee:', employeeId)
    }
  } else {
    // console.log('[computeOverallOvertimeCalculation] Missing required parameters:', {
    //   hasEmployeeId: !!employeeId,
    //   hasDateString: !!usedDateString,
    // })
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
): Promise<AttendanceRecord[] | null> {
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
