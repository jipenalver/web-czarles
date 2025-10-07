import { useOverallEarningsTotal, useNetSalaryCalculation } from '@/views/system/admin/manage-payroll/payroll/overallTotal'
import { usePayrollComputation } from '@/views/system/admin/manage-payroll/payroll/payrollComputation'
import { monthNames } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { useEmployeesStore, type Employee } from '@/stores/employees'
import { useHolidaysStore, type Holiday } from '@/stores/holidays'
import { useCashAdvancesStore } from '@/stores/cashAdvances'
import { type EmployeeDeduction } from '@/stores/benefits'
import { useTripsStore, type Trip } from '@/stores/trips'
import { getDateISO } from '@/utils/helpers/dates'
import { getSundayDutyDaysForMonth } from '@/views/system/admin/manage-payroll/payroll/computation/attendance'

import { ref, computed } from 'vue'

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
 * Interface for pre-filtered month data to avoid repeated filtering
 */
interface MonthDataCache {
  startDate: Date
  endDate: Date
  tripsByEmployee: Map<number, Trip[]>
  holidays: Holiday[]
  cashAdvancesByEmployee: Map<number, number>
}

/**
 * Composable for monthly payroll computation
 */
export function useMonthlyPayroll() {
  // Stores
  const employeesStore = useEmployeesStore()
  const tripsStore = useTripsStore()
  const holidaysStore = useHolidaysStore()
  const cashAdvancesStore = useCashAdvancesStore()

  // State
  const loading = ref(false)
  const monthlyPayrollData = ref<MonthlyPayrollRow[]>([])
  const selectedMonth = ref<string>('')
  const selectedYear = ref<number>(new Date().getFullYear())

  // Cache to prevent reloading same month/year
  const lastLoadedKey = ref<string>('')

  // Computed date string
  const dateString = computed(() => {
    if (!selectedMonth.value || !selectedYear.value) return ''
    const monthIndex = monthNames.indexOf(selectedMonth.value)
    const date = new Date(selectedYear.value, monthIndex, 15)
    return getDateISO(date) || ''
  })

  /**
   * Pre-filter and group all data by employee for the selected month
   * This eliminates repeated filtering inside computeEmployeePayroll
   */
  function prepareMonthDataCache(): MonthDataCache {
    const monthIndex = monthNames.indexOf(selectedMonth.value)
    const startDate = new Date(selectedYear.value, monthIndex, 1)
    const endDate = new Date(selectedYear.value, monthIndex + 1, 0)

    // Group trips by employee
    const tripsByEmployee = new Map<number, Trip[]>()
    tripsStore.trips.forEach((trip) => {
      const tripDate = new Date(trip.trip_at)
      if (tripDate >= startDate && tripDate <= endDate && trip.employee_id) {
        if (!tripsByEmployee.has(trip.employee_id)) {
          tripsByEmployee.set(trip.employee_id, [])
        }
        tripsByEmployee.get(trip.employee_id)!.push(trip)
      }
    })

    // Filter holidays for the month (holidays are shared across all employees)
    const holidays = holidaysStore.holidays.filter((holiday) => {
      const holidayDate = new Date(holiday.holiday_at)
      return holidayDate >= startDate && holidayDate <= endDate
    })

    // Group and sum cash advances by employee
    const cashAdvancesByEmployee = new Map<number, number>()
    cashAdvancesStore.cashAdvances.forEach((ca) => {
      const caDate = new Date(ca.created_at)
      if (caDate >= startDate && caDate <= endDate && ca.employee_id) {
        const currentAmount = cashAdvancesByEmployee.get(ca.employee_id) || 0
        cashAdvancesByEmployee.set(ca.employee_id, currentAmount + (ca.amount || 0))
      }
    })

    return {
      startDate,
      endDate,
      tripsByEmployee,
      holidays,
      cashAdvancesByEmployee,
    }
  }

  // Compute payroll for a single employee using pre-filtered data
  async function computeEmployeePayroll(
    employee: Employee,
    monthDataCache: MonthDataCache,
  ): Promise<MonthlyPayrollRow> {
    const dailyRate = ref(employee.daily_rate || 0)
    const grossSalary = ref(0)
    const tableData = ref<Record<string, unknown> | null>(null)

    // Use payroll computation
    const payrollComp = usePayrollComputation(
      dailyRate,
      grossSalary,
      tableData,
      employee.id,
      selectedMonth.value,
      selectedYear.value,
      dateString.value,
    )

    // Wait for computation to complete
    await payrollComp.computeRegularWorkTotal()

    // Use pre-filtered data from cache instead of filtering again
    const employeeTrips = ref<Trip[]>(monthDataCache.tripsByEmployee.get(employee.id) || [])
    const employeeHolidays = ref<Holiday[]>(monthDataCache.holidays)
    const cashAdvance = ref(monthDataCache.cashAdvancesByEmployee.get(employee.id) || 0)

    // Get employee deductions (from employee_deductions)
    const employeeDeductions = ref<EmployeeDeduction[]>(
      employee.employee_deductions?.filter((ed) => ed.benefit?.is_deduction) || [],
    )

    // Get non-deductions (benefits)
    const nonDeductions = ref<EmployeeDeduction[]>(
      employee.employee_deductions?.filter((ed) => !ed.benefit?.is_deduction) || [],
    )

    const codaAllowance = ref(0)
    const overallOvertime = ref(0)

    // Compute overall overtime if available
    if (payrollComp.computeOverallOvertimeCalculation) {
      const overtimeResult = await payrollComp.computeOverallOvertimeCalculation()
      overallOvertime.value = overtimeResult || 0
    }

    // Use overall earnings total
    const dailyRateComputed = computed(() => dailyRate.value)
    const employeeDailyRateComputed = computed(() => payrollComp.employeeDailyRate.value)
    const overallEarningsTotal = useOverallEarningsTotal(
      payrollComp.regularWorkTotal,
      employeeTrips,
      employeeHolidays,
      dailyRateComputed,
      employeeDailyRateComputed,
      overallOvertime,
      codaAllowance,
      nonDeductions,
    )

    // Show late deduction
    const showLateDeduction = computed(() => true)

    // Use net salary calculation
    const netSalaryCalc = useNetSalaryCalculation(
      overallEarningsTotal,
      showLateDeduction,
      payrollComp.lateDeduction,
      employeeDeductions,
      cashAdvance,
      payrollComp.undertimeDeduction,
    )

    // Calculate individual earnings breakdown
    const tripsEarnings = employeeTrips.value.reduce((sum, trip) => {
      const perTrip = Number(trip.per_trip) || 0
      const tripNo = Number(trip.trip_no) || 1
      return sum + perTrip * tripNo
    }, 0)

    const holidayEarnings = employeeHolidays.value.reduce((sum, holiday) => {
      const baseRate = Number(dailyRate.value) || 0
      const type = holiday.type?.toLowerCase() || ''
      let multiplier = 1
      if (type.includes('rh')) multiplier = 2.0
      else if (type.includes('snh')) multiplier = 1.5
      else if (type.includes('swh')) multiplier = 1.3
      return sum + baseRate * multiplier
    }, 0)

    const overtimeRate = ((Number(payrollComp.employeeDailyRate.value) || 0) / 8) * 1.25
    const overtimeEarnings = overtimeRate * (Number(overallOvertime.value) || 0)
    const overtimeHours = Number(overallOvertime.value) || 0

    // Calculate Sunday work using the getSundayDutyDaysForMonth function
    const sundayDays = await getSundayDutyDaysForMonth(dateString.value, employee.id)
    // Sunday rate is typically 130% of the daily rate (30% premium)
    const sundayAmount = sundayDays * (Number(employee.daily_rate) || 0) * 0.3

    // Calculate COLA (Cost of Living Allowance)
    // This is typically from non-deductions (benefits)
    const colaAmount = nonDeductions.value
      .filter((nd) => nd.benefit?.benefit?.toLowerCase().includes('cola'))
      .reduce((sum, nd) => sum + (nd.amount || 0), 0)

    // Calculate detailed deductions
    const lateDeduction = netSalaryCalc.value.deductions.late || 0
    const undertimeDeduction = netSalaryCalc.value.deductions.undertime || 0
    const cashAdvanceDeduction = netSalaryCalc.value.deductions.cashAdvance || 0

    // Break down employee deductions by type
    const sssDeduction = employeeDeductions.value
      .filter((ed) => ed.benefit?.benefit?.toLowerCase().includes('sss') && !ed.benefit?.benefit?.toLowerCase().includes('loan'))
      .reduce((sum, ed) => sum + (ed.amount || 0), 0)

    const phicDeduction = employeeDeductions.value
      .filter((ed) => ed.benefit?.benefit?.toLowerCase().includes('phic') || ed.benefit?.benefit?.toLowerCase().includes('philhealth'))
      .reduce((sum, ed) => sum + (ed.amount || 0), 0)

    const pagibigDeduction = employeeDeductions.value
      .filter((ed) => ed.benefit?.benefit?.toLowerCase().includes('pag-ibig') || ed.benefit?.benefit?.toLowerCase().includes('pagibig'))
      .reduce((sum, ed) => sum + (ed.amount || 0), 0)

    const sssLoanDeduction = employeeDeductions.value
      .filter((ed) => ed.benefit?.benefit?.toLowerCase().includes('sss') && ed.benefit?.benefit?.toLowerCase().includes('loan'))
      .reduce((sum, ed) => sum + (ed.amount || 0), 0)

    const savingsDeduction = employeeDeductions.value
      .filter((ed) => ed.benefit?.benefit?.toLowerCase().includes('saving'))
      .reduce((sum, ed) => sum + (ed.amount || 0), 0)

    const salaryDepositDeduction = employeeDeductions.value
      .filter((ed) => ed.benefit?.benefit?.toLowerCase().includes('salary') && ed.benefit?.benefit?.toLowerCase().includes('deposit'))
      .reduce((sum, ed) => sum + (ed.amount || 0), 0)

    return {
      employee_id: employee.id,
      employee_name: `${employee.firstname} ${employee.lastname}`,
      daily_rate: employee.daily_rate,
      days_worked: payrollComp.presentDays.value,
      sunday_days: sundayDays,
      sunday_amount: sundayAmount,
      cola: colaAmount,
      overtime_hrs: overtimeHours,
      basic_pay: payrollComp.regularWorkTotal.value,
      overtime_pay: overtimeEarnings,
      trips_pay: tripsEarnings,
      holidays_pay: holidayEarnings,
      gross_pay: netSalaryCalc.value.grossSalary,
      deductions: {
        cash_advance: cashAdvanceDeduction,
        sss: sssDeduction,
        phic: phicDeduction,
        pagibig: pagibigDeduction,
        sss_loan: sssLoanDeduction,
        savings: savingsDeduction,
        salary_deposit: salaryDepositDeduction,
        late: lateDeduction,
        undertime: undertimeDeduction,
        total: netSalaryCalc.value.totalDeductions,
      },
      total_deductions: netSalaryCalc.value.totalDeductions,
      net_pay: netSalaryCalc.value.netSalary,
    }
  }

  // Load payroll data for all employees
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
      // Load all employees and data in parallel
      await Promise.all([
        employeesStore.getEmployees(),
        holidaysStore.getHolidays(),
        tripsStore.getTrips(),
        cashAdvancesStore.getCashAdvances(),
      ])

      const employees = employeesStore.employees.filter((emp) => !emp.deleted_at)

      // Pre-filter and group data ONCE for all employees
      const monthDataCache = prepareMonthDataCache()

      // Process each employee with pre-filtered data
      const payrollPromises = employees.map(async (employee) => {
        return await computeEmployeePayroll(employee, monthDataCache)
      })

      monthlyPayrollData.value = await Promise.all(payrollPromises)

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
    dateString,
    totals,

    // Methods
    loadMonthlyPayroll,
    refreshMonthlyPayroll,
    computeEmployeePayroll,
  }
}
