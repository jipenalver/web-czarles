<script setup lang="ts">
import { type Attendance, type AttendanceImage } from '@/stores/attendances'
import { getTime } from '@/utils/helpers/dates'

const props = defineProps<{
  itemData: Attendance
  attendanceType: 'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out'
}>()

const emit = defineEmits(['click'])

const hasNoCoordinates = (images: AttendanceImage[], type: string) => {
  const image = images.find((img) => img.image_type === type)
  return image ? !image.coordinates : false
}

const hasTakenFromOffline = (images: AttendanceImage[], type: string) => {
  const image = images.find((img) => img.image_type === type)
  return image ? image.is_from_offline : false
}

const getAttendanceTime = (type: string) => {
  switch (type) {
    case 'am_time_in':
      return props.itemData.am_time_in
    case 'am_time_out':
      return props.itemData.am_time_out
    case 'pm_time_in':
      return props.itemData.pm_time_in
    case 'pm_time_out':
      return props.itemData.pm_time_out
    default:
      return null
  }
}
</script>

<template>
  <span class="font-weight-bold cursor-pointer text-decoration-underline" @click="emit('click')">
    <v-badge
      v-if="hasNoCoordinates(props.itemData.attendance_images, props.attendanceType)"
      location="top left"
      color="error"
      offset-y="-10"
      bordered
      floating
    >
      <template #badge>
        <v-icon icon="mdi-map-marker-off"></v-icon>
      </template>
      <v-tooltip activator="parent" location="top">No Coordinates</v-tooltip>
    </v-badge>

    {{ getTime(getAttendanceTime(props.attendanceType)) }}

    <v-badge
      v-if="hasTakenFromOffline(props.itemData.attendance_images, props.attendanceType)"
      location="top right"
      color="warning"
      offset-y="-10"
      bordered
      floating
    >
      <template #badge>
        <v-icon icon="mdi-cloud-off"></v-icon>
      </template>
      <v-tooltip activator="parent" location="top">From Offline Mode</v-tooltip>
    </v-badge>
  </span>
</template>
