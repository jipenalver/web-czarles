<script setup lang="ts">
import { formActionDefault } from '@/utils/helpers/constants'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Attendance } from '@/stores/attendances'
import { useDate, useDisplay } from 'vuetify'
import { ref } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Attendance | null
  viewType: 'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out'
}>()

const emit = defineEmits(['update:isDialogVisible'])

const date = useDate()
const { mdAndDown } = useDisplay()

const viewType =
  props.viewType === 'am_time_in'
    ? 'AM - Time In'
    : props.viewType === 'am_time_out'
      ? 'AM - Time Out'
      : props.viewType === 'pm_time_in'
        ? 'PM - Time In'
        : 'PM - Time Out'
const viewData = props.itemData?.attendance_images.find(
  (image) => image.image_type === props.viewType,
)

const formAction = ref({ ...formActionDefault })

const onDownload = (imagePath: string) => {
  const link = document.createElement('a')
  link.href = imagePath

  link.download = `${new Date().toISOString().slice(0, 10)}-${props.itemData?.employee.id}_${props.viewType}.jpg`
  document.body.appendChild(link)

  link.click()
  document.body.removeChild(link)
}

const onDialogClose = () => {
  formAction.value = { ...formActionDefault }
  emit('update:isDialogVisible', false)
}
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
    <v-card prepend-icon="mdi-clock-in" title="Attendance Image" :subtitle="viewType">
      <template #append>
        <v-btn
          icon="mdi-download"
          variant="plain"
          color="primary"
          @click="onDownload(viewData?.image_path || '')"
        ></v-btn>
      </template>

      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-img :src="viewData?.image_path || ''" />
          </v-col>

          <v-divider class="my-3"></v-divider>

          <v-col cols="12" sm="6" class="text-start">
            <strong>Employee:</strong>
            <span class="text-caption ms-2">
              {{ props.itemData?.employee.firstname }} {{ props.itemData?.employee.lastname }}
            </span>
          </v-col>

          <v-col cols="12" sm="6" class="text-end">
            <strong>Upload Date:</strong>
            <span class="text-caption ms-2">
              {{ date.format(viewData?.created_at, 'fullDateTime') }}
            </span>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>

        <v-btn text="Close" variant="plain" prepend-icon="mdi-close" @click="onDialogClose"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
