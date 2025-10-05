<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, roundDecimal } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { type MonthlyPayrollRow } from '../composables/monthlyPayroll'

const props = defineProps<{
  items: MonthlyPayrollRow[]
  loading: boolean
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
      late: acc.late + (item.deductions.late || 0),
      undertime: acc.undertime + (item.deductions.undertime || 0),
      cash_advance: acc.cash_advance + (item.deductions.cash_advance || 0),
      other_deductions: acc.other_deductions + (item.deductions.employee_deductions || 0),
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
      late: 0,
      undertime: 0,
      cash_advance: 0,
      other_deductions: 0,
      total_deductions: 0,
      net_pay: 0,
    },
  )
})
</script>

<template>
  <v-card>
    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <v-table density="compact" class="text-caption" fixed-header height="600px">
        <thead>
          <!-- Main Header Row - Level 1 -->
          <tr>
            <th rowspan="3" class="text-center font-weight-bold border">Employee Name</th>
            <th colspan="8" class="text-center font-weight-bold text-uppercase text-info border">
              PAYABLE
            </th>
            <th colspan="5" class="text-center font-weight-bold text-uppercase text-error border">
              DEDUCTION
            </th>
            <th rowspan="3" class="text-center font-weight-bold text-success border">Net Pay</th>
          </tr>

          <!-- Sub Header Row - Level 2 (Group headers) -->
          <tr>
            <!-- Payable Group Sub-columns -->
            <th rowspan="2" class="text-center text-caption border">No. of Days Work</th>
            <th colspan="2" class="text-center font-weight-medium border">Sunday Rate</th>
            <th rowspan="2" class="text-center text-caption border">Allowance (COLA)</th>
            <th colspan="2" class="text-center font-weight-medium border">Overtime</th>
            <th rowspan="2" class="text-center text-caption border">Holiday Pay</th>
            <th rowspan="2" class="text-center text-caption border">Monthly Tripping</th>

            <!-- Deduction Sub-columns -->
            <th rowspan="2" class="text-center text-caption border">Late</th>
            <th rowspan="2" class="text-center text-caption border">Undertime</th>
            <th rowspan="2" class="text-center text-caption border">Cash Advance</th>
            <th rowspan="2" class="text-center text-caption border">Other Deductions</th>
            <th rowspan="2" class="text-center text-caption border">Total Deductions</th>
          </tr>

          <!-- Sub Header Row - Level 3 (Detail columns) -->
          <tr>
            <!-- Sunday Rate Details -->
            <th class="text-center text-caption border">Days</th>
            <th class="text-center text-caption border">Amount</th>

            <!-- Overtime Details -->
            <th class="text-center text-caption border">HRS</th>
            <th class="text-center text-caption border">Amount</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in items" :key="item.employee_id">
            <td class="font-weight-medium border">{{ item.employee_name }}</td>

            <!-- Payable Columns -->
            <td class="text-center border">{{ item.days_worked }}</td>
            <td class="text-center border">{{ item.sunday_days || 0 }}</td>
            <td class="text-end border">{{ formatCurrency(item.sunday_amount || 0) }}</td>
            <td class="text-end border">{{ formatCurrency(item.cola || 0) }}</td>
            <td class="text-center border">{{ roundDecimal(item.overtime_hrs || 0, 2) }}</td>
            <td class="text-end border">{{ formatCurrency(item.overtime_pay) }}</td>
            <td class="text-end border">{{ formatCurrency(item.holidays_pay) }}</td>
            <td class="text-end border">{{ formatCurrency(item.trips_pay) }}</td>

            <!-- Deduction Columns -->
            <td class="text-end text-error border">{{ formatCurrency(item.deductions.late) }}</td>
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.undertime) }}
            </td>
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.cash_advance) }}
            </td>
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.employee_deductions) }}
            </td>
            <td class="text-end text-error font-weight-bold border">
              {{ formatCurrency(item.total_deductions) }}
            </td>

            <!-- Net Pay -->
            <td class="text-end font-weight-bold text-success border">
              {{ formatCurrency(item.net_pay) }}
            </td>
          </tr>

          <!-- Totals Row -->
          <tr v-if="items.length > 0">
            <td class="font-weight-bold border">TOTAL</td>

            <!-- Payable Totals -->
            <td class="text-center font-weight-bold border">{{ totals.days_worked }}</td>
            <td class="text-center font-weight-bold border">{{ totals.sunday_days }}</td>
            <td class="text-end font-weight-bold border">
              {{ formatCurrency(totals.sunday_amount) }}
            </td>
            <td class="text-end font-weight-bold border">{{ formatCurrency(totals.cola) }}</td>
            <td class="text-center font-weight-bold border">
              {{ roundDecimal(totals.overtime_hrs, 2) }}
            </td>
            <td class="text-end font-weight-bold border">
              {{ formatCurrency(totals.overtime_amount) }}
            </td>
            <td class="text-end font-weight-bold border">
              {{ formatCurrency(totals.holidays_pay) }}
            </td>
            <td class="text-end font-weight-bold border">{{ formatCurrency(totals.trips_pay) }}</td>

            <!-- Deduction Totals -->
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.late) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.undertime) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.cash_advance) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.other_deductions) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.total_deductions) }}
            </td>

            <!-- Net Pay Total -->
            <td class="text-end font-weight-bold text-success border">
              {{ formatCurrency(totals.net_pay) }}
            </td>
          </tr>
        </tbody>
      </v-table>

      <!-- Empty State -->
      <v-alert v-if="!loading && items.length === 0" type="info" variant="tonal" class="mt-4">
        No payroll data available for the selected period.
      </v-alert>
    </v-card-text>
  </v-card>
</template>
