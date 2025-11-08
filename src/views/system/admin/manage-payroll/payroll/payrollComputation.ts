import { getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, computeOverallOvertimeCalculation, getExcessMinutes, getUndertimeMinutes } from './computation/computation'
import { getTotalMinutesForMonth, getPaidLeaveDaysForMonth, isFridayOrSaturday } from './computation/attendance'
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

/**
 * Calculate field staff late and undertime minutes with specific time thresholds
 * AM Late: starts at 7:21, AM Undertime: before 11:49
 * PM Late: starts at 1:01, PM Undertime: before 4:59
 */
function calculateFieldStaffLateUndertime(attendances: Array<{ am_time_in?: string | null; pm_time_in?: string | null; am_time_out?: string | null; pm_time_out?: string | null }>): { lateMinutes: number; undertimeMinutes: number } {
  let totalLateMinutes = 0
  let totalUndertimeMinutes = 0

  attendances.forEach((attendance) => {
    // AM Late calculation: after 7:20 (7:21 and later)
    if (attendance.am_time_in) {
      const amTimeIn = new Date(`1970-01-01T${attendance.am_time_in}`)
      const amLateThreshold = new Date('1970-01-01T07:20:59')
      if (amTimeIn > amLateThreshold) {
        totalLateMinutes += Math.floor((amTimeIn.getTime() - amLateThreshold.getTime()) / (1000 * 60))
      }
    }

    // PM Late calculation: after 1:00 (1:01 and later)
    if (attendance.pm_time_in) {
      const pmTimeIn = new Date(`1970-01-01T${attendance.pm_time_in}`)
      const pmLateThreshold = new Date('1970-01-01T13:00:59')
      if (pmTimeIn > pmLateThreshold) {
        totalLateMinutes += Math.floor((pmTimeIn.getTime() - pmLateThreshold.getTime()) / (1000 * 60))
      }
    }

    // AM Undertime calculation: before 11:49
    if (attendance.am_time_out) {
      const amTimeOut = new Date(`1970-01-01T${attendance.am_time_out}`)
      const amUndertimeThreshold = new Date('1970-01-01T11:49:00')
      if (amTimeOut < amUndertimeThreshold) {
        totalUndertimeMinutes += Math.floor((amUndertimeThreshold.getTime() - amTimeOut.getTime()) / (1000 * 60))
      }
    }

    // PM Undertime calculation: before 4:59
    if (attendance.pm_time_out) {
      const pmTimeOut = new Date(`1970-01-01T${attendance.pm_time_out}`)
      const pmUndertimeThreshold = new Date('1970-01-01T16:59:00')
      if (pmTimeOut < pmUndertimeThreshold) {
        totalUndertimeMinutes += Math.floor((pmUndertimeThreshold.getTime() - pmTimeOut.getTime()) / (1000 * 60))
      }
    }
  })

  return { lateMinutes: totalLateMinutes, undertimeMinutes: totalUndertimeMinutes }
}

export function usePayrollComputation(
  dailyRate: Ref<number>,
  grossSalary: Ref<number>,
  tableData: Ref<TableData | null>,
  employeeId?: number,
  payrollMonth?: string,
  payrollYear?: number,
  dateString?: string,
  filterDateString?: Ref<string>,
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
    return await computeOverallOvertimeCalculation(employeeId, dateString, fromDate, toDate)
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

  // Update employee daily rate when employeeId changes
  const updateEmployeeDailyRate = async () => {
    if (!employeeId) {
      employeeDailyRate.value = dailyRate.value
      isFieldStaff.value = false
      return
    }
    const emp = await employeesStore.getEmployeesById(employeeId)
    employeeDailyRate.value = emp?.daily_rate || dailyRate.value
    isFieldStaff.value = emp?.is_field_staff || false
  }

  // Watch for employeeId changes and update daily rate
  watch(() => employeeId, updateEmployeeDailyRate, { immediate: true })

  // monthLateDeduction for total late minutes in the month
  const monthLateDeduction = ref<number>(0)

  // monthUndertimeDeduction for total undertime minutes in the month
  const monthUndertimeDeduction = ref<number>(0)

  // Late deduction formula: (dailyrate / 8 hours / 60 minutes) * total late minutes
  const lateDeduction = computed(() => {
    //compute ang deduction base sa total late minutes
    const perMinuteRate = (dailyRate.value || 0) / 8 / 60
    return perMinuteRate * (monthLateDeduction.value || 0)
  })

  // Undertime deduction formula: (dailyrate / 8 hours / 60 minutes) * total undertime minutes
  const undertimeDeduction = computed(() => {
    //compute ang deduction base sa total undertime minutes
    const perMinuteRate = (dailyRate.value || 0) / 8 / 60
    return perMinuteRate * (monthUndertimeDeduction.value || 0)
  })

  // Regular work total (future-proof for deductions, etc.)
  const regularWorkTotal = ref<number>(0)
  const absentDays = ref<number>(0)
  const presentDays = ref<number>(0)

  async function computeRegularWorkTotal() {
    let daily = dailyRate.value
    // const source = 'fallback'

    // Kuhaon ang dateString gikan sa prop, kung wala, kuhaon sa localStorage
    let usedDateString = dateString
    if (!usedDateString && typeof window !== 'undefined') {
      usedDateString = localStorage.getItem('czarles_payroll_dateString') || undefined
      //console.log(`[computeRegularWorkTotal] Using dateString: ${usedDateString}`)
    }

    if (employeeId && usedDateString) {
      // Read persisted from/to dates if available
      let fromDate: string | undefined = undefined
      let toDate: string | undefined = undefined
      if (typeof window !== 'undefined') {
        fromDate = localStorage.getItem('czarles_payroll_fromDate') || undefined
        toDate = localStorage.getItem('czarles_payroll_toDate') || undefined
      }

      // Use special function for employee 55, regular function for others
      const attendances = employeeId === 55
        ? await getEmployeeAttendanceForEmployee55(employeeId, usedDateString, fromDate, toDate)
        : await getEmployeeAttendanceById(employeeId, usedDateString, fromDate, toDate)
      if (Array.isArray(attendances) && attendances.length > 0) {
        // Get employee info to check if field staff
        const emp = await employeesStore.getEmployeesById(employeeId)
        const isFieldStaff = emp?.is_field_staff || undefined

        // Get paid leave days para sa month
        const paidLeaveDays = await getPaidLeaveDaysForMonth(usedDateString, employeeId)
        /*  console.log(
          `[computeRegularWorkTotal] Paid leave days for employee ${employeeId}:`,
          paidLeaveDays,
        ) */

        if (isFieldStaff) {
          // For field staff, use getTotalMinutesForMonth to calculate actual work hours for the entire month
          let totalWorkMinutes = 0

          // Get filterDateString value, fallback to usedDateString if not provided
          const dateStringForCalculation = filterDateString?.value || usedDateString

          if (dateStringForCalculation) {
            // Use getTotalMinutesForMonth to get total minutes worked for the entire month
            totalWorkMinutes = await getTotalMinutesForMonth(
              dateStringForCalculation, // filterDateString format: "YYYY-MM-01"
              employeeId,
              true, // isField = true
            )
          }

          // For field staff, calculate pay based on actual hours worked
          const totalWorkHours = totalWorkMinutes / 60 // Convert minutes to hours
          const hourlyRate = daily / 8
          regularWorkTotal.value = totalWorkHours * hourlyRate

          // Set present days based on days with attendance (including half days) + paid leave days
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

          // Add paid leave days to present days para field staff
          employeePresentDays += paidLeaveDays
          /*  console.log(
            `[computeRegularWorkTotal] Field staff - actual present: ${employeePresentDays - paidLeaveDays}, paid leave: ${paidLeaveDays}, total present: ${employeePresentDays}`,
          ) */

          presentDays.value = employeePresentDays
          absentDays.value = Math.max(0, workDays.value - employeePresentDays)

          // Calculate field staff late and undertime with specific thresholds
          const { lateMinutes, undertimeMinutes } = calculateFieldStaffLateUndertime(attendances)
          monthLateDeduction.value = lateMinutes
          monthUndertimeDeduction.value = undertimeMinutes

          if (lateMinutes > 0) {
            console.warn(`[FIELD STAFF LATE] Employee ${employeeId} - Late minutes: ${lateMinutes} (AM: 7:21+, PM: 1:01+)`)
          }
          if (undertimeMinutes > 0) {
            console.warn(`[FIELD STAFF UNDERTIME] Employee ${employeeId} - Undertime minutes: ${undertimeMinutes} (AM: <11:49, PM: <4:59)`)
          }
        } else {
          // For office staff, use existing logic with Friday/Saturday special rules
          /* const allAmTimeIn = attendances.map((a) => a.am_time_in)
          const allPmTimeIn = attendances.map((a) => a.pm_time_in)
          const allAmTimeOut = attendances.map((a) => a.am_time_out)
          const allPmTimeOut = attendances.map((a) => a.pm_time_out) */

          // Compute late minutes for each amTimeIn and pmTimeIn, and sum for month_late deduction
          let totalLateAM = 0
          let totalLatePM = 0
          let totalUndertimeAM = 0
          let totalUndertimePM = 0

          attendances.forEach((attendance, /* index */) => {
            const attendanceDate = attendance.attendance_date
            const isFriSat = attendanceDate ? isFridayOrSaturday(attendanceDate) : false

            // Determine time rules based on day of week
            const amStartTime = isFriSat ? '08:12' : '08:12'
            const pmStartTime = isFriSat ? '13:00' : '13:00' // PM start time remains the same
            const amEndTime = isFriSat ? '11:50' : '11:50' // AM end time adjusted for undertime deduction
            const pmEndTime = isFriSat ? '16:30' : '17:00' // PM end time changes for Fri/Sat

            // Calculate late minutes
            if (attendance.am_time_in) {
              const lateMinutes = getExcessMinutes(amStartTime, attendance.am_time_in)
              totalLateAM += lateMinutes

              //console.error(`[LATE AM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${amStartTime}, Actual: ${attendance.am_time_in}, Late: ${lateMinutes} minutes`)
            }
            if (attendance.pm_time_in) {
              const lateMinutes = getExcessMinutes(pmStartTime, attendance.pm_time_in)
              totalLatePM += lateMinutes
              //console.error(`[LATE PM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${pmStartTime}, Actual: ${attendance.pm_time_in}, Late: ${lateMinutes} minutes`)
            }

            // Calculate undertime minutes
            if (attendance.am_time_out) {
              const undertimeMinutes = getUndertimeMinutes(amEndTime, attendance.am_time_out)
              /*  if (undertimeMinutes > 0) {
                console.warn(`[UNDERTIME AM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${amEndTime}, Actual: ${attendance.am_time_out}, Undertime: ${undertimeMinutes} minutes`)
              } */
              totalUndertimeAM += undertimeMinutes
            }
            if (attendance.pm_time_out) {
              const undertimeMinutes = getUndertimeMinutes(pmEndTime, attendance.pm_time_out)
              /*  if (undertimeMinutes > 0) {
                console.warn(`[UNDERTIME PM] Employee ${employeeId} - Date: ${attendanceDate}, Expected: ${pmEndTime}, Actual: ${attendance.pm_time_out}, Undertime: ${undertimeMinutes} minutes`)
              } */
              totalUndertimePM += undertimeMinutes
            }
          })

          monthLateDeduction.value = totalLateAM + totalLatePM
          monthUndertimeDeduction.value = totalUndertimeAM + totalUndertimePM

          // Log total undertime summary
          /* if (monthUndertimeDeduction.value > 0) {
            console.warn(`[TOTAL UNDERTIME] Employee ${employeeId} - Total AM Undertime: ${totalUndertimeAM} minutes, Total PM Undertime: ${totalUndertimePM} minutes, Monthly Total: ${monthUndertimeDeduction.value} minutes`)
          } */

          // Check attendance data for present/absent days calculation including half days
          let employeePresentDays = 0
          // let fullDaysCount = 0
          // let halfDaysCount = 0

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

            // const attendanceDate = attendance.attendance_date

            // Full day: both AM and PM data are available
            if (hasAmData && hasPmData) {
              employeePresentDays += 1
              // fullDaysCount++
            }
            // Half day: only AM data or only PM data is available
            else if (hasAmData || hasPmData) {
              employeePresentDays += 0.5
              // halfDaysCount++
              // const timeType = hasAmData ? 'AM' : 'PM'
              // console.error(`[HALF DAY ${timeType}] Employee ${employeeId} - Date: ${attendanceDate}, AM: ${hasAmData ? 'Complete' : 'Missing'}, PM: ${hasPmData ? 'Complete' : 'Missing'}`)
            }
          })

          // Log summary para sa half days
          // if (halfDaysCount > 0) {
          //   console.error(`[HALF DAYS SUMMARY] Employee ${employeeId} - Total Full Days: ${fullDaysCount}, Total Half Days: ${halfDaysCount}, Total Present Days (with half days): ${employeePresentDays}`)
          // }

          // Add paid leave days to present days para office staff
          employeePresentDays += paidLeaveDays
          /*  console.log(
            `[computeRegularWorkTotal] Office staff - actual present: ${employeePresentDays - paidLeaveDays}, paid leave: ${paidLeaveDays}, total present: ${employeePresentDays}`,
          ) */

          // Calculate absent days: total working days minus present days (including paid leave)
          const totalAbsentDays = Math.max(0, workDays.value - employeePresentDays)

          presentDays.value = employeePresentDays
          absentDays.value = totalAbsentDays

          // Calculate regular work total using present days (which includes half days)
          regularWorkTotal.value = (daily ?? 0) * employeePresentDays
        }

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
  const overtimeHours = computed(() => tableData.value?.overtime_hours || 0)
  const overtimePay = computed(() => {
    const hourlyRate = dailyRate.value / 8
    const overtimeRate = hourlyRate * 1.25
    return overtimeHours.value * overtimeRate
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

    // Compute function for regular work total
    computeRegularWorkTotal,
  }
}
