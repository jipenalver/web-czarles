<script setup lang="ts">
import { type MonthlyPayrollRow } from '../composables/monthlyPayroll'
import { formatCurrency, roundDecimal } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { computed } from 'vue'

const props = defineProps<{
  items: MonthlyPayrollRow[]
  selectedMonth: string
  selectedYear: number
}>()

// Compute totals
const totals = computed(() => {
  return props.items.reduce(
    (acc, item) => ({
      days_worked: acc.days_worked + (item.days_worked || 0),
      sunday_days: acc.sunday_days + (item.sunday_days || 0),
      sunday_amount: acc.sunday_amount + (item.sunday_amount || 0),
      cola: acc.cola + (item.cola || 0),
      overtime_hrs: acc.overtime_hrs + (item.overtime_hrs || 0),
      overtime_amount: acc.overtime_amount + (item.overtime_pay || 0),
      holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
      trips_pay: acc.trips_pay + (item.trips_pay || 0),
      gross_pay: acc.gross_pay + (item.gross_pay || 0),
      cash_advance: acc.cash_advance + (item.deductions.cash_advance || 0),
      sss: acc.sss + (item.deductions.sss || 0),
      phic: acc.phic + (item.deductions.phic || 0),
      pagibig: acc.pagibig + (item.deductions.pagibig || 0),
      sss_loan: acc.sss_loan + (item.deductions.sss_loan || 0),
      savings: acc.savings + (item.deductions.savings || 0),
      salary_deposit: acc.salary_deposit + (item.deductions.salary_deposit || 0),
      late: acc.late + (item.deductions.late || 0),
      undertime: acc.undertime + (item.deductions.undertime || 0),
      total_deductions: acc.total_deductions + (item.total_deductions || 0),
      net_pay: acc.net_pay + (item.net_pay || 0),
    }),
    {
      days_worked: 0,
      sunday_days: 0,
      sunday_amount: 0,
      cola: 0,
      overtime_hrs: 0,
      overtime_amount: 0,
      holidays_pay: 0,
      trips_pay: 0,
      gross_pay: 0,
      cash_advance: 0,
      sss: 0,
      phic: 0,
      pagibig: 0,
      sss_loan: 0,
      savings: 0,
      salary_deposit: 0,
      late: 0,
      undertime: 0,
      total_deductions: 0,
      net_pay: 0,
    },
  )
})
</script>

<template>
  <!-- PDF Export Container - hidden table for PDF generation -->
  <div style="display: none" id="monthly-payroll-table">
    <h2 class="report-title">
      MONTHLY PAYROLL REPORT - {{ selectedMonth.toUpperCase() }} {{ selectedYear }}
    </h2>
    <table class="pdf-table pa-2">
      <thead class="pdf-thead">
        <!-- Main Header Row - Level 1 -->
        <tr>
          <th rowspan="3" class="pdf-th pdf-th--wide">Employee Name</th>
          <th colspan="9" class="pdf-th-group">PAYABLE</th>
          <th colspan="9" class="pdf-th-group">DEDUCTION</th>
          <th rowspan="3" class="pdf-th pdf-th--narrow">Total Deductions</th>
          <th rowspan="3" class="pdf-th pdf-th--narrow">Net Pay</th>
          <th rowspan="3" class="pdf-th pdf-th--signature">Signature</th>
        </tr>

        <!-- Sub Header Row - Level 2 -->
        <tr>
          <!-- Payable Group -->
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">Days</th>
          <th colspan="2" class="pdf-th-subgroup">Sunday</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">COLA</th>
          <th colspan="2" class="pdf-th-subgroup">OT</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">Holiday</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">Trips</th>
          <th rowspan="2" class="pdf-th pdf-th--narrow">Gross Pay</th>

          <!-- Deduction Group -->
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">C/A</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">SSS</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">PHIC</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">Pag-IBIG</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">SSS Loan</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">Savings</th>
          <th rowspan="2" class="pdf-th pdf-th--extra-narrow">Deposit</th>
          <th colspan="2" class="pdf-th-subgroup">Others</th>
        </tr>

        <!-- Sub Header Row - Level 3 -->
        <tr>
          <!-- Sunday Details -->
          <th class="pdf-th pdf-th--extra-narrow">Days</th>
          <th class="pdf-th pdf-th--extra-narrow">Amt</th>

          <!-- OT Details -->
          <th class="pdf-th pdf-th--extra-narrow">HRS</th>
          <th class="pdf-th pdf-th--extra-narrow">Amt</th>

          <!-- Others Details -->
          <th class="pdf-th pdf-th--extra-narrow">Late</th>
          <th class="pdf-th pdf-th--extra-narrow">UT</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="item in items" :key="item.employee_id" class="pdf-tr">
          <td class="pdf-td pdf-td--bold pdf-td--wide">{{ item.employee_name }}</td>

          <!-- Payable Columns -->
          <td class="pdf-td pdf-td--extra-narrow">{{ item.days_worked }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ item.sunday_days || 0 }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.sunday_amount || 0) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.cola || 0) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ roundDecimal(item.overtime_hrs || 0, 2) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.overtime_pay) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.holidays_pay) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.trips_pay) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--narrow">{{ formatCurrency(item.gross_pay) }}</td>

          <!-- Deduction Columns -->
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.cash_advance) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.sss) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.phic) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.pagibig) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.sss_loan) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.savings) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.salary_deposit) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.late) }}</td>
          <td class="pdf-td pdf-td--extra-narrow">{{ formatCurrency(item.deductions.undertime) }}</td>

          <!-- Total Deductions -->
          <td class="pdf-td pdf-td--bold pdf-td--narrow">{{ formatCurrency(item.total_deductions) }}</td>

          <!-- Net Pay -->
          <td class="pdf-td pdf-td--bold pdf-td--narrow">{{ formatCurrency(item.net_pay) }}</td>

          <!-- Signature -->
          <td class="pdf-td pdf-td--signature"></td>
        </tr>

        <!-- Totals Row -->
        <tr v-if="items.length > 0" class="pdf-tr-total">
          <td class="pdf-td pdf-td--bold pdf-td--wide">TOTAL</td>

          <!-- Payable Totals -->
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ totals.days_worked }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ totals.sunday_days }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.sunday_amount) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.cola) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ roundDecimal(totals.overtime_hrs, 2) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.overtime_amount) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.holidays_pay) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.trips_pay) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--narrow">{{ formatCurrency(totals.gross_pay) }}</td>

          <!-- Deduction Totals -->
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.cash_advance) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.sss) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.phic) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.pagibig) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.sss_loan) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.savings) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.salary_deposit) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.late) }}</td>
          <td class="pdf-td pdf-td--bold pdf-td--extra-narrow">{{ formatCurrency(totals.undertime) }}</td>

          <!-- Total Deductions Total -->
          <td class="pdf-td pdf-td--bold pdf-td--narrow">{{ formatCurrency(totals.total_deductions) }}</td>

          <!-- Net Pay Total -->
          <td class="pdf-td pdf-td--bold pdf-td--narrow">{{ formatCurrency(totals.net_pay) }}</td>

          <!-- Signature (empty for totals row) -->
          <td class="pdf-td pdf-td--signature"></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.report-title {
  text-align: center;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: bold;
  page-break-after: avoid;
}

.pdf-table {
  border-collapse: collapse;
  font-size: 6px;
  width: 100%;
  page-break-inside: auto;
  table-layout: fixed;
}

.pdf-thead {
  page-break-inside: avoid;
  page-break-after: auto;
}

.pdf-th {
  border: 1px solid #ddd;
  padding: 2px;
  text-align: center;
  background-color: #f5f5f5;
  font-size: 6px;
  font-weight: bold;
  width: 4%;
}

.pdf-th-group {
  border: 1px solid #ddd;
  padding: 2px;
  text-align: center;
  background-color: #e3f2fd;
  font-size: 7px;
  font-weight: bold;
}

.pdf-th-subgroup {
  border: 1px solid #ddd;
  padding: 2px;
  text-align: center;
  background-color: #f0f0f0;
  font-size: 6px;
  font-weight: bold;
}

.pdf-th--extra-narrow {
  width: 3%;
}

.pdf-th--narrow {
  width: 5%;
}

.pdf-th--wide {
  width: 8%;
}

.pdf-th--signature {
  width: 10%;
}

.pdf-tr {
  page-break-inside: avoid;
}

.pdf-tr-total {
  page-break-inside: avoid;
  background-color: #f5f5f5;
}

.pdf-td {
  border: 1px solid #ddd;
  padding: 1px;
  font-size: 6px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  width: 4%;
  text-align: center;
}

.pdf-td--bold {
  font-weight: bold;
}

.pdf-td--extra-narrow {
  width: 3%;
  font-size: 5px;
}

.pdf-td--narrow {
  width: 5%;
}

.pdf-td--wide {
  width: 8%;
  text-align: left;
}

.pdf-td--signature {
  width: 10%;
  text-align: center;
  height: 20px;
}
</style>
