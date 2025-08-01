// Import constants, types, and timezone helpers
import { usePayrollComputation, type TableData as ComputationTableData } from './payrollComputation'
import { useOverallEarningsTotal, useNetSalaryCalculation } from './overallTotal'
import { formActionDefault } from '@/utils/helpers/constants'
import { fetchHolidaysByDateString } from '@/stores/holidays'
import { ref, watch, computed, onUnmounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { useBenefitsStore } from '@/stores/benefits'
import { type Employee } from '@/stores/employees'
import { fetchCashAdvances } from './cashAdvance'
import { useTripsStore } from '@/stores/trips'

import {
  getCurrentMonthInPhilippines,
  getCurrentYearInPhilippines,
  monthNames,
} from './currentMonth'

// Table row type para sa payroll data
export interface TableData {
  month: string
  basic_salary: number
  gross_pay: number
  deductions: number
  net_pay: number
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
  const tripsStore = useTripsStore()
  const employeesStore = useEmployeesStore()
  const benefitsStore = useBenefitsStore()

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
      }
    }

    try {
      // Fetch actual data para sa specific month ug employee
      const [trips, holidays, employeeData, employeeDeductions, cashAdvances] = await Promise.all([
        tripsStore.fetchFilteredTrips(dateString, employeeId),
        fetchHolidaysByDateString(dateString, employeeId.toString()),
        employeesStore.getEmployeeById(employeeId),
        benefitsStore.getDeductionsById(employeeId),
        fetchCashAdvances(cashAdvanceDateString, employeeId),
      ])

      // Setup reactive refs para sa computation
      const regularWorkTotal = ref(0)
      const tripsRef = ref(trips || [])
      const holidaysRef = ref(holidays || [])
      const dailyRate = computed(() => employeeData?.daily_rate || 0)
      const employeeDailyRate = computed(() => employeeData?.daily_rate || 0)
      const overallOvertime = ref(0)
      const codaAllowance = ref(0) // pwede ni ma-fetch from benefits or separate allowance table
      const nonDeductions = ref(
        employeeDeductions?.filter((d: any) => d.benefit?.is_deduction === false) || [],
      )
      const lateDeduction = ref(0)
      const employeeDeductionsRef = ref(
        employeeDeductions?.filter((d: any) => d.benefit?.is_deduction === true) || [],
      )

      // Calculate total cash advance amount para sa month
      const totalCashAdvance =
        cashAdvances?.reduce((sum, advance) => sum + (Number(advance.amount) || 0), 0) || 0
      const cashAdvance = ref(totalCashAdvance)

      // Debug log para sa cash advances
      if (totalCashAdvance > 0) {
        console.log(
          `Cash advances for ${monthName} ${year}:`,
          cashAdvances,
          'Total:',
          totalCashAdvance,
        )
      }

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
      )

      // Calculate basic salary using employee daily rate ug work days
      console.log(`Basic salary calculation for ${monthName} ${year}:`, {
        employeeDailyRate: payrollComp.employeeDailyRate.value,
        workDays: payrollComp.workDays.value,
        basicSalary: payrollComp.employeeDailyRate.value * payrollComp.workDays.value,
        employeeId,
      })

      // Set regular work total - note: payroll computation has watch that auto-computes this
      regularWorkTotal.value = payrollComp.regularWorkTotal.value

      // Compute overtime hours for the month
      const overtimeHours = await payrollComp.computeOverallOvertimeCalculation()
      overallOvertime.value = overtimeHours

      // Get late deduction from payroll computation
      lateDeduction.value = payrollComp.lateDeduction.value

      // Calculate basic salary using employee daily rate ug work days
      const basicSalary = payrollComp.employeeDailyRate.value * payrollComp.workDays.value

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
      console.log(`Net pay calculation for ${monthName} ${year}:`, {
        basicSalary,
        grossPay: overallEarningsTotal.value,
        totalDeductions: netSalaryCalc.value.totalDeductions,
        netPay,
        formula: `${basicSalary} + ${overallEarningsTotal.value} - ${netSalaryCalc.value.totalDeductions} = ${netPay}`,
      })

      return {
        month: monthName,
        basic_salary: basicSalary,
        gross_pay: overallEarningsTotal.value,
        deductions: netSalaryCalc.value.totalDeductions,
        net_pay: netPay,
      }
    } catch (error) {
      console.error(`Error generating payroll data for ${monthName} ${year}:`, error)
      return {
        month: monthName,
        basic_salary: 0,
        gross_pay: 0,
        deductions: 0,
        net_pay: 0,
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
    year: getCurrentYearInPhilippines(),
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

  const availableMonths = computed<number[]>(() => {
    const current = currentMonth.value
    const year = tableFilters.value.year
    const currentYearInPH = currentYear.value
    // kung current year, kutob ra sa current month
    if (year === currentYearInPH) {
      return Array.from({ length: current + 1 }, (_, i) => i)
    } else if (year < currentYearInPH) {
      // Kung past year, tanan 12 months
      return Array.from({ length: 12 }, (_, i) => i)
    } else {
      // Kung future year, walay months
      return []
    }
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
    availableMonths,
    onView,
    onDialogClose,
  }
}
