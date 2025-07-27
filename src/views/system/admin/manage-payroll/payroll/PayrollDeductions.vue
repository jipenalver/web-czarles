<script setup lang="ts">
import { safeCurrencyFormat } from './helpers'
import { computed, onMounted, ref } from 'vue'
import { useEmployeesStore } from '@/stores/employees'

interface Deductions {
  late: number
  sss: number
  phic: number
  hdmf: number
  cashAdvance: number
  others: number
}

const props = defineProps<{
  showLateDeduction: boolean
  monthLateDeduction: number | undefined
  netSalaryCalculation: {
    deductions: Deductions
    totalDeductions: number
    netSalary: number
  }
  formatCurrency: (value: number) => string
  employeeId: number | undefined
  employeeDeductions: any[]
}>()


// ...existing code...
</script>
<template>
  <!-- Deduction Rows -->
  <tr v-if="showLateDeduction">
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">Late Deduction</td>
    <td class="text-caption font-weight-bold text-end pa-2 text-disabled">
      <span v-if="monthLateDeduction !== undefined && monthLateDeduction > 0">
        ({{ monthLateDeduction }} min.)
      </span>
    </td>
    <td class="border-b-thin border-s-sm text-end pa-2 text-disabled">
      {{ safeCurrencyFormat(netSalaryCalculation.deductions.late, formatCurrency) }}
    </td>
  </tr>

  <!-- Dynamic Employee Deductions List -->
  <tr v-for="deduction in props.employeeDeductions" :key="deduction.id">
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">
      {{ deduction.employee_benefit?.benefit || 'Deduction' }}
    </td>
    <td class="text-caption font-weight-bold text-end pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2 text-disabled">
      {{ safeCurrencyFormat(deduction.amount || 0, formatCurrency) }}
    </td>
  </tr>

  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">Cash Advance</td>
    <td class="text-caption font-weight-bold text-end pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2 text-disabled">
      {{ safeCurrencyFormat(netSalaryCalculation.deductions.cashAdvance, formatCurrency) }}
    </td>
  </tr>
  
  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption pa-2 text-disabled">Less Deductions</td>
    <td class="pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2 text-disabled">
      {{ safeCurrencyFormat(netSalaryCalculation.totalDeductions, formatCurrency) }}
    </td>
  </tr>
  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption font-weight-bold border-t-sm border-s-sm pa-2">
      TOTAL NET SALARY
    </td>
    <td class="border-t-sm pa-2">Php</td>
    <td class="border-t-sm border-s-sm text-end pa-2">
      {{ safeCurrencyFormat(netSalaryCalculation.netSalary, formatCurrency) }}
    </td>
  </tr>
</template>
