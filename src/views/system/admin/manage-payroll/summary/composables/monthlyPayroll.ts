import { supabase } from '@/utils/supabase'
import { ref, computed } from 'vue'
import { getEmployeesAttendanceBatch } from '@/views/system/admin/manage-payroll/payroll/computation/computation'
import { useEmployeesStore } from '@/stores/employees'

// Import modular components
import type { MonthlyPayrollRow, MonthlyPayrollTotals } from './types'
import { transformPayrollData, createDateStringForCalculation, separateEmployeesByType } from './dataTransformation'
import { processFieldStaffEmployees } from './fieldStaffProcessor'
import { processNonFieldStaffEmployees } from './nonFieldStaffProcessor'
import { getCashAdjustmentsForEmployee } from './cashAdjustmentCalculations'

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

  // Employees store for admin flags
  const employeesStore = useEmployeesStore()

  /**
   * Load payroll data using Supabase function for base calculations,
   * then apply client-side late/undertime calculations for PayrollPrint.vue consistency
   * @param fromDate Optional start date in YYYY-MM-DD format for cross-month filtering
   * @param toDate Optional end date in YYYY-MM-DD format for cross-month filtering
   */
  async function loadMonthlyPayroll(fromDate?: string, toDate?: string) {
    if (!selectedMonth.value || !selectedYear.value) {
      return
    }

    // Check if we already have data for this month/year/date range
    const cacheKey = `${selectedMonth.value}-${selectedYear.value}-${fromDate || 'full'}-${toDate || 'full'}`
    if (lastLoadedKey.value === cacheKey && monthlyPayrollData.value.length > 0) {
      // Data already loaded, skip reload
      return
    }

    loading.value = true

    try {
      // Call Supabase function to compute monthly payroll
      // Pass optional date range for cross-month filtering
      const rpcParams: {
        p_month: string
        p_year: number
        p_from_date?: string
        p_to_date?: string
      } = {
        p_month: selectedMonth.value,
        p_year: selectedYear.value,
      }

      // Add date range parameters if provided
      if (fromDate && toDate) {
        rpcParams.p_from_date = fromDate
        rpcParams.p_to_date = toDate
      }

      const { data, error } = await supabase.rpc('compute_monthly_payroll', rpcParams)

      if (error) {
        console.error('Error calling compute_monthly_payroll:', error)
        throw error
      }

      // Transform database response to match MonthlyPayrollRow interface
      // Note: is_field_staff, late_deduction and undertime_deduction now come from SQL function
      const transformedData = transformPayrollData(data)

      // Ensure employees are loaded before setting admin flags
      if (employeesStore.employees.length === 0) {
        await employeesStore.getEmployees()
      }

      // Set admin and field staff flags before processing to ensure correct late deduction calculations
      transformedData.forEach(item => {
        const employee = employeesStore.employees.find(emp => emp.id === item.employee_id)
        if (employee) {
          item.is_admin = employee.is_admin || false
          // is_field_staff already comes from SQL function, but ensure consistency
          item.is_field_staff = employee.is_field_staff || false
        } else {
          item.is_admin = false
          // Keep is_field_staff from SQL function if employee not found in store
        }
      })

      // Create date string in format YYYY-MM-01 for calculations
      const dateStringForCalculation = createDateStringForCalculation(selectedMonth.value, selectedYear.value)

      // Separate employees by type
      const { fieldStaff: fieldStaffEmployees, nonFieldStaff: nonFieldStaffEmployees } = separateEmployeesByType(transformedData)

      // Batch fetch attendance data for non-field staff employees (optimization)
      if (nonFieldStaffEmployees.length > 0) {
        const nonFieldStaffIds = nonFieldStaffEmployees.map(emp => emp.employee_id)
        const attendanceBatch = await getEmployeesAttendanceBatch(
          nonFieldStaffIds,
          dateStringForCalculation,
          fromDate,
          toDate
        )

        // Store batch attendance data in cache for potential future use
        // Client-side late/undertime calculations will use this cached data for performance
        console.log(`[Batch Optimization] Loaded and cached attendance for ${nonFieldStaffIds.length} non-field staff employees:`, attendanceBatch.size)
        console.log(`[Client-Side Calculations] Applied PayrollPrint.vue-consistent late/undertime calculations for ${nonFieldStaffIds.length} employees`)
      }

      // Process field staff employees with special calculations
      await processFieldStaffEmployees(fieldStaffEmployees, dateStringForCalculation, fromDate, toDate)

      // Process non-field staff employees with late/undertime calculations
      await processNonFieldStaffEmployees(nonFieldStaffEmployees, dateStringForCalculation, fromDate, toDate)

      // Combine field staff and non-field staff employees
      const finalData = [...fieldStaffEmployees, ...nonFieldStaffEmployees]

      // Fetch and apply cash adjustments for all employees
      await Promise.all(
        finalData.map(async (employee: MonthlyPayrollRow) => {
          const { addOnAmount, deductionAmount } = await getCashAdjustmentsForEmployee(
            employee.employee_id,
            selectedMonth.value,
            selectedYear.value,
            fromDate,
            toDate
          )

          // Update employee with cash adjustment values
          employee.cash_adjustment_addon = addOnAmount
          employee.deductions.cash_adjustment = deductionAmount

          // Recalculate gross_pay: add cash adjustment add-ons
          employee.gross_pay = employee.gross_pay + addOnAmount

          // Recalculate total_deductions: add cash adjustment deductions
          employee.total_deductions = employee.total_deductions + deductionAmount

          // Recalculate net_pay: gross_pay - total_deductions
          employee.net_pay = employee.gross_pay - employee.total_deductions

          // Round to 2 decimal places
          employee.cash_adjustment_addon = Number(employee.cash_adjustment_addon.toFixed(2))
          employee.deductions.cash_adjustment = Number(employee.deductions.cash_adjustment.toFixed(2))
          employee.gross_pay = Number(employee.gross_pay.toFixed(2))
          employee.total_deductions = Number(employee.total_deductions.toFixed(2))
          employee.net_pay = Number(employee.net_pay.toFixed(2))
        })
      )

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
        cash_adjustment_addon: 0,
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
        cash_adjustment_addon: acc.cash_adjustment_addon + (item.cash_adjustment_addon || 0),
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
        cash_adjustment_addon: 0,
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
