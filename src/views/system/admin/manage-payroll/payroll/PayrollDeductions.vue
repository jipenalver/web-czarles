<script setup lang="ts">
import { safeCurrencyFormat } from './helpers'
import { computed, onMounted } from 'vue'
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
}>()


// Pinia store for employees
const employeesStore = useEmployeesStore()
onMounted(async () => {
  // fetch ang employee by ID gamit supabase query
  if (props.employeeId !== undefined) {
    const employee = await employeesStore.getEmployeeById(props.employeeId)
    // log ang employee details para makita ang sulod
    console.log('getEmployeeById result:', employee)
  } else {
    // walay employeeId, skip fetch
    console.log('No employeeId provided')
  }
})

// log the employeeId for debugging
console.log('PayrollDeductions employeeId:', props.employeeId)
</script>
<template>
  <!-- Deduction Rows -->
  <tr v-if="showLateDeduction">
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">Late Deduction</td>
    <td class="text-caption font-weight-bold text-end pa-2">
      <span v-if="monthLateDeduction !== undefined && monthLateDeduction > 0">
        ({{ monthLateDeduction }} min.)
      </span>
    </td>
    <td class="border-b-thin border-s-sm text-end pa-2">
      {{ safeCurrencyFormat(netSalaryCalculation.deductions.late, formatCurrency) }}
    </td>
  </tr>
  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">SSS</td>
    <td class="text-caption font-weight-bold text-end pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2">
      {{ safeCurrencyFormat(netSalaryCalculation.deductions.sss, formatCurrency) }}
    </td>
  </tr>

  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">Cash Advance</td>
    <td class="text-caption font-weight-bold text-end pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2">
      {{ safeCurrencyFormat(netSalaryCalculation.deductions.cashAdvance, formatCurrency) }}
    </td>
  </tr>
  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption text-disabled pa-2">Others</td>
    <td class="text-caption font-weight-bold text-end pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2">
      {{ safeCurrencyFormat(netSalaryCalculation.deductions.others, formatCurrency) }}
    </td>
  </tr>
  <tr>
    <td class="pa-2" colspan="2"></td>
    <td class="text-caption pa-2">Less Deductions</td>
    <td class="pa-2"></td>
    <td class="border-b-thin border-s-sm text-end pa-2">
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
