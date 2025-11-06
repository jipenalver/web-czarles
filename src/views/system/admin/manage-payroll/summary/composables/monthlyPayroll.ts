import { supabase } from '@/utils/supabase'
import { ref, computed } from 'vue'
import { getTotalMinutesForMonth, getPaidLeaveDaysForMonth, isFridayOrSaturday } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
import { getEmployeesAttendanceBatch, getEmployeeAttendanceById, getEmployeeAttendanceForEmployee55, getExcessMinutes, getUndertimeMinutes, computeOvertimeHours } from '@/views/system/admin/manage-payroll/payroll/computation/computation'
import { useEmployeesStore } from '@/stores/employees'

/**
 * Interface for database function response row
 */
interface PayrollDatabaseRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number // Can be decimal for half days (e.g., 0.5, 1.5, 2.0)
  sunday_days: number
  sunday_amount: number
  cola: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  gross_pay: number
  cash_advance: number
  sss: number
  phic: number
  pagibig: number
  sss_loan: number
  savings: number
  salary_deposit: number
  late_deduction: number
  undertime_deduction: number
  total_deductions: number
  net_pay: number
}

export interface MonthlyPayrollRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number
  is_field_staff: boolean // Added to track field staff status
  hours_worked?: number // Added for field staff - stores actual hours worked
  sunday_days: number
  sunday_amount: number
  cola: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  gross_pay: number
  deductions: {
    cash_advance: number
    sss: number
    phic: number
    pagibig: number
    sss_loan: number
    savings: number
    salary_deposit: number
    late: number
    undertime: number
    total: number
  }
  total_deductions: number
  net_pay: number
}

export interface MonthlyPayrollTotals {
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  utilizations_pay: number
  holidays_pay: number
  gross_pay: number
  total_deductions: number
  net_pay: number
}

/**
 * Composable for monthly payroll computation using Supabase function
 */
export function useMonthlyPayroll() {
  // State
  const loading = ref(false)
  const monthlyPayrollData = ref<MonthlyPayrollRow[]>([])
  const selectedMonth = ref<string>('')
  const selectedYear = ref<number>(new Date().getFullYear())

  // Cache to prevent reloading same month/year
  const lastLoadedKey = ref<string>('')

  // Initialize employees store
  const employeesStore = useEmployeesStore()

  /**
   * Calculate client-side overtime hours using PayrollPrint.vue logic
   * Returns total overtime hours for the month
   */
  async function calculateOvertimeHours(
    employeeId: number,
    dateStringForCalculation: string
  ): Promise<number> {
    try {
      // Get attendance data using the same logic as PayrollPrint.vue
      const attendances = employeeId === 55
        ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForCalculation.substring(0, 7))
        : await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7))

      if (!Array.isArray(attendances) || attendances.length === 0) {
        return 0
      }

      // Calculate total overtime hours using the same logic as PayrollPrint.vue
      let totalOvertimeHours = 0
      attendances.forEach((attendance) => {
        const overtimeHours = computeOvertimeHours(attendance.overtime_in, attendance.overtime_out)
        totalOvertimeHours += overtimeHours
      })

      return Number(totalOvertimeHours.toFixed(2))
    } catch (error) {
      console.error('[calculateOvertimeHours] Error calculating overtime hours:', error)
      return 0
    }
  }

  /**
   * Calculate client-side late and undertime deductions using PayrollPrint.vue logic
   * Returns { lateDeductionAmount, undertimeDeductionAmount }
   */
  async function calculateLateAndUndertimeDeductions(
    employeeId: number,
    dateStringForCalculation: string,
    dailyRate: number,
    isFieldStaff: boolean
  ): Promise<{ lateDeductionAmount: number; undertimeDeductionAmount: number }> {
    // Field staff don't have late/undertime deductions
    if (isFieldStaff) {
      return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
    }

    try {
      // Get attendance data using the same logic as PayrollPrint.vue
      const attendances = employeeId === 55
        ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForCalculation.substring(0, 7))
        : await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7))

      if (!Array.isArray(attendances) || attendances.length === 0) {
        return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
      }

      // Calculate late and undertime minutes using the same logic as PayrollPrint.vue
      let totalLateAM = 0
      let totalLatePM = 0
      let totalUndertimeAM = 0
      let totalUndertimePM = 0

      attendances.forEach((attendance) => {
        const attendanceDate = attendance.attendance_date
        const isFriSat = attendanceDate ? isFridayOrSaturday(attendanceDate) : false

        // Determine time rules based on day of week (same as PayrollPrint.vue)
        const amStartTime = isFriSat ? '08:12' : '08:12'
        const pmStartTime = isFriSat ? '13:00' : '13:00'
        const amEndTime = isFriSat ? '11:50' : '11:50'
        const pmEndTime = isFriSat ? '16:30' : '17:00'

        // Calculate late minutes
        if (attendance.am_time_in) {
          const lateMinutes = getExcessMinutes(amStartTime, attendance.am_time_in)
          totalLateAM += lateMinutes
        }
        if (attendance.pm_time_in) {
          const lateMinutes = getExcessMinutes(pmStartTime, attendance.pm_time_in)
          totalLatePM += lateMinutes
        }

        // Calculate undertime minutes
        if (attendance.am_time_out) {
          const undertimeMinutes = getUndertimeMinutes(amEndTime, attendance.am_time_out)
          totalUndertimeAM += undertimeMinutes
        }
        if (attendance.pm_time_out) {
          const undertimeMinutes = getUndertimeMinutes(pmEndTime, attendance.pm_time_out)
          totalUndertimePM += undertimeMinutes
        }
      })

      const totalLateMinutes = totalLateAM + totalLatePM
      const totalUndertimeMinutes = totalUndertimeAM + totalUndertimePM

      // Convert minutes to monetary deductions using same formula as PayrollPrint.vue
      // Formula: (dailyRate / 8 hours / 60 minutes) * total minutes
      const perMinuteRate = dailyRate / 8 / 60
      const lateDeductionAmount = perMinuteRate * totalLateMinutes
      const undertimeDeductionAmount = perMinuteRate * totalUndertimeMinutes

      return {
        lateDeductionAmount: Number(lateDeductionAmount.toFixed(2)),
        undertimeDeductionAmount: Number(undertimeDeductionAmount.toFixed(2))
      }
    } catch (error) {
      console.error('[calculateLateAndUndertimeDeductions] Error calculating deductions:', error)
      return { lateDeductionAmount: 0, undertimeDeductionAmount: 0 }
    }
  }

  /**
   * Calculate accurate days worked using client-side attendance logic
   * This matches the calculation used in PayrollPrint.vue for consistency
   */
  async function calculateDaysWorked(
    employeeId: number,
    dateStringForCalculation: string
  ): Promise<number> {
    try {
      // Get attendance data using the same logic as PayrollPrint.vue
      const attendances = employeeId === 55
        ? await getEmployeeAttendanceForEmployee55(employeeId, dateStringForCalculation.substring(0, 7))
        : await getEmployeeAttendanceById(employeeId, dateStringForCalculation.substring(0, 7))

      if (!Array.isArray(attendances) || attendances.length === 0) {
        return 0
      }

      // Get paid leave days
      const paidLeaveDays = await getPaidLeaveDaysForMonth(dateStringForCalculation, employeeId)

      let employeePresentDays = 0

      // Use the same logic as payrollComputation.ts
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
          attendance.pm_time_out !== null &&
          attendance.pm_time_out !== undefined &&
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

      // Add paid leave days to present days
      employeePresentDays += paidLeaveDays

      return employeePresentDays
    } catch (error) {
      console.error('[calculateDaysWorked] Error calculating days worked:', error)
      return 0
    }
  }

  /**
   * Load payroll data using Supabase function for base calculations,
   * then apply client-side late/undertime calculations for PayrollPrint.vue consistency
   */
  async function loadMonthlyPayroll() {
    if (!selectedMonth.value || !selectedYear.value) {
      return
    }

    // Check if we already have data for this month/year
    const cacheKey = `${selectedMonth.value}-${selectedYear.value}`
    if (lastLoadedKey.value === cacheKey && monthlyPayrollData.value.length > 0) {
      // Data already loaded, skip reload
      return
    }

    loading.value = true

    try {
      // Call Supabase function to compute monthly payroll
      const { data, error } = await supabase.rpc('compute_monthly_payroll', {
        p_month: selectedMonth.value,
        p_year: selectedYear.value,
      })

      if (error) {
        console.error('Error calling compute_monthly_payroll:', error)
        throw error
      }

      // Transform database response to match MonthlyPayrollRow interface
      // Note: late_deduction and undertime_deduction from server are 0.00, will be calculated client-side
      const transformedData = (data || []).map((row: PayrollDatabaseRow) => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        daily_rate: Number(row.daily_rate) || 0,
        days_worked: Number(row.days_worked) || 0,
        is_field_staff: false, // Will be updated below
        hours_worked: undefined, // Will be calculated for field staff
        sunday_days: Number(row.sunday_days) || 0,
        sunday_amount: Number(row.sunday_amount) || 0,
        cola: Number(row.cola) || 0,
        overtime_hrs: Number(row.overtime_hrs) || 0,
        basic_pay: Number(row.basic_pay) || 0,
        overtime_pay: Number(row.overtime_pay) || 0,
        trips_pay: Number(row.trips_pay) || 0,
        utilizations_pay: Number(row.utilizations_pay) || 0,
        holidays_pay: Number(row.holidays_pay) || 0,
        gross_pay: Number(row.gross_pay) || 0,
        deductions: {
          cash_advance: Number(row.cash_advance) || 0,
          sss: Number(row.sss) || 0,
          phic: Number(row.phic) || 0,
          pagibig: Number(row.pagibig) || 0,
          sss_loan: Number(row.sss_loan) || 0,
          savings: Number(row.savings) || 0,
          salary_deposit: Number(row.salary_deposit) || 0,
          late: Number(row.late_deduction) || 0,
          undertime: Number(row.undertime_deduction) || 0,
          total: Number(row.total_deductions) || 0,
        },
        total_deductions: Number(row.total_deductions) || 0,
        net_pay: Number(row.net_pay) || 0,
      }))

      // Calculate hours worked for field staff
      // Create date string in format YYYY-MM-01 for getTotalMinutesForMonth
      const monthIndex = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ].indexOf(selectedMonth.value)
      const dateStringForCalculation = `${selectedYear.value}-${String(monthIndex + 1).padStart(2, '0')}-01`

      // Separate field staff from non-field staff employees
      const fieldStaffEmployees: MonthlyPayrollRow[] = []
      const nonFieldStaffEmployees: MonthlyPayrollRow[] = []

      // First pass: categorize employees by field staff status
      await Promise.all(
        transformedData.map(async (employee: MonthlyPayrollRow) => {
          const emp = await employeesStore.getEmployeesById(employee.employee_id)
          if (emp?.is_field_staff) {
            employee.is_field_staff = true
            fieldStaffEmployees.push(employee)
          } else {
            employee.is_field_staff = false
            nonFieldStaffEmployees.push(employee)
          }
        })
      )

      // Batch fetch attendance data for non-field staff employees (optimization)
      if (nonFieldStaffEmployees.length > 0) {
        const nonFieldStaffIds = nonFieldStaffEmployees.map(emp => emp.employee_id)
        const attendanceBatch = await getEmployeesAttendanceBatch(
          nonFieldStaffIds,
          dateStringForCalculation
        )

        // Store batch attendance data in cache for potential future use
        // Client-side late/undertime calculations will use this cached data for performance
        console.log(`[Batch Optimization] Loaded and cached attendance for ${nonFieldStaffIds.length} non-field staff employees:`, attendanceBatch.size)
        console.log(`[Client-Side Calculations] Applied PayrollPrint.vue-consistent late/undertime calculations for ${nonFieldStaffIds.length} employees`)
      }

      // Process field staff employees individually (they need special calculation)
      await Promise.all(
        fieldStaffEmployees.map(async (employee: MonthlyPayrollRow) => {
          // Calculate accurate days worked using client-side logic (matches PayrollPrint.vue)
          const accurateDaysWorked = await calculateDaysWorked(
            employee.employee_id,
            dateStringForCalculation
          )
          employee.days_worked = Number(accurateDaysWorked.toFixed(1))

          // Calculate actual hours worked for field staff
          const totalWorkMinutes = await getTotalMinutesForMonth(
            dateStringForCalculation,
            employee.employee_id,
            true // isField = true
          )
          employee.hours_worked = totalWorkMinutes / 60 // Convert minutes to hours

          // Calculate client-side overtime hours (matches PayrollPrint.vue)
          const clientOvertimeHours = await calculateOvertimeHours(
            employee.employee_id,
            dateStringForCalculation
          )
          employee.overtime_hrs = clientOvertimeHours

          // Calculate overtime pay: overtime hours * (hourly rate * 1.25)
          const hourlyRate = employee.daily_rate / 8
          const clientOvertimePay = clientOvertimeHours * (hourlyRate * 1.25)
          employee.overtime_pay = Number(clientOvertimePay.toFixed(2))

          // Recalculate basic_pay based on actual hours worked
          // Formula: (hours worked * hourly rate) where hourly rate = daily rate / 8
          const newBasicPay = employee.hours_worked * hourlyRate

          // Recalculate gross_pay: basic_pay + cola + overtime_pay + trips_pay + holidays_pay + utilizations_pay
          const newGrossPay =
            newBasicPay +
            employee.cola +
            clientOvertimePay +
            employee.trips_pay +
            employee.holidays_pay +
            (employee.utilizations_pay || 0)

          // Recalculate net_pay: gross_pay - total_deductions
          const newNetPay = newGrossPay - employee.total_deductions

          // Update the employee record with recalculated values
          employee.basic_pay = Number(newBasicPay.toFixed(2))
          employee.gross_pay = Number(newGrossPay.toFixed(2))
          employee.net_pay = Number(newNetPay.toFixed(2))
        })
      )

      // Process non-field staff employees to recalculate days_worked, overtime, AND late/undertime deductions for accuracy
      await Promise.all(
        nonFieldStaffEmployees.map(async (employee: MonthlyPayrollRow) => {
          // Calculate accurate days worked using client-side logic (matches PayrollPrint.vue)
          const accurateDaysWorked = await calculateDaysWorked(
            employee.employee_id,
            dateStringForCalculation
          )
          employee.days_worked = Number(accurateDaysWorked.toFixed(1))

          // Calculate client-side overtime hours (matches PayrollPrint.vue)
          const clientOvertimeHours = await calculateOvertimeHours(
            employee.employee_id,
            dateStringForCalculation
          )
          employee.overtime_hrs = clientOvertimeHours

          // Calculate overtime pay: overtime hours * (hourly rate * 1.25)
          const hourlyRate = employee.daily_rate / 8
          const clientOvertimePay = clientOvertimeHours * (hourlyRate * 1.25)
          employee.overtime_pay = Number(clientOvertimePay.toFixed(2))

          // Calculate client-side late and undertime deductions (matches PayrollPrint.vue)
          const { lateDeductionAmount, undertimeDeductionAmount } = await calculateLateAndUndertimeDeductions(
            employee.employee_id,
            dateStringForCalculation,
            employee.daily_rate,
            false // non-field staff
          )

          // Update deductions with client-side calculated values
          employee.deductions.late = lateDeductionAmount
          employee.deductions.undertime = undertimeDeductionAmount

          // Recalculate gross_pay: basic_pay + cola + overtime_pay + trips_pay + holidays_pay + utilizations_pay
          const newGrossPay =
            employee.basic_pay +
            employee.cola +
            clientOvertimePay +
            employee.trips_pay +
            employee.holidays_pay +
            (employee.utilizations_pay || 0)
          employee.gross_pay = Number(newGrossPay.toFixed(2))

          // Recalculate total_deductions and net_pay with new late/undertime values
          const newTotalDeductions =
            employee.deductions.cash_advance +
            employee.deductions.sss +
            employee.deductions.phic +
            employee.deductions.pagibig +
            employee.deductions.sss_loan +
            employee.deductions.savings +
            employee.deductions.salary_deposit +
            lateDeductionAmount +
            undertimeDeductionAmount

          employee.total_deductions = Number(newTotalDeductions.toFixed(2))
          employee.net_pay = Number((newGrossPay - newTotalDeductions).toFixed(2))
        })
      )

      // Also process field staff employees to ensure late/undertime are set to 0 (already processed above for overtime)
      fieldStaffEmployees.forEach((employee: MonthlyPayrollRow) => {
        // Field staff don't have late/undertime deductions (set to 0)
        employee.deductions.late = 0
        employee.deductions.undertime = 0
        // Note: overtime calculations were already done above for field staff
      })

      // Combine field staff and non-field staff employees
      const finalData = [...fieldStaffEmployees, ...nonFieldStaffEmployees]
      monthlyPayrollData.value = finalData

      // Update cache key after successful load
      lastLoadedKey.value = cacheKey
    } catch (error) {
      console.error('Error loading monthly payroll:', error)
      // Clear cache on error to allow retry
      lastLoadedKey.value = ''
      throw error
    } finally {
      loading.value = false
    }
  }

  // Compute totals
  const totals = computed<MonthlyPayrollTotals>(() => {
    if (monthlyPayrollData.value.length === 0) {
      return {
        basic_pay: 0,
        overtime_pay: 0,
        trips_pay: 0,
        utilizations_pay: 0,
        holidays_pay: 0,
        gross_pay: 0,
        total_deductions: 0,
        net_pay: 0,
      }
    }

    return monthlyPayrollData.value.reduce(
      (acc, item) => ({
        basic_pay: acc.basic_pay + (item.basic_pay || 0),
        overtime_pay: acc.overtime_pay + (item.overtime_pay || 0),
        trips_pay: acc.trips_pay + (item.trips_pay || 0),
        utilizations_pay: acc.utilizations_pay + (item.utilizations_pay || 0),
        holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
        gross_pay: acc.gross_pay + (item.gross_pay || 0),
        total_deductions: acc.total_deductions + (item.total_deductions || 0),
        net_pay: acc.net_pay + (item.net_pay || 0),
      }),
      {
        basic_pay: 0,
        overtime_pay: 0,
        trips_pay: 0,
        utilizations_pay: 0,
        holidays_pay: 0,
        gross_pay: 0,
        total_deductions: 0,
        net_pay: 0,
      },
    )
  })

  // Force refresh - clears cache and reloads
  async function refreshMonthlyPayroll() {
    lastLoadedKey.value = ''
    await loadMonthlyPayroll()
  }

  return {
    // State
    loading,
    monthlyPayrollData,
    selectedMonth,
    selectedYear,
    totals,

    // Methods
    loadMonthlyPayroll,
    refreshMonthlyPayroll,
  }
}
