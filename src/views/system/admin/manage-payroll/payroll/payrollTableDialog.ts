// Import constants, types, and timezone helpers
import { usePayrollComputation, type TableData as ComputationTableData } from './payrollComputation'
import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch, computed, onUnmounted } from 'vue'
import { type Employee } from '@/stores/employees'

import { useOverallEarningsTotal, useNetSalaryCalculation } from './overallTotal'

import {
  getCurrentMonthInPhilippines,
  getCurrentYearInPhilippines,
  monthNames,
  getSampleBasicSalary,
  getSampleOvertime,
  getSampleAllowances,
  getSampleDeductions,
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
  // Payroll data generator using overallTotal composables
  // NOTE: This assumes you have the required data for each month (trips, holidays, overtime, etc.)
  // You may need to fetch or compute these per employee/month
  // ...existing code...
  const generatePayrollData = (monthIndex: number): TableData => {
    // Example: Replace these with actual data fetches per employee/month
    // For demo, use empty arrays/refs
    const regularWorkTotal = ref(0) // dapat actual regular work total
    const trips = ref([]) // dapat actual trips for the month
    const holidays = ref([]) // dapat actual holidays for the month
    const dailyRate = computed(() => 0) // dapat actual daily rate
    const employeeDailyRate = computed(() => 0) // dapat actual employee daily rate
    const overallOvertime = ref(0) // dapat actual overtime hours
    const codaAllowance = ref(0) // dapat actual allowance
    const nonDeductions = ref([]) // dapat actual non-deductions/benefits
    const lateDeduction = ref(0) // dapat actual late deduction
    const employeeDeductions = ref([]) // dapat actual employee deductions
    const cashAdvance = ref(0) // dapat actual cash advance
    const showLateDeduction = computed(() => false) // dapat actual logic

    // Compute overall earnings
    const overallEarningsTotal = useOverallEarningsTotal(
      regularWorkTotal,
      trips,
      holidays,
      dailyRate,
      employeeDailyRate,
      overallOvertime,
      codaAllowance,
      nonDeductions,
    )

    // Compute net salary
    const netSalaryCalc = useNetSalaryCalculation(
      overallEarningsTotal,
      showLateDeduction,
      lateDeduction,
      employeeDeductions,
      cashAdvance,
    )

    // For demo, use month name and zeros
    return {
      month: monthNames[monthIndex],
      basic_salary: Number(dailyRate.value) * 22, // estimate
      gross_pay: overallEarningsTotal.value,
      deductions: netSalaryCalc.value.totalDeductions,
      net_pay: netSalaryCalc.value.netSalary,
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
  const loadPayrollData = (): void => {
    tableData.value = availableMonths.value.map((monthIndex) => generatePayrollData(monthIndex))
  }

  // Update current time (month/year) and reload if needed
  const updateCurrentTime = (): void => {
    const newMonth = getCurrentMonthInPhilippines()
    const newYear = getCurrentYearInPhilippines()
    if (newMonth !== currentMonth.value || newYear !== currentYear.value) {
      currentMonth.value = newMonth
      currentYear.value = newYear
      //kung current year gihapon, reload para ma-include new month
      if (tableFilters.value.year === newYear) {
        loadPayrollData()
      }
    }
  }

  // Watch: dialog visibility
  watch(
    () => props.isDialogVisible,
    (isVisible) => {
      if (isVisible) {
        // update time ug load data pag open
        updateCurrentTime()
        loadPayrollData()
        // Start interval (every 1 min)
        updateInterval = setInterval(updateCurrentTime, 60000)
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
    () => {
      loadPayrollData()
    },
  )

  // Watch: available months (month transition)
  watch(availableMonths, () => {
    if (props.isDialogVisible) {
      loadPayrollData()
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
