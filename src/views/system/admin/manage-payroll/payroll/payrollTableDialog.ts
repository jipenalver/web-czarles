// Import constants, types, and timezone helpers
import { usePayrollComputation } from './payrollComputation'
import { useOverallEarningsTotal, useNetSalaryCalculation } from './overallTotal'
import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch, computed, onUnmounted } from 'vue'
import { useEmployeesStore } from '@/stores/employees'
import { type Employee } from '@/stores/employees'
import { type Trip } from '@/stores/trips'
import { type Holiday } from '@/stores/holidays'
import { fetchCashAdvances } from './computation/cashAdvance'
import { fetchEmployeeDeductions } from './computation/benefits'
import type { Utilization } from '@/stores/utilizations'
import { fetchFilteredUtilizations } from './computation/utilizations'
import type { Allowance } from '@/stores/allowances'
import { fetchFilteredAllowances } from './computation/allowances'
import type { CashAdjustment } from '@/stores/cashAdjustments'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from './helpers'
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

// Interface for cash advance data
interface CashAdvance {
  amount: number
  [key: string]: unknown
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
  // Store instances
  // const tripsStore = useTripsStore()
  const employeesStore = useEmployeesStore()

  // Track crossmonth configuration
  const crossMonthConfig = ref<CrossMonthConfig>({
    crossMonthEnabled: false,
    dayFrom: null,
    dayTo: null,
  })

  // Type for year data cache
  type YearData = {
    employeeData: Employee | null | undefined
    deductions: Awaited<ReturnType<typeof fetchEmployeeDeductions>>
    monthlyData: Map<number, {
      monthIndex: number
      dateString: string
      trips: Trip[]
      holidays: Holiday[]
      cashAdvances: CashAdvance[]
      utilizations: Utilization[]
      allowances: Allowance[]
      cashAdjustments: CashAdjustment[]
    }>
  }

  // Cache para sa year data to avoid repeated fetches
  const yearDataCache = ref<Map<string, YearData>>(new Map())

  // Batch fetch all data for the entire year
  const fetchYearData = async (employeeId: number, year: number): Promise<YearData> => {
    const cacheKey = `${employeeId}-${year}`

    // Check cache first
    if (yearDataCache.value.has(cacheKey)) {
      return yearDataCache.value.get(cacheKey)!
    }

    try {
      console.log(`[YEAR DATA] Fetching all data for employee ${employeeId}, year ${year}...`)
      const yearStartTime = performance.now()

      // OPTIMIZATION 1: Preload attendance data for the entire year in ONE batch call
      const yearStartDate = `${year}-01-01`
      const yearEndDate = `${year}-12-31`
      const { getEmployeesAttendanceBatch } = await import('./computation/computation')

      // OPTIMIZATION 2: Fetch ALL payroll data (trips, holidays, cash advances, etc) in ONE batch call
      const { getPayrollYearData, filterPayrollDataByMonth } = await import('./computation/payrollYearData')

      // Execute both batch fetches in parallel
      const [attendanceBatchResult, payrollYearData, employeeData, employeeDeductionsResult] = await Promise.all([
        getEmployeesAttendanceBatch([employeeId], `${year}-01`, yearStartDate, yearEndDate),
        getPayrollYearData(employeeId, year),
        employeesStore.getEmployeesById(employeeId),
        fetchEmployeeDeductions(employeeId),
      ])

      // Check if batch fetch succeeded
      if (attendanceBatchResult.size > 0) {
        console.log(`[BATCH] Attendance preloaded successfully`)
      }

      // Organize payroll data by month
      const monthlyData = new Map()
      for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthData = filterPayrollDataByMonth(payrollYearData, monthIndex, year)
        const dateString = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`

        monthlyData.set(monthIndex, {
          monthIndex,
          dateString,
          trips: monthData.trips,
          holidays: monthData.holidays,
          cashAdvances: monthData.cashAdvances,
          utilizations: monthData.utilizations,
          allowances: monthData.allowances,
          cashAdjustments: monthData.cashAdjustments,
        })
      }

      const yearData: YearData = {
        employeeData,
        deductions: employeeDeductionsResult,
        monthlyData,
      }

      // Cache the result
      yearDataCache.value.set(cacheKey, yearData)

      const yearEndTime = performance.now()
      console.log(`[YEAR DATA] All data fetched in ${Math.round(yearEndTime - yearStartTime)}ms`)
      console.log(`[YEAR DATA] API calls saved: 72+ → 3 (96% reduction!)`)

      return yearData
    } catch (error) {
      console.error(`Error fetching year data for ${year}:`, error)
      throw error
    }
  }

  // Async payroll data generator using overallTotal composables
  const generatePayrollData = async (
    monthIndex: number,
    yearData?: Awaited<ReturnType<typeof fetchYearData>>,
    customDateRange?: { fromDate: string; toDate: string } | null
  ): Promise<TableData> => {
    const employeeId = props.itemData?.id
    const year = tableFilters.value.year
    const monthName = monthNames[monthIndex]

    // Create dateString in YYYY-MM format for data fetching
    const dateString = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`
    // Create full date string for cash advances (YYYY-MM-DD format)
    const cashAdvanceDateString = `${dateString}-01`

    /*   console.log(`STARTING payroll generation for ${monthName} ${year}:`, {
      employeeId,
      employeeName: `${props.itemData?.firstname} ${props.itemData?.lastname}`,
      dateString,
      cashAdvanceDateString,
      monthIndex
    })
 */
    if (!employeeId) {
      console.warn(`No employee ID provided for ${monthName} ${year}`)
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
      // Use yearData if provided (cached), otherwise fetch individual month data
      let trips, holidays, employeeData, employeeDeductionsResult, cashAdvances, utilizations, allowances, cashAdjustments

      if (yearData) {
        // Use cached year data
        const monthData = yearData.monthlyData.get(monthIndex)
        trips = monthData?.trips || []
        holidays = monthData?.holidays || []
        cashAdvances = monthData?.cashAdvances || []
        utilizations = monthData?.utilizations || []
        allowances = monthData?.allowances || []
        cashAdjustments = monthData?.cashAdjustments || []
        employeeData = yearData.employeeData
        employeeDeductionsResult = yearData.deductions
      } else {
        // Fallback: fetch individual month data (old behavior)
        const results = await Promise.all([
          fetchFilteredTrips(dateString, employeeId),
          fetchHolidaysByDateString(dateString, employeeId.toString()),
          employeesStore.getEmployeesById(employeeId),
          fetchEmployeeDeductions(employeeId),
          fetchCashAdvances(cashAdvanceDateString, employeeId),
          fetchFilteredUtilizations(dateString, employeeId),
          fetchFilteredAllowances(dateString, employeeId),
          (async () => {
            const startDate = cashAdvanceDateString
            const endDate = getLastDateOfMonth(startDate)
            const { data } = await supabase
              .from('cash_adjustments')
              .select('*')
              .eq('employee_id', employeeId)
              .eq('is_deduction', false)
              .gte('adjustment_at', startDate)
              .lt('adjustment_at', endDate)
            return data || []
          })(),
        ])
        trips = results[0]
        holidays = results[1]
        employeeData = results[2]
        employeeDeductionsResult = results[3]
        cashAdvances = results[4]
        utilizations = results[5]
        allowances = results[6]
        cashAdjustments = results[7]
      }

      /*   console.log(`Data fetching results for ${monthName} ${year}:`, {
        employeeId,
        employeeData: employeeData ? {
          id: employeeData.id,
          firstname: employeeData.firstname,
          lastname: employeeData.lastname,
          daily_rate: employeeData.daily_rate,
          is_field_staff: employeeData.is_field_staff,
          hired_at: employeeData.hired_at
        } : 'NULL',
        trips: {
          count: trips?.length || 0,
          data: trips || 'NULL'
        },
        holidays: {
          count: holidays?.length || 0,
          data: holidays || 'NULL'
        },
        cashAdvances: {
          count: cashAdvances?.length || 0,
          total: cashAdvances?.reduce((sum, advance) => sum + (Number(advance.amount) || 0), 0) || 0,
          data: cashAdvances || 'NULL'
        },
        employeeDeductions: {
          deductionsCount: employeeDeductionsResult.deductions?.length || 0,
          nonDeductionsCount: employeeDeductionsResult.nonDeductions?.length || 0,
          result: employeeDeductionsResult
        }
      }) */

      // Calculate total attendance minutes for the month
      const filterDateString = `${dateString}-01` // Format: "YYYY-MM-01"
      const isFieldStaff = employeeData?.is_field_staff || false

      // Use custom date range if provided (for crossmonth), otherwise use full month
      const fromDateForAttendance = customDateRange?.fromDate
      const toDateForAttendance = customDateRange?.toDate

      if (fromDateForAttendance && toDateForAttendance) {
        console.log(`[CROSSMONTH] Calculating attendance for ${monthName} with custom range:`, {
          from: fromDateForAttendance,
          to: toDateForAttendance,
          monthName,
          employeeId,
        })
      }

      const attendanceMinutes = await getTotalMinutesForMonth(
        filterDateString,
        employeeId,
        isFieldStaff,
        fromDateForAttendance,
        toDateForAttendance,
      )

      // Console log the attendance minutes result
      /*   console.log(`ATTENDANCE MINUTES for ${monthName} ${year}:`, {
        employeeId,
        employeeName: `${props.itemData?.firstname} ${props.itemData?.lastname}`,
        isFieldStaff,
        filterDateString,
        attendanceMinutes,
        hoursWorked: (attendanceMinutes / 60).toFixed(2),
        daysWorked: (attendanceMinutes / 480).toFixed(2), // Assuming 8 hours per day
      }) */

      // Setup reactive refs para sa computation
      const regularWorkTotal = ref(0)
      const tripsRef = ref(trips || [])
      const holidaysRef = ref(holidays || [])
      const utilizationsRef = ref(utilizations || [])
      const allowancesRef = ref(allowances || [])
      const cashAdjustmentsRef = ref(cashAdjustments || [])
      const dailyRate = computed(() => employeeData?.daily_rate || 0)
      const employeeDailyRate = computed(() => employeeData?.daily_rate || 0)
      const overallOvertime = ref(0)
      const codaAllowance = ref(0) // pwede ni ma-fetch from benefits or separate allowance table
      const nonDeductions = ref(employeeDeductionsResult.nonDeductions || [])
      const lateDeduction = ref(0)
      const employeeDeductionsRef = ref(employeeDeductionsResult.deductions || [])

      // Compute monthly utilizations total
      const monthlyUtilizationsTotal = computed(() => {
        return utilizationsRef.value.reduce((sum, utilization) => {
          const totalHours = utilization.hours ?? 0
          const overtimeHours = utilization.overtime_hours ?? 0
          const perHour = utilization.per_hour ?? 0
          return sum + (totalHours + overtimeHours) * perHour
        }, 0)
      })

      // Compute monthly allowances total
      const monthlyAllowancesTotal = computed(() => {
        return allowancesRef.value.reduce((sum, allowance) => {
          return sum + (allowance.amount ?? 0)
        }, 0)
      })

      // Compute monthly cash adjustments total (additions/earnings)
      const monthlyCashAdjustmentsTotal = computed(() => {
        return cashAdjustmentsRef.value.reduce((sum, adjustment) => {
          return sum + (adjustment.amount ?? 0)
        }, 0)
      })

      // Calculate total cash advance amount para sa month
      const totalCashAdvance =
        cashAdvances?.reduce((sum: number, advance: CashAdvance) => sum + (Number(advance.amount) || 0), 0) || 0
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

      // Wait for payrollComputation to finish its initial computation
      await payrollComp.computeRegularWorkTotal()



      // Set regular work total - note: payroll computation has watch that auto-computes this
      regularWorkTotal.value = payrollComp.regularWorkTotal.value

      /*  console.log(` Regular work total assignment for ${monthName} ${year}:`, {
        fromPayrollComp: payrollComp.regularWorkTotal.value,
        assignedTo: regularWorkTotal.value,
        isEqual: payrollComp.regularWorkTotal.value === regularWorkTotal.value
      }) */

      // Compute overtime hours for the month
      const overtimeHours = await payrollComp.computeOverallOvertimeCalculation()
      overallOvertime.value = overtimeHours

      /* console.log(`Overtime calculation for ${monthName} ${year}:`, {
        overtimeHours,
        overallOvertimeValue: overallOvertime.value
      }) */

      // Get late deduction from payroll computation
      lateDeduction.value = payrollComp.lateDeduction.value

      // Get undertime deduction from payroll computation
      const undertimeDeduction = ref(payrollComp.undertimeDeduction.value)

      /* console.log(`Late deduction for ${monthName} ${year}:`, {
        fromPayrollComp: payrollComp.lateDeduction.value,
        assignedTo: lateDeduction.value
      }) */

      /* console.log(`Undertime deduction for ${monthName} ${year}:`, {
        fromPayrollComp: payrollComp.undertimeDeduction.value,
        assignedTo: undertimeDeduction.value,
        monthUndertimeMinutes: payrollComp.monthUndertimeDeduction.value
      }) */

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
        monthlyUtilizationsTotal,
        monthlyAllowancesTotal,
        monthlyCashAdjustmentsTotal,
      )



      // Compute net salary using overallTotal composable
      const netSalaryCalc = useNetSalaryCalculation(
        overallEarningsTotal,
        showLateDeduction,
        ref(lateDeduction.value),
        employeeDeductionsRef,
        cashAdvance,
        undertimeDeduction,
      )


      // Calculate net pay: basic salary + gross pay - deductions
      const netPay =
        /* basicSalary + */ overallEarningsTotal.value - netSalaryCalc.value.totalDeductions

      // Debug log para sa net pay calculation


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
        console.log('[LOAD] Skipping reload - data already loaded with same config')
        tableOptions.value.isLoading = false
        return
      }

      console.log('[LOAD] Loading payroll data with config:', { employeeId, year: tableFilters.value.year, crossMonthConfig: crossMonthConfig.value })

      if (!employeeId) {
        tableData.value = []
        tableOptions.value.isLoading = false
        return
      }

      // ⚡ **OPTIMIZATION: Single batch fetch for the entire year**

      const yearData = await fetchYearData(employeeId, tableFilters.value.year)

      // Import helpers for date range calculation
      const { getDateRangeForMonth, monthNames: helperMonthNames } = await import('./helpers')

      // Generate payroll for each month using cached year data
      const payrollPromises = availableMonths.value.map((monthIndex) => {
        // Calculate date range for this month if crossmonth is enabled
        let dateRange: { fromDate: string; toDate: string } | null = null

        if (crossMonthConfig.value.crossMonthEnabled &&
            crossMonthConfig.value.dayFrom &&
            crossMonthConfig.value.dayTo) {
          const monthName = helperMonthNames[monthIndex]
          dateRange = getDateRangeForMonth(
            tableFilters.value.year,
            monthName,
            crossMonthConfig.value.dayFrom,
            crossMonthConfig.value.dayTo,
          )
        }

        return generatePayrollData(monthIndex, yearData, dateRange)
      })

      tableData.value = await Promise.all(payrollPromises)
      // Update cache marker so subsequent opens/changes don't refetch unnecessarily
      lastLoaded.value = { employeeId: props.itemData?.id ?? null, year: tableFilters.value.year, monthsKey }
      /* console.log('Payroll data loaded:', tableData.value) */
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
        // Initialize crossMonthConfig from employee data when dialog opens
        const hasPayrollDates = Boolean(props.itemData?.payroll_start && props.itemData?.payroll_end)
        crossMonthConfig.value = {
          crossMonthEnabled: hasPayrollDates,
          dayFrom: props.itemData?.payroll_start ?? null,
          dayTo: props.itemData?.payroll_end ?? null,
        }

        console.log('[DIALOG OPEN] Initialized crossMonthConfig:', crossMonthConfig.value)

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
        // Clear year data cache for old employee
        yearDataCache.value.clear()
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
    console.log('[CROSSMONTH] Reloading table data with config:', config)

    if (config) {
      // Update crossmonth configuration
      crossMonthConfig.value = { ...config }

      if (config.crossMonthEnabled && config.dayFrom && config.dayTo) {
        // For each month, we'll calculate based on the crossmonth days
        // Store the base days in localStorage for computation to use
        console.log('[CROSSMONTH] Enabled with days:', { from: config.dayFrom, to: config.dayTo })
        try {
          localStorage.setItem('czarles_payroll_crossMonthEnabled', 'true')
          localStorage.setItem('czarles_payroll_dayFrom', String(config.dayFrom))
          localStorage.setItem('czarles_payroll_dayTo', String(config.dayTo))
        } catch {
          /* ignore storage errors */
        }
      } else {
        // Clear crossmonth settings
        console.log('[CROSSMONTH] Disabled, clearing settings')
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
    yearDataCache.value.clear()

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
