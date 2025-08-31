<script setup lang="ts">
import { type PayrollData, type TableData } from './payrollTableDialog'
import { usePayrollPrintDialog } from './payrollPrintDialog'
import { type Employee } from '@/stores/employees'
import PayrollPrint from './PayrollPrint.vue'
import { useDisplay } from 'vuetify'
import { ref, watch, computed } from 'vue'
import { reloadAllPayrollFunctions, manualRefreshPayroll } from './helpers'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'

const props = defineProps<{
  isDialogVisible: boolean
  payrollData: PayrollData
  employeeData: Employee
  tableData: TableData
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formAction, isPrinting, onPrint, onDialogClose } = usePayrollPrintDialog(
  {
    isDialogVisible: props.isDialogVisible,
    itemId: props.employeeData?.id,
    employeeData: props.employeeData,
    payrollData: props.payrollData
  },
  emit
)

// Ref para sa PayrollPrint component para ma-trigger ang reload
const payrollPrintRef = ref<InstanceType<typeof PayrollPrint> | null>(null)

// Key para force re-render ang PayrollPrint component
const payrollPrintKey = ref(0)

// Loading state para sa reload operations
const isReloadingData = ref(false)

// Computed para ma-track ang comprehensive loading state from PayrollPrint
const isPayrollLoading = computed(() => {
  // Use optional chaining and provide fallback to ensure reactivity
  const payrollComponent = payrollPrintRef.value
  return payrollComponent?.isPayrollCalculating ?? false
})

// Combined loading state - show dialog if either reloading or payroll calculating
const isAnyLoading = computed(() => {
  return isReloadingData.value || isPayrollLoading.value
})

// Delegate reload and manual refresh helpers from shared helpers.ts
async function reloadAllPayrollFunctionsLocal() {
  await reloadAllPayrollFunctions(payrollPrintRef, payrollPrintKey, isReloadingData)
}

async function manualRefreshPayrollLocal() {
  await manualRefreshPayroll(payrollPrintRef, isReloadingData)
}

// Watch for dialog visibility changes para mag-reload kung nag-open
watch(
  () => props.isDialogVisible,
  async (isVisible) => {
    if (isVisible) {
      // Reload all functions when dialog opens
      await reloadAllPayrollFunctionsLocal()
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
      await reloadAllPayrollFunctionsLocal()
    }
  },
  { deep: true }
)

// Debug logging for loading states coordination
watch(
  () => [isReloadingData.value, isPayrollLoading.value, isAnyLoading.value],
  ([reloading, payrollLoading, anyLoading]) => {
    console.log('[PayrollPrintDialog] Loading states:', {
      reloading,
      payrollLoading,
      anyLoading,
      hasPayrollRef: !!payrollPrintRef.value
    })
  },
  { immediate: true }
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
      <LoadingDialog
        v-model:is-visible="isPrinting"
        title="Generating PDF..."
        subtitle="Please wait while we prepare your payroll document"
        description="This may take a few moments"
        :progress-size="80"
        :progress-width="6"
        progress-color="primary"
      ></LoadingDialog>

      <!-- Loading overlay para sa data reload and calculations -->
      <LoadingDialog
        v-model:is-visible="isAnyLoading"
        :title="isReloadingData ? 'Refreshing Data...' : 'Calculating Payroll...'"
        :subtitle="isReloadingData ? 'Loading latest payroll information' : 'Processing employee data and computations'"
        :description="isReloadingData ? 'Please wait while we update the data' : 'This may take a few moments while we calculate all payroll components'"
        :progress-size="64"
        :progress-width="4"
        :progress-color="isReloadingData ? 'success' : 'primary'"
      ></LoadingDialog>

      <template #append>
        <v-btn
          variant="text"
          density="comfortable"
          @click="manualRefreshPayrollLocal"
          :disabled="isPrinting || isAnyLoading"
          :loading="isReloadingData"
          icon
          class="me-2"
        >
          <v-icon icon="mdi-refresh" color="success"></v-icon>
          <v-tooltip activator="parent" location="top">
            {{ isAnyLoading ? 'Processing...' : 'Refresh Payroll Data' }}
          </v-tooltip>
        </v-btn>

        <v-btn
          variant="text"
          density="comfortable"
          @click="onPrint"
          :disabled="isPrinting || isAnyLoading"
          :loading="isPrinting"
          icon
        >
          <v-icon icon="mdi-printer" color="primary"></v-icon>
          <v-tooltip activator="parent" location="top">
            {{ isPrinting ? 'Generating PDF...' : isAnyLoading ? 'Processing...' : 'Print Employee Payroll' }}
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
