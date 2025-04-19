<script setup lang="ts">
import { watch } from 'vue'

const props = defineProps<{
  isAlertVisible: boolean
  formMessage: string
  formStatus: number
}>()

const emit = defineEmits(['update:isAlertVisible'])

watch(
  () => props.isAlertVisible,
  () => {
    setTimeout(() => {
      onClose()
    }, 10000)
  },
)

const onClose = () => {
  emit('update:isAlertVisible', false)
}
</script>

<template>
  <v-snackbar
    :model-value="props.isAlertVisible"
    :timeout="10000"
    :color="formStatus >= 400 ? 'error' : formStatus && formStatus >= 200 ? 'success' : undefined"
    location="top right"
    multi-line
  >
    <v-icon class="me-1" icon="mdi-information"></v-icon>
    {{ formMessage }}

    <template #actions>
      <v-btn variant="text" @click="onClose">Close</v-btn>
    </template>
  </v-snackbar>
</template>
