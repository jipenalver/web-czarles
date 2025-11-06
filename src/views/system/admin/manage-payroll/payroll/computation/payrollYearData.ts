import { supabase } from '@/utils/supabase'
import type { Trip } from '@/stores/trips'
import type { Utilization } from '@/stores/utilizations'
import type { Allowance } from '@/stores/allowances'
import type { CashAdjustment } from '@/stores/cashAdjustments'
import type { HolidayWithAttendance } from './holidays'

// Interface for cash advance data
interface CashAdvance {
  id: number
  employee_id: number
  amount: number
  request_at: string
  created_at: string
  status: string
  [key: string]: unknown
}

// Response type from RPC
interface PayrollYearDataResponse {
  trips: Trip[]
  holidays: HolidayWithAttendance[]
  cash_advances: CashAdvance[]
  utilizations: Utilization[]
  allowances: Allowance[]
  cash_adjustments: CashAdjustment[]
}

// Cache structure: Map<cacheKey, {data, timestamp}>
const payrollYearDataCache = new Map<string, {
  data: PayrollYearDataResponse
  timestamp: number
}>()

const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * ⚡ OPTIMIZED: Fetch ALL payroll data for entire year in a SINGLE RPC call
 *
 * Replaces:
 * - 12 fetchFilteredTrips calls
 * - 12 fetchHolidaysByDateString calls (+ N attendance queries per holiday)
 * - 12 fetchCashAdvances calls
 * - 12 fetchFilteredUtilizations calls
 * - 12 fetchFilteredAllowances calls
 * - 12 cash_adjustments queries
 *
 * Total: 72+ API calls → 1 API call (98.6% reduction!)
 */
export async function getPayrollYearData(
  employeeId: number,
  year: number
): Promise<PayrollYearDataResponse> {
  const cacheKey = `${employeeId}-${year}`

  // Check cache first
  const cached = payrollYearDataCache.get(cacheKey)
  if (cached && (performance.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`✅ [PAYROLL YEAR] Cache hit for employee ${employeeId}, year ${year}`)
    return cached.data
  }

  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  console.log(`🚀 [PAYROLL YEAR] Batch fetching year data for employee ${employeeId}, year ${year}...`)
  const startTime = performance.now()

  try {
    const { data, error } = await supabase.rpc('get_payroll_year_data', {
      p_employee_id: employeeId,
      p_start_date: startDate,
      p_end_date: endDate
    })

    if (error) {
      console.error('❌ [PAYROLL YEAR] RPC Error:', error)
      console.error('❌ [PAYROLL YEAR] Make sure to run: supabase/functions/get_payroll_year_data.sql')

      // Return empty data structure on error
      return {
        trips: [],
        holidays: [],
        cash_advances: [],
        utilizations: [],
        allowances: [],
        cash_adjustments: []
      }
    }

    const endTime = performance.now()
    const duration = Math.round(endTime - startTime)

    console.log(`✅ [PAYROLL YEAR] Data fetched in ${duration}ms:`, {
      trips: data.trips?.length || 0,
      holidays: data.holidays?.length || 0,
      cash_advances: data.cash_advances?.length || 0,
      utilizations: data.utilizations?.length || 0,
      allowances: data.allowances?.length || 0,
      cash_adjustments: data.cash_adjustments?.length || 0,
      totalRecords: (data.trips?.length || 0) +
                    (data.holidays?.length || 0) +
                    (data.cash_advances?.length || 0) +
                    (data.utilizations?.length || 0) +
                    (data.allowances?.length || 0) +
                    (data.cash_adjustments?.length || 0)
    })

    // Cache the result
    payrollYearDataCache.set(cacheKey, {
      data: data as PayrollYearDataResponse,
      timestamp: performance.now()
    })

    return data as PayrollYearDataResponse

  } catch (error) {
    console.error('❌ [PAYROLL YEAR] Unexpected error:', error)

    // Return empty data structure on error
    return {
      trips: [],
      holidays: [],
      cash_advances: [],
      utilizations: [],
      allowances: [],
      cash_adjustments: []
    }
  }
}

/**
 * Clear the payroll year data cache
 */
export function clearPayrollYearDataCache() {
  payrollYearDataCache.clear()
  console.log('🗑️ [PAYROLL YEAR] Cache cleared')
}

/**
 * Clear cache for specific employee/year
 */
export function clearPayrollYearDataCacheFor(employeeId: number, year: number) {
  const cacheKey = `${employeeId}-${year}`
  payrollYearDataCache.delete(cacheKey)
  console.log(`🗑️ [PAYROLL YEAR] Cache cleared for employee ${employeeId}, year ${year}`)
}

/**
 * Helper to filter data by month from the year data
 */
export function filterPayrollDataByMonth(
  yearData: PayrollYearDataResponse,
  monthIndex: number,
  year: number
) {
  const monthStr = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`

  // Calculate next month for range filtering
  let nextYear = year
  let nextMonth = monthIndex + 2 // +2 because monthIndex is 0-based
  if (nextMonth > 12) {
    nextMonth = 1
    nextYear += 1
  }
  const nextMonthStr = `${nextYear}-${nextMonth.toString().padStart(2, '0')}`

  return {
    trips: yearData.trips.filter(t =>
      t.trip_at >= `${monthStr}-01` && t.trip_at < `${nextMonthStr}-01`
    ),
    holidays: yearData.holidays.filter(h =>
      h.holiday_at >= `${monthStr}-01` && h.holiday_at < `${nextMonthStr}-01`
    ),
    cashAdvances: yearData.cash_advances.filter(ca =>
      ca.request_at >= `${monthStr}-01` && ca.request_at < `${nextMonthStr}-01`
    ),
    utilizations: yearData.utilizations.filter(u =>
      u.utilization_at >= `${monthStr}-01` && u.utilization_at < `${nextMonthStr}-01`
    ),
    allowances: yearData.allowances.filter(a =>
      a.trip_at >= `${monthStr}-01` && a.trip_at < `${nextMonthStr}-01`
    ),
    cashAdjustments: yearData.cash_adjustments.filter(ca =>
      ca.adjustment_at >= `${monthStr}-01` && ca.adjustment_at < `${nextMonthStr}-01`
    )
  }
}
