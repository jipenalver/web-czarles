<script setup lang="ts">
import { type Employee, type EmployeeTableFilter } from '@/stores/employees'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useRatesFormDialog } from './ratesFormDialog'
import { requiredValidator } from '@/utils/validators'
import RatesLogs from '../employees/EmployeeLogs.vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Employee | null
  tableOptions: TableOptions
  tableFilters: EmployeeTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const {
  formData,
  formAction,
  refVForm,
  isConfirmSubmitDialog,
  onSubmit,
  onFormSubmit,
  onFormReset,
} = useRatesFormDialog(props, emit)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-dialog
    :max-width="mdAndDown ? undefined : '600'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card prepend-icon="mdi-cash-edit " title="Employee Rate">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="formData.daily_rate"
                prepend-inner-icon="mdi-currency-php"
                label="Daily Rate"
                type="number"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" class="d-flex justify-center">
              <v-switch v-model="formData.is_insured" class="ms-2" color="primary" hide-details>
                <template #label>
                  With Accident Insurance?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_insured ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-text>
          <RatesLogs :item-id="props.itemData?.id" type="rates"></RatesLogs>
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

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmSubmitDialog"
    title="Confirm Update"
    text="Are you sure you want to update employee rate?"
    @confirm="onSubmit"
  ></ConfirmDialog>
</template>
