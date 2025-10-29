import { computed, type Ref, type ComputedRef } from 'vue'
import type { Holiday } from '@/stores/holidays'
import type { Trip } from '@/stores/trips'
import type { EmployeeDeduction } from '@/stores/benefits'

/**
 * Computes the overall earnings total including regular work, trips, holidays, overtime, benefits, utilizations, and allowances
 */
export function useOverallEarningsTotal(
  regularWorkTotal: Ref<number>,
  trips: Ref<Trip[]>,
  holidays: Ref<Holiday[]>,
  dailyRate: ComputedRef<number>,
  employeeDailyRate: ComputedRef<number>,
  overallOvertime: Ref<number>,
  codaAllowance: Ref<number>,
  nonDeductions?: Ref<EmployeeDeduction[]>,
  monthlyUtilizationsTotal?: ComputedRef<number>,
  monthlyAllowancesTotal?: ComputedRef<number>,
  /* isFieldStaff?: ComputedRef<boolean>, */
): ComputedRef<number> {
  return computed(() => {
    let total = 0

    // 1. Regular work earnings (already calculated correctly in computeRegularWorkTotal)
    const regularWork = Number(regularWorkTotal.value) || 0
    total += regularWork

    // 2. Trips earnings - trip_no as multiplier, default 1 if not provided
    const tripsEarnings =
      trips.value?.reduce((sum, trip) => {
        const perTrip = Number(trip.per_trip) || 0
        const tripNo = Number(trip.trip_no) || 1
        return sum + perTrip * tripNo
      }, 0) || 0
    total += tripsEarnings

    // 3. Holiday earnings with different multipliers based on type
    const holidayEarnings =
      holidays.value?.reduce((sum, holiday) => {
        const baseRate = Number(dailyRate.value) || 0
        const type = holiday.type?.toLowerCase() || ''

        let multiplier = 1
        if (type.includes('rh'))
          multiplier = 2.0 // Regular Holiday
        else if (type.includes('snh'))
          multiplier = 1.5 // Special Non-working Holiday
        else if (type.includes('swh')) multiplier = 1.3 // Special Working Holiday

        return sum + baseRate * multiplier
      }, 0) || 0
    total += holidayEarnings

    // 4. Overtime earnings (1.25x hourly rate)
    const overtimeRate = ((Number(employeeDailyRate.value) || 0) / 8) * 1.25
    const overtimeEarnings = overtimeRate * (Number(overallOvertime.value) || 0)
    total += overtimeEarnings

    // 5. Monthly trippings (reserved for future use)
    const monthlyTrippings = 0
    total += monthlyTrippings

    // 6. Add non-deductions (benefits)
    if (nonDeductions && Array.isArray(nonDeductions.value)) {
      const nonDeductionTotal = nonDeductions.value.reduce((sum, item) => {
        return sum + (Number(item.amount) || 0)
      }, 0)
      total += nonDeductionTotal
    }

    // 7. Add monthly utilizations
    if (monthlyUtilizationsTotal) {
      total += Number(monthlyUtilizationsTotal.value) || 0
    }

    // 8. Add monthly allowances
    if (monthlyAllowancesTotal) {
      total += Number(monthlyAllowancesTotal.value) || 0
    }

    return total
  })
}

/**
 * Computes detailed breakdown of earnings by category
 */
export function useEarningsBreakdown(
  regularWorkTotal: Ref<number>,
  trips: Ref<Trip[]>,
  holidays: Ref<Holiday[]>,
  dailyRate: ComputedRef<number>,
  employeeDailyRate: ComputedRef<number>,
  overallOvertime: Ref<number>,
  codaAllowance: Ref<number>,
  /* isFieldStaff?: ComputedRef<boolean>, */
): ComputedRef<Record<string, number>> {
  return computed(() => {
    // Regular work earnings (already calculated correctly in computeRegularWorkTotal)
    const regular = Number(regularWorkTotal.value) || 0

    // Trips earnings - trip_no as multiplier, default 1 if not provided
    const tripsTotal =
      trips.value?.reduce((sum, trip) => {
        const perTrip = Number(trip.per_trip) || 0
        const tripNo = Number(trip.trip_no) || 1
        return sum + perTrip * tripNo
      }, 0) || 0

    // Holiday earnings with multipliers
    const holidayTotal =
      holidays.value?.reduce((sum, holiday) => {
        const baseRate = Number(dailyRate.value) || 0
        const type = holiday.type?.toLowerCase() || ''

        let multiplier = 1
        if (type.includes('rh'))
          multiplier = 2.0 // Regular Holiday
        else if (type.includes('snh'))
          multiplier = 1.5 // Special Non-working Holiday
        else if (type.includes('swh')) multiplier = 1.3 // Special Working Holiday

        return sum + baseRate * multiplier
      }, 0) || 0

    // Overtime earnings
    const overtime =
      ((Number(employeeDailyRate.value) || 0) / 8) * 1.25 * (Number(overallOvertime.value) || 0)

    // Allowances
    const allowances = Number(codaAllowance.value) || 0

    return {
      regular,
      trips: tripsTotal,
      holidays: holidayTotal,
      overtime,
      allowances,
      total: regular + tripsTotal + holidayTotal + overtime + allowances,
    }
  })
}

/**
 * Computes net salary after deductions including late deductions, cash advances, and dynamic employee deductions
 */
export function useNetSalaryCalculation(
  overallEarningsTotal: ComputedRef<number>,
  showLateDeduction: ComputedRef<boolean>,
  lateDeduction: Ref<number>,
  employeeDeductions?: Ref<EmployeeDeduction[]>,
  cashAdvance?: Ref<number>,
  undertimeDeduction?: Ref<number>,
): ComputedRef<{
  grossSalary: number
  deductions: Record<string, number>
  totalDeductions: number
  netSalary: number
  dynamicDeductions?: Array<{ id: number; amount: number; benefit: string }>
}> {
  return computed(() => {
    const totalEarnings = overallEarningsTotal.value

    // Fixed deductions
    const deductions = {
      late: showLateDeduction.value ? Number(lateDeduction.value) || 0 : 0,
      undertime: showLateDeduction.value && undertimeDeduction ? Number(undertimeDeduction.value) || 0 : 0,
      cashAdvance: cashAdvance ? Number(cashAdvance.value) || 0 : 0,
    }

    // Process dynamic employee deductions (from PayrollDeductions.vue)
    let dynamicDeductions: Array<{ id: number; amount: number; benefit: string }> = []
    let dynamicDeductionsTotal = 0

    // Ensure employeeDeductions.value is an array, even if it's a Proxy(Array)
    const deductionsArray = Array.isArray(employeeDeductions?.value) ? employeeDeductions.value : []

    if (deductionsArray.length > 0) {
      dynamicDeductions = deductionsArray
        .filter((deduction) => deduction && (deduction.id !== undefined || deduction.amount))
        .map((deduction) => ({
          id: deduction.id,
          amount: Number(deduction.amount) || 0,
          benefit: deduction.benefit?.benefit || 'Deduction',
        }))
      dynamicDeductionsTotal = dynamicDeductions.reduce((sum, d) => sum + d.amount, 0)
    }

    // Calculate totals
    const totalDeductionsAmount =
      Object.values(deductions).reduce((sum, amount) => sum + amount, 0) + dynamicDeductionsTotal

    const result = {
      grossSalary: totalEarnings,
      deductions,
      totalDeductions: totalDeductionsAmount,
      netSalary: totalEarnings - totalDeductionsAmount,
      dynamicDeductions,
    }

    return result
  })
}
