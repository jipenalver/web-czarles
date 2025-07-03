<script setup lang="ts">
import { useAttendanceViewDialog } from './attendanceViewDialog'
import { getDate, getTime } from '@/utils/helpers/others'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Attendance } from '@/stores/attendances'
import { useDisplay } from 'vuetify'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Attendance | null
  viewType: 'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out'
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const { formAction, imageType, imageData, onDownload, onDialogClose } = useAttendanceViewDialog(
  props,
  emit,
)
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
    <v-card prepend-icon="mdi-clock-in" title="Attendance Image" :subtitle="imageType">
      <template #append>
        <v-btn
          icon="mdi-download"
          variant="plain"
          color="primary"
          @click="onDownload(imageData?.image_path || '')"
        ></v-btn>
      </template>

      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-img :src="imageData?.image_path || ''" />
          </v-col>

          <v-divider class="my-3"></v-divider>

          <v-col cols="12" class="d-flex justify-space-between align-center">
            <strong>Employee:</strong>
            <span class="text-body-2">
              {{ props.itemData?.employee.firstname }} {{ props.itemData?.employee.lastname }}
            </span>
          </v-col>

          <v-col cols="12" class="d-flex justify-space-between align-center">
            <strong>Attendance Date/Time:</strong>
            <span class="text-body-2">
              {{
                getDate(String(props.itemData?.[props.viewType as keyof Attendance] ?? '')) +
                ' ' +
                getTime(String(props.itemData?.[props.viewType as keyof Attendance] ?? ''))
              }}
            </span>
          </v-col>

          <v-col cols="12" class="d-flex justify-space-between align-center">
            <strong>Upload Date/Time:</strong>
            <span class="text-body-2">
              {{
                getDate(imageData?.created_at as string) +
                ' ' +
                getTime(imageData?.created_at as string)
              }}
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
