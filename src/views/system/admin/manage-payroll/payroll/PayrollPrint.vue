<script setup lang="ts">
import { type PayrollData } from './payrollTableDialog'
import { type Employee } from '@/stores/employees'
import { computed } from 'vue'

const props = defineProps<{
  employee: Employee | null
  payrollData: PayrollData
  tableData: any
}>()

const fullName = computed(() => {
  if (!props.employee) return 'N/A'
  const middleName = props.employee.middlename ? ` ${props.employee.middlename} ` : ' '
  return `${props.employee.firstname}${middleName}${props.employee.lastname}`
})

const designation = computed(() => {
  return props.employee?.designation?.designation || 'N/A'
})

const address = computed(() => {
  return props.employee?.address || 'N/A'
})

const formattedDate = computed(() => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const monthIndex = monthNames.indexOf(props.payrollData.month)
  const date = new Date(props.payrollData.year, monthIndex)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
})

const dailyRate = computed(() => {
  return props.employee?.daily_rate || 0
})

const grossSalary = computed(() => {
  return props.tableData?.gross_pay || 0
})

const totalDeductions = computed(() => {
  return props.tableData?.deductions || 0
})

const netSalary = computed(() => {
  return props.tableData?.net_pay || 0
})

const workDays = computed(() => {
  // Calculate work days based on gross pay and daily rate
  if (dailyRate.value === 0) return 0
  return Math.round(grossSalary.value / dailyRate.value)
})
</script>

<template>
  <v-row dense no-gutters>
    <v-col cols="12" sm="9" class="d-flex justify-center align-center">
      <v-img src="/image-header-title.png"></v-img>
    </v-col>
    <v-col cols="12" sm="3" class="d-flex justify-center align-center">
      <h1 class="text-h5 font-weight-black text-primary">PAY SLIP</h1>
    </v-col>
  </v-row>

  <table class="mt-6 text-body-2 w-100">
    <tbody>
      <tr>
        <td class="text-caption">PAID TO</td>
        <td class="border-b-md w-66 ps-5">{{ fullName }}</td>
        <td class="text-caption">POSITION</td>
        <td class="border-b-md w-25 ps-5">{{ designation }}</td>
      </tr>
      <tr>
        <td class="text-caption">ADDRESS</td>
        <td class="border-b-md w-66 ps-5">{{ address }}</td>
        <td class="text-caption">DATE</td>
        <td class="border-b-md w-25 ps-5">{{ formattedDate }}</td>
      </tr>
    </tbody>
  </table>

  <table class="mt-3 text-body-2 border-md border-collapse w-100">
    <tbody>
      <tr>
        <td class="text-caption text-center border-b-md" colspan="4">PARTICULARS</td>
        <td class="text-caption text-center border-b-md border-s-md">AMOUNT</td>
      </tr>
      <tr>
        <td class="border-b-sm text-center">{{ workDays }}</td>
        <td>Days Regular Work for {{ payrollData.month }}</td>
        <td>@ {{ dailyRate.toFixed(2) }}</td>
        <td>/Day</td>
        <td class="border-b-sm border-s-md text-end">{{ grossSalary.toFixed(2) }}</td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="text-caption font-weight-bold">Gross Salary</td>
        <td class="text-caption font-weight-bold text-end">Php</td>
        <td class="border-b-sm border-s-md text-end">{{ grossSalary.toFixed(2) }}</td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="text-caption">Less Deductions</td>
        <td></td>
        <td class="border-b-sm border-s-md text-end">{{ totalDeductions.toFixed(2) }}</td>
      </tr>
      <tr>
        <td colspan="2"></td>
        <td class="text-caption font-weight-bold border-t-md border-s-md">TOTAL NET SALARY</td>
        <td class="border-t-md">Php</td>
        <td class="border-t-md border-s-md text-end">{{ netSalary.toFixed(2) }}</td>
      </tr>
    </tbody>
  </table>

  <v-row dense no-gutters>
    <v-col cols="12" sm="3" class="d-flex justify-center align-center">
      <table class="mt-3 text-caption border-md w-100">
        <tbody>
          <tr>
            <td>Prepared by:</td>
            <td class="border-b-sm"></td>
            <td>Date:</td>
            <td class="border-b-sm"></td>
          </tr>
          <tr>
            <td>Approved by:</td>
            <td class="border-b-sm"></td>
            <td>Date:</td>
            <td class="border-b-sm"></td>
          </tr>
        </tbody>
      </table>
    </v-col>
    <v-col cols="12" sm="9" class="d-flex justify-center align-center"> </v-col>
  </v-row>
</template>

<style scoped>
.border-collapse {
  border-collapse: collapse;
}
</style>
