<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, roundDecimal } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { type MonthlyPayrollRow } from '../composables/types'
import MonthlyPayrollPagination from './MonthlyPayrollPagination.vue'
import DaysWorkedTooltip from './DaysWorkedTooltip.vue'

const props = defineProps<{
  items: MonthlyPayrollRow[]
  loading: boolean
  currentPage: number
  itemsPerPage: number
  searchQuery: string
  selectedDesignation: number | null
  selectedMonth?: string
  selectedYear?: number
  crossMonthEnabled?: boolean
  dayFrom?: number | null
  dayTo?: number | null
}>()

const emit = defineEmits<{
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
}>()

// Items with client-side calculations
// Note: Items are now pre-filtered in parent component (SummaryTable.vue)
const itemsWithCalculations = computed(() => {
  return props.items.map(item => {
    // Use days_worked_calculated for admin employees, fallback to days_worked for regular employees
    const effectiveDaysWorked = (item.days_worked_calculated ?? item.days_worked) || 0

    // Recalculate basic_pay based on effective days worked
    // For admin employees, this will use the new admin-specific calculation
    const basicPay = effectiveDaysWorked * (item.daily_rate || 0)

    // Calculate gross pay safely
    // Include sunday_amount as it's a separate premium (30% of daily rate per Sunday worked)
    const grossPay = basicPay +
                    (item.allowance || 0) +
                    (item.overtime_pay || 0) +
                    (item.trips_pay || 0) +
                    (item.holidays_pay || 0) +
                    (item.sunday_amount || 0) +
                    (item.utilizations_pay || 0) +
                    (item.benefits_pay || 0) +
                    (item.cash_adjustment_addon || 0)

    // Calculate total deductions safely
    const totalDeductions = (item.deductions.cash_advance || 0) +
                           (item.deductions.sss || 0) +
                           (item.deductions.phic || 0) +
                           (item.deductions.pagibig || 0) +
                           (item.deductions.sss_loan || 0) +
                           (item.deductions.savings || 0) +
                           (item.deductions.salary_deposit || 0) +
                           (item.deductions.late || 0) +
                           (item.deductions.undertime || 0) +
                           (item.deductions.cash_adjustment || 0)

    // Calculate net pay safely
    const netPay = grossPay - totalDeductions

    return {
      ...item,
      effective_days_worked: effectiveDaysWorked,
      basic_pay: basicPay,
      gross_pay: grossPay,
      total_deductions: totalDeductions,
      net_pay: netPay
    }
  })
})

// Paginated items
const paginatedItems = computed(() => {
  if (props.itemsPerPage === -1) {
    return itemsWithCalculations.value
  }

  const start = (props.currentPage - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return itemsWithCalculations.value.slice(start, end)
})

// Compute totals based on items with calculations
const totals = computed(() => {
  return itemsWithCalculations.value.reduce(
    (acc, item) => {
      // Use the effective_days_worked from the calculated items for consistency
      const effectiveDaysWorked = item.effective_days_worked || 0

      return {
        days_worked: acc.days_worked + effectiveDaysWorked,
        sunday_days: acc.sunday_days + (item.sunday_days || 0),
        sunday_amount: acc.sunday_amount + (item.sunday_amount || 0),
        allowance: acc.allowance + (item.allowance || 0),
        overtime_hrs: acc.overtime_hrs + (item.overtime_hrs || 0),
        overtime_amount: acc.overtime_amount + (item.overtime_pay || 0),
        holidays_pay: acc.holidays_pay + (item.holidays_pay || 0),
        trips_pay: acc.trips_pay + (item.trips_pay || 0),
        utilizations_pay: acc.utilizations_pay + (item.utilizations_pay || 0),
        benefits_pay: acc.benefits_pay + (item.benefits_pay || 0),
        cash_adjustment_addon: acc.cash_adjustment_addon + (item.cash_adjustment_addon || 0),
        basic_pay: acc.basic_pay + (item.basic_pay || 0),
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
        cash_adjustment_deduction: acc.cash_adjustment_deduction + (item.deductions.cash_adjustment || 0),
        total_deductions: acc.total_deductions + (item.total_deductions || 0),
        net_pay: acc.net_pay + (item.net_pay || 0),
      }
    },
    {
      days_worked: 0,
      sunday_days: 0,
      sunday_amount: 0,
      allowance: 0,
      overtime_hrs: 0,
      overtime_amount: 0,
      holidays_pay: 0,
      trips_pay: 0,
      utilizations_pay: 0,
      benefits_pay: 0,
      cash_adjustment_addon: 0,
      basic_pay: 0,
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
      cash_adjustment_deduction: 0,
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
            <th colspan="12" class="text-center font-weight-bold text-uppercase text-info border">
              PAYABLE
            </th>
            <th colspan="9" class="text-center font-weight-bold text-uppercase text-error border">
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
            <th rowspan="2" class="text-center text-caption border">No. of Days Work / Hours</th>
            <th colspan="2" class="text-center font-weight-medium border">Sunday Rate</th>
            <th rowspan="2" class="text-center text-caption border">Allowance</th>
            <th colspan="2" class="text-center font-weight-medium border">Overtime</th>
            <th rowspan="2" class="text-center text-caption border">Holiday Pay</th>
            <th rowspan="2" class="text-center text-caption border">Monthly Tripping</th>
            <th rowspan="2" class="text-center text-caption border">Utilization</th>
            <th colspan="2" class="text-center font-weight-medium border">Others</th>
            <th rowspan="2" class="text-center text-caption border font-weight-bold">Gross Pay</th>

            <!-- Deduction Sub-columns -->
            <th rowspan="2" class="text-center text-caption border">Total C/A</th>
            <th rowspan="2" class="text-center text-caption border">SSS</th>
            <th rowspan="2" class="text-center text-caption border">PHIC</th>
            <th rowspan="2" class="text-center text-caption border">Pag-IBIG</th>
            <th rowspan="2" class="text-center text-caption border">SSS Loan</th>
            <th colspan="4" class="text-center font-weight-medium border">Others</th>
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
            <th class="text-center text-caption border">Benefits</th>
            <th class="text-center text-caption border">Adjustments</th>

            <!-- Others Details -->
            <th class="text-center text-caption border">Late</th>
            <th class="text-center text-caption border">Undertime</th>
            <th class="text-center text-caption border">Savings</th>
            <th class="text-center text-caption border">Adjustments</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="item in paginatedItems" :key="item.employee_id">
            <td class="font-weight-medium border">{{ item.employee_name }}</td>

            <!-- Payable Columns -->
            <td class="text-center border">
              <DaysWorkedTooltip
                :days-worked="item.effective_days_worked || 0"
                :basic-pay="item.basic_pay || 0"
                :daily-rate="item.daily_rate || 0"
                :is-field-staff="item.is_field_staff"
                :hours-worked="item.hours_worked"
                :is-admin="item.is_admin"
              />
            </td>
            <td class="text-center border">{{ item.sunday_days || 0 }}</td>
            <td class="text-center border">{{ formatCurrency(item.sunday_amount || 0) }}</td>
            <td class="text-center border">{{ formatCurrency(item.allowance || 0) }}</td>
            <td class="text-center border">{{ roundDecimal(item.overtime_hrs || 0, 2) }}</td>
            <td class="text-center border">{{ formatCurrency(item.overtime_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.holidays_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.trips_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.utilizations_pay) }}</td>
            <td class="text-center border">{{ formatCurrency(item.benefits_pay || 0) }}</td>
            <td class="text-center border">{{ formatCurrency(item.cash_adjustment_addon || 0) }}</td>
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
            <td class="text-end text-error border">
              {{ formatCurrency(item.deductions.cash_adjustment || 0) }}
            </td>

            <!-- Total Deductions -->
            <td class="text-end text-error font-weight-bold border">
              {{ formatCurrency(item.total_deductions) }}
            </td>

            <!-- Net Pay -->
            <td class="text-end font-weight-bold text-success border">
              {{ Math.round(item.net_pay).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
            </td>
          </tr>

          <!-- Totals Row -->
          <tr v-if="itemsWithCalculations.length > 0">
            <td class="font-weight-bold border">TOTAL</td>

            <!-- Payable Totals -->
            <td class="text-center font-weight-bold border">{{ roundDecimal(totals.days_worked, 2) }} days</td>
            <td class="text-center font-weight-bold border">{{ totals.sunday_days }}</td>
            <td class="text-center font-weight-bold border">
              {{ formatCurrency(totals.sunday_amount) }}
            </td>
            <td class="text-center font-weight-bold border">{{ formatCurrency(totals.allowance) }}</td>
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
            <td class="text-center font-weight-bold border">{{ formatCurrency(totals.benefits_pay) }}</td>
            <td class="text-center font-weight-bold border">{{ formatCurrency(totals.cash_adjustment_addon) }}</td>
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
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.cash_adjustment_deduction) }}
            </td>

            <!-- Total Deductions Total -->
            <td class="text-end font-weight-bold text-error border">
              {{ formatCurrency(totals.total_deductions) }}
            </td>

            <!-- Net Pay Total -->
            <td class="text-end font-weight-bold text-success border">
              {{ Math.round(totals.net_pay).toLocaleString('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }) }}
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
        v-if="!loading && items.length > 0 && itemsWithCalculations.length === 0"
        type="warning"
        variant="tonal"
        class="mt-4"
      >
        <v-icon icon="mdi-magnify-close" class="me-2"></v-icon>
        No employees found matching "{{ searchQuery }}". Try a different search term.
      </v-alert>
    </v-card-text>

    <!-- Pagination -->
    <v-divider v-if="itemsWithCalculations.length > 0"></v-divider>
    <MonthlyPayrollPagination
      v-if="itemsWithCalculations.length > 0"
      :current-page="currentPage"
      :items-per-page="itemsPerPage"
      :total-items="itemsWithCalculations.length"
      @update:current-page="emit('update:currentPage', $event)"
      @update:items-per-page="emit('update:itemsPerPage', $event)"
    />
  </div>
</template>
