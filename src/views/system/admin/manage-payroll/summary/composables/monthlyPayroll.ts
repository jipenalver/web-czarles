import { supabase } from '@/utils/supabase'
import { ref, computed } from 'vue'

/**
 * Interface for database function response row
 */
interface PayrollDatabaseRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number
  sunday_days: number
  sunday_amount: number
  cola: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
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
  sunday_days: number
  sunday_amount: number
  cola: number
  overtime_hrs: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
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
      monthlyPayrollData.value = (data || []).map((row: PayrollDatabaseRow) => ({
        employee_id: row.employee_id,
        employee_name: row.employee_name,
        daily_rate: Number(row.daily_rate) || 0,
        days_worked: Number(row.days_worked) || 0,
        sunday_days: Number(row.sunday_days) || 0,
        sunday_amount: Number(row.sunday_amount) || 0,
        cola: Number(row.cola) || 0,
        overtime_hrs: Number(row.overtime_hrs) || 0,
        basic_pay: Number(row.basic_pay) || 0,
        overtime_pay: Number(row.overtime_pay) || 0,
        trips_pay: Number(row.trips_pay) || 0,
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
        holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
        gross_pay: acc.gross_pay + (item.gross_pay || 0),
        total_deductions: acc.total_deductions + (item.total_deductions || 0),
        net_pay: acc.net_pay + (item.net_pay || 0),
      }),
      {
        basic_pay: 0,
        overtime_pay: 0,
        trips_pay: 0,
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
