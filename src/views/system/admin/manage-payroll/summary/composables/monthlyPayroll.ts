import { supabase } from '@/utils/supabase'
import { ref, computed } from 'vue'
import { getTotalMinutesForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'
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
   * Load payroll data using Supabase function
   * This replaces client-side computation with server-side processing
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

      // Process each employee to check if field staff and calculate hours
      await Promise.all(
        transformedData.map(async (employee: MonthlyPayrollRow) => {
          const emp = await employeesStore.getEmployeesById(employee.employee_id)
          if (emp?.is_field_staff) {
            employee.is_field_staff = true
            // Calculate actual hours worked for field staff
            const totalWorkMinutes = await getTotalMinutesForMonth(
              dateStringForCalculation,
              employee.employee_id,
              true // isField = true
            )
            employee.hours_worked = totalWorkMinutes / 60 // Convert minutes to hours

            // Recalculate basic_pay based on actual hours worked
            // Formula: (hours worked * hourly rate) where hourly rate = daily rate / 8
            const hourlyRate = employee.daily_rate / 8
            const newBasicPay = employee.hours_worked * hourlyRate

            // Recalculate gross_pay: basic_pay + cola + overtime_pay + trips_pay + holidays_pay + utilizations_pay
            const newGrossPay =
              newBasicPay +
              employee.cola +
              employee.overtime_pay +
              employee.trips_pay +
              employee.holidays_pay +
              (employee.utilizations_pay || 0)

            // Recalculate net_pay: gross_pay - total_deductions
            const newNetPay = newGrossPay - employee.total_deductions

            // Update the employee record with recalculated values
            employee.basic_pay = Number(newBasicPay.toFixed(2))
            employee.gross_pay = Number(newGrossPay.toFixed(2))
            employee.net_pay = Number(newNetPay.toFixed(2))
          }
        })
      )

      monthlyPayrollData.value = transformedData

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
