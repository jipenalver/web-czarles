<script setup lang="ts">
import { formatCurrency } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { type MonthlyPayrollRow } from '../composables/monthlyPayroll'


defineProps<{
  payrollData: MonthlyPayrollRow[]
}>()
</script>

<template>
  <div class="pa-4">
    <v-row dense class="font-weight-bold">
      <v-col cols="12" md="2">
        <div class="text-caption text-grey">TOTAL EMPLOYEES</div>
        <div class="text-h6">{{ payrollData.length }}</div>
      </v-col>
      <v-col cols="12" md="2">
        <div class="text-caption text-grey">BASIC PAY</div>
        <div class="text-body-1">
          {{ formatCurrency(payrollData.reduce((sum, item) => sum + (item.basic_pay || 0), 0)) }}
        </div>
      </v-col>
      <v-col cols="12" md="2">
        <div class="text-caption text-grey">OVERTIME</div>
        <div class="text-body-1">
          {{ formatCurrency(payrollData.reduce((sum, item) => sum + (item.overtime_pay || 0), 0)) }}
        </div>
      </v-col>
      <v-col cols="12" md="2">
        <div class="text-caption text-grey">GROSS PAY</div>
        <div class="text-body-1 text-success">
          {{ formatCurrency(payrollData.reduce((sum, item) => sum + (item.gross_pay || 0), 0)) }}
        </div>
      </v-col>
      <v-col cols="12" md="2">
        <div class="text-caption text-grey">DEDUCTIONS</div>
        <div class="text-body-1 text-error">
          {{
            formatCurrency(payrollData.reduce((sum, item) => sum + (item.total_deductions || 0), 0))
          }}
        </div>
      </v-col>
      <v-col cols="12" md="2">
        <div class="text-caption text-grey">NET PAY</div>
        <div class="text-h6 text-primary">
          {{ formatCurrency(payrollData.reduce((sum, item) => sum + (item.net_pay || 0), 0)) }}
        </div>
      </v-col>
    </v-row>
  </div>
</template>
