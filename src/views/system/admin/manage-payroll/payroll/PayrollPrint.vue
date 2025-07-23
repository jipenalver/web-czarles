<script setup lang="ts">
import { usePayrollComputation } from './payrollComputation'
import { type PayrollData } from './payrollTableDialog'
import { type Employee } from '@/stores/employees'
import { computed } from 'vue'
import { usePayrollRefs } from '@/views/system/admin/manage-payroll/payroll/PayrollPrint'

const props = defineProps<{
  employeeData: Employee | null
  payrollData: PayrollData
  tableData: any
}>()

// Employee Information 
const fullName = computed(() => {
  if (!props.employeeData) return 'N/A'
  const middleName = props.employeeData.middlename ? ` ${props.employeeData.middlename} ` : ' '
  return `${props.employeeData.firstname}${middleName}${props.employeeData.lastname}`
})

const designation = computed(() => {
  return props.employeeData?.designation?.designation || 'N/A'
})

const address = computed(() => {
  return props.employeeData?.address || 'N/A'
})

// Date Formatting
const formattedDate = computed(() => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthIndex = monthNames.indexOf(props.payrollData.month)
  const date = new Date(props.payrollData.year, monthIndex)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

// Basic salary data 
const dailyRate = computed(() => {
  return props.employeeData?.daily_rate || 0
})

const grossSalary = computed(() => {
  return props.tableData?.gross_pay || 0
})

// composable: gamit ang usePayrollRefs para sa mga ref
const { dailyRateRef, grossSalaryRef, tableDataRef } = usePayrollRefs(
  {
    employee: props.employeeData,
    payrollData: props.payrollData,
    tableData: props.tableData
  },
  dailyRate,
  grossSalary
)

// payroll computation 
const {
  workDays,
  codaAllowance,
  totalGrossSalary,
  totalDeductions,
  netSalary,
  formatCurrency
} = usePayrollComputation(dailyRateRef, grossSalaryRef, tableDataRef)
</script>

<template>
  <v-container fluid class="pa-4">
    <!-- Header Section -->
    <v-row dense no-gutters>
      <v-col cols="12" sm="9" class="d-flex justify-center align-center">
        <v-img src="/image-header-title.png"></v-img>
      </v-col>
      <v-col cols="12" sm="3" class="d-flex justify-center align-center">
        <h1 class="text-h5 font-weight-black text-primary">PAY SLIP</h1>
      </v-col>
    </v-row>

    <!-- Employee Information Table -->
    <v-table class="mt-6 text-body-2" density="compact">
      <tbody>
        <tr>
          <td class="text-caption pa-2" style="width: auto;">PAID TO</td>
          <td class="pa-2 border-b-sm" style="width: 66%;">{{ fullName }}</td>
          <td class="text-caption pa-2" style="width: auto;">POSITION</td>
          <td class="pa-2 border-b-sm" style="width: 25%;">{{ designation }}</td>
        </tr>
        <tr>
          <td class="text-caption pa-2">ADDRESS</td>
          <td class="pa-2 border-b-sm">{{ address }}</td>
          <td class="text-caption pa-2">DATE</td>
          <td class="pa-2 border-b-sm">{{ formattedDate }}</td>
        </tr>
      </tbody>
    </v-table>

    <!-- Payroll Details Table -->
    <v-table class="mt-3 text-body-2 border" density="compact">
      <tbody>
        <tr>
          <td class="text-caption text-center border-b-sm pa-2" colspan="4">PARTICULARS</td>
          <td class="text-caption text-center border-b-sm border-s-sm pa-2">AMOUNT</td>
        </tr>
        <tr>
          <td class="border-b-thin text-center pa-2">{{ workDays }}</td>
          <td class="pa-2">Days Regular Work for {{ payrollData.month }}</td>
          <td class="pa-2">@ {{ formatCurrency(dailyRate) }}</td>
          <td class="pa-2">/Day</td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(grossSalary) }}</td>
        </tr>
        <!-- TODO dapat dynamic row ni -->
        <tr>
          <td class="border-b-thin text-center pa-2">1</td>
          <td class="pa-2">Cola allowance CDO / NAMNAM / BUKIDNON / Cabulohan</td>
          <td class="pa-2">@ {{ formatCurrency(codaAllowance) }}</td>
          <td class="pa-2">/Day</td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(codaAllowance) }}</td>
        </tr>
         <tr>
          <td class="border-b-thin text-center pa-2">1</td>
          <td class="pa-2">Cola Jabonga Allowance / Jabonga / Buenavista / SanLuis</td>
          <td class="pa-2">@ {{ formatCurrency(codaAllowance) }}</td>
          <td class="pa-2">/Day</td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(codaAllowance) }}</td>
        </tr>
          <tr>
          <td class="border-b-thin text-center pa-2">1</td>
          <td class="pa-2">Sunday Work</td>
          <td class="pa-2">@ {{ formatCurrency(codaAllowance) }}</td>
          <td class="pa-2">/Sunday</td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(codaAllowance) }}</td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold pa-2">Gross Salary</td>
          <td class="text-caption font-weight-bold text-end pa-2">Php</td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(totalGrossSalary) }}</td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption pa-2">Less Deductions</td>
          <td class="pa-2"></td>
          <td class="border-b-thin border-s-sm text-end pa-2">{{ formatCurrency(totalDeductions) }}</td>
        </tr>
        <tr>
          <td class="pa-2" colspan="2"></td>
          <td class="text-caption font-weight-bold border-t-sm border-s-sm pa-2">TOTAL NET SALARY</td>
          <td class="border-t-sm pa-2">Php</td>
          <td class="border-t-sm border-s-sm text-end pa-2">{{ formatCurrency(netSalary) }}</td>
        </tr>
      </tbody>
    </v-table>

    <!-- Signatures Section -->
    <v-row dense no-gutters>
      <v-col cols="12" sm="3" class="d-flex justify-center align-center">
        <v-table class="mt-3 text-caption border" density="compact">
          <tbody>
            <tr>
              <td class="pa-2">Prepared by:</td>
              <td class="border-b-thin pa-2"></td>
              <td class="pa-2">Date:</td>
              <td class="border-b-thin pa-2"></td>
            </tr>
            <tr>
              <td class="pa-2">Approved by:</td>
              <td class="border-b-thin pa-2"></td>
              <td class="pa-2">Date:</td>
              <td class="border-b-thin pa-2"></td>
            </tr>
          </tbody>
        </v-table>
      </v-col>
      <v-col cols="12" sm="9" class="d-flex justify-center align-center"> </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Minimal print styles only */
@media print {
  .v-container {
    max-width: 100% !important;
    padding: 0 !important;
  }
}
</style>
