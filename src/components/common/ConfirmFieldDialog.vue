<script setup lang="ts">
import { requiredValidator } from '@/utils/validators'
import { ref } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  title: string
  subtitle: string
  confirmText: string
}>()

const emit = defineEmits(['update:isDialogVisible', 'confirm'])

const confirmData = ref('')
const refVForm = ref()

const onSubmit = () => {
  emit('update:isDialogVisible', false)
  emit('confirm')
}

const onFormSubmit = async () => {
  const { valid } = await refVForm.value.validate()
  if (valid) onSubmit()
}

const onClose = () => {
  emit('update:isDialogVisible', false)
}

const confirmValidator = (value: unknown) => {
  if (value === null || value === undefined || value === '') return true

  return (
    String(value) === props.confirmText ||
    `Invalid input. Please type '${props.confirmText}' to confirm.`
  )
}
</script>

<template>
  <v-dialog max-width="400" :model-value="props.isDialogVisible" @update:model-value="onClose">
    <v-card prepend-icon="mdi-information" :title="title">
      <v-card-text>
        <span class="text-body-2">
          {{ subtitle }}
        </span>
      </v-card-text>

      <v-form ref="refVForm" @submit.prevent="onFormSubmit">
        <v-card-text>
          <v-row dense>
            <v-col cols="12">
              <v-text-field
                v-model="confirmData"
                :label="`Type '${confirmText}' to confirm`"
                :rules="[requiredValidator, confirmValidator]"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>

          <v-btn prepend-icon="mdi-thumb-down" @click="onClose"> Cancel </v-btn>

          <v-btn prepend-icon="mdi-thumb-up" type="submit" color="primary" variant="elevated">
            Confirm
          </v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>
