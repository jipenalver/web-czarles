

// Import constants, types, and timezone helpers
import { formActionDefault } from '@/utils/helpers/constants'
import { type Employee } from '@/stores/employees'
import { ref, watch, computed, onUnmounted } from 'vue'
import { usePayrollComputation, type TableData as ComputationTableData } from './payrollComputation'
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

  // ...existing code...

  // Payroll data generator using payrollComputation composable
  const generatePayrollData = (monthIndex: number): TableData => {
    // Use helpers from currentMonth.ts for sample/demo data
    const basicSalary = getSampleBasicSalary(monthIndex)
    const overtime = getSampleOvertime()
    const allowances = getSampleAllowances()
    const grossPay = basicSalary + overtime + allowances
    const deductions = getSampleDeductions(monthIndex)

    // Prepare tableData for computation composable
    const computationTableData: ComputationTableData = {
      gross_pay: grossPay,
      deductions: deductions,
      coda_allowance: allowances,
      overtime_hours: Math.round(overtime / (basicSalary / 22 / 8)), // estimate hours
      // You can add more fields as needed for computation
    }

    // Use composable for all math
    const dailyRate = ref(Math.round(basicSalary / 22))
    const grossSalary = ref(grossPay)
    const tableDataRef = ref<ComputationTableData | null>(computationTableData)
    const payroll = usePayrollComputation(dailyRate, grossSalary, tableDataRef)

    return {
      month: monthNames[monthIndex],
      basic_salary: basicSalary,
      gross_pay: payroll.totalGrossSalary.value,
      deductions: payroll.totalDeductions.value,
      net_pay: payroll.netSalary.value,
    }
  }

  // Table options (for v-data-table-server)
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 12,
    sortBy: [],
    isLoading: false,
  })

  // Table filters (year)
  const tableFilters = ref<{ year: number }>({
    year: getCurrentYearInPhilippines(),
  })

  // Table data (rows)
  const tableData = ref<TableData[]>([])

  // Form action state (for dialog)
  const formAction = ref({ ...formActionDefault })

  // Print dialog visibility
  const isPrintDialogVisible = ref(false)

  // Payroll data for print dialog
  const payrollData = ref<PayrollData>({
    year: 0,
    month: '',
    employee_id: 0,
  })

  // Selected row data
  const selectedData = ref<TableData | null>(null)

  // Real-time current month/year tracking
  const currentMonth = ref<number>(getCurrentMonthInPhilippines())
  const currentYear = ref<number>(getCurrentYearInPhilippines())

  // Interval for real-time update
  let updateInterval: ReturnType<typeof setInterval> | undefined

  // Computed: available months depende sa year
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
    tableData.value = availableMonths.value.map((monthIndex) =>
      generatePayrollData(monthIndex)
    )
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