<script setup lang="ts">
import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
} from '@/stores/attendanceRequests'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useLeaveFormDialog } from './leaveFormDialog'
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

const {
  formData,
  formAction,
  refVForm,
  isUpdate,
  isConfirmSubmitDialog,
  onSubmit,
  onFormSubmit,
  onFormReset,
  employeesStore,
} = useLeaveFormDialog(props, emit)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-dialog
    :max-width="mdAndDown ? undefined : '800'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card
      prepend-icon="mdi-account-arrow-left"
      title="Leave Application"
      subtitle="Apply for Employee's Leave."
    >
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="7">
              <v-autocomplete
                v-model="formData.employee_id"
                :items="employeesStore.employees"
                label="Employee"
                item-title="label"
                item-value="id"
                :rules="[requiredValidator]"
                :readonly="isUpdate"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="5">
              <v-date-input
                v-model="formData.date"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                label="Select Date"
                placeholder="Select Date"
                :rules="[requiredValidator]"
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="6" class="d-flex justify-center">
              <v-switch v-model="formData.is_am_leave" class="ms-2" color="primary" hide-details>
                <template #label>
                  AM - Leave?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_am_leave ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-col cols="12" sm="6" class="d-flex justify-center">
              <v-switch v-model="formData.is_pm_leave" class="ms-2" color="primary" hide-details>
                <template #label>
                  PM - Leave?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_pm_leave ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-col cols="12" class="d-flex justify-center">
              <v-switch
                v-model="formData.is_leave_with_pay"
                class="ms-2"
                color="primary"
                hide-details
                disabled
              >
                <template #label>
                  Is Leave with Pay?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_leave_with_pay ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="formData.leave_type"
                label="Leave Type"
                :items="[
                  'Sick Leave',
                  'Vacation Leave',
                  'Emergency Leave',
                  'Maternity Leave',
                  'Paternity Leave',
                  'Leisure Leave',
                  'Others',
                ]"
                :rules="[requiredValidator]"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.leave_reason"
                label="Leave Reason"
                rows="2"
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
            {{ isUpdate ? 'Update' : 'Submit' }} Leave
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmSubmitDialog"
    title="Confirm Leave Application"
    text="Are you sure you want to submit this leave application? Any existing attendance records for this employee on the same date will be overwritten."
    @confirm="onSubmit"
  ></ConfirmDialog>
</template>
