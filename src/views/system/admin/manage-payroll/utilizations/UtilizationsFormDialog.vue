<script setup lang="ts">
import { type Utilization, type UtilizationTableFilter } from '@/stores/utilizations'
import { useUtilizationsFormDialog } from './utilizationsFormDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Utilization | null
  tableOptions: TableOptions
  tableFilters: UtilizationTableFilter
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
  employeesStore,
  unitsStore,
  tripLocationsStore,
} = useUtilizationsFormDialog(props, emit)

const isOvertimeApplied = ref(false)
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
    <v-card prepend-icon="mdi-fuel" title="Fuel Utilization">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.employee_id"
                :items="employeesStore.employees"
                label="Employee"
                item-title="label"
                item-value="id"
                :rules="[requiredValidator]"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.unit_id"
                :items="unitsStore.units"
                label="Unit"
                item-title="name"
                item-value="id"
                :rules="[requiredValidator]"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <v-date-input
                v-model="formData.utilization_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                label="Utilization Date"
                placeholder="Select Date"
                :rules="[requiredValidator]"
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="6">
              <v-autocomplete
                v-model="formData.trip_location_id"
                :items="tripLocationsStore.tripLocations"
                label="Location - Destination"
                item-title="location"
                item-value="id"
                :rules="[requiredValidator]"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.am_time_in"
                label="AM Time In"
                type="time"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.am_time_out"
                label="AM Time Out"
                type="time"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.pm_time_in"
                label="PM Time In"
                type="time"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.pm_time_out"
                label="PM Time Out"
                type="time"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.hours"
                label="No. of Hours"
                type="number"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="6">
              <v-text-field
                v-model="formData.per_hour"
                prepend-inner-icon="mdi-currency-php"
                label="Per Hour"
                type="number"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" class="d-flex justify-center">
              <v-switch v-model="isOvertimeApplied" class="ms-2" color="primary" hide-details>
                <template #label>
                  Is Overtime Applied?
                  <span class="font-weight-black ms-1">
                    {{ isOvertimeApplied ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <template v-if="isOvertimeApplied">
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.overtime_in"
                  label="Overtime In"
                  type="time"
                ></v-text-field>
              </v-col>

              <v-col cols="12" sm="6">
                <v-text-field
                  v-model="formData.overtime_out"
                  label="Overtime Out"
                  type="time"
                ></v-text-field>
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
            :disabled="formAction.formProcess"
            :loading="formAction.formProcess"
          >
            {{ isUpdate ? 'Update Utilization' : 'Add Utilization' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
