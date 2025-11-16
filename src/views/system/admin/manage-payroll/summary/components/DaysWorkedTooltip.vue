<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency, roundDecimal } from '@/views/system/admin/manage-payroll/payroll/helpers'

const props = defineProps<{
  daysWorked: number
  basicPay: number
  dailyRate: number
  isFieldStaff: boolean
  hoursWorked?: number
}>()

// Calculate breakdown for tooltip
const breakdown = computed(() => {
  // Both field staff and office staff now use days-based calculation
  // Show hours worked for field staff as additional info, but calculation is always days × daily rate
  return {
    type: 'days',
    value: props.daysWorked,
    rate: props.dailyRate,
    calculation: `${roundDecimal(props.daysWorked, 2)} days × ${formatCurrency(props.dailyRate)}/day`,
    amount: props.basicPay,
    hoursInfo: props.isFieldStaff && props.hoursWorked !== undefined ? props.hoursWorked : undefined
  }
})
</script>

<template>
  <v-tooltip location="top" max-width="300">
    <template v-slot:activator="{ props: tooltipProps }">
      <span v-bind="tooltipProps" class="cursor-help text-decoration-underline text-decoration-dotted">
        {{ roundDecimal(daysWorked, 2) }} days
      </span>
    </template>
    <div class="pa-2">
      <div class="text-caption font-weight-bold mb-2">
        {{ isFieldStaff ? 'Field Staff Calculation' : 'Office Staff Calculation' }}
      </div>
      <div v-if="breakdown.hoursInfo !== undefined" class="text-caption mb-1 text-grey-lighten-1">
        <span>Hours Worked:</span>
        <span class="ms-1">{{ roundDecimal(breakdown.hoursInfo, 2) }} hrs</span>
      </div>
      <div class="text-caption mb-1">
        <span class="text-grey-lighten-1">Days Worked:</span>
        <span class="ms-1 font-weight-medium">{{ roundDecimal(breakdown.value, 2) }} days</span>
      </div>
      <div class="text-caption mb-1">
        <span class="text-grey-lighten-1">Daily Rate:</span>
        <span class="ms-1 font-weight-medium">{{ formatCurrency(breakdown.rate) }}/day</span>
      </div>
      <v-divider class="my-2 opacity-50"></v-divider>
      <div class="text-caption">
        <span class="text-grey-lighten-1">Basic Pay:</span>
        <span class="ms-1 font-weight-bold text-error">{{ formatCurrency(breakdown.amount) }}</span>
      </div>
      <div class="text-caption text-grey-darken-1 mt-1 font-italic">
        {{ breakdown.calculation }}
      </div>
    </div>
  </v-tooltip>
</template>

<style scoped>
.cursor-help {
  cursor: help;
}
</style>
