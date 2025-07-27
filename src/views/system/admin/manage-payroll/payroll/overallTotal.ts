import { computed, type Ref, type ComputedRef } from 'vue'
import type { Holiday } from '@/stores/holidays'
import type { Trip } from '@/stores/trips'

// Helper to compute overall earnings total
export function useOverallEarningsTotal(
  regularWorkTotal: Ref<number>,
  trips: Ref<Trip[]>,
  holidays: Ref<Holiday[]>,
  dailyRate: ComputedRef<number>,
  employeeDailyRate: ComputedRef<number>,
  overallOvertime: Ref<number>,
  codaAllowance: Ref<number>,
): ComputedRef<number> {
  return computed(() => {
    let total = 0
    // 1. Regular work earnings
    const regularWork = Number(regularWorkTotal.value) || 0
    total += regularWork
    // 2. Trips earnings
    // trip_no as multiplier, default 1 kung wala
    const tripsEarnings =
      trips.value?.reduce((sum, trip) => {
        const perTrip = Number(trip.per_trip) || 0
        const tripNo = Number(trip.trip_no) || 1
        return sum + perTrip * tripNo
      }, 0) || 0
    total += tripsEarnings
    // 3. Holiday earnings
    const holidayEarnings =
      holidays.value?.reduce((sum, holiday) => {
        const baseRate = Number(dailyRate.value) || 0
        const type = holiday.type?.toLowerCase() || ''
        let multiplier = 1
        if (type.includes('rh')) multiplier = 2.0
        else if (type.includes('snh')) multiplier = 1.5
        else if (type.includes('swh')) multiplier = 1.3
        return sum + baseRate * multiplier
      }, 0) || 0
    total += holidayEarnings
    // 4. Overtime earnings
    const overtimeRate = ((Number(employeeDailyRate.value) || 0) / 8) * 1.25
    const overtimeEarnings = overtimeRate * (Number(overallOvertime.value) || 0)
    total += overtimeEarnings
    // 5. Monthly trippings (future use)
    const monthlyTrippings = 0
    total += monthlyTrippings

    return total
  })
}

// Helper to compute earnings breakdown
export function useEarningsBreakdown(
  regularWorkTotal: Ref<number>,
  trips: Ref<Trip[]>,
  holidays: Ref<Holiday[]>,
  dailyRate: ComputedRef<number>,
  employeeDailyRate: ComputedRef<number>,
  overallOvertime: Ref<number>,
  codaAllowance: Ref<number>,
): ComputedRef<Record<string, number>> {
  return computed(() => {
    const regular = Number(regularWorkTotal.value) || 0
    // trip_no as multiplier, default 1 kung wala
    const tripsTotal =
      trips.value?.reduce((sum, trip) => {
        const perTrip = Number(trip.per_trip) || 0
        const tripNo = Number(trip.trip_no) || 1
        return sum + perTrip * tripNo
      }, 0) || 0
    const holidayTotal =
      holidays.value?.reduce((sum, holiday) => {
        const baseRate = Number(dailyRate.value) || 0
        const type = holiday.type?.toLowerCase() || ''
        let multiplier = 1
        if (type.includes('rh')) multiplier = 2.0
        else if (type.includes('snh')) multiplier = 1.5
        else if (type.includes('swh')) multiplier = 1.3
        return sum + baseRate * multiplier
      }, 0) || 0
    const overtime =
      ((Number(employeeDailyRate.value) || 0) / 8) * 1.25 * (Number(overallOvertime.value) || 0)
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

// Helper to compute net salary calculation
export function useNetSalaryCalculation(
  overallEarningsTotal: ComputedRef<number>,
  showLateDeduction: ComputedRef<boolean>,
  lateDeduction: Ref<number>,
  employeeDeductions?: Ref<any[]>,

  cashAdvance?: Ref<number>,
): ComputedRef<{
  grossSalary: number
  deductions: Record<string, number>
  totalDeductions: number
  netSalary: number
  dynamicDeductions?: Array<{ id: any; amount: number; benefit: string }>
}> {
  return computed(() => {
    const totalEarnings = overallEarningsTotal.value
    const deductions = {
      late: showLateDeduction.value ? Number(lateDeduction.value) || 0 : 0,
      cashAdvance: cashAdvance ? Number(cashAdvance.value) || 0 : 0,
    }
    // i-sum up ang tanan dynamic employee deductions (from PayrollDeductions.vue)
    // i-initialize as empty, pero dapat gikan sa component ang employeeDeductions
    let dynamicDeductions: Array<{ id: any; amount: number; benefit: string }> = []
    if (!employeeDeductions) {
      // warning kung wala gi-pasa ang employeeDeductions ref
      console.warn(
        'employeeDeductions ref was not provided to useNetSalaryCalculation. Dynamic deductions will be empty.',
      )
    }

    console.log('Employee deductions:', dynamicDeductions)
    let dynamicDeductionsTotal = 0
    if (employeeDeductions && Array.isArray(employeeDeductions.value)) {
      console.log('Employee deductions:', employeeDeductions.value)
      dynamicDeductions = employeeDeductions.value.map((deduction) => ({
        id: deduction.id,
        amount: Number(deduction.amount) || 0,
        benefit: deduction.employee_benefit?.benefit || 'Deduction',
      }))
      dynamicDeductionsTotal = dynamicDeductions.reduce((sum, d) => sum + d.amount, 0)
    }
    const totalDeductionsAmount =
      Object.values(deductions).reduce((sum, amount) => sum + amount, 0) + dynamicDeductionsTotal
    return {
      grossSalary: totalEarnings,
      deductions,
      totalDeductions: totalDeductionsAmount,
      netSalary: totalEarnings - totalDeductionsAmount,
      dynamicDeductions,
    }
  })
}
