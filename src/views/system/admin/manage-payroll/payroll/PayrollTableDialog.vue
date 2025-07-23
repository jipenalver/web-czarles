<script setup lang="ts">
import { usePayrollTableDialog } from './payrollTableDialog'
import { type TableHeader } from '@/utils/helpers/tables'
import PayrollPrintDialog from './PayrollPrintDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Employee } from '@/stores/employees'

import { useDisplay } from 'vuetify'


const props = defineProps<{
  isDialogVisible: boolean
  itemData: Employee | null
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mobile, mdAndDown } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Month',
    key: 'month',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Basic Salary',
    key: 'basic_salary',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Gross Pay',
    key: 'gross_pay',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Deductions',
    key: 'deductions',
    sortable: false,
    align: 'start',
  },
  {
    title: 'Net Pay',
    key: 'net_pay',
    sortable: false,
    align: 'start',
  },
]

const {
  tableOptions,
  tableFilters,
  tableData,
  filteredTableData,
  formAction,
  isPrintDialogVisible,
  payrollData,
  selectedData,
  onView,
  onDialogClose,
} = usePayrollTableDialog(props, emit)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-dialog
    :max-width="mdAndDown ? undefined : '1200'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card
      prepend-icon="mdi-account-cash"
      :title="`Payslip ${tableFilters.year}`"
      :subtitle="`${props.itemData?.firstname} ${props.itemData?.lastname}`"
    >
      <template #append>
        <div class="d-flex ga-3 align-center">
          <v-select
            v-model="tableFilters.year"
            label="Year"
            :items="[2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030]"
            style="min-width: 120px;"
          ></v-select>
        </div>
      </template>

      <v-card-text>
        <!-- eslint-disable vue/valid-v-slot -->
        <v-data-table
          v-model:items-per-page="tableOptions.itemsPerPage"
          v-model:page="tableOptions.page"
          v-model:sort-by="tableOptions.sortBy"
          :loading="tableOptions.isLoading"
          :headers="tableHeaders"
          :items="filteredTableData"
          :items-per-page-options="[6, 12]"
          :hide-default-header="mobile"
          :mobile="mobile"
        >
          <template #item.month="{ item }">
            <v-btn class="text-decoration-underline" variant="text" @click="onView(item)">
              {{ item.month }}
            </v-btn>
          </template>
        </v-data-table>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>

        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onDialogClose"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <PayrollPrintDialog
  v-if="props.itemData && selectedData"
  v-model:is-dialog-visible="isPrintDialogVisible"
  :payroll-data="payrollData"
  :employee-data="props.itemData"
  :table-data="selectedData"
/>

</template>
