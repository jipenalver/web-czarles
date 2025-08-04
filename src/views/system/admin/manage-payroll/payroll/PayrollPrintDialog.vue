<script setup lang="ts">
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrintDialog } from './payrollPrintDialog'
import { type Employee } from '@/stores/employees'
import PayrollPrint from './PayrollPrint.vue'
import { useDisplay } from 'vuetify'
import { ref, watch, nextTick } from 'vue'
import AppAlert from '@/components/common/AppAlert.vue'

const props = defineProps<{
  isDialogVisible: boolean
  payrollData: PayrollData
  employeeData: Employee
  tableData: TableData
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formAction, isPrinting, onPrint, onDialogClose } = usePayrollPrintDialog(props, emit)

// Ref para sa PayrollPrint component para ma-trigger ang reload
const payrollPrintRef = ref<InstanceType<typeof PayrollPrint> | null>(null)

// Key para force re-render ang PayrollPrint component
const payrollPrintKey = ref(0)

// Loading state para sa reload operations
const isReloadingData = ref(false)

// Function para reload all functions sa PayrollPrint component
async function reloadAllPayrollFunctions() {
  try {
    console.log('[PayrollPrintDialog] Reloading all payroll functions...')
    isReloadingData.value = true
    
    // Option 1: Force re-render ng PayrollPrint component
    payrollPrintKey.value++
    
    // Wait for next tick para ma-ensure na na-mount na ang bagong component instance
    await nextTick()
    
    // Option 2: Kung naa na ang ref, directly call ang reload function
    if (payrollPrintRef.value && payrollPrintRef.value.reloadAllFunctions) {
      await payrollPrintRef.value.reloadAllFunctions()
    }
    
    console.log('[PayrollPrintDialog] Payroll functions reloaded successfully')
  } catch (error) {
    console.error('[PayrollPrintDialog] Error reloading payroll functions:', error)
  } finally {
    isReloadingData.value = false
  }
}

// Function para manual refresh kung needed
async function manualRefreshPayroll() {
  if (payrollPrintRef.value) {
    try {
      console.log('[PayrollPrintDialog] Manual refresh of payroll data...')
      isReloadingData.value = true
      
      // Call individual reload functions
      await Promise.all([
        payrollPrintRef.value.loadTrips?.(),
        payrollPrintRef.value.fetchEmployeeHolidays?.(),
        payrollPrintRef.value.updateOverallOvertime?.(),
        payrollPrintRef.value.updateEmployeeDeductions?.()
      ])
      
      // Force recalculation
      payrollPrintRef.value.recalculateEarnings?.()
      
      console.log('[PayrollPrintDialog] Manual refresh completed')
    } catch (error) {
      console.error('[PayrollPrintDialog] Error during manual refresh:', error)
    } finally {
      isReloadingData.value = false
    }
  }
}

// Watch for dialog visibility changes para mag-reload kung nag-open
watch(
  () => props.isDialogVisible,
  async (isVisible) => {
    if (isVisible) {
      // Reload all functions when dialog opens
      await reloadAllPayrollFunctions()
    }
  },
  { immediate: false }
)

// Watch for critical prop changes para mag-reload din
watch(
  [
    () => props.employeeData?.id,
    () => props.payrollData?.month,
    () => props.payrollData?.year,
  ],
  async () => {
    if (props.isDialogVisible) {
      // Reload functions kung nag-change ang critical data while dialog is open
      await reloadAllPayrollFunctions()
    }
  },
  { deep: true }
)
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
        z-index="10"
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

      <!-- Loading overlay para sa data reload -->
      <v-overlay 
        v-model="isReloadingData" 
        contained 
        persistent
        class="d-flex justify-center align-center"
        z-index="9"
      >
        <v-card class="pa-6 text-center w-100" elevation="8" max-width="800">
          <v-progress-circular 
            indeterminate 
            color="success" 
            size="48" 
            width="4"
            class="mb-4"
          />
          <h3 class="text-h6 text-success mb-2">Refreshing Data...</h3>
          <p class="text-body-2 text-grey-darken-1 mb-0">
            Loading latest payroll information
          </p>
        </v-card>
      </v-overlay>

      <template #append>
        <v-btn 
          variant="text" 
          density="comfortable" 
          @click="manualRefreshPayroll" 
          :disabled="isPrinting || isReloadingData"
          :loading="isReloadingData"
          icon
          class="me-2"
        >
          <v-icon icon="mdi-refresh" color="success"></v-icon>
          <v-tooltip activator="parent" location="top"> 
            {{ isReloadingData ? 'Refreshing Data...' : 'Refresh Payroll Data' }}
          </v-tooltip>
        </v-btn>
        
        <v-btn 
          variant="text" 
          density="comfortable" 
          @click="onPrint" 
          :disabled="isPrinting || isReloadingData"
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
          ref="payrollPrintRef"
          :key="payrollPrintKey"
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
