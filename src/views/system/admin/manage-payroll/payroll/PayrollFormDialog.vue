<script setup lang="ts">
import type { EmployeeTableFilter } from '@/stores/employees'
import { usePayrollFormDialog } from './payrollFormDialog'
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

const {
  // formData,
  formAction,
  refVForm,
  onPrint,
  onFormSubmit,
  onFormReset,
} = usePayrollFormDialog(props, emit)
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
    <v-card prepend-icon="mdi-cash-fast" title="Employee Payroll">
      <template #append>
        <v-btn variant="text" density="comfortable" @click="onPrint" icon>
          <v-icon icon="mdi-printer" color="primary"></v-icon>
          <v-tooltip activator="parent" location="top"> Print Employee Payroll </v-tooltip>
        </v-btn>
      </template>

      <v-card-text id="generate-payroll">
        <PayrollPrint></PayrollPrint>
      </v-card-text>

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12"> </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>

          <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onFormReset"></v-btn>

          <v-btn
            prepend-icon="mdi-pencil"
            color="primary"
            type="submit"
            variant="elevated"
            :disabled="formAction.formProcess"
            :loading="formAction.formProcess"
          >
            Update
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
