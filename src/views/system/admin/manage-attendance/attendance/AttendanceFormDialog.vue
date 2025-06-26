<script setup lang="ts">
import { type Attendance, type AttendanceTableFilter } from '@/stores/attendances'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useAttendanceFormDialog } from './attendanceFormDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Attendance | null
  tableOptions: TableOptions
  tableFilters: AttendanceTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const {
  formData,
  formAction,
  refVForm,
  isUpdate,
  formCheckBox,
  isConfirmSubmitDialog,
  confirmText,
  onSubmit,
  onFormSubmit,
  onFormReset,
  employeesStore,
} = useAttendanceFormDialog(props, emit)
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
      prepend-icon="mdi-account-cash"
      title="Attendance"
      :subtitle="
        isUpdate
          ? 'Rectify Attendance Record. Check the checkboxes to modify the time.'
          : 'Add Employee\'s Attendance Record. Check the checkboxes to modify the time.'
      "
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
                label="Attendance Date"
                placeholder="Select Date"
                :rules="[requiredValidator]"
                :readonly="isUpdate"
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="6" class="d-flex justify-center">
              <v-time-picker
                v-model="formData.am_time_in"
                color="secondary"
                :disabled="!formCheckBox.isRectifyAMTimeIn"
                ampm-in-title
              >
                <template #title>
                  <v-checkbox-btn
                    v-model="formCheckBox.isRectifyAMTimeIn"
                    label="AM - Time In"
                  ></v-checkbox-btn>
                </template>
              </v-time-picker>
            </v-col>

            <v-col cols="12" sm="6" class="d-flex justify-center">
              <v-time-picker
                v-model="formData.am_time_out"
                color="secondary"
                :disabled="!formCheckBox.isRectifyAMTimeOut"
                ampm-in-title
              >
                <template #title>
                  <v-checkbox-btn
                    v-model="formCheckBox.isRectifyAMTimeOut"
                    label="AM - Time Out"
                  ></v-checkbox-btn>
                </template>
              </v-time-picker>
            </v-col>

            <v-col cols="12" sm="6" class="d-flex justify-center">
              <v-time-picker
                v-model="formData.pm_time_in"
                color="secondary"
                :disabled="!formCheckBox.isRectifyPMTimeIn"
                ampm-in-title
              >
                <template #title>
                  <v-checkbox-btn
                    v-model="formCheckBox.isRectifyPMTimeIn"
                    label="PM - Time In"
                  ></v-checkbox-btn>
                </template>
              </v-time-picker>
            </v-col>

            <v-col cols="12" sm="6" class="d-flex justify-center">
              <v-time-picker
                v-model="formData.pm_time_out"
                color="secondary"
                :disabled="!formCheckBox.isRectifyPMTimeOut"
                ampm-in-title
              >
                <template #title>
                  <v-checkbox-btn
                    v-model="formCheckBox.isRectifyPMTimeOut"
                    label="PM - Time Out"
                  ></v-checkbox-btn>
                </template>
              </v-time-picker>
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
            {{ isUpdate ? 'Rectify Attendance' : 'Add Attendance' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmSubmitDialog"
    :title="isUpdate ? 'Confirm Attendance Rectification' : 'Confirm Attendance Submission'"
    :text="confirmText"
    @confirm="onSubmit"
  ></ConfirmDialog>
</template>
