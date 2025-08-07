<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  isVisible: boolean
  title?: string
  subtitle?: string
  description?: string
  progressSize?: number | string
  progressWidth?: number | string
  progressColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Processing...',
  subtitle: 'Please wait while we complete your request',
  description: 'This may take a few moments',
  progressSize: 80,
  progressWidth: 6,
  progressColor: 'primary'
})

const emit = defineEmits<{
  'update:isVisible': [value: boolean]
}>()

// Computed para sa v-model behavior
const dialogVisible = computed({
  get: () => props.isVisible,
  set: (value: boolean) => emit('update:isVisible', value)
})
</script>

<template>
  <!-- Reusable Loading Dialog -->
  <v-dialog v-model="dialogVisible" persistent fullscreen>
    <v-card class="d-flex align-center justify-center fill-height">
      <v-card class="pa-16 text-center" width="100%" height="100%" elevation="0">
        <v-card-text class="d-flex flex-column align-center justify-center fill-height">
          <v-progress-circular 
            indeterminate 
            :size="progressSize" 
            :width="progressWidth"
            :color="progressColor" 
            class="mb-6"
          ></v-progress-circular>
          <div class="text-h4 mb-4 font-weight-bold">{{ title }}</div>
          <div class="text-h6 text-medium-emphasis mb-2">
            {{ subtitle }}
          </div>
          <div class="text-body-2 text-medium-emphasis">
            {{ description }}
          </div>
        </v-card-text>
      </v-card>
    </v-card>
  </v-dialog>
</template>
