<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from 'vue'

interface Props {
  isVisible: boolean
  title?: string
  subtitle?: string
  description?: string
  progressSize?: number | string
  progressWidth?: number | string
  progressColor?: string
  maxTimeout?: number // Maximum time in ms before auto-closing (default: 60 seconds)
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Processing...',
  subtitle: 'Please wait while we complete your request',
  description: 'This may take a few moments',
  progressSize: 80,
  progressWidth: 6,
  progressColor: 'primary',
  maxTimeout: 60000, // 60 seconds default timeout
})

const emit = defineEmits<{
  'update:isVisible': [value: boolean]
}>()

// Computed para sa v-model behavior with close prevention
const dialogVisible = computed({
  get: () => {
    // If dialog was closed (manually or by timeout), don't show it again
    if (hasBeenClosed.value) {
      return false
    }
    return props.isVisible
  },
  set: (value: boolean) => {
    if (!value) {
      // Mark as closed to prevent re-opening
      hasBeenClosed.value = true
    }
    emit('update:isVisible', value)
  },
})

// Safety timeout to prevent dialog from getting stuck
let timeoutId: ReturnType<typeof setTimeout> | null = null
const timeoutWarning = ref(false)
const remainingTime = ref(0)
const hasBeenClosed = ref(false) // Flag to prevent re-opening after manual/auto close

// Function to clear timeout
const clearSafetyTimeout = () => {
  if (timeoutId) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
  timeoutWarning.value = false
  remainingTime.value = 0
}

// Function to set safety timeout
const setSafetyTimeout = () => {
  clearSafetyTimeout()

  if (props.isVisible && props.maxTimeout > 0) {
    // Show warning at 75% of max timeout
    const warningTime = props.maxTimeout * 0.75

    setTimeout(() => {
      if (props.isVisible) {
        timeoutWarning.value = true
        remainingTime.value = Math.ceil((props.maxTimeout - warningTime) / 1000)
      }
    }, warningTime)

    // Auto-close at max timeout
    timeoutId = setTimeout(() => {
      if (props.isVisible && !hasBeenClosed.value) {
        console.warn('[LoadingDialog] Auto-closing due to timeout')
        hasBeenClosed.value = true // Mark as closed to prevent re-opening
        emit('update:isVisible', false)
      }
    }, props.maxTimeout)
  }
}

// Watch for visibility changes
watch(() => props.isVisible, (isVisible, oldValue) => {
  // Reset hasBeenClosed when dialog is freshly opened (was false, now true)
  if (isVisible && !oldValue) {
    hasBeenClosed.value = false
  }

  if (isVisible && !hasBeenClosed.value) {
    setSafetyTimeout()
  } else {
    clearSafetyTimeout()
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  clearSafetyTimeout()
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
            :color="timeoutWarning ? 'warning' : progressColor"
            class="mb-6"
          ></v-progress-circular>

          <div class="text-h4 mb-4 font-weight-bold">{{ title }}</div>

          <div class="text-h6 text-medium-emphasis mb-2">
            {{ subtitle }}
          </div>

          <div class="text-body-2 text-medium-emphasis">
            {{ description }}
          </div>

          <!-- Timeout Warning -->
          <v-alert
            v-if="timeoutWarning"
            type="warning"
            variant="tonal"
            density="compact"
            class="mt-6 mx-auto"
            max-width="400"
          >
            <div class="text-caption">
              Taking longer than expected. Auto-closing in {{ remainingTime }}s...
            </div>
            <v-btn
              size="small"
              color="warning"
              variant="text"
              class="mt-2"
              @click="dialogVisible = false"
            >
              Close Now
            </v-btn>
          </v-alert>
        </v-card-text>
      </v-card>
    </v-card>
  </v-dialog>
</template>
