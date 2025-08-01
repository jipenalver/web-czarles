<script setup lang="ts">
import { useAddonsDeductionsFormDialog } from './addonsDeductionsFormDialog'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type EmployeeTableFilter } from '@/stores/employees'
import { type TableOptions } from '@/utils/helpers/tables'
import EmployeeLogs from '../employees/EmployeeLogs.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemId?: number
  tableOptions: TableOptions
  tableFilters: EmployeeTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const {
  formAction,
  formAddons,
  formDeductions,
  refVForm,
  isConfirmSubmitDialog,
  onSubmit,
  onFormSubmit,
  onFormReset,
  benefitsStore,
} = useAddonsDeductionsFormDialog(props, emit)
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <v-dialog
    :max-width="mdAndDown ? undefined : '1200'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card prepend-icon="mdi-account-cash" title="Employee Benefits">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row>
            <v-col cols="12" sm="6">
              <v-row dense>
                <v-col cols="12">
                  <h2 class="text-body-1 font-weight-black mb-3 ms-2">Add-ons</h2>
                </v-col>

                <template v-for="(benefit, index) in benefitsStore.addons" :key="benefit.id">
                  <v-col cols="12" sm="8">
                    <v-text-field
                      v-model="formAddons.amount[index]"
                      prepend-inner-icon="mdi-currency-php"
                      :label="benefit.benefit"
                      type="number"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-switch
                      v-model="formAddons.is_quincena[index]"
                      class="ms-2"
                      color="primary"
                      hide-details
                    >
                      <template #label>
                        <span class="font-weight-black ms-1">
                          {{ formAddons.is_quincena[index] ? 'Quincena' : 'Monthly' }}
                        </span>
                      </template>
                    </v-switch>
                  </v-col>
                </template>

                <v-col cols="12">
                  <h2 class="text-body-1 font-weight-black mb-3 ms-2">Deductions</h2>
                </v-col>

                <template v-for="(benefit, index) in benefitsStore.deductions" :key="benefit.id">
                  <v-col cols="12" sm="8">
                    <v-text-field
                      v-model="formDeductions.amount[index]"
                      prepend-inner-icon="mdi-currency-php"
                      :label="benefit.benefit"
                      type="number"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="4">
                    <v-switch
                      v-model="formDeductions.is_quincena[index]"
                      class="ms-2"
                      color="primary"
                      hide-details
                    >
                      <template #label>
                        <span class="font-weight-black ms-1">
                          {{ formDeductions.is_quincena[index] ? 'Quincena' : 'Monthly' }}
                        </span>
                      </template>
                    </v-switch>
                  </v-col>
                </template>
              </v-row>
            </v-col>

            <v-col cols="12" sm="6">
              <EmployeeLogs
                :item-id="props.itemId"
                type="benefits"
                max-height="450px"
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
            Update
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmSubmitDialog"
    title="Confirm Update"
    text="Are you sure you want to update employee benefits?"
    @confirm="onSubmit"
  ></ConfirmDialog>
</template>
