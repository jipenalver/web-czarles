import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
  useAttendanceRequestsStore,
} from '@/stores/attendanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref } from 'vue'

export function useLogsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: AttendanceRequest | null
    tableOptions: TableOptions
    tableFilters: AttendanceRequestTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const attendanceRequestsStore = useAttendanceRequestsStore()

  // States
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onFormSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await attendanceRequestsStore.updateAttendanceRequest({
      ...props.itemData,
      ...(props.tableFilters.component_view === 'leave-requests'
        ? { leave_status: 'Pending' }
        : { overtime_status: 'Pending' }),
    } as AttendanceRequest)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `${props.tableFilters.component_view === 'leave-requests' ? 'Leave' : 'Overtime'} request resubmitted successfully.`

      await attendanceRequestsStore.getAttendanceRequestsTable(
        props.tableOptions,
        props.tableFilters,
      )

      setTimeout(() => {
        onFormReset()
      }, 1500)
    }

    formAction.value.formAlert = true
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formAction,
    refVForm,
    onFormSubmit,
    onFormReset,
  }
}
