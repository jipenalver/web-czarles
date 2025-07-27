<script setup lang="ts">
import { type Trip, type TripTableFilter } from '@/stores/trips'
import { useTripLocationsStore } from '@/stores/tripLocation'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { useTripsFormDialog } from './TripsFormDialog'
import { useEmployeesStore } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { watch, computed } from 'vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Trip | null
  tableOptions: TableOptions
  tableFilters: TripTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formData, formAction, refVForm, isUpdate, onFormSubmit, onFormReset } = useTripsFormDialog(
  props,
  emit,
)

// stores for dropdown
const employeesStore = useEmployeesStore()
const unitsStore = useUnitsStore()
const tripLocationsStore = useTripLocationsStore()

// Make stores reactive using computed para magamit sa UI
const employees = computed(() => employeesStore.employees)
const units = computed(() => unitsStore.units)
const tripLocations = computed(() => tripLocationsStore.tripLocations)
// Fetch stores when dialog opens
watch(
  () => props.isDialogVisible,
  async (visible) => {
    if (visible) {
      // fetch ang tanan store geters
      await unitsStore.getUnits()
      await employeesStore.getEmployees()
      await tripLocationsStore.getTripLocations()
    }
  },
  { immediate: true },
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
    <v-card prepend-icon="mdi-map-marker" title="Trip Information">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.date"
                label="Date"
                type="date"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.trip_at"
                label="Trip At"
                type="date"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.trip_no"
                label="Trip Number"
                type="number"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.unit_id as any"
                label="Unit"
                :items="units"
                item-title="name"
                item-value="id"
                clearable
                :return-object="false"
                :rules="[requiredValidator]"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.trip_location_id as any"
                label="Trip Location"
                :items="tripLocations"
                item-title="location"
                item-value="id"
                clearable
                :return-object="false"
                :rules="[requiredValidator]"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-select
                v-model="formData.employee_id as any"
                label="Employee"
                :items="employees"
                item-title="label"
                item-value="id"
                clearable
                :return-object="false"
                :rules="[requiredValidator]"
              ></v-select>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.km"
                label="Kilometers"
                type="number"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.per_trip"
                label="Per Trip"
                type="number"
                step="0.01"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.materials"
                label="Materials"
                rows="2"
                :rules="[requiredValidator]"
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Description"
                rows="2"
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
            {{ isUpdate ? 'Update Trip' : 'Add Trip' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
