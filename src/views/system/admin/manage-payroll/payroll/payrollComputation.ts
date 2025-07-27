import { useAttendancesStore } from '@/stores/attendances'
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
  dateString?: string
) {
  const employeesStore = useEmployeesStore()
  const attendancesStore = useAttendancesStore()

  // Helper function to compute excess minutes (late)
  function getExcessMinutes(defaultOut: string, actualOut: string): number {
    const today = new Date().toISOString().split("T")[0];
    const defaultDate = new Date(`${today}T${defaultOut}:00`);
    const actualDate = new Date(`${today}T${actualOut}:00`);
    const diffMs = actualDate.getTime() - defaultDate.getTime();
    const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));
    return diffMinutes;
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
    const emp = employeesStore.getEmployeeById(employeeId)
    return emp?.daily_rate || dailyRate.value
  })


  // Async function para kuhaon ang am_time_in ug pm_time_in gikan sa attendance DB
  async function getEmployeeTimeIns(empId?: number, dateStr?: string): Promise<{ amTimeIn: string | null; pmTimeIn: string | null }> {
    if (!empId || !dateStr) {
      // Kung walay empId or dateStr, default time_in values
      return { amTimeIn: '08:00', pmTimeIn: '13:00' }
    }
    const attendances = await attendancesStore.getEmployeeAttendanceById(empId, dateStr)
    if (Array.isArray(attendances) && attendances.length > 0) {
      // Gamiton ang pinakabag-o (first in array) na attendance record
      return { amTimeIn: attendances[0].am_time_in, pmTimeIn: attendances[0].pm_time_in }
    }
    // Kung walay attendance record, default time_in values
    return { amTimeIn: '08:00', pmTimeIn: '13:00' }
  }

  // Regular work total (future-proof for deductions, etc.)
  // Gamiton ang getEmployeeById ug i-filter by employeeId (props.employeeData?.id)
  // Async computed for regular work total using attendance DB
  const regularWorkTotal = ref<number>(0)

  async function computeRegularWorkTotal() {
    let daily = dailyRate.value
    let source = 'fallback'

    // Kuhaon ang dateString gikan sa prop, kung wala, kuhaon sa localStorage
    let usedDateString = dateString
    if (!usedDateString && typeof window !== 'undefined') {
      usedDateString = localStorage.getItem('czarles_payroll_dateString') || undefined
    }

    // Calculating regular work total for employeeId ug dateString gikan sa PayrollTableDialog.vue or localStorage
    console.log('Calculating regular work total for employeeId:', employeeId, '| dateString (from prop/localStorage):', usedDateString)

    let amTimeIn: string | null | undefined = undefined
    let pmTimeIn: string | null | undefined = undefined

    if (employeeId && usedDateString) {
      // Gamiton ang getEmployeeTimeIns para kuhaon ang time_in values
      const timeIns = await getEmployeeTimeIns(employeeId, usedDateString)
      amTimeIn = timeIns.amTimeIn
      pmTimeIn = timeIns.pmTimeIn
      // I-log ang output sa getEmployeeTimeIns
      console.log('getEmployeeTimeIns output:', timeIns)
      // I-log gihapon ang tanan am_time_in ug pm_time_in values separately kung naa attendance
      const attendances = await attendancesStore.getEmployeeAttendanceById(employeeId, usedDateString)
      if (Array.isArray(attendances) && attendances.length > 0) {
        const allAmTimeIn = attendances.map(a => a.am_time_in)
        const allPmTimeIn = attendances.map(a => a.pm_time_in)
        console.log('All am_time_in:', allAmTimeIn)
        console.log('All pm_time_in:', allPmTimeIn)
        // Compute late minutes for each amTimeIn and pmTimeIn, and sum for month_late deduction
        let totalLateAM = 0
        let totalLatePM = 0
        allAmTimeIn.forEach((am, idx) => {
          // Default AM time-in is 08:00
          const lateMinutes = am ? getExcessMinutes('08:00', am) : 0
          totalLateAM += lateMinutes
          /* console.log(`Late minutes (AM) for index ${idx}:`, lateMinutes) */
        })
        allPmTimeIn.forEach((pm, idx) => {
          // Default PM time-in is 13:00
          const lateMinutes = pm ? getExcessMinutes('13:00', pm) : 0
          totalLatePM += lateMinutes
          /* console.log(`Late minutes (PM) for index ${idx}:`, lateMinutes) */
        })
        const monthLateDeduction = totalLateAM + totalLatePM
        console.log('Total month late deduction (minutes):', monthLateDeduction)
        // Gamiton ang pinakabag-o (first in array) na attendance record
        // kuhaon ang am_time_in ug pm_time_in gikan sa attendance DB
        /* console.log('am_time_in:', attendances[0].am_time_in, '| pm_time_in:', attendances[0].pm_time_in) */
      }
      source = 'attendance'
      // Optionally, you can still get daily rate from employee store if needed
      const emp = employeesStore.getEmployeeById(employeeId)
      if (emp) {
        daily = emp.daily_rate
      }
    }
    const total = (daily ?? 0) * workDays.value
    regularWorkTotal.value = total
  }

  // Watch for changes and recompute
  watch([dailyRate, workDays, () => employeeId, () => dateString], computeRegularWorkTotal, { immediate: true })

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

  type DeductionKey = typeof deductionFields[number]

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

  // Calculation functions
  const calculateIncomeTax = (taxableIncome: number): number => {
    return 0
  }

  const calculateSSS = (monthlyBasicSalary: number): number => {
    return 0
  }

  const calculatePhilHealth = (monthlyBasicSalary: number): number => {
    return 0
  }

  const calculatePagIbig = (monthlyBasicSalary: number): number => {
    return 0
  }

  const calculateTotalDeductions = (): number => {
    return (
      sssDeduction.value +
      philhealthDeduction.value +
      pagibigDeduction.value +
      taxDeduction.value +
      otherDeductions.value
    )
  }

  // Utility functions
  const formatCurrency = (amount: number): string => amount.toFixed(2)
  const formatNumber = (num: number): string => num.toString()

  return {
    // Basic
    workDays,
    codaAllowance,
    totalGrossSalary,
    totalDeductions,
    netSalary,
    regularWorkTotal,

    // Overtime
    overtimeHours,
    overtimePay,
    totalEarnings,

    // Deductions
    sssDeduction,
    philhealthDeduction,
    pagibigDeduction,
    taxDeduction,
    otherDeductions,

    // Calculations
    calculateIncomeTax,
    calculateSSS,
    calculatePhilHealth,
    calculatePagIbig,
    calculateTotalDeductions,

    // Utilities
    formatCurrency,
    formatNumber,
    employeeDailyRate,
  }
}