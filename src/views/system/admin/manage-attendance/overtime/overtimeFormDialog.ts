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
  const confirmText = ref('')

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
      is_overtime_in_rectified: formCheckBox.value.isRectifyOvertimeIn,
      is_overtime_out_rectified: formCheckBox.value.isRectifyOvertimeOut,
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

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) {
      confirmText.value = 'Are you sure you want to update, '
      if (formCheckBox.value.isRectifyOvertimeIn) confirmText.value += ' Overtime - Time In, '
      if (formCheckBox.value.isRectifyOvertimeOut) confirmText.value += ' Overtime - Time Out, '
      confirmText.value += ' attendance?'

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
    confirmText,
    onSubmit,
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
