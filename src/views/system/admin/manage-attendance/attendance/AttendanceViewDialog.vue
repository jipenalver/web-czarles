<script setup lang="ts">
import { formActionDefault } from '@/utils/helpers/constants'
import AppAlert from '@/components/common/AppAlert.vue'
import { type Attendance } from '@/stores/attendances'
import { useDisplay } from 'vuetify'
import { ref } from 'vue'

const props = defineProps<{
  isDialogVisible: boolean
  itemData: Attendance | null
  imageType: 'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out'
}>()

const emit = defineEmits(['update:isDialogVisible'])

const { mdAndDown } = useDisplay()

const formAction = ref({ ...formActionDefault })

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
    <v-card prepend-icon="mdi-clock-in" title="Attendance">
      <v-card-text>
        <v-row dense>
          <v-col cols="12">
            <v-img
              :src="
                props.itemData?.attendance_images[
                  props.imageType === 'am_time_in'
                    ? 0
                    : props.imageType === 'am_time_out'
                      ? 1
                      : props.imageType === 'pm_time_in'
                        ? 2
                        : 3
                ].image_path
              "
            />
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
