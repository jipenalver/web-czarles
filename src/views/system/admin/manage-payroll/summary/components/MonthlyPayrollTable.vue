<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, roundDecimal } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { type MonthlyPayrollRow } from '../composables/monthlyPayroll'
import MonthlyPayrollPagination from './MonthlyPayrollPagination.vue'

const props = defineProps<{
  items: MonthlyPayrollRow[]
  loading: boolean
  currentPage: number
  itemsPerPage: number
  searchQuery: string
}>()

const emit = defineEmits<{
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
}>()

// Filtered items based on search query
const filteredItems = computed(() => {
  if (!props.searchQuery || props.searchQuery.trim() === '') {
    return props.items
  }

  const query = props.searchQuery.toLowerCase().trim()
  return props.items.filter((item) => item.employee_name.toLowerCase().includes(query))
})

// Paginated items
const paginatedItems = computed(() => {
  if (props.itemsPerPage === -1) {
    return filteredItems.value
  }

  const start = (props.currentPage - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredItems.value.slice(start, end)
})

// Compute totals based on filtered items
const totals = computed(() => {
  return filteredItems.value.reduce(
    (acc, item) => ({
      days_worked: acc.days_worked + (item.days_worked || 0),
      sunday_days: acc.sunday_days + (item.sunday_days || 0),
      sunday_amount: acc.sunday_amount + (item.sunday_amount || 0),
      cola: acc.cola + (item.cola || 0),
      overtime_hrs: acc.overtime_hrs + (item.overtime_hrs || 0),
      overtime_amount: acc.overtime_amount + (item.overtime_pay || 0),
      holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
      trips_pay: acc.trips_pay + (item.trips_pay || 0),
      utilizations_pay: acc.utilizations_pay + (item.utilizations_pay || 0),
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
      utilizations_pay: 0,
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
  <div>
    <v-card-text>
      <v-progress-linear v-if="loading" indeterminate color="primary" class="mb-4" />

      <v-table density="compact" class="text-caption" fixed-header height="600px">
        <thead>
          <!-- Main Header Row - Level 1 -->
          <tr>
            <th rowspan="3" class="text-center font-weight-bold border">Employee Name</th>
            <th colspan="11" class="text-center font-weight-bold text-uppercase text-info border">
              PAYABLE
            </th>
            <th colspan="8" class="text-center font-weight-bold text-uppercase text-error border">
              DEDUCTION
            </th>
            <th rowspan="3" class="text-center font-weight-bold text-error border">
              Total Deductions
            </th>
            <th rowspan="3" class="text-center font-weight-bold text-success border">Net Pay</th>
          </tr>

          <!-- Sub Header Row - Level 2 (Group headers) -->
          <tr>
            <!-- Payable Group Sub-columns -->
            <th rowspan="2" class="text-center text-caption border">No. of Days Work</th>
            <th colspan="2" class="text-center font-weight-medium border">Sunday Rate</th>
            <th rowspan="2" class="text-center text-caption border">Allowance</th>
            <th colspan="2" class="text-center font-weight-medium border">Overtime</th>
            <th rowspan="2" class="text-center text-caption border">Holiday Pay</th>
            <th rowspan="2" class="text-center text-caption border">Monthly Tripping</th>
            <th rowspan="2" class="text-center text-caption border">Utilization</th>
            <th colspan="1" class="text-center font-weight-medium border">Others</th>
            <th rowspan="2" class="text-center text-caption border font-weight-bold">Gross Pay</th>

            <!-- Deduction Sub-columns -->
            <th rowspan="2" class="text-center text-caption border">Total C/A</th>
            <th rowspan="2" class="text-center text-caption border">SSS</th>
            <th rowspan="2" class="text-center text-caption border">PHIC</th>
            <th rowspan="2" class="text-center text-caption border">Pag-IBIG</th>
            <th rowspan="2" class="text-center text-caption border">SSS Loan</th>
            <th colspan="3" class="text-center font-weight-medium border">Others</th>
          </tr>

          <!-- Sub Header Row - Level 3 (Detail columns) -->
          <tr>
            <!-- Sunday Rate Details -->
            <th class="text-center text-caption border">Days</th>
            <th class="text-center text-caption border">Amount</th>

            <!-- Overtime Details -->
            <th class="text-center text-caption border">HRS</th>
            <th class="text-center text-caption border">Amount</th>

            <!-- Other Details -->
            <th class="text-center text-caption border">Add-on</th>

            <!-- Others Details -->
            <th class="text-center text-caption border">Late</th>
            <th class="text-center text-caption border">Undertime</th>
            <th class="text-center text-caption border">Deduction</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in paginatedItems" :key="item.employee_id">
            <td class="font-weight-medium border">{{ item.employee_name }}</td>

            <!-- Payable Columns -->
            <td class="text-center border">{{ roundDecimal(item.days_worked || 0, 1) }}</td>
            <td class="text-center border">{{ item.sunday_days || 0 }}</td>
            <td class="text-center border">{{ formatCurrency(item.sunday_amount || 0) }}</td>
            <td class="text-center border">{{ formatCurrency(item.cola || 0) }}</td>
            <td class="text-center border">{{ roundDecimal(item.overtime_hrs || 0, 2) }}</td>
            <td class="text-center border">{{ formatCurrency(item.overtime_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.holidays_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.trips_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.utilizations_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(0) }}</td>
            <td class="text-end font-weight-bold border">{{ formatCurrency(item.gross_pay) }}</td>

            <!-- Deduction Columns -->
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.cash_advance) }}
            </td>
            <td class="text-end text-error border">{{ formatCurrency(item.deductions.sss) }}</td>
            <td class="text-end text-error border">{{ formatCurrency(item.deductions.phic) }}</td>
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.pagibig) }}
            </td>
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.sss_loan) }}
            </td>
            <!-- Others Group -->
            <td class="text-end text-error border">{{ formatCurrency(item.deductions.late) }}</td>
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.undertime) }}
            </td>
            <td class="text-end text-error border">
              {{ formatCurrency((item.deductions.savings || 0) + (item.deductions.salary_deposit || 0)) }}
            </td>

            <!-- Total Deductions -->
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
            <td class="text-center font-weight-bold border">{{ roundDecimal(totals.days_worked, 1) }}</td>
            <td class="text-center font-weight-bold border">{{ totals.sunday_days }}</td>
            <td class="text-center font-weight-bold border">
              {{ formatCurrency(totals.sunday_amount) }}
            </td>
            <td class="text-center font-weight-bold border">{{ formatCurrency(totals.cola) }}</td>
            <td class="text-center font-weight-bold border">
              {{ roundDecimal(totals.overtime_hrs, 2) }}
            </td>
            <td class="text-center font-weight-bold border">
              {{ formatCurrency(totals.overtime_amount) }}
            </td>
            <td class="text-center font-weight-bold border">
              {{ formatCurrency(totals.holidays_pay) }}
            </td>
            <td class="text-center font-weight-bold border">{{ formatCurrency(totals.trips_pay) }}</td>
            <td class="text-center font-weight-bold border">{{ formatCurrency(totals.utilizations_pay) }}</td>
            <td class="text-center font-weight-bold border">{{ formatCurrency(0) }}</td>
            <td class="text-end font-weight-bold border">{{ formatCurrency(totals.gross_pay) }}</td>

            <!-- Deduction Totals -->
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.cash_advance) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.sss) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.phic) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.pagibig) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.sss_loan) }}
            </td>
            <!-- Others Group Totals -->
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.late) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.undertime) }}
            </td>
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.savings + totals.salary_deposit) }}
            </td>

            <!-- Total Deductions Total -->
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

      <!-- No Results from Search -->
      <v-alert
        v-if="!loading && items.length > 0 && filteredItems.length === 0"
        type="warning"
        variant="tonal"
        class="mt-4"
      >
        <v-icon icon="mdi-magnify-close" class="me-2"></v-icon>
        No employees found matching "{{ searchQuery }}". Try a different search term.
      </v-alert>
    </v-card-text>

    <!-- Pagination -->
    <v-divider v-if="filteredItems.length > 0"></v-divider>
    <MonthlyPayrollPagination
      v-if="filteredItems.length > 0"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="filteredItems.length"
      @update:current-page="emit('update:currentPage', $event)"
      @update:items-per-page="emit('update:itemsPerPage', $event)"
    />
  </div>
</template>
