<script setup lang="ts">
import { useDisplay } from 'vuetify'
import { computed } from 'vue'

const props = defineProps<{
  headerItems: string[]
  headerIcon: string
  headline?: string
  image?: string
}>()

const { xs } = useDisplay()

const items = computed(() =>
  props.headerItems.map((item, index) => {
    if (index === props.headerItems.length - 1) return { title: item, disabled: false }
    return { title: item, disabled: true }
  }),
)
</script>

<template>
  <v-card class="mb-5" :image="props.image">
    <template #title>
      <span class="text-h6 font-weight-bold">
        <v-breadcrumbs :items="xs ? items.slice(-1) : items">
          <template #prepend>
            <v-icon :icon="props.headerIcon" size="small" class="me-1"></v-icon>
          </template>
        </v-breadcrumbs>
      </span>
    </template>

    <template #subtitle>
      <p class="ms-4 text-wrap">{{ props.headline }}</p>
    </template>
  </v-card>
</template>
