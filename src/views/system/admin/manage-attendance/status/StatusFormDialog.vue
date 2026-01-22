<script setup lang="ts">
import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
} from '@/stores/attendanceRequests'
import { getDateWithWeekday } from '@/utils/helpers/dates'
import { type TableOptions } from '@/utils/helpers/tables'
import { useStatusFormDialog } from './statusFormDialog'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: AttendanceRequest | null
  tableOptions: TableOptions
  tableFilters: AttendanceRequestTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formData, formAction, refVForm, onFormSubmit, onFormReset } = useStatusFormDialog(
  props,
  emit,
)
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
      prepend-icon="mdi-list-status"
      :title="`${props.tableFilters.component_view === 'leave-requests' ? 'Leave' : 'Overtime'} Status`"
      :subtitle="`${props.itemData?.employee.firstname + ' ' + props.itemData?.employee.lastname}: ${getDateWithWeekday(props.itemData?.date as string)}`"
    >
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-radio-group
                v-model="formData.status"
                label="Status"
                :rules="[requiredValidator]"
                inline
              >
                <v-radio label="Approve" value="Approved"></v-radio>
                <v-radio label="Reject" value="Rejected"></v-radio>
              </v-radio-group>
            </v-col>

            <v-col v-if="formData.status === 'Rejected'" cols="12">
              <v-textarea
                v-model="formData.reason"
                label="Reason"
                rows="3"
                :rules="[requiredValidator]"
              ></v-textarea>
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
            Set Status
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
