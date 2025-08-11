// Async function para kuhaon ang am_time_in ug pm_time_in gikan sa attendance DB

import { computed, type Ref, ref, watch } from 'vue'
import { getEmployeeAttendanceById } from './computation/computation'
import { getTotalMinutesForMonth, getPaidLeaveDaysForMonth } from './computation/attendance'
import { useEmployeesStore } from '@/stores/employees'

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
  filterDateString?: Ref<string>,
) {
  // Initialize employees store
  const employeesStore = useEmployeesStore()

  // Helper function to compute overtime hours between two time strings (HH:MM)
  function computeOvertimeHours(overtimeIn: string | null, overtimeOut: string | null): number {
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
  async function computeOverallOvertimeCalculation() {
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
  // const employeesStore = useEmployeesStore()
  // const attendancesStore = useAttendancesStore()

  // Helper function to compute excess minutes (late)
  function getExcessMinutes(defaultOut: string, actualOut: string): number {
    const today = new Date().toISOString().split('T')[0]
    const defaultDate = new Date(`${today}T${defaultOut}:00`)
    const actualDate = new Date(`${today}T${actualOut}:00`)
    const diffMs = actualDate.getTime() - defaultDate.getTime()
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
    return diffMinutes
  }

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

  // Late deduction formula: (dailyrate / 8 hours / 60 minutes) * total late minutes
  const lateDeduction = computed(() => {
    //compute ang deduction base sa total late minutes
    const perMinuteRate = (dailyRate.value || 0) / 8 / 60
    return perMinuteRate * (monthLateDeduction.value || 0)
  })

  // Regular work total (future-proof for deductions, etc.)
  // Gamiton ang getEmployeeById ug i-filter by employeeId (props.employeeData?.id)
  // Async computed for regular work total using attendance DB
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
    }

    if (employeeId && usedDateString) {
      const attendances = await getEmployeeAttendanceById(employeeId, usedDateString)
      if (Array.isArray(attendances) && attendances.length > 0) {
        // Get employee info to check if field staff
        const emp = await employeesStore.getEmployeesById(employeeId)
        const isFieldStaff = emp?.is_field_staff || undefined

        // Get paid leave days para sa month
        const paidLeaveDays = await getPaidLeaveDaysForMonth(usedDateString, employeeId)
        console.log(
          `[computeRegularWorkTotal] Paid leave days for employee ${employeeId}:`,
          paidLeaveDays,
        )

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

          // Set present days based on days with any attendance + paid leave days
          let employeePresentDays = 0
          attendances.forEach((attendance) => {
            const hasAnyData =
              attendance.am_time_in ||
              attendance.am_time_out ||
              attendance.pm_time_in ||
              attendance.pm_time_out
            if (hasAnyData) employeePresentDays++
          })

          // Add paid leave days to present days para field staff
          employeePresentDays += paidLeaveDays
          console.log(
            `[computeRegularWorkTotal] Field staff - actual present: ${employeePresentDays - paidLeaveDays}, paid leave: ${paidLeaveDays}, total present: ${employeePresentDays}`,
          )

          presentDays.value = employeePresentDays
          absentDays.value = Math.max(0, workDays.value - employeePresentDays)
          monthLateDeduction.value = 0 // Field staff don't have late deductions
        } else {
          // For office staff, use existing logic
          const allAmTimeIn = attendances.map((a) => a.am_time_in)
          const allPmTimeIn = attendances.map((a) => a.pm_time_in)

          // Compute late minutes for each amTimeIn and pmTimeIn, and sum for month_late deduction
          let totalLateAM = 0
          let totalLatePM = 0
          allAmTimeIn.forEach((am) => {
            const lateMinutes = am ? getExcessMinutes('08:00', am) : 0
            totalLateAM += lateMinutes
          })
          allPmTimeIn.forEach((pm) => {
            const lateMinutes = pm ? getExcessMinutes('13:00', pm) : 0
            totalLatePM += lateMinutes
          })
          monthLateDeduction.value = totalLateAM + totalLatePM

          // Check attendance data for present/absent days calculation
          let employeePresentDays = 0

          attendances.forEach((attendance) => {
            // Strict check: BOTH AM or BOTH PM time-in and time-out must be present (not null or undefined)
            const hasAmData =
              attendance.am_time_in !== null &&
              attendance.am_time_in !== undefined &&
              attendance.am_time_out !== null &&
              attendance.am_time_out !== undefined
            const hasPmData =
              attendance.pm_time_in !== null &&
              attendance.pm_time_in !== undefined &&
              attendance.pm_time_out != null &&
              attendance.pm_time_out != undefined

            // Consider present if both AM and PM data are available
            if (hasAmData && hasPmData) {
              employeePresentDays++
            }
          })

          // Add paid leave days to present days para office staff
          employeePresentDays += paidLeaveDays
          console.log(
            `[computeRegularWorkTotal] Office staff - actual present: ${employeePresentDays - paidLeaveDays}, paid leave: ${paidLeaveDays}, total present: ${employeePresentDays}`,
          )

          // Calculate absent days: total working days minus present days (including paid leave)
          const totalAbsentDays = Math.max(0, workDays.value - employeePresentDays)

          presentDays.value = employeePresentDays
          absentDays.value = totalAbsentDays

          // Calculate regular work total: (total work days - absent days) * daily rate
          const effectiveWorkDays = Math.max(0, workDays.value - absentDays.value)
          regularWorkTotal.value = (daily ?? 0) * effectiveWorkDays
        }

        // Update daily rate from employee data if available
        if (emp) {
          daily = emp.daily_rate
        }
      } else {
        monthLateDeduction.value = 0
        presentDays.value = 0
        absentDays.value = workDays.value // All days considered absent kung wala attendance records
        regularWorkTotal.value = 0
      }
    } else {
      // No employee ID or date string, use fallback calculation
      monthLateDeduction.value = 0
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
    computeOverallOvertimeCalculation,
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
    lateDeduction,
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
