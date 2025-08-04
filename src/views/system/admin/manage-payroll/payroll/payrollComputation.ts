// Async function para kuhaon ang am_time_in ug pm_time_in gikan sa attendance DB

import { computed, type Ref, ref, watch } from 'vue'
import { getEmployeeAttendanceById, getEmployeeByIdemp } from './computation/computation'

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
  // Helper function to compute overtime hours between two time strings (HH:MM)
  function computeOvertimeHours(overtimeIn: string | null, overtimeOut: string | null): number {
    // Debug: log overtimeIn and overtimeOut values
    /* console.log('computeOvertimeHours:', { overtimeIn, overtimeOut }) */
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
  const employeeDailyRate = computed(() => {
    if (!employeeId) return dailyRate.value
    const emp = getEmployeeByIdemp(employeeId)
    return emp?.daily_rate || dailyRate.value
  })

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
        const allAmTimeIn = attendances.map((a) => a.am_time_in)
        const allPmTimeIn = attendances.map((a) => a.pm_time_in)
        // const allAmTimeOut = attendances.map((a) => a.am_time_out)
        // const allPmTimeOut = attendances.map((a) => a.pm_time_out)

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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attendances.forEach((attendance: any) => {
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
          /*   console.log(
            'Attendance:',
            {
              am_time_in: attendance.am_time_in,
              am_time_out: attendance.am_time_out,
              pm_time_in: attendance.pm_time_in,
              pm_time_out: attendance.pm_time_out,
            },
            '| hasAmData:', hasAmData,
            '| hasPmData:', hasPmData
          ) */

          // Kung naa attendance data (either AM or PM), consider as present direa nato kubion in the future and halfday chuchu..
          if (hasAmData && hasPmData) {
            employeePresentDays++
          }
        })

        // Calculate absent days: total working days minus present days
        const totalAbsentDays = Math.max(0, workDays.value - employeePresentDays)

        presentDays.value = employeePresentDays
        absentDays.value = totalAbsentDays
        //console.log('Total working days:', workDays.value, '| Present days:', employeePresentDays, '| Absent days:', totalAbsentDays)
        /*    console.log('Total month late deduction (minutes):', monthLateDeduction.value) */
      } else {
        monthLateDeduction.value = 0
        presentDays.value = 0
        absentDays.value = workDays.value // All days considered absent kung wala attendance records
      }
      // source = 'attendance'
      // Optionally, you can still get daily rate from employee store if needed
      const emp = getEmployeeByIdemp(employeeId)
      if (emp) {
        daily = emp.daily_rate
      }
    }

    // Calculate regular work total: (total work days - absent days) * daily rate
    const effectiveWorkDays = Math.max(0, workDays.value - absentDays.value)
    const total = (daily ?? 0) * effectiveWorkDays
    regularWorkTotal.value = total
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
      other_deductions: 20000,
    }
    if (tableData.value) {
      deductionFields.forEach((key) => {
        // kuhaon ang value per deduction, default 0 kung wala
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

    // Compute function for regular work total
    computeRegularWorkTotal,
  }
}
