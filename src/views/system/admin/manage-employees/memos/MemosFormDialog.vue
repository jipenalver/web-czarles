<script setup lang="ts">
import { fileSizeValidator, requiredValidator } from '@/utils/validators'
import { type Memo, type MemoTableFilter } from '@/stores/memos'
import { type TableOptions } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useMemosFormDialog } from './memosFormDialog'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Memo | null
  tableOptions: TableOptions
  tableFilters: MemoTableFilter
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const {
  formData,
  formAction,
  refVForm,
  isUpdate,
  onFile,
  onFileReset,
  onFormSubmit,
  onFormReset,
  employeesStore,
} = useMemosFormDialog(props, emit)
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
    <v-card prepend-icon="mdi-file-account" title="Memo Information">
      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-file-input
                prepend-icon=""
                prepend-inner-icon="mdi-file-document"
                accept="application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                label="Browse Memo File"
                placeholder="Browse Memo File"
                hint="Allowed PDF or DOCX. Max size of 2MB."
                :rules="isUpdate ? [fileSizeValidator] : [requiredValidator, fileSizeValidator]"
                persistent-hint
                show-size
                chips
                @change="onFile"
                @click:clear="onFileReset"
              ></v-file-input>
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="formData.name"
                label="Name"
                :rules="[requiredValidator]"
              ></v-text-field>
            </v-col>

            <v-col cols="12">
              <v-textarea
                v-model="formData.description"
                label="Description"
                rows="2"
                hide-details
              ></v-textarea>
            </v-col>

            <v-col cols="12">
              <v-switch v-model="formData.is_everybody" class="ms-2" color="primary" hide-details>
                <template #label>
                  Is For Everybody?
                  <span class="font-weight-black ms-1">
                    {{ formData.is_everybody ? 'Yes' : 'No' }}
                  </span>
                </template>
              </v-switch>
            </v-col>

            <v-col v-if="!formData.is_everybody" cols="12">
              <v-autocomplete
                v-model="formData.employee_ids"
                :items="employeesStore.employees"
                label="Employees"
                placeholder="Select Employees"
                item-title="label"
                item-value="id"
                hint="Select employees to assign this memo."
                persistent-hint
                multiple
                chips
              ></v-autocomplete>
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
            {{ isUpdate ? 'Update Memo' : 'Add Memo' }}
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
