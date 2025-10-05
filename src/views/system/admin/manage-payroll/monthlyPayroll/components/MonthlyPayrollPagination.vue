<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentPage: number
  itemsPerPage: number
  totalItems: number
}>()

const emit = defineEmits<{
  'update:currentPage': [value: number]
  'update:itemsPerPage': [value: number]
}>()

// Items per page options
const itemsPerPageOptions = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: -1, title: 'All' },
]

// Calculate total pages
const totalPages = computed(() => {
  if (props.itemsPerPage === -1) return 1
  return Math.ceil(props.totalItems / props.itemsPerPage)
})

// Calculate range display (e.g., "1-10 of 50")
const rangeText = computed(() => {
  if (props.totalItems === 0) return '0 of 0'

  if (props.itemsPerPage === -1) {
    return `1-${props.totalItems} of ${props.totalItems}`
  }

  const start = (props.currentPage - 1) * props.itemsPerPage + 1
  const end = Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
  return `${start}-${end} of ${props.totalItems}`
})

// Navigation handlers
const goToFirstPage = () => {
  if (props.currentPage !== 1) {
    emit('update:currentPage', 1)
  }
}

const goToPreviousPage = () => {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

const goToNextPage = () => {
  if (props.currentPage < totalPages.value) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

const goToLastPage = () => {
  if (props.currentPage !== totalPages.value) {
    emit('update:currentPage', totalPages.value)
  }
}

// Check if buttons should be disabled
const isFirstPage = computed(() => props.currentPage === 1)
const isLastPage = computed(() => props.currentPage === totalPages.value)
</script>

<template>
  <div class="d-flex align-center justify-space-between pa-3">
    <!-- Items Per Page Selector -->
    <div class="d-flex align-center">
      <span class="text-caption me-2">Rows per page:</span>
      <v-select
        :model-value="itemsPerPage"
        @update:model-value="emit('update:itemsPerPage', $event)"
        :items="itemsPerPageOptions"
        variant="outlined"
        density="compact"
        hide-details
        class="pagination-select"
        style="width: 80px"
      ></v-select>
    </div>

    <!-- Page Info and Navigation -->
    <div class="d-flex align-center">
      <span class="text-caption me-4">{{ rangeText }}</span>

      <v-btn
        icon="mdi-page-first"
        variant="text"
        size="small"
        :disabled="isFirstPage"
        @click="goToFirstPage"
      ></v-btn>

      <v-btn
        icon="mdi-chevron-left"
        variant="text"
        size="small"
        :disabled="isFirstPage"
        @click="goToPreviousPage"
      ></v-btn>

      <span class="text-caption mx-2">
        Page {{ currentPage }} of {{ totalPages }}
      </span>

      <v-btn
        icon="mdi-chevron-right"
        variant="text"
        size="small"
        :disabled="isLastPage"
        @click="goToNextPage"
      ></v-btn>

      <v-btn
        icon="mdi-page-last"
        variant="text"
        size="small"
        :disabled="isLastPage"
        @click="goToLastPage"
      ></v-btn>
    </div>
  </div>
</template>

<style scoped>
.pagination-select :deep(.v-field__input) {
  padding: 4px 8px;
}
</style>
