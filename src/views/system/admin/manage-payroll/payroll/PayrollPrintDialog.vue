<script setup lang="ts">
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrintDialog } from './payrollPrintDialog'
import { type Employee } from '@/stores/employees'
import PayrollPrint from './PayrollPrint.vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  payrollData: PayrollData
  employeeData: Employee
  tableData: TableData
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formAction, isPrinting, onPrint, onDialogClose } = usePayrollPrintDialog(props, emit)
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
    <v-card prepend-icon="mdi-cash-fast" title="Payroll Preview" class="position-relative">
      <!-- Loading overlay para matago ang entire dialog during printing -->
      <v-overlay 
        v-model="isPrinting" 
        contained 
        persistent
        class="d-flex justify-center align-center"
      >
        <v-card class="pa-6 text-center w-100" elevation="8" max-width="800">
          <v-progress-circular 
            indeterminate 
            color="primary" 
            size="64" 
            width="6"
            class="mb-4"
          />
          <h3 class="text-h6 text-primary mb-2">Generating PDF...</h3>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Please wait while we prepare your payroll document
          </p>
        </v-card>
      </v-overlay>

      <template #append>
        <v-btn 
          variant="text" 
          density="comfortable" 
          @click="onPrint" 
          :disabled="isPrinting"
          :loading="isPrinting"
          icon
        >
          <v-icon icon="mdi-printer" color="primary"></v-icon>
          <v-tooltip activator="parent" location="top"> 
            {{ isPrinting ? 'Generating PDF...' : 'Print Employee Payroll' }}
          </v-tooltip>
        </v-btn>
      </template>

      <v-card-text id="generate-payroll">        
        <PayrollPrint
          :employee-data="props.employeeData"
          :payroll-data="props.payrollData"
          :table-data="props.tableData"
        ></PayrollPrint>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>

        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onDialogClose"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
