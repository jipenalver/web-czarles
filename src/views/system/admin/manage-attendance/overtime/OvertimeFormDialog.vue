<script setup lang="ts">
import { type Attendance, type AttendanceTableFilter } from '@/stores/attendances'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useOvertimeFormDialog } from './overtimeFormDialog'
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
  formCheckBox,
  isConfirmSubmitDialog,
  confirmText,
  onSubmit,
  onFormSubmit,
  onFormReset,
  employeesStore,
} = useOvertimeFormDialog(props, emit)
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
      prepend-icon="mdi-clock-plus"
      title="Overtime Application"
      subtitle="Apply Overtime Record. Check the checkboxes to modify the time.
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
                readonly
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
                readonly
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12" class="d-flex justify-center">
              <v-switch
                v-model="formData.is_overtime_applied"
                class="ms-2"
                color="primary"
                hide-details
              >
                <template #label>
                  Apply For Overtime?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_overtime_applied ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <template v-if="formData.is_overtime_applied">
              <v-col cols="12" sm="6" class="d-flex justify-center">
                <v-time-picker
                  v-model="formData.overtime_in"
                  color="secondary"
                  :disabled="!formCheckBox.isRectifyOvertimeIn"
                  ampm-in-title
                >
                  <template #title>
                    <v-checkbox-btn
                      v-model="formCheckBox.isRectifyOvertimeIn"
                      label="Overtime - Time In"
                    ></v-checkbox-btn>
                  </template>
                </v-time-picker>
              </v-col>

              <v-col cols="12" sm="6" class="d-flex justify-center">
                <v-time-picker
                  v-model="formData.overtime_out"
                  color="secondary"
                  :disabled="!formCheckBox.isRectifyOvertimeOut"
                  ampm-in-title
                >
                  <template #title>
                    <v-checkbox-btn
                      v-model="formCheckBox.isRectifyOvertimeOut"
                      label="Overtime - Time Out"
                    ></v-checkbox-btn>
                  </template>
                </v-time-picker>
              </v-col>
            </template>
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
            :disabled="formAction.formProcess || !formData.is_overtime_applied"
            :loading="formAction.formProcess"
          >
            Apply Overtime
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmSubmitDialog"
    title="Confirm Overtime Rectification"
    :text="confirmText"
    @confirm="onSubmit"
  ></ConfirmDialog>
</template>
