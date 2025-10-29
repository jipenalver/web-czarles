<script setup lang="ts">
import { safeCurrencyFormat } from './helpers'
import { fetchCashAdvances } from './computation/cashAdvance'
import { ref, watch, computed } from 'vue'
import { useNetSalaryCalculation } from './overallTotal'
import type { EmployeeDeduction } from '@/stores/benefits'
import type { CashAdvance } from '@/stores/cashAdvances'
import type { CashAdjustment } from '@/stores/cashAdjustments'
import { supabase } from '@/utils/supabase'
import { getLastDateOfMonth } from './helpers'

const props = defineProps<{
  showLateDeduction: boolean
  monthLateDeduction: number | undefined
  monthUndertimeDeduction: number | undefined
  formatCurrency: (value: number) => string
  employeeId: number | undefined
  employeeDeductions: EmployeeDeduction[]
  filterDateString?: string
  overallEarningsTotal: number
  lateDeduction: number
  undertimeDeduction: number
}>()

const cashAdvances = ref<CashAdvance[]>([])
const cashAdjustments = ref<CashAdjustment[]>([])

// Fetch cash adjustments with is_deduction=true
async function fetchCashAdjustments(filterDateString: string, employeeId: number) {
  const startDate = `${filterDateString}`
  const endDate = getLastDateOfMonth(startDate)

  const { data, error } = await supabase
    .from('cash_adjustments')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('is_deduction', true)
    .gte('adjustment_at', startDate)
    .lt('adjustment_at', endDate)

  if (error) {
    console.error('Error fetching cash adjustments:', error)
    return []
  }

  return data || []
}

// Fetch cash advances when employeeId or filterDateString changes
watch(
  () => [props.filterDateString, props.employeeId],
  async ([filterDateString, employeeId]) => {
    if (typeof employeeId === 'number' && filterDateString) {
      // kuhaon ang cash advances ug cash adjustments para sa employee ug payroll month
      cashAdvances.value = await fetchCashAdvances(filterDateString as string, employeeId)
      cashAdjustments.value = await fetchCashAdjustments(filterDateString as string, employeeId)
    } else {
      cashAdvances.value = []
      cashAdjustments.value = []
    }
  },
  { immediate: true },
)

// Compute total cash advance from all ca.amount
const totalCashAdvance = computed(() =>
  cashAdvances.value.reduce((sum, ca) => sum + (Number(ca.amount) || 0), 0),
)

// Compute total cash adjustments (deductions only)
const totalCashAdjustments = computed(() =>
  cashAdjustments.value.reduce((sum, adj) => sum + (Number(adj.amount) || 0), 0),
)

// Console warn for late deduction
// watch(
//   () => props.lateDeduction,
//   (newLateDeduction) => {
//     if (newLateDeduction > 0) {
//       console.warn(`[LATE DEDUCTION] Employee ${props.employeeId} - Late deduction: ₱${newLateDeduction.toFixed(2)} (${props.monthLateDeduction || 0} minutes)`)
//     }
//   },
//   { immediate: true }
// )

// Console warn for undertime deduction
watch(
  () => props.undertimeDeduction,
  (newUndertimeDeduction) => {
    if (newUndertimeDeduction > 0) {
      console.warn(`[UNDERTIME DEDUCTION] Employee ${props.employeeId} - Undertime deduction: ₱${newUndertimeDeduction.toFixed(2)} (${props.monthUndertimeDeduction || 0} minutes)`)
    }
  },
  { immediate: true }
)

// Setup netSalaryCalculation using useNetSalaryCalculation composable
// Note: Cash adjustments total should be added separately to deductions
const netSalaryCalculation = useNetSalaryCalculation(
  computed(() => props.overallEarningsTotal),
  computed(() => props.showLateDeduction),
  computed(() => props.lateDeduction),
  computed(() => props.employeeDeductions),
  computed(() => totalCashAdvance.value + totalCashAdjustments.value), // Combine both cash deductions
  computed(() => props.undertimeDeduction),
)

// Publish net salary in realtime for other components (e.g. print footer)
watch(
  () => netSalaryCalculation.value.netSalary,
  (newNet) => {
    if (typeof window !== 'undefined') {
      try {
        const priceValue = typeof newNet === 'number' ? newNet : Number(newNet)
        // store as string for persistence
        localStorage.setItem('czarles_payroll_price', String(priceValue))
        // dispatch a custom event so same-window listeners receive updates in realtime
        window.dispatchEvent(new CustomEvent('czarles_payroll_price_update', { detail: { price: priceValue } }))
      } catch {
        // noop
      }
    }
  },
  { immediate: true },
)

// ...existing code...
</script>
<template>
  <!-- Merged Deductions Row -->
  <tr>
    <td class="pa-1" colspan="2"></td>
    <td class="pa-1" colspan="3">
      <div class="d-flex flex-column pa-0 ma-0">
        <!-- Late Deduction -->
        <template v-if="showLateDeduction">
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="d-flex align-center">
              <span class="text-caption " style="font-size: 12px">Late Deduction</span>
              <span
                class="text-caption font-weight-bold text-end  ms-1"
                v-if="monthLateDeduction !== undefined && monthLateDeduction > 0"
                style="font-size: 12px"
              >
                ({{ monthLateDeduction }} min.)
              </span>
            </div>
            <span
              class="border-b-thin border-s-sm text-end pa-0 "
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(netSalaryCalculation.deductions.late, formatCurrency) }}
            </span>
          </div>
        </template>
        <!-- Undertime Deduction -->
        <template v-if="showLateDeduction">
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="d-flex align-center">
              <span class="text-caption" style="font-size: 12px">Undertime Deduction</span>
              <span
                class="text-caption font-weight-bold text-end  ms-1"
                v-if="monthUndertimeDeduction !== undefined && monthUndertimeDeduction > 0"
                style="font-size: 12px"
              >
                ({{ monthUndertimeDeduction }} min.)
              </span>
            </div>
            <span
              class="border-b-thin border-s-sm text-end pa-0 "
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(netSalaryCalculation.deductions.undertime, formatCurrency) }}
            </span>
          </div>
        </template>
        <!-- Employee Deductions -->
        <template v-for="deduction in props.employeeDeductions" :key="deduction.id">
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <span class="text-caption " style="font-size: 12px">{{
              deduction.benefit?.benefit || 'Deduction'
            }}</span>
            <span
              class="border-b-thin border-s-sm text-end pa-0 "
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(deduction.amount || 0, formatCurrency) }}
            </span>
          </div>
        </template>
        <!-- Cash Advances -->
        <template v-for="ca in cashAdvances" :key="'cashadvance-' + ca.id">
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="d-flex align-center">
              <span class="text-caption " style="font-size: 12px">Cash Advance</span>
              <span class="text-caption font-weight-bold text-end ms-1" style="font-size: 12px">{{
                ca.request_at
              }}</span>
            </div>
            <span
              class="border-b-thin border-s-sm text-end pa-0 "
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(ca.amount || 0, formatCurrency) }}
            </span>
          </div>
        </template>
        <!-- Cash Adjustments (Deductions) -->
        <template v-for="adj in cashAdjustments" :key="'cashadjustment-' + adj.id">
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <div class="d-flex align-center">
              <span class="text-caption " style="font-size: 12px">{{ adj.name || 'Cash Adjustment' }}</span>
              <span v-if="adj.remarks" class="text-caption font-weight-bold text-end ms-1" style="font-size: 12px">
                ({{ adj.remarks }})
              </span>
            </div>
            <span
              class="border-b-thin border-s-sm text-end pa-0 "
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(adj.amount || 0, formatCurrency) }}
            </span>
          </div>
        </template>
      </div>
    </td>
  </tr>
  <!-- Less Deductions and Net Salary Rows remain unchanged -->
  <tr>
    <td class="pa-1" colspan="2"></td>
    <td class="text-caption pa-1 ">Less Deductions</td>
    <td class="pa-1"></td>
    <td class="border-b-thin border-s-sm text-end pa-1 ">
      {{ safeCurrencyFormat(netSalaryCalculation.totalDeductions, formatCurrency) }}
    </td>
  </tr>
  <tr>
    <td class="pa-1" colspan="2"></td>
    <td class="text-caption font-weight-bold border-t-sm border-s-sm pa-1">TOTAL NET SALARY</td>
    <td class="border-t-sm pa-1">Php</td>
    <td class="border-t-sm border-s-sm text-end pa-1">
      ₱{{ safeCurrencyFormat(netSalaryCalculation.netSalary, formatCurrency) }}
    </td>
  </tr>
</template>
