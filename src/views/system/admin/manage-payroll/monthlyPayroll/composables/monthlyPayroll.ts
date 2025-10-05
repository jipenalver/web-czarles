import { ref, computed } from 'vue'
import { useEmployeesStore, type Employee } from '@/stores/employees'
import { useTripsStore, type Trip } from '@/stores/trips'
import { useHolidaysStore, type Holiday } from '@/stores/holidays'
import { useCashAdvancesStore } from '@/stores/cashAdvances'
import { type EmployeeDeduction } from '@/stores/benefits'
import { usePayrollComputation } from '../../payroll/payrollComputation'
import { useOverallEarningsTotal, useNetSalaryCalculation } from '../../payroll/overallTotal'
import { getDateISO } from '@/utils/helpers/dates'

export interface MonthlyPayrollRow {
  employee_id: number
  employee_name: string
  daily_rate: number
  days_worked: number
  basic_pay: number
  overtime_pay: number
  trips_pay: number
  holidays_pay: number
  gross_pay: number
  deductions: {
    late: number
    undertime: number
    cash_advance: number
    employee_deductions: number
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

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

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

  // Computed date string
  const dateString = computed(() => {
    if (!selectedMonth.value || !selectedYear.value) return ''
    const monthIndex = monthNames.indexOf(selectedMonth.value)
    const date = new Date(selectedYear.value, monthIndex, 15)
    return getDateISO(date) || ''
  })

  // Compute payroll for a single employee
  async function computeEmployeePayroll(employee: Employee): Promise<MonthlyPayrollRow> {
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
      dateString.value
    )

    // Wait for computation to complete
    await payrollComp.computeRegularWorkTotal()

    // Get trips for employee in selected month
    const monthIndex = monthNames.indexOf(selectedMonth.value)
    const startDate = new Date(selectedYear.value, monthIndex, 1)
    const endDate = new Date(selectedYear.value, monthIndex + 1, 0)

    const employeeTrips = ref<Trip[]>(
      tripsStore.trips.filter(trip =>
        trip.employee_id === employee.id &&
        new Date(trip.trip_at) >= startDate &&
        new Date(trip.trip_at) <= endDate
      )
    )

    // Get holidays for the month
    const employeeHolidays = ref<Holiday[]>(
      holidaysStore.holidays.filter(holiday => {
        const holidayDate = new Date(holiday.holiday_at)
        return holidayDate >= startDate && holidayDate <= endDate
      })
    )

    // Get cash advances
    const cashAdvance = ref(
      cashAdvancesStore.cashAdvances
        .filter(ca =>
          ca.employee_id === employee.id &&
          new Date(ca.created_at) >= startDate &&
          new Date(ca.created_at) <= endDate
        )
        .reduce((sum, ca) => sum + (ca.amount || 0), 0)
    )

    // Get employee deductions (from employee_deductions)
    const employeeDeductions = ref<EmployeeDeduction[]>(
      employee.employee_deductions?.filter(ed => ed.benefit?.is_deduction) || []
    )

    // Get non-deductions (benefits)
    const nonDeductions = ref<EmployeeDeduction[]>(
      employee.employee_deductions?.filter(ed => !ed.benefit?.is_deduction) || []
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
      nonDeductions
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
      payrollComp.undertimeDeduction
    )

    // Calculate individual earnings breakdown
    const tripsEarnings = employeeTrips.value.reduce((sum, trip) => {
      const perTrip = Number(trip.per_trip) || 0
      const tripNo = Number(trip.trip_no) || 1
      return sum + (perTrip * tripNo)
    }, 0)

    const holidayEarnings = employeeHolidays.value.reduce((sum, holiday) => {
      const baseRate = Number(dailyRate.value) || 0
      const type = holiday.type?.toLowerCase() || ''
      let multiplier = 1
      if (type.includes('rh')) multiplier = 2.0
      else if (type.includes('snh')) multiplier = 1.5
      else if (type.includes('swh')) multiplier = 1.3
      return sum + (baseRate * multiplier)
    }, 0)

    const overtimeRate = ((Number(payrollComp.employeeDailyRate.value) || 0) / 8) * 1.25
    const overtimeEarnings = overtimeRate * (Number(overallOvertime.value) || 0)

    // Calculate detailed deductions
    const lateDeduction = netSalaryCalc.value.deductions.late || 0
    const undertimeDeduction = netSalaryCalc.value.deductions.undertime || 0
    const cashAdvanceDeduction = netSalaryCalc.value.deductions.cashAdvance || 0
    const employeeDeductionsTotal = netSalaryCalc.value.dynamicDeductions?.reduce((sum, d) => sum + d.amount, 0) || 0

    return {
      employee_id: employee.id,
      employee_name: `${employee.firstname} ${employee.lastname}`,
      daily_rate: employee.daily_rate,
      days_worked: payrollComp.presentDays.value,
      basic_pay: payrollComp.regularWorkTotal.value,
      overtime_pay: overtimeEarnings,
      trips_pay: tripsEarnings,
      holidays_pay: holidayEarnings,
      gross_pay: netSalaryCalc.value.grossSalary,
      deductions: {
        late: lateDeduction,
        undertime: undertimeDeduction,
        cash_advance: cashAdvanceDeduction,
        employee_deductions: employeeDeductionsTotal,
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

    loading.value = true

    try {
      // Load all employees
      await employeesStore.getEmployees()
      const employees = employeesStore.employees.filter(emp => !emp.deleted_at)

      // Load holidays and trips
      await holidaysStore.getHolidays()
      await tripsStore.getTrips()
      await cashAdvancesStore.getCashAdvances()

      // Process each employee
      const payrollPromises = employees.map(async (employee) => {
        return await computeEmployeePayroll(employee)
      })

      monthlyPayrollData.value = await Promise.all(payrollPromises)
    } catch (error) {
      console.error('Error loading monthly payroll:', error)
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

    return monthlyPayrollData.value.reduce((acc, item) => ({
      basic_pay: acc.basic_pay + (item.basic_pay || 0),
      overtime_pay: acc.overtime_pay + (item.overtime_pay || 0),
      trips_pay: acc.trips_pay + (item.trips_pay || 0),
      holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
      gross_pay: acc.gross_pay + (item.gross_pay || 0),
      total_deductions: acc.total_deductions + (item.total_deductions || 0),
      net_pay: acc.net_pay + (item.net_pay || 0),
    }), {
      basic_pay: 0,
      overtime_pay: 0,
      trips_pay: 0,
      holidays_pay: 0,
      gross_pay: 0,
      total_deductions: 0,
      net_pay: 0,
    })
  })

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
    computeEmployeePayroll,
  }
}

/**
 * Format currency helper
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(value)
}
