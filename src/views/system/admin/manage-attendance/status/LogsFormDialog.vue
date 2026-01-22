<script setup lang="ts">
import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
} from '@/stores/attendanceRequests'
import EmployeeLogs from '../../manage-employees/employees/EmployeeLogs.vue'
import { getDateWithWeekday } from '@/utils/helpers/dates'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useLogsFormDialog } from './logsFormDialog'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: AttendanceRequest | null
  tableOptions: TableOptions
  tableFilters: AttendanceRequestTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formAction, onFormSubmit, onFormReset } = useLogsFormDialog(props, emit)
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
      title="Rejection Logs"
      :subtitle="`${props.itemData?.employee.firstname + ' ' + props.itemData?.employee.lastname}: ${getDateWithWeekday(props.itemData?.date as string)}`"
    >
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <EmployeeLogs
                :type="
                  props.tableFilters.component_view === 'leave-requests' ? 'leave' : 'overtime'
                "
                :item-id="props.itemData?.employee_id as number"
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
