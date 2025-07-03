<script setup lang="ts">
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemId?: number
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const onDialogClose = () => {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <v-dialog
    :max-width="mdAndDown ? undefined : '1200'"
    :model-value="props.isDialogVisible"
    :fullscreen="mdAndDown"
    persistent
  >
    <v-card prepend-icon="mdi-account-cash" title="Payroll List">
      <v-card-text> </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>

        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onDialogClose"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
