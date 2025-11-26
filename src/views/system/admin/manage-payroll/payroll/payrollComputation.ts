import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, computeOverallOvertimeCalculation, getExcessMinutes, getUndertimeMinutes } from './computation/computation'
import { getPaidLeaveDaysForMonth, isFridayOrSaturday } from './computation/attendance'
import { useEmployeesStore } from '@/stores/employees'
import { computed, type Ref, ref, watch } from 'vue'

export interface PayrollData {
  month: string
  year: number
}

export interface TableData {
  gross_pay?: number
  deductions?: number
  net_pay?: number
  coda_allowance?: number
  overtime_hours?: number
  sss_deduction?: number
  philhealth_deduction?: number
  pagibig_deduction?: number
  tax_deduction?: number
  other_deductions?: number
}



export function usePayrollComputation(
  dailyRate: Ref<number>,
  grossSalary: Ref<number>,
  tableData: Ref<TableData | null>,
  employeeId?: number,
  payrollMonth?: string,
  payrollYear?: number,
  dateString?: string,
) {
  // Initialize employees store
  const employeesStore = useEmployeesStore()

  // Async function to compute overall overtime for the month for an employee
  async function computeOverallOvertimeCalculationForEmployee() {
    // Read persisted from/to dates if available
    let fromDate: string | undefined = undefined
    let toDate: string | undefined = undefined
    if (typeof window !== 'undefined') {
      fromDate = localStorage.getItem('czarles_payroll_fromDate') || undefined
      toDate = localStorage.getItem('czarles_payroll_toDate') || undefined
    }
    const overtimeResult = await computeOverallOvertimeCalculation(employeeId, dateString, fromDate, toDate)
    // console.log(`[OVERTIME CALCULATION] Employee ${employeeId}:`, {
    //   dateString,
    //   fromDate,
    //   toDate,
    //   overtimeHours: overtimeResult,
    // })
    return overtimeResult
  }
  // const employeesStore = useEmployeesStore()
  // const attendancesStore = useAttendancesStore()

  // Basic calculations
  const codaAllowance = computed(() => tableData.value?.coda_allowance || 0)
  const totalGrossSalary = computed(() => grossSalary.value + codaAllowance.value)
  const totalDeductions = computed(() => tableData.value?.deductions || 0)
  const netSalary = computed(() => totalGrossSalary.value - totalDeductions.value)

  // Work days calculation
  const workDays = computed(() => {
    if (!payrollMonth || !payrollYear) return 0
    const monthIndex = new Date(`${payrollMonth} 1, ${payrollYear}`).getMonth()
    const start = new Date(payrollYear, monthIndex, 1)
    const end = new Date(payrollYear, monthIndex + 1, 0)
    let count = 0
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const day = d.getDay()
      if (day >= 1 && day <= 5) count++
    }
    return count
  })

  // Employee daily rate
  const employeeDailyRate = ref<number>(dailyRate.value)
  const isFieldStaff = ref<boolean>(false)
  const isAdmin = ref<boolean>(false)

  // Update employee daily rate when employeeId changes
  const updateEmployeeDailyRate = async () => {
    if (!employeeId) {
      employeeDailyRate.value = dailyRate.value
      isFieldStaff.value = false
      isAdmin.value = false
      return
    }
    const emp = await employeesStore.getEmployeesById(employeeId)
    employeeDailyRate.value = emp?.daily_rate || dailyRate.value
    isFieldStaff.value = emp?.is_field_staff || false
    isAdmin.value = emp?.is_admin || false
  }

  // Watch for employeeId changes and update daily rate
  watch(() => employeeId, updateEmployeeDailyRate, { immediate: true })

  // monthLateDeduction for total late minutes in the month
  const monthLateDeduction = ref<number>(0)

  // monthUndertimeDeduction for total undertime minutes in the month
  const monthUndertimeDeduction = ref<number>(0)

  // Late deduction formula: (dailyrate / 8 hours / 60 minutes) * total late minutes
  // Admin employees should not have late deductions
  const lateDeduction = computed(() => {
    if (isAdmin.value) return 0
    //compute ang deduction base sa total late minutes
    const perMinuteRate = (dailyRate.value || 0) / 8 / 60
    return perMinuteRate * (monthLateDeduction.value || 0)
  })

  // Undertime deduction formula: (dailyrate / 8 hours / 60 minutes) * total undertime minutes
  // Admin employees should not have undertime deductions
  const undertimeDeduction = computed(() => {
    if (isAdmin.value) return 0
    //compute ang deduction base sa total undertime minutes
    const perMinuteRate = (dailyRate.value || 0) / 8 / 60
    return perMinuteRate * (monthUndertimeDeduction.value || 0)
  })

  // Regular work total (future-proof for deductions, etc.)
  const regularWorkTotal = ref<number>(0)
  const absentDays = ref<number>(0)
  const presentDays = ref<number>(0)
  const attendanceRecords = ref<Array<{
    am_time_in?: string | null
    am_time_out?: string | null
    pm_time_in?: string | null
    pm_time_out?: string | null
  }>>([])

  async function computeRegularWorkTotal() {
    let daily = dailyRate.value
    // const source = 'fallback'

    // Kuhaon ang dateString gikan sa prop, kung wala, kuhaon sa localStorage
    let usedDateString = dateString
    if (!usedDateString && typeof window !== 'undefined') {
      usedDateString = localStorage.getItem('czarles_payroll_dateString') || undefined
      // console.log(`[computeRegularWorkTotal] Using dateString: ${usedDateString}`)
    }

    if (employeeId && usedDateString) {
      // Read persisted from/to dates if available
      let fromDate: string | undefined = undefined
      let toDate: string | undefined = undefined
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate') || undefined
        toDate = localStorage.getItem('czarles_payroll_toDate') || undefined
      }

      // Get employee info to check if admin
      const emp = await employeesStore.getEmployeesById(employeeId)
      const isAdmin = emp?.is_admin || false

      // Use special function for admin employees, regular function for others
      const attendances = isAdmin
        ? await getEmployeeAttendanceForEmployee55(employeeId, usedDateString, fromDate, toDate)
        : await getEmployeeAttendanceById(employeeId, usedDateString, fromDate, toDate)

          // Store attendance records for later use
      attendanceRecords.value = Array.isArray(attendances) ? attendances : []

      // Debug: Log main calculation data
      console.warn(`[MAIN PAYROLL DEBUG] Employee ${employeeId} - Total attendance records: ${Array.isArray(attendances) ? attendances.length : 0}`)

      if (Array.isArray(attendances) && attendances.length > 0) {
        // Read persisted from/to dates for crossmonth calculations if available
        let fromDateForAttendance: string | undefined = undefined
        let toDateForAttendance: string | undefined = undefined
        if (typeof window !== 'undefined') {
          fromDateForAttendance = localStorage.getItem('czarles_payroll_fromDate') || undefined
          toDateForAttendance = localStorage.getItem('czarles_payroll_toDate') || undefined
        }

        // Get paid leave days para sa month
        const paidLeaveDays = await getPaidLeaveDaysForMonth(usedDateString, employeeId, fromDateForAttendance, toDateForAttendance)
        // console.log(
        //   `[computeRegularWorkTotal] Paid leave days for employee ${employeeId}:`,
        //   paidLeaveDays,
        // )



        // Use unified late/undertime calculation for both field staff and office staff
        // This logic matches the AttendanceDaysTooltip.vue calculation
        let totalLateAM = 0
        let totalLatePM = 0
        let totalUndertimeAM = 0
        let totalUndertimePM = 0

        attendances.forEach((attendance, /* index */) => {
          const attendanceDate = attendance.attendance_date
          const isFriSat = attendanceDate ? isFridayOrSaturday(attendanceDate) : false
          const isFieldStaff = emp?.is_field_staff || false

          // Determine time rules based on staff type and day of week
          let amStartTime, pmStartTime, amEndTime, pmEndTime

          if (isFieldStaff) {
            // Field staff time rules: 7:20 AM start, 11:50 AM end, PM same as office
            amStartTime = '07:20'
            pmStartTime = isFriSat ? '13:00' : '13:00'
            amEndTime = '11:50'
            pmEndTime = isFriSat ? '16:30' : '17:00'
          } else {
            // Office staff time rules: 8:12 AM start
            amStartTime = isFriSat ? '08:12' : '08:12'
            pmStartTime = isFriSat ? '13:00' : '13:00' // PM start time remains the same
            amEndTime = isFriSat ? '11:50' : '11:50' // AM end time adjusted for undertime deduction
            pmEndTime = isFriSat ? '16:30' : '17:00' // PM end time changes for Fri/Sat
          }

          // Calculate late minutes
          if (attendance.am_time_in) {
            const lateMinutes = getExcessMinutes(amStartTime, attendance.am_time_in)
            totalLateAM += lateMinutes

            // console.error(`[LATE AM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${amStartTime}, Actual: ${attendance.am_time_in}, Late: ${lateMinutes} minutes`)
          }
          if (attendance.pm_time_in) {
            const lateMinutes = getExcessMinutes(pmStartTime, attendance.pm_time_in)
            totalLatePM += lateMinutes
            // console.error(`[LATE PM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${pmStartTime}, Actual: ${attendance.pm_time_in}, Late: ${lateMinutes} minutes`)
          }

          // Calculate undertime minutes
          if (attendance.am_time_out) {
            const undertimeMinutes = getUndertimeMinutes(amEndTime, attendance.am_time_out)
            // if (undertimeMinutes > 0) {
            //   console.warn(`[UNDERTIME AM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${amEndTime}, Actual: ${attendance.am_time_out}, Undertime: ${undertimeMinutes} minutes`)
            // }
            totalUndertimeAM += undertimeMinutes
          }
          if (attendance.pm_time_out) {
            const undertimeMinutes = getUndertimeMinutes(pmEndTime, attendance.pm_time_out)
            // if (undertimeMinutes > 0) {
            //   console.warn(`[UNDERTIME PM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${pmEndTime}, Actual: ${attendance.pm_time_out}, Undertime: ${undertimeMinutes} minutes`)
            // }
            totalUndertimePM += undertimeMinutes
          }
        })

        monthLateDeduction.value = totalLateAM + totalLatePM
        monthUndertimeDeduction.value = totalUndertimeAM + totalUndertimePM

        // Debug: Log main calculation results
        console.warn(`[MAIN PAYROLL CALCULATION] Employee ${employeeId} - Processed ${attendances.length} records`)
        console.warn(`[MAIN PAYROLL TOTALS] Late: ${totalLateAM + totalLatePM} minutes (AM: ${totalLateAM}, PM: ${totalLatePM})`)
        console.warn(`[MAIN PAYROLL TOTALS] Undertime: ${totalUndertimeAM + totalUndertimePM} minutes (AM: ${totalUndertimeAM}, PM: ${totalUndertimePM})`)

        // Log total undertime summary
        // if (monthUndertimeDeduction.value > 0) {
        //   console.warn(`[TOTAL UNDERTIME] Employee ${employeeId} - Total AM Undertime: ${totalUndertimeAM} minutes, Total PM Undertime: ${totalUndertimePM} minutes, Monthly Total: ${monthUndertimeDeduction.value} minutes`)
        // }

        // Calculate present/absent days for both field staff and office staff
        // This logic is now unified and moved outside the staff type conditional
        let employeePresentDays = 0

        attendances.forEach((attendance) => {
          // Check if both AM time-in and time-out are present and not empty strings
          const hasAmData =
            attendance.am_time_in !== null &&
            attendance.am_time_in !== undefined &&
            attendance.am_time_in !== '' &&
            attendance.am_time_out !== null &&
            attendance.am_time_out !== undefined &&
            attendance.am_time_out !== ''

          // Check if both PM time-in and time-out are present and not empty strings
          const hasPmData =
            attendance.pm_time_in !== null &&
            attendance.pm_time_in !== undefined &&
            attendance.pm_time_in !== '' &&
            attendance.pm_time_out != null &&
            attendance.pm_time_out != undefined &&
            attendance.pm_time_out !== ''

          // Full day: both AM and PM data are available
          if (hasAmData && hasPmData) {
            employeePresentDays += 1
          }
          // Half day: only AM data or only PM data is available
          else if (hasAmData || hasPmData) {
            employeePresentDays += 0.5
          }
        })

        // Add paid leave days to present days (for both staff types)
        employeePresentDays += paidLeaveDays

        // Calculate absent days: total working days minus present days (including paid leave)
        const totalAbsentDays = Math.max(0, workDays.value - employeePresentDays)

        // Set final values for both staff types
        presentDays.value = employeePresentDays
        absentDays.value = totalAbsentDays
        regularWorkTotal.value = (daily ?? 0) * employeePresentDays

        // Update daily rate from employee data if available
        if (emp) {
          daily = emp.daily_rate
        }
      } else {
        monthLateDeduction.value = 0
        monthUndertimeDeduction.value = 0
        presentDays.value = 0
        absentDays.value = workDays.value // All days considered absent kung wala attendance records
        regularWorkTotal.value = 0
      }
    } else {
      // No employee ID or date string, use fallback calculation
      monthLateDeduction.value = 0
      monthUndertimeDeduction.value = 0
      presentDays.value = 0
      absentDays.value = workDays.value // All days considered absent if no attendance records
      const effectiveWorkDays = Math.max(0, workDays.value - absentDays.value)
      regularWorkTotal.value = (daily ?? 0) * effectiveWorkDays
    }
  }

  // Watch for changes and recompute
  watch([dailyRate, workDays, () => employeeId, () => dateString], computeRegularWorkTotal, {
    immediate: true,
  })

  // Overtime calculations
  const overtimeHours = computed(() => {
    const hours = tableData.value?.overtime_hours || 0
    // console.log(`[OVERTIME HOURS] Employee ${employeeId}:`, hours)
    return hours
  })
  const overtimePay = computed(() => {
    const hourlyRate = dailyRate.value / 8
    const overtimeRate = hourlyRate * 1.25
    const pay = overtimeHours.value * overtimeRate
    // console.log(`[OVERTIME PAY] Employee ${employeeId}:`, {
    //   hourlyRate: hourlyRate.toFixed(2),
    //   overtimeRate: overtimeRate.toFixed(2),
    //   overtimeHours: overtimeHours.value,
    //   overtimePay: pay.toFixed(2),
    // })
    return pay
  })
  const totalEarnings = computed(() => totalGrossSalary.value + overtimePay.value)

  // Dynamic deduction variables for future extensibility
  // Magamit ni for any deduction type, dili lang fixed fields
  const deductionFields = [
    'sss_deduction',
    'philhealth_deduction',
    'pagibig_deduction',
    'tax_deduction',
    'other_deductions',
    // add more deduction keys diri in the future
  ] as const

  type DeductionKey = (typeof deductionFields)[number]

  // Dynamic deductions object
  const deductions = computed(() => {
    const result: Record<DeductionKey, number> = {
      sss_deduction: 0,
      philhealth_deduction: 0,
      pagibig_deduction: 0,
      tax_deduction: 0,
      other_deductions: 0,
    }
    if (tableData.value) {
      deductionFields.forEach((key) => {
        // Get value per deduction, default 0 if not available
        result[key] = tableData.value?.[key] || 0
      })
    }
    return result
  })

  // For backward compatibility, keep individual computed
  const sssDeduction = computed(() => deductions.value.sss_deduction)
  const philhealthDeduction = computed(() => deductions.value.philhealth_deduction)
  const pagibigDeduction = computed(() => deductions.value.pagibig_deduction)
  const taxDeduction = computed(() => deductions.value.tax_deduction)
  const otherDeductions = computed(() => deductions.value.other_deductions)

  // Utility functions
  const formatCurrency = (amount: number): string => amount.toFixed(2)
  const formatNumber = (num: number): string => num.toString()

  return {
    // Overtime calculation utility
    computeOverallOvertimeCalculation: computeOverallOvertimeCalculationForEmployee,
    // Basic
    workDays,
    codaAllowance,
    totalGrossSalary,
    totalDeductions,
    netSalary,
    regularWorkTotal,
    absentDays,
    presentDays,

    // Overtime
    overtimeHours,
    overtimePay,
    totalEarnings,

    // Deductions
    monthLateDeduction,
    monthUndertimeDeduction,
    lateDeduction,
    undertimeDeduction,
    sssDeduction,
    philhealthDeduction,
    pagibigDeduction,
    taxDeduction,
    otherDeductions,

    // Utilities
    formatCurrency,
    formatNumber,
    employeeDailyRate,
    isFieldStaff,
    isAdmin,
    attendanceRecords,

    // Compute function for regular work total
    computeRegularWorkTotal,
  }
}
