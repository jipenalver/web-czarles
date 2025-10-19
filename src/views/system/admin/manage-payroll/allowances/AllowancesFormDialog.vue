<script setup lang="ts">
import { type Allowance, type AllowanceTableFilter } from '@/stores/allowances'
import { useAllowancesFormDialog } from './allowancesFormDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Allowance | null
  tableOptions: TableOptions
  tableFilters: AllowanceTableFilter
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
  tripLocationsStore,
} = useAllowancesFormDialog(props, emit)
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
    <v-card prepend-icon="mdi-highway" title="Trip Details">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
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
              <v-date-input
                v-model="formData.trip_range_at"
                class="mb-2"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                label="Date"
                placeholder="Select Date"
                multiple="range"
                :rules="[requiredValidator]"
                :hide-actions="false"
                :disabled="isUpdate"
                :hint="
                  isUpdate ? 'Date cannot be changed when updating' : 'You may select a date range'
                "
                persistent-hint
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

            <v-col cols="12">
              <v-textarea
                v-model="formData.activities"
                label="Activities"
                rows="2"
                :rules="[requiredValidator]"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.amount"
                prepend-inner-icon="mdi-currency-php"
                label="Amount"
                type="number"
                :rules="[requiredValidator]"
              ></v-text-field>
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
            {{ isUpdate ? 'Update Allowance' : 'Add Allowance' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
