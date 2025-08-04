<script setup lang="ts">
import { safeCurrencyFormat } from './helpers'
import { fetchCashAdvances } from './computation/cashAdvance'
import { ref, watch, computed } from 'vue'
import { useNetSalaryCalculation } from './overallTotal'
import type { EmployeeDeduction } from '@/stores/benefits'
import type { CashAdvance } from '@/stores/cashAdvances'

const props = defineProps<{
  showLateDeduction: boolean
  monthLateDeduction: number | undefined
  formatCurrency: (value: number) => string
  employeeId: number | undefined
  employeeDeductions: EmployeeDeduction[]
  filterDateString?: string
  overallEarningsTotal: number
  lateDeduction: number
}>()

const cashAdvances = ref<CashAdvance[]>([])

// Fetch cash advances when employeeId or filterDateString changes
watch(
  () => [props.filterDateString, props.employeeId],
  async ([filterDateString, employeeId]) => {
    if (typeof employeeId === 'number' && filterDateString) {
      // kuhaon ang cash advances para sa employee ug payroll month
      cashAdvances.value = await fetchCashAdvances(filterDateString as string, employeeId)
    } else {
      cashAdvances.value = []
    }
  },
  { immediate: true },
)

// Compute total cash advance from all ca.amount
const totalCashAdvance = computed(() =>
  cashAdvances.value.reduce((sum, ca) => sum + (Number(ca.amount) || 0), 0),
)

// Setup netSalaryCalculation using useNetSalaryCalculation composable
const netSalaryCalculation = useNetSalaryCalculation(
  computed(() => props.overallEarningsTotal),
  computed(() => props.showLateDeduction),
  computed(() => props.lateDeduction),
  computed(() => props.employeeDeductions),
  totalCashAdvance,
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
              <span class="text-caption text-disabled" style="font-size: 12px">Late Deduction</span>
              <span
                class="text-caption font-weight-bold text-end text-disabled ms-1"
                v-if="monthLateDeduction !== undefined && monthLateDeduction > 0"
                style="font-size: 12px"
              >
                ({{ monthLateDeduction }} min.)
              </span>
            </div>
            <span
              class="border-b-thin border-s-sm text-end pa-0 text-disabled"
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(netSalaryCalculation.deductions.late, formatCurrency) }}
            </span>
          </div>
        </template>
        <!-- Employee Deductions -->
        <template v-for="deduction in props.employeeDeductions" :key="deduction.id">
          <div class="d-flex align-center justify-space-between pa-0 ma-0">
            <span class="text-caption text-disabled" style="font-size: 12px">{{
              deduction.employee_benefit?.benefit || 'Deduction'
            }}</span>
            <span
              class="border-b-thin border-s-sm text-end pa-0 text-disabled"
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
              <span class="text-caption text-disabled" style="font-size: 12px">Cash Advance</span>
              <span class="text-caption font-weight-bold text-end ms-1" style="font-size: 12px">{{
                ca.date
              }}</span>
            </div>
            <span
              class="border-b-thin border-s-sm text-end pa-0 text-disabled"
              style="font-size: 12px; min-width: 70px"
            >
              {{ safeCurrencyFormat(ca.amount || 0, formatCurrency) }}
            </span>
          </div>
        </template>
      </div>
    </td>
  </tr>
  <!-- Less Deductions and Net Salary Rows remain unchanged -->
  <tr>
    <td class="pa-1" colspan="2"></td>
    <td class="text-caption pa-1 text-disabled">Less Deductions</td>
    <td class="pa-1"></td>
    <td class="border-b-thin border-s-sm text-end pa-1 text-disabled">
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
