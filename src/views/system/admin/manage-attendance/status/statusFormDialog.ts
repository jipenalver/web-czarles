import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
} from '@/stores/attendanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useStatusFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: AttendanceRequest | null
    tableOptions: TableOptions
    tableFilters: AttendanceRequestTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // States
  const formDataDefault = {
    status: 'Pending' as 'Pending' | 'Approved' | 'Rejected',
    reason: '',
    type: 'Leave' as 'Leave' | 'Overtime',
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  watch(
    () => props.isDialogVisible,
    () => {
      formData.value = {
        ...formDataDefault,
        type: props.tableFilters.component_view === 'leave-requests' ? 'Leave' : 'Overtime',
      }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // const { data, error } = isUpdate.value
    //   ? await attendanceRequestsStore.updateAttendanceRequest(formData.value)
    //   : await attendanceRequestsStore.addAttendanceRequest(formData.value)

    // if (error) {
    //   formAction.value = {
    //     ...formActionDefault,
    //     formMessage: error.message,
    //     formStatus: 400,
    //     formProcess: false,
    //   }
    // } else if (data) {
    //   formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated Leave Request' : 'Applied for Leave'}.`

    //   // await attendanceRequestsStore.getAttendanceRequestsTable(
    //   //   props.tableOptions,
    //   //   props.tableFilters,
    //   // )

    //   setTimeout(() => {
    //     onFormReset()
    //   }, 1500)
    // }

    formAction.value.formAlert = true
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    formData.value = { ...formDataDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    onFormSubmit,
    onFormReset,
  }
}
