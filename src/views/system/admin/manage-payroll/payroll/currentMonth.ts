// Payroll sample data helpers (for demo/sample only)
export const baseBasicSalary = 25000
export const variations = [0, 0, 0, 100, -100, 200, -50, -300, 500, 300, 100, 400]
export const deductionVariations = [
  3200, 3100, 2900, 3400, 3000, 3600, 3300, 3150, 3500, 3250, 3800, 4200,
]

export function getSampleBasicSalary(monthIndex: number): number {
  return baseBasicSalary + (variations[monthIndex] || 0)
}

export function getSampleOvertime(): number {
  // Random overtime 1000-6000
  return Math.floor(Math.random() * 5000) + 1000
}

export function getSampleAllowances(): number {
  // Random allowances 500-2500
  return Math.floor(Math.random() * 2000) + 500
}

export function getSampleDeductions(monthIndex: number): number {
  return deductionVariations[monthIndex] || 3000
}

// mga helper para sa timezone ug month/year sa PH

// Import date helpers from others.ts
import { getDateISO, getDate, getDateWithWeekday, prepareDate } from '@/utils/helpers/others'

/**
 * Kuha current date/time sa Manila timezone (Asia/Manila)
 */
export function getPhilippinesDate(): string {
  // gamit prepareDate para consistent ang format
  return prepareDate(new Date())
}

/**
 * Kuha current month index (0-11) sa PH timezone
 */
export function getCurrentMonthInPhilippines(): number {
  // gamit prepareDate para sa PH timezone, then extract month
  const philippinesDate = new Date(prepareDate(new Date()))
  return philippinesDate.getMonth()
}

/**
 * Kuha current year sa PH timezone
 */
export function getCurrentYearInPhilippines(): number {
  const philippinesDate = new Date(prepareDate(new Date()))
  return philippinesDate.getFullYear()
}

/**
 * Month names array (English, for display)
 */
export const monthNames: string[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
