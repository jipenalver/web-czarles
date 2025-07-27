<script setup lang="ts">
import { type Holiday, type HolidayTableFilter } from '@/stores/holidays'
import { useHolidaysFormDialog } from './holidaysFormDialog'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { requiredValidator } from '@/utils/validators'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Holiday | null
  tableOptions: TableOptions
  tableFilters: HolidayTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formData, formAction, refVForm, isUpdate, onFormSubmit, onFormReset } =
  useHolidaysFormDialog(props, emit)
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
    <v-card prepend-icon="mdi-tag" title="Holiday Details">
      <v-card-text>
        <div class="text-caption text-wrap">
          <p class="mb-2">
            To add or update a holiday, please check the official list of holidays in the
            Philippines.
          </p>

          <p class="mb-2">
            <strong>Note:</strong> The list of holidays is subject to change, so please
            <strong>always refer to the official government website</strong> for the most accurate
            and up-to-date information.
          </p>

          <p>
            <strong>Source: </strong>
            <a
              href="https://www.officialgazette.gov.ph/nationwide-holidays/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Official Gazette
            </a>
          </p>
        </div>
      </v-card-text>

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Name"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-date-input
                v-model="formData.holiday_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                label="Date"
                placeholder="Select Date"
                :rules="[requiredValidator]"
                hide-actions
              ></v-date-input>
            </v-col>

            <v-col cols="12">
              <v-select
                v-model="formData.type"
                label="Type of Holiday"
                :items="[
                  'Regular Holiday',
                  'Special (Non-working) Holiday',
                  'Special (Working) Holiday',
                  'Sunday Rate',
                  /* 'Local Holiday', */
                ]"
                :rules="[requiredValidator]"
              ></v-select>
            </v-col>

            <v-col cols="12">
              <v-textarea v-model="formData.description" label="Description" rows="2"></v-textarea>
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
            {{ isUpdate ? 'Update Holiday' : 'Add Holiday' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
