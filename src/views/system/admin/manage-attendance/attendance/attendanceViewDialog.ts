import { type Attendance, type AttendanceImage } from '@/stores/attendances'
import { fileDownload, getDate } from '@/utils/helpers/others'
import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch } from 'vue'

export function useAttendanceViewDialog(
  props: {
    isDialogVisible: boolean
    itemData: Attendance | null
    viewType: 'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out'
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // States
  const formAction = ref({ ...formActionDefault })
  const imageType = ref('')
  const imageData = ref<AttendanceImage | null>(null)

  watch(
    () => props.isDialogVisible,
    () => {
      imageType.value =
        props.viewType === 'am_time_in'
          ? 'AM - Time In'
          : props.viewType === 'am_time_out'
            ? 'AM - Time Out'
            : props.viewType === 'pm_time_in'
              ? 'PM - Time In'
              : 'PM - Time Out'
      imageData.value =
        props.itemData?.attendance_images.find((image) => image.image_type === props.viewType) ||
        null
    },
  )

  // Actions
  const onDownload = async (imagePath: string) => {
    formAction.value = { ...formActionDefault, formProcess: true }

    await fileDownload(
      imagePath,
      `${getDate(imageData.value?.created_at as string)}-${props.itemData?.employee.id}_${props.viewType}.jpg`,
    )

    formAction.value.formMessage = 'Image downloaded.'

    formAction.value.formAlert = true
  }

  const onDialogClose = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formAction,
    imageType,
    imageData,
    onDownload,
    onDialogClose,
  }
}
