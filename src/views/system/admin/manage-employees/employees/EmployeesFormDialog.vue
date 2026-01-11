<script setup lang="ts">
import { emailValidator, lengthMinValidator, requiredValidator } from '@/utils/validators'
import { type Employee, type EmployeeTableFilter } from '@/stores/employees'
import { useEmployeesFormDialog } from './employeesFormDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
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
  isUpdate,
  onFormSubmit,
  onFormReset,
  designationsStore,
  areasStore,
} = useEmployeesFormDialog(props, emit)
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
    <v-card prepend-icon="mdi-account" title="Employee Information">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="formData.firstname"
                label="Firstname"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field v-model="formData.middlename" label="Middlename"></v-text-field>
            </v-col>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="formData.lastname"
                label="Lastname"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-date-input
                v-model="formData.birthdate"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                label="Birthdate"
                placeholder="Select Date"
                view-mode="year"
                :rules="[requiredValidator]"
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.address"
                label="Address"
                rows="3"
                :rules="[requiredValidator]"
              ></v-textarea>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.email"
                label="Email"
                prepend-inner-icon="mdi-email-outline"
                :rules="[emailValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.phone"
                label="Phone"
                prepend-inner-icon="mdi-phone"
                :rules="[requiredValidator, lengthMinValidator(formData.phone as string, 11)]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.tin_no" label="TIN No."></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.sss_no" label="SSS No."></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.philhealth_no" label="PhilHealth No."></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field v-model="formData.pagibig_no" label="Pag-ibig No."></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.designation_id"
                label="Designation"
                :items="designationsStore.designations"
                item-value="id"
                :rules="[requiredValidator]"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <v-date-input
                v-model="formData.hired_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                label="Hired Date"
                placeholder="Select Date"
                :rules="[requiredValidator]"
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.area_origin_id"
                label="Area of Origin"
                :items="areasStore.areas"
                item-title="area"
                item-value="id"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.area_assignment_id"
                label="Area of Assignment"
                :items="areasStore.areas"
                item-title="area"
                item-value="id"
              ></v-autocomplete>
            </v-col>

            <v-col class="d-flex justify-center" cols="12">
              <v-switch v-model="formData.is_permanent" class="ms-2" color="primary" hide-details>
                <template #label>
                  Is Permanent Status?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_permanent ? 'Permanent' : 'Contractual' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-divider class="my-3"></v-divider>

            <v-col cols="12" sm="6">
              <v-switch v-model="formData.is_field_staff" class="ms-2" color="primary" hide-details>
                <template #label>
                  Is Field Staff?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_field_staff ? 'Field Staff' : 'Office Staff' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-col cols="12" sm="6">
              <v-switch
                v-model="formData.is_gps_disabled"
                class="ms-2"
                color="primary"
                hide-details
                :disabled="formData.is_field_staff"
              >
                <template #label>
                  Is GPS Disabled?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_gps_disabled ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-col class="d-flex justify-center" cols="12">
              <v-switch
                v-model="formData.is_qr_generator"
                class="ms-2"
                color="primary"
                hide-details
              >
                <template #label>
                  Is QR Generator?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_qr_generator ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
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
            {{ isUpdate ? 'Update Employee' : 'Add Employee' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
