<script setup lang="ts">
const props = defineProps<{
  isDialogVisible: boolean
  title: string
  text: string
}>()

const emit = defineEmits(['update:isDialogVisible', 'confirm'])

const onConfirm = () => {
  emit('update:isDialogVisible', false)
  emit('confirm')
}

const onClose = () => {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <v-dialog max-width="400" :model-value="props.isDialogVisible" @update:model-value="onClose">
    <v-card prepend-icon="mdi-information" :title="title">
      <v-card-text>
        {{ text }}
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-btn prepend-icon="mdi-thumb-down" @click="onClose"> Cancel </v-btn>

        <v-btn prepend-icon="mdi-thumb-up" color="primary" variant="elevated" @click="onConfirm">
          Confirm
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
