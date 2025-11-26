// Import constants, types, and timezone helpers
import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch, computed, onUnmounted } from 'vue'
import { type Employee } from '@/stores/employees'

import {
  getCurrentMonthInPhilippines,
  getCurrentYearInPhilippines,
  monthNames,
} from './currentMonth'

// Table row type para sa payroll data
export interface TableData {
  month: string
}

// Type para sa payrollData na gamiton sa print dialog
export interface PayrollData {
  year: number
  month: string
  employee_id: number
}

// Interface for crossmonth configuration
interface CrossMonthConfig {
  crossMonthEnabled: boolean
  dayFrom: number | null
  dayTo: number | null
}

// Composable para sa Payroll Table Dialog
export function usePayrollTableDialog(
  props: {
    isDialogVisible: boolean
    itemData: Employee | null
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // Track crossmonth configuration
  const crossMonthConfig = ref<CrossMonthConfig>({
    crossMonthEnabled: false,
    dayFrom: null,
    dayTo: null,
  })



  // Simplified payroll data generator - returns only month name
  const generatePayrollData = async (
    monthIndex: number,
  ): Promise<TableData> => {
    const monthName = monthNames[monthIndex]
    return {
      month: monthName,
    }
  }

  // Table options (for v-data-table-server)
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 12,
    sortBy: [],
    isLoading: false,
  })

  const tableFilters = ref<{ year: number; attendance_at?: Date[] | null }>({
    year: getCurrentYearInPhilippines(), // Start with current year, will be updated when employee data loads
    attendance_at: null,
  })
  const tableData = ref<TableData[]>([])
  // Simple cache tracker to prevent unnecessary refetches
  const lastLoaded = ref<{ employeeId: number | null; year: number | null; monthsKey: string | null }>(
    { employeeId: null, year: null, monthsKey: null },
  )
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
      // Guard: if data already loaded for this employee/year/months/crossmonth config, skip refetch
      const employeeId = props.itemData?.id ?? null
      const crossMonthKey = `${crossMonthConfig.value.crossMonthEnabled}-${crossMonthConfig.value.dayFrom}-${crossMonthConfig.value.dayTo}`
      const monthsKey = `${availableMonths.value.join(',')}-${crossMonthKey}`

      if (
        tableData.value.length > 0 &&
        lastLoaded.value.employeeId === employeeId &&
        lastLoaded.value.year === tableFilters.value.year &&
        lastLoaded.value.monthsKey === monthsKey
      ) {
        // already loaded, avoid refetch
        // console.log('[LOAD] Skipping reload - data already loaded with same config')
        tableOptions.value.isLoading = false
        return
      }

      // console.log('[LOAD] Loading payroll data with config:', { employeeId, year: tableFilters.value.year })

      if (!employeeId) {
        tableData.value = []
        tableOptions.value.isLoading = false
        return
      }

      // Generate payroll data for each available month (just month names)
      const payrollPromises = availableMonths.value.map((monthIndex) => generatePayrollData(monthIndex))

      tableData.value = await Promise.all(payrollPromises)
      // Update cache marker so subsequent opens/changes don't refetch unnecessarily
      lastLoaded.value = { employeeId: props.itemData?.id ?? null, year: tableFilters.value.year, monthsKey }
    } catch (error) {
      console.error('Error loading payroll data:', error)
      tableData.value = []
      // clear cache on error to allow retry
      lastLoaded.value = { employeeId: null, year: null, monthsKey: null }
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
        // TODO: Crossmonth calculation disabled - always use default (full month) for table data
        // Initialize crossMonthConfig as disabled for now
        crossMonthConfig.value = {
          crossMonthEnabled: false, // TODO: Change to: Boolean(props.itemData?.payroll_start && props.itemData?.payroll_end)
          dayFrom: null, // TODO: Change to: props.itemData?.payroll_start ?? null
          dayTo: null, // TODO: Change to: props.itemData?.payroll_end ?? null
        }

        // console.log('[DIALOG OPEN] Initialized crossMonthConfig (DISABLED):', crossMonthConfig.value)
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

  // Clear cached payroll data when the selected employee changes
  watch(
    () => props.itemData?.id,
    (newId, oldId) => {
      if (newId !== oldId) {
        tableData.value = []
        lastLoaded.value = { employeeId: null, year: null, monthsKey: null }
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

  // Action: filter by date (attendance_at) - simple handler to clear or reload payroll data
  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.attendance_at = null

    // For payroll, changing attendance date may affect attendance-based calculations; reload data
    await loadPayrollData()
  }

  // Action: close dialog
  const onDialogClose = (): void => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Action: reload table data with crossmonth configuration
  const reloadTableData = async (config?: CrossMonthConfig): Promise<void> => {
    // console.log('[CROSSMONTH] Reloading table data with config:', config)

    if (config) {
      // Update crossmonth configuration
      crossMonthConfig.value = { ...config }

      if (config.crossMonthEnabled && config.dayFrom && config.dayTo) {
        // For each month, we'll calculate based on the crossmonth days
        // Store the base days in localStorage for computation to use
        // console.log('[CROSSMONTH] Enabled with days:', { from: config.dayFrom, to: config.dayTo })
        try {
          localStorage.setItem('czarles_payroll_crossMonthEnabled', 'true')
          localStorage.setItem('czarles_payroll_dayFrom', String(config.dayFrom))
          localStorage.setItem('czarles_payroll_dayTo', String(config.dayTo))
        } catch {
          /* ignore storage errors */
        }
      } else {
        // Clear crossmonth settings
        // console.log('[CROSSMONTH] Disabled, clearing settings')
        try {
          localStorage.removeItem('czarles_payroll_crossMonthEnabled')
          localStorage.removeItem('czarles_payroll_dayFrom')
          localStorage.removeItem('czarles_payroll_dayTo')
          localStorage.removeItem('czarles_payroll_fromDate')
          localStorage.removeItem('czarles_payroll_toDate')
        } catch {
          /* ignore storage errors */
        }
      }
    }

    // Clear cache to force reload with new settings
    lastLoaded.value = { employeeId: null, year: null, monthsKey: null }

    // Reload payroll data
    await loadPayrollData()
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
  onFilterDate,
  onView,
    onDialogClose,
    reloadTableData,
  }
}
