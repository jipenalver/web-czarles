/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
  useAttendanceRequestsStore,
} from '@/stores/attendanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { useAttendancesStore } from '@/stores/attendances'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { getDate } from '@/utils/helpers/dates'
import { onMounted, ref, watch } from 'vue'

export function useLeaveFormDialog(
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
  const employeesStore = useEmployeesStore()

  // States
  const formDataDefault = {
    date: null as string | null,
    employee_id: null as number | null,
    is_am_leave: false,
    is_pm_leave: false,
    is_leave_with_pay: false,
    leave_type: null,
    leave_reason: '',
  }
  const formData = ref<Partial<AttendanceRequest>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)
  const isConfirmSubmitDialog = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false

      if (isUpdate.value) {
        const { employee, ...itemData } = props.itemData as AttendanceRequest
        formData.value = { ...itemData }
      } else formData.value = { ...formDataDefault }
    },
  )

  watch(
    () => formData.value.employee_id,
    async () => {
      formAction.value = { ...formActionDefault, formProcess: true }

      await attendancesStore.getAttendances(formData.value.employee_id)

      formAction.value = { ...formActionDefault, formProcess: false }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = isUpdate.value
      ? await attendanceRequestsStore.updateAttendanceRequest(formData.value)
      : await attendanceRequestsStore.addAttendanceRequest(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated Leave Request' : 'Applied for Leave'}.`

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

  const onFormValidate = () => {
    const setError = (message: string) => {
      formAction.value = {
        ...formActionDefault,
        formMessage: message,
        formStatus: 400,
        formProcess: false,
        formAlert: true,
      }
      return true
    }

    if (!isUpdate.value) {
      const attendance = attendancesStore.attendances.find(
        (attendance) =>
          getDate(attendance.am_time_in) === getDate(formData.value.date as string) &&
          attendance.employee_id === formData.value.employee_id,
      )

      const isAttendanceComplete =
        attendance &&
        [
          attendance.am_time_in,
          attendance.am_time_out,
          attendance.pm_time_in,
          attendance.pm_time_out,
        ].every((time) => time !== null)

      if (isAttendanceComplete)
        return setError('Cannot apply for leave - attendance already recorded for this date.')
    }

    if (!formData.value.is_am_leave && !formData.value.is_pm_leave)
      return setError('Either AM or PM leave must be selected.')
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) {
      if (onFormValidate()) return

      isConfirmSubmitDialog.value = true
    }
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    formData.value = { ...formDataDefault }
    emit('update:isDialogVisible', false)
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    isConfirmSubmitDialog,
    onSubmit,
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
