// Import constants, types, and timezone helpers
import { usePayrollComputation } from './payrollComputation'
import { useOverallEarningsTotal, useNetSalaryCalculation } from './overallTotal'
import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch, computed, onUnmounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { type Employee } from '@/stores/employees'
import { fetchCashAdvances } from './computation/cashAdvance'
import { fetchEmployeeDeductions } from './computation/benefits'
// import { useTripsStore } from '@/stores/trips'

import {
  getCurrentMonthInPhilippines,
  getCurrentYearInPhilippines,
  monthNames,
} from './currentMonth'
import { fetchHolidaysByDateString } from './computation/holidays'
import { fetchFilteredTrips } from './computation/trips'
import { getTotalMinutesForMonth } from './computation/attendance'

// Table row type para sa payroll data
export interface TableData {
  month: string
  basic_salary: number
  gross_pay: number
  deductions: number
  net_pay: number
  employeeDailyRate: number
  attendanceMinutes?: number // Total minutes worked for the month
  dateString?: string // Optional date string for cash advances
}

// Type para sa payrollData na gamiton sa print dialog
export interface PayrollData {
  year: number
  month: string
  employee_id: number
}

// Composable para sa Payroll Table Dialog
export function usePayrollTableDialog(
  props: {
    isDialogVisible: boolean
    itemData: Employee | null
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // Store instances
  // const tripsStore = useTripsStore()
  const employeesStore = useEmployeesStore()

  // Async payroll data generator using overallTotal composables
  const generatePayrollData = async (monthIndex: number): Promise<TableData> => {
    const employeeId = props.itemData?.id
    const year = tableFilters.value.year
    const monthName = monthNames[monthIndex]

    // Create dateString in YYYY-MM format for data fetching
    const dateString = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`
    // Create full date string for cash advances (YYYY-MM-DD format)
    const cashAdvanceDateString = `${dateString}-01`

    if (!employeeId) {
      return {
        month: monthName,
        basic_salary: 0,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        employeeDailyRate: 0,
        attendanceMinutes: 0,
      }
    }

    try {
      // Fetch actual data para sa specific month ug employee
      const [trips, holidays, employeeData, employeeDeductionsResult, cashAdvances] =
        await Promise.all([
          fetchFilteredTrips(dateString, employeeId),
          fetchHolidaysByDateString(dateString, employeeId.toString()),
          employeesStore.getEmployeesById(employeeId),
          fetchEmployeeDeductions(employeeId),
          fetchCashAdvances(cashAdvanceDateString, employeeId),
        ])

      // Calculate total attendance minutes for the month
      const filterDateString = `${dateString}-01` // Format: "YYYY-MM-01"
      const isFieldStaff = employeeData?.is_field_staff || false
      const attendanceMinutes = await getTotalMinutesForMonth(
        filterDateString,
        employeeId,
        isFieldStaff,
      )

      // Console log the attendance minutes result
      // console.log(`📊 ATTENDANCE MINUTES for ${monthName} ${year}:`, {
      //   employeeId,
      //   employeeName: `${props.itemData?.firstname} ${props.itemData?.lastname}`,
      //   isFieldStaff,
      //   filterDateString,
      //   attendanceMinutes,
      //   hoursWorked: (attendanceMinutes / 60).toFixed(2),
      //   daysWorked: (attendanceMinutes / 480).toFixed(2), // Assuming 8 hours per day
      // })

      // Setup reactive refs para sa computation
      const regularWorkTotal = ref(0)
      const tripsRef = ref(trips || [])
      const holidaysRef = ref(holidays || [])
      const dailyRate = computed(() => employeeData?.daily_rate || 0)
      const employeeDailyRate = computed(() => employeeData?.daily_rate || 0)
      const overallOvertime = ref(0)
      const codaAllowance = ref(0) // pwede ni ma-fetch from benefits or separate allowance table
      const nonDeductions = ref(employeeDeductionsResult.nonDeductions || [])
      const lateDeduction = ref(0)
      const employeeDeductionsRef = ref(employeeDeductionsResult.deductions || [])

      // Calculate total cash advance amount para sa month
      const totalCashAdvance =
        cashAdvances?.reduce((sum, advance) => sum + (Number(advance.amount) || 0), 0) || 0
      const cashAdvance = ref(totalCashAdvance)

      // Debug log para sa cash advances
      /*   if (totalCashAdvance > 0) {
        console.log(
          `Cash advances for ${monthName} ${year}:`,
          cashAdvances,
          'Total:',
          totalCashAdvance,
        )
      } */

      const showLateDeduction = computed(() => true)

      // Use payrollComputation para sa regular work ug overtime calculation
      const payrollComp = usePayrollComputation(
        dailyRate,
        ref(0), // grossSalary will be computed by overallEarningsTotal
        ref(null), // tableData not needed for this computation
        employeeId,
        monthName,
        year,
        dateString,
        ref(cashAdvanceDateString), // pass filterDateString as reactive reference
      )

      // Calculate basic salary using employee daily rate ug work days
      /* console.log(`Basic salary calculation for ${monthName} ${year}:`, {
        isFieldStaff: payrollComp.isFieldStaff.value,
        employeeDailyRate: payrollComp.employeeDailyRate.value,
        workDays: payrollComp.workDays.value,
        presentDays: payrollComp.presentDays.value,
        absentDays: payrollComp.absentDays.value,
        regularWorkTotal: payrollComp.regularWorkTotal.value,
        basicSalaryFormula: payrollComp.isFieldStaff.value
          ? 'Field Staff: Uses regularWorkTotal (actual hours worked)'
          : 'Office Staff: employeeDailyRate * presentDays',
        employeeId,
      }) */

      // Set regular work total - note: payroll computation has watch that auto-computes this
      regularWorkTotal.value = payrollComp.regularWorkTotal.value

      // Compute overtime hours for the month
      const overtimeHours = await payrollComp.computeOverallOvertimeCalculation()
      overallOvertime.value = overtimeHours

      // Get late deduction from payroll computation
      lateDeduction.value = payrollComp.lateDeduction.value

      // Calculate basic salary - para sa field staff, gamiton ang regularWorkTotal instead of dailyRate * presentDays
      let basicSalary: number
      if (payrollComp.isFieldStaff.value) {
        // Para sa field staff, ang basic salary is based sa actual hours worked (regularWorkTotal)
        basicSalary = payrollComp.regularWorkTotal.value
        // Field staff basic salary is based on actual hours worked (regularWorkTotal)
      } else {
        // Para sa office staff, traditional calculation: daily rate * present days
        basicSalary = payrollComp.employeeDailyRate.value * payrollComp.presentDays.value
      }

      // Compute overall earnings using overallTotal composable
      const overallEarningsTotal = useOverallEarningsTotal(
        regularWorkTotal,
        tripsRef,
        holidaysRef,
        dailyRate,
        employeeDailyRate,
        overallOvertime,
        codaAllowance,
        nonDeductions,
      )

      // Compute net salary using overallTotal composable
      const netSalaryCalc = useNetSalaryCalculation(
        overallEarningsTotal,
        showLateDeduction,
        ref(lateDeduction.value),
        employeeDeductionsRef,
        cashAdvance,
      )

      // Calculate net pay: basic salary + gross pay - deductions
      const netPay = basicSalary + overallEarningsTotal.value - netSalaryCalc.value.totalDeductions

      // Debug log para sa net pay calculation
      /*  console.log(`Net pay calculation for ${monthName} ${year}:`, {
        isFieldStaff: payrollComp.isFieldStaff.value,
        basicSalary,
        grossPay: overallEarningsTotal.value,
        totalDeductions: netSalaryCalc.value.totalDeductions,
        netPay,
        presentDays: payrollComp.presentDays.value,
        absentDays: payrollComp.absentDays.value,
        workDays: payrollComp.workDays.value,
        regularWorkTotal: payrollComp.regularWorkTotal.value,
        formula: `${basicSalary} + ${overallEarningsTotal.value} - ${netSalaryCalc.value.totalDeductions} = ${netPay}`,
      }) */

      return {
        month: monthName,
        basic_salary: basicSalary,
        gross_pay: overallEarningsTotal.value,
        deductions: netSalaryCalc.value.totalDeductions,
        net_pay: netPay,
        employeeDailyRate: payrollComp.employeeDailyRate.value,
        attendanceMinutes: attendanceMinutes,
      }
    } catch (error) {
      console.error(`Error generating payroll data for ${monthName} ${year}:`, error)
      return {
        month: monthName,
        basic_salary: 0,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
        employeeDailyRate: 0,
        attendanceMinutes: 0,
      }
    }
  }

  // Table options (for v-data-table-server)
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 12,
    sortBy: [],
    isLoading: false,
  })

  const tableFilters = ref<{ year: number }>({
    year: getCurrentYearInPhilippines(), // Start with current year, will be updated when employee data loads
  })
  const tableData = ref<TableData[]>([])
  const formAction = ref({ ...formActionDefault })
  const isPrintDialogVisible = ref(false)

  const payrollData = ref<PayrollData>({
    year: 0,
    month: '',
    employee_id: 0,
  })

  const selectedData = ref<TableData | null>(null)

  const currentMonth = ref<number>(getCurrentMonthInPhilippines())
  const currentYear = ref<number>(getCurrentYearInPhilippines())
  let updateInterval: ReturnType<typeof setInterval> | undefined

  // Compute starting year based sa employee hired_at date
  const startingYear = computed<number>(() => {
    const employeeHiredAt = props.itemData?.hired_at
    if (!employeeHiredAt) {
      return getCurrentYearInPhilippines()
    }
    const hiredDate = new Date(employeeHiredAt)
    return hiredDate.getFullYear()
  })

  // Available years from hired year to current year
  const availableYears = computed<number[]>(() => {
    const start = startingYear.value
    const end = currentYear.value
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  })

  const availableMonths = computed<number[]>(() => {
    const current = currentMonth.value
    const year = tableFilters.value.year
    const currentYearInPH = currentYear.value

    // Check employee hired_at date para sa start month ug year
    const employeeHiredAt = props.itemData?.hired_at
    if (!employeeHiredAt) {
      // Kung walay hired_at, use existing logic
      if (year === currentYearInPH) {
        return Array.from({ length: current + 1 }, (_, i) => i)
      } else if (year < currentYearInPH) {
        return Array.from({ length: 12 }, (_, i) => i)
      } else {
        return []
      }
    }

    const hiredDate = new Date(employeeHiredAt)
    const hiredYear = hiredDate.getFullYear()
    const hiredMonth = hiredDate.getMonth() // 0-based index

    // Kung selected year is before hired year, walay available months
    if (year < hiredYear) {
      return []
    }

    // Kung selected year is same as hired year
    if (year === hiredYear) {
      // Kung current year pa gihapon, kutob ra sa current month or hired month onwards
      if (year === currentYearInPH) {
        const endMonth = Math.min(current, 11) // Max 11 (December)
        const startMonth = hiredMonth
        if (startMonth > endMonth) return []
        return Array.from({ length: endMonth - startMonth + 1 }, (_, i) => i + startMonth)
      } else {
        // Past year, from hired month to December
        return Array.from({ length: 12 - hiredMonth }, (_, i) => i + hiredMonth)
      }
    }

    // Kung selected year is after hired year pero before current year
    if (year > hiredYear && year < currentYearInPH) {
      // Full year available (January to December)
      return Array.from({ length: 12 }, (_, i) => i)
    }

    // Kung selected year is current year pero after hired year
    if (year === currentYearInPH && year > hiredYear) {
      // From January to current month
      return Array.from({ length: current + 1 }, (_, i) => i)
    }

    // Future year, walay months
    return []
  })

  // Load payroll data based on available months
  const loadPayrollData = async (): Promise<void> => {
    tableOptions.value.isLoading = true
    try {
      const payrollPromises = availableMonths.value.map((monthIndex) =>
        generatePayrollData(monthIndex),
      )
      tableData.value = await Promise.all(payrollPromises)
    } catch (error) {
      console.error('Error loading payroll data:', error)
      tableData.value = []
    } finally {
      tableOptions.value.isLoading = false
    }
  }

  // Update current time (month/year) and reload if needed
  const updateCurrentTime = async (): Promise<void> => {
    const newMonth = getCurrentMonthInPhilippines()
    const newYear = getCurrentYearInPhilippines()
    if (newMonth !== currentMonth.value || newYear !== currentYear.value) {
      currentMonth.value = newMonth
      currentYear.value = newYear
      //kung current year gihapon, reload para ma-include new month
      if (tableFilters.value.year === newYear) {
        await loadPayrollData()
      }
    }
  }

  // Watch: dialog visibility
  watch(
    () => props.isDialogVisible,
    async (isVisible) => {
      if (isVisible) {
        // update time ug load data pag open
        await updateCurrentTime()
        // Update year filter based sa employee hired_at
        if (props.itemData?.hired_at) {
          const employeeStartingYear = startingYear.value
          // Set to current year or employee starting year, whichever is appropriate
          tableFilters.value.year = Math.max(employeeStartingYear, currentYear.value)
        }
        await loadPayrollData()
        // Start interval (every 1 min)
        updateInterval = setInterval(() => updateCurrentTime().catch(console.error), 60000)
      } else {
        // Stop interval pag close
        if (updateInterval) {
          clearInterval(updateInterval)
          updateInterval = undefined
        }
      }
    },
  )

  // Watch: employee data changes para sa year filter update
  watch(
    () => props.itemData?.hired_at,
    (hiredAt) => {
      if (hiredAt && props.isDialogVisible) {
        const employeeStartingYear = startingYear.value
        // Update year filter to most recent available year or current year
        tableFilters.value.year = Math.max(employeeStartingYear, currentYear.value)
      }
    },
  )

  // Watch: year filter changes
  watch(
    () => tableFilters.value.year,
    async () => {
      await loadPayrollData()
    },
  )

  // Watch: available months (month transition)
  watch(availableMonths, async () => {
    if (props.isDialogVisible) {
      await loadPayrollData()
    }
  })

  // Cleanup: on unmount, clear interval
  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval)
    }
  })

  // Compute if current employee is field staff
  const isCurrentEmployeeFieldStaff = computed(() => {
    return props.itemData?.is_field_staff || false
  })

  // Action: view/print payroll row
  const onView = (item: TableData): void => {
    payrollData.value = {
      year: tableFilters.value.year,
      month: item.month,
      employee_id: props.itemData?.id ?? 0, // gamita 0 kung wala
    }
    selectedData.value = item
    isPrintDialogVisible.value = true
  }

  // Action: close dialog
  const onDialogClose = (): void => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose state ug actions
  return {
    tableOptions,
    tableFilters,
    tableData,
    formAction,
    isPrintDialogVisible,
    payrollData,
    selectedData,
    currentMonth: computed(() => monthNames[currentMonth.value]),
    currentYear,
    startingYear,
    availableYears,
    availableMonths,
    isCurrentEmployeeFieldStaff,
    onView,
    onDialogClose,
  }
}
