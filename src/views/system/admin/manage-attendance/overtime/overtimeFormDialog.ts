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

export function useOvertimeFormDialog(
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
    employee_id: null as string | null,
    is_overtime_applied: false,
    overtime_in: '',
    overtime_out: '',
  }
  const formCheckBoxDefault = {
    isRectifyOvertimeIn: false,
    isRectifyOvertimeOut: false,
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const formCheckBox = ref({ ...formCheckBoxDefault })
  const isConfirmSubmitDialog = ref(false)
  const confirmTitle = ref('')
  const confirmText = ref('')
  const isOvertimeApplied = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      formCheckBox.value = { ...formCheckBoxDefault }

      const { employee, ...itemData } = props.itemData as Attendance
      formData.value = {
        ...itemData,
        overtime_in: getTime24Hour(itemData.overtime_in) as string,
        overtime_out: getTime24Hour(itemData.overtime_out) as string,
        date: getDate(itemData.am_time_in),
      }

      isOvertimeApplied.value = itemData.is_overtime_applied || false
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { date, ...newFormData } = {
      ...formData.value,
      overtime_in: formData.value.overtime_in
        ? getDate(formData.value.date) + ' ' + formData.value.overtime_in
        : null,
      overtime_out: formData.value.overtime_out
        ? getDate(formData.value.date) + ' ' + formData.value.overtime_out
        : null,
      is_overtime_in_rectified: formCheckBox.value.isRectifyOvertimeIn ? true : undefined,
      is_overtime_out_rectified: formCheckBox.value.isRectifyOvertimeOut ? true : undefined,
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
      formAction.value.formMessage = `Successfully Updated Attendance Overtime.`

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

    if (!formData.value.overtime_in) return setError('Overtime - Time In is required.')

    const hasChecked = Object.values(formCheckBox.value).some((value) => value)

    if (!hasChecked)
      return setError('Please check at least one checkbox to rectify the attendance.')
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) {
      if (isOvertimeApplied.value) {
        if (onFormValidate()) return

        confirmTitle.value = 'Confirm Overtime Rectification'
        confirmText.value = 'Are you sure you want to update, '
        if (formCheckBox.value.isRectifyOvertimeIn) confirmText.value += ' Overtime - Time In, '
        if (formCheckBox.value.isRectifyOvertimeOut) confirmText.value += ' Overtime - Time Out, '
        confirmText.value += ' attendance?'
      } else {
        confirmTitle.value = 'Confirm Overtime Application'
        confirmText.value = 'Are you sure you want to apply overtime for this attendance?'
      }

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
    formCheckBox,
    isConfirmSubmitDialog,
    confirmTitle,
    confirmText,
    onSubmit,
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
