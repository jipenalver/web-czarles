<script setup lang="ts">
import {
  type CashAdvanceRequest,
  type CashAdvanceRequestTableFilter
} from '@/stores/cashAdvanceRequests'
import EmployeeLogs from '../../manage-employees/employees/EmployeeLogs.vue'
import { useCashAdvanceLogsFormDialog } from './cashAdvanceLogsFormDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useDate, useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: CashAdvanceRequest | null
  tableOptions: TableOptions
  tableFilters: CashAdvanceRequestTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()
const date = useDate()

const { formAction, onFormSubmit, onFormReset } = useCashAdvanceLogsFormDialog(props, emit)
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
    <v-card
      prepend-icon="mdi-information-outline"
      title="Request Logs"
      :subtitle="`${props.itemData?.employee.firstname + ' ' + props.itemData?.employee.lastname}: ${date.format(props.itemData?.created_at, 'fullDate')}`"
    >
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <EmployeeLogs
                type="cash advance"
                :item-id="props.itemData?.employee_id as number"
                :cash-advance-request-id="props.itemData?.id as number"
                title="Rejection Logs"
              ></EmployeeLogs>
            </v-col>
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
            Resubmit
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
