import { useOverallEarningsTotal, useNetSalaryCalculation } from '@/views/system/admin/manage-payroll/payroll/overallTotal'
import { usePayrollComputation } from '@/views/system/admin/manage-payroll/payroll/payrollComputation'
import { monthNames } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { useEmployeesStore, type Employee } from '@/stores/employees'
import { useHolidaysStore, type Holiday } from '@/stores/holidays'
import { useCashAdvancesStore } from '@/stores/cashAdvances'
import { type EmployeeDeduction } from '@/stores/benefits'
import { useTripsStore, type Trip } from '@/stores/trips'
import { getDateISO } from '@/utils/helpers/dates'

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
      dateString.value,
    )

    // Wait for computation to complete
    await payrollComp.computeRegularWorkTotal()

    // Get trips for employee in selected month
    const monthIndex = monthNames.indexOf(selectedMonth.value)
    const startDate = new Date(selectedYear.value, monthIndex, 1)
    const endDate = new Date(selectedYear.value, monthIndex + 1, 0)

    const employeeTrips = ref<Trip[]>(
      tripsStore.trips.filter(
        (trip) =>
          trip.employee_id === employee.id &&
          new Date(trip.trip_at) >= startDate &&
          new Date(trip.trip_at) <= endDate,
      ),
    )

    // Get holidays for the month
    const employeeHolidays = ref<Holiday[]>(
      holidaysStore.holidays.filter((holiday) => {
        const holidayDate = new Date(holiday.holiday_at)
        return holidayDate >= startDate && holidayDate <= endDate
      }),
    )

    // Get cash advances
    const cashAdvance = ref(
      cashAdvancesStore.cashAdvances
        .filter(
          (ca) =>
            ca.employee_id === employee.id &&
            new Date(ca.created_at) >= startDate &&
            new Date(ca.created_at) <= endDate,
        )
        .reduce((sum, ca) => sum + (ca.amount || 0), 0),
    )

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

    // Calculate Sunday work (assuming it's tracked in attendance or a separate field)
    // For now, we'll set it to 0 - you can update this based on your attendance logic
    const sundayDays = 0
    const sundayAmount = 0

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

    loading.value = true

    try {
      // Load all employees
      await employeesStore.getEmployees()
      const employees = employeesStore.employees.filter((emp) => !emp.deleted_at)

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
