<script setup lang="ts">
import { formatCurrency } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { type MonthlyPayrollRow } from '../composables/monthlyPayroll'
import MonthlyPayrollTotals from './MonthlyPayrollTotals.vue'
import { type TableHeader } from '@/utils/helpers/tables'



defineProps<{
  headers: TableHeader[]
  items: MonthlyPayrollRow[]
  loading: boolean
}>()
</script>

<template>
  <v-card>
    <v-card-text>
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        :items-per-page="50"
        :items-per-page-options="[25, 50, 100, -1]"
        density="compact"
        class="elevation-1"
      >
        <!-- eslint-disable vue/valid-v-slot -->
        <!-- Employee Name -->
        <template #item.employee_name="{ item }">
          <span class="font-weight-medium">{{ item.employee_name }}</span>
        </template>

        <!-- Daily Rate -->
        <template #item.daily_rate="{ item }">
          <span>{{ formatCurrency(item.daily_rate) }}</span>
        </template>

        <!-- Days Worked -->
        <template #item.days_worked="{ item }">
          <v-chip size="small" color="primary">{{ item.days_worked }}</v-chip>
        </template>

        <!-- Basic Pay -->
        <template #item.basic_pay="{ item }">
          <span>{{ formatCurrency(item.basic_pay) }}</span>
        </template>

        <!-- Overtime Pay -->
        <template #item.overtime_pay="{ item }">
          <span>{{ formatCurrency(item.overtime_pay) }}</span>
        </template>

        <!-- Trips Pay -->
        <template #item.trips_pay="{ item }">
          <span>{{ formatCurrency(item.trips_pay) }}</span>
        </template>

        <!-- Holidays Pay -->
        <template #item.holidays_pay="{ item }">
          <span>{{ formatCurrency(item.holidays_pay) }}</span>
        </template>

        <!-- Gross Pay -->
        <template #item.gross_pay="{ item }">
          <span class="font-weight-bold text-success">{{ formatCurrency(item.gross_pay) }}</span>
        </template>

        <!-- Deductions (with breakdown in tooltip) -->
        <template #item.deductions="{ item }">
          <v-tooltip location="left">
            <template #activator="{ props }">
              <span
                v-bind="props"
                class="text-error"
                style="cursor: help; text-decoration: underline dotted"
              >
                {{ formatCurrency(item.deductions.total) }}
              </span>
            </template>
            <div class="pa-2">
              <div class="text-caption font-weight-bold mb-2">Deductions Breakdown:</div>
              <div class="text-caption">Late: {{ formatCurrency(item.deductions.late) }}</div>
              <div class="text-caption">
                Undertime: {{ formatCurrency(item.deductions.undertime) }}
              </div>
              <div class="text-caption">
                Cash Advance: {{ formatCurrency(item.deductions.cash_advance) }}
              </div>
              <div class="text-caption">
                Other Deductions: {{ formatCurrency(item.deductions.employee_deductions) }}
              </div>
              <v-divider class="my-1"></v-divider>
              <div class="text-caption font-weight-bold">
                Total: {{ formatCurrency(item.deductions.total) }}
              </div>
            </div>
          </v-tooltip>
        </template>

        <!-- Net Pay -->
        <template #item.net_pay="{ item }">
          <span class="font-weight-bold text-primary">{{ formatCurrency(item.net_pay) }}</span>
        </template>
        <!-- eslint-enable vue/valid-v-slot -->

        <!-- Footer totals -->
        <template #bottom>
          <v-divider></v-divider>
          <MonthlyPayrollTotals :payroll-data="items" />
        </template>
      </v-data-table>
    </v-card-text>
  </v-card>
</template>
