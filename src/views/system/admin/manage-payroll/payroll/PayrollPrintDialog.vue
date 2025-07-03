<script setup lang="ts">
import type { EmployeeTableFilter } from '@/stores/employees'
import { usePayrollPrintDialog } from './payrollPrintDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import PayrollPrint from './PayrollPrint.vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemId?: number
  tableOptions: TableOptions
  tableFilters: EmployeeTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formAction, onPrint, onDialogClose } = usePayrollPrintDialog(props, emit)
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
    <v-card prepend-icon="mdi-account-cash" title="Payroll Preview">
      <template #append>
        <v-btn variant="text" density="comfortable" @click="onPrint" icon>
          <v-icon icon="mdi-printer" color="primary"></v-icon>
          <v-tooltip activator="parent" location="top"> Print Employee Payroll </v-tooltip>
        </v-btn>
      </template>

      <v-card-text id="generate-payroll">
        <PayrollPrint></PayrollPrint>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>

        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onDialogClose"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
