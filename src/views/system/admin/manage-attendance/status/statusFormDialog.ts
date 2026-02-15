/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
  useAttendanceRequestsStore,
} from '@/stores/attendanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useAttendancesStore } from '@/stores/attendances'
import { getDate } from '@/utils/helpers/dates'
import { useLogsStore } from '@/stores/logs'
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
  const attendanceRequestsStore = useAttendanceRequestsStore()
  const attendancesStore = useAttendancesStore()
  const logsStore = useLogsStore()

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

    if (formData.value.type === 'Leave' && formData.value.status === 'Approved') {
      const {
        id,
        created_at,
        date,
        employee,
        leave_status,
        requestor_id,
        user_avatar,
        user_fullname,
        attendance_id,
        attendance,
        overtime_in,
        overtime_out,
        is_overtime_in_rectified,
        is_overtime_out_rectified,
        overtime_status,
        type,
        ...newFormData
      } = {
        ...props.itemData,
        am_time_in: getDate(props.itemData?.date as string),
      }

      const { data, error } = await attendancesStore.addAttendance(newFormData)

      if (error) {
        formAction.value = {
          ...formActionDefault,
          formMessage: error.message,
          formStatus: 400,
          formProcess: false,
        }
      } else if (data) {
        formAction.value.formMessage = 'Approved Leave Request.'

        await attendanceRequestsStore.deleteAttendanceRequest(props.itemData?.id as number)
      }
    } else if (formData.value.type === 'Overtime' && formData.value.status === 'Approved') {
      const {
        created_at,
        date,
        employee,
        is_am_leave,
        is_pm_leave,
        is_leave_with_pay,
        leave_type,
        leave_reason,
        leave_status,
        requestor_id,
        user_avatar,
        user_fullname,
        attendance_id,
        attendance,
        overtime_status,
        type,
        ...newFormData
      } = {
        ...props.itemData,
      }

      const { data, error } = await attendancesStore.updateAttendance(newFormData)

      if (error) {
        formAction.value = {
          ...formActionDefault,
          formMessage: error.message,
          formStatus: 400,
          formProcess: false,
        }
      } else if (data) {
        formAction.value.formMessage = 'Approved Overtime Request.'

        await attendanceRequestsStore.deleteAttendanceRequest(props.itemData?.id as number)
      }
    }

    if (formData.value.status === 'Rejected') {
      const { data, error } = await attendanceRequestsStore.updateAttendanceRequest({
        ...props.itemData,
        ...(formData.value.type === 'Leave'
          ? { leave_status: formData.value.status }
          : { overtime_status: formData.value.status }),
      } as AttendanceRequest)

      if (error) {
        formAction.value = {
          ...formActionDefault,
          formMessage: error.message,
          formStatus: 400,
          formProcess: false,
        }
      } else if (data) {
        formAction.value.formMessage = `Rejected ${formData.value.type} Request.`

        await logsStore.addLog({
          type: formData.value.type.toLowerCase() as 'leave' | 'overtime',
          employee_id: props.itemData?.employee_id as number,
          attendance_request_id: props.itemData?.id as number,
          description: formData.value.reason,
        })
      }
    }

    await attendanceRequestsStore.getAttendanceRequestsTable(props.tableOptions, props.tableFilters)

    setTimeout(() => {
      onFormReset()
    }, 1500)

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
