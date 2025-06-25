/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type Attendance,
  type AttendanceTableFilter,
  useAttendancesStore,
} from '@/stores/attendances'
import { getDate, getTime24Hour } from '@/utils/helpers/others'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref, watch } from 'vue'

export function useAttendanceFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Attendance | null
    tableOptions: TableOptions
    tableFilters: AttendanceTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const attendancesStore = useAttendancesStore()
  const employeesStore = useEmployeesStore()

  // States
  const formDataDefault = {
    date: null as string | null,
    am_time_in: '',
    am_time_out: '',
    pm_time_in: '',
    pm_time_out: '',
    employee_id: null as string | null,
    is_am_in_rectified: false,
    is_am_out_rectified: false,
    is_pm_in_rectified: false,
    is_pm_out_rectified: false,
  }
  const formCheckBoxDefault = {
    isRectifyAMTimeIn: false,
    isRectifyAMTimeOut: false,
    isRectifyPMTimeIn: false,
    isRectifyPMTimeOut: false,
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)
  const formCheckBox = ref({ ...formCheckBoxDefault })
  const isConfirmSubmitDialog = ref(false)
  const confirmText = ref('')

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formCheckBox.value = { ...formCheckBoxDefault }

      if (isUpdate.value) {
        const { employee, ...itemData } = props.itemData as Attendance
        formData.value = {
          ...itemData,
          am_time_in: getTime24Hour(itemData.am_time_in) as string,
          am_time_out: getTime24Hour(itemData.am_time_out) as string,
          pm_time_in: getTime24Hour(itemData.pm_time_in) as string,
          pm_time_out: getTime24Hour(itemData.pm_time_out) as string,
          date: getDate(itemData.am_time_in),
        }
      } else formData.value = { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { date, ...newFormData } = {
      ...formData.value,
      am_time_in: formData.value.am_time_in
        ? getDate(formData.value.date) + ' ' + formData.value.am_time_in
        : null,
      am_time_out: formData.value.am_time_out
        ? getDate(formData.value.date) + ' ' + formData.value.am_time_out
        : null,
      pm_time_in: formData.value.pm_time_in
        ? getDate(formData.value.date) + ' ' + formData.value.pm_time_in
        : null,
      pm_time_out: formData.value.pm_time_out
        ? getDate(formData.value.date) + ' ' + formData.value.pm_time_out
        : null,
      is_am_in_rectified: formCheckBox.value.isRectifyAMTimeIn,
      is_am_out_rectified: formCheckBox.value.isRectifyAMTimeOut,
      is_pm_in_rectified: formCheckBox.value.isRectifyPMTimeIn,
      is_pm_out_rectified: formCheckBox.value.isRectifyPMTimeOut,
    }

    const { data, error } = isUpdate.value
      ? await attendancesStore.updateAttendance(newFormData)
      : await attendancesStore.addAttendance(newFormData)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Attendance.`

      await attendancesStore.getAttendancesTable(props.tableOptions, props.tableFilters)

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

    if (isUpdate.value) {
      const hasChecked = Object.values(formCheckBox.value).some((value) => value)

      if (!hasChecked)
        return setError('Please check at least one checkbox to rectify the attendance.')
    } else {
      const hasAttendance = attendancesStore.attendances.some(
        (attendance) =>
          getDate(attendance.am_time_in) === getDate(formData.value.date as string) &&
          attendance.employee_id === formData.value.employee_id,
      )

      if (hasAttendance) return setError('Attendance for this date and employee already exists.')
    }

    if (!formData.value.am_time_in) return setError('AM - Time In is required.')
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) {
      if (onFormValidate()) return

      if (isUpdate.value) {
        confirmText.value = 'Are you sure you want to update, '
        if (formCheckBox.value.isRectifyAMTimeIn) confirmText.value += ' AM - Time In, '
        if (formCheckBox.value.isRectifyAMTimeOut) confirmText.value += ' AM - Time Out, '
        if (formCheckBox.value.isRectifyPMTimeIn) confirmText.value += ' PM - Time In, '
        if (formCheckBox.value.isRectifyPMTimeOut) confirmText.value += ' PM - Time Out, '
        confirmText.value += ' attendance?'
      } else confirmText.value = 'Are you sure you want to add this attendance?'

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
    if (attendancesStore.attendances.length === 0) await attendancesStore.getAttendances()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    formCheckBox,
    isConfirmSubmitDialog,
    confirmText,
    onSubmit,
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
