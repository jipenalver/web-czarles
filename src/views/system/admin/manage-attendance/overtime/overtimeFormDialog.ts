/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
  useAttendanceRequestsStore,
} from '@/stores/attendanceRequests'
import { type Attendance, useAttendancesStore } from '@/stores/attendances'
import { getDate, getTime24Hour } from '@/utils/helpers/dates'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref, watch } from 'vue'

export function useOvertimeFormDialog(
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
    overtime_in: '',
    overtime_out: '',
    overtime_status: 'Pending' as 'Pending' | 'Approved' | 'Rejected',
    type: 'Overtime' as 'Leave' | 'Overtime',
  }
  const formCheckBoxDefault = {
    isRectifyOvertimeIn: false,
    isRectifyOvertimeOut: false,
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const formCheckBox = ref({ ...formCheckBoxDefault })
  const isUpdate = ref(false)
  const isConfirmSubmitDialog = ref(false)
  const confirmTitle = ref('')
  const confirmText = ref('')
  const attendanceData = ref<Attendance | undefined>()

  watch(
    () => props.isDialogVisible,
    () => {
      formCheckBox.value = { ...formCheckBoxDefault }

      isUpdate.value = props.itemData ? true : false

      if (isUpdate.value) {
        const { employee, attendance, ...itemData } = props.itemData as AttendanceRequest
        formData.value = {
          ...itemData,
          overtime_in: getTime24Hour(itemData.overtime_in) as string,
          overtime_out: getTime24Hour(itemData.overtime_out) as string,
          date: getDate(itemData.overtime_in),
        }
      } else formData.value = { ...formDataDefault }
    },
  )

  watch(
    () => formData.value.employee_id,
    async () => {
      formAction.value = { ...formActionDefault, formProcess: true }

      if (formData.value.employee_id)
        await attendancesStore.getAttendances(formData.value.employee_id)

      formAction.value = { ...formActionDefault, formProcess: false }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const baseDate = getDate(formData.value.date)

    const prepareTimeField = (timeValue: string, baseDate: string): string | null => {
      if (!timeValue || timeValue.trim() === '') return null
      return `${baseDate} ${timeValue}`
    }

    const newFormData = {
      ...formData.value,
      overtime_in: prepareTimeField(formData.value.overtime_in as string, baseDate as string),
      overtime_out: prepareTimeField(formData.value.overtime_out as string, baseDate as string),
      is_overtime_in_rectified: formCheckBox.value.isRectifyOvertimeIn,
      is_overtime_out_rectified: formCheckBox.value.isRectifyOvertimeOut,
      attendance_id: attendanceData.value ? attendanceData.value.id : null,
    }

    const { data, error } = isUpdate.value
      ? await attendanceRequestsStore.updateAttendanceRequest(newFormData)
      : await attendanceRequestsStore.addAttendanceRequest(newFormData)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated Overtime Request' : 'Applied for Overtime'}.`

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

    attendanceData.value = attendancesStore.attendances.find(
      (attendance) =>
        getDate(attendance.am_time_in) === getDate(formData.value.date as string) &&
        attendance.employee_id === formData.value.employee_id,
    )

    const isAttendanceBlank =
      attendanceData.value &&
      [
        attendanceData.value.am_time_in,
        attendanceData.value.am_time_out,
        attendanceData.value.pm_time_in,
        attendanceData.value.pm_time_out,
      ].some((time) => time !== null)

    if (!isAttendanceBlank)
      return setError('Cannot apply for overtime - attendance is not yet recorded for this date.')

    const isAttendanceHasLeave =
      attendanceData.value &&
      [attendanceData.value.is_am_leave, attendanceData.value.is_pm_leave].every(
        (isLeave) => isLeave === true,
      )

    if (isAttendanceHasLeave)
      return setError('Cannot apply for overtime - full leave already recorded for this date.')

    if (!formData.value.overtime_in) return setError('Overtime - Time In is required.')

    const hasChecked = Object.values(formCheckBox.value).some((value) => value)

    if (!hasChecked) return setError('Please check at least one checkbox to rectify the overtime.')
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) {
      if (isUpdate.value) {
        confirmTitle.value = 'Confirm Overtime Rectification'
        confirmText.value = 'Are you sure you want to update, '
        if (formCheckBox.value.isRectifyOvertimeIn) confirmText.value += ' Overtime - Time In, '
        if (formCheckBox.value.isRectifyOvertimeOut) confirmText.value += ' Overtime - Time Out, '
        confirmText.value += ' overtime request?'
      } else {
        confirmTitle.value = 'Confirm Overtime Application'
        confirmText.value = 'Are you sure you want to apply overtime for this attendance?'
      }

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
    formCheckBox,
    formAction,
    refVForm,
    isUpdate,
    isConfirmSubmitDialog,
    confirmTitle,
    confirmText,
    onSubmit,
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
