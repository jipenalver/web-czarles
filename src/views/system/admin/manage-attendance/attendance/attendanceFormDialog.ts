/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type Attendance,
  type AttendanceForm,
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
    date: null,
    am_time_in: '',
    am_time_out: '',
    pm_time_in: '',
    pm_time_out: '',
    employee_id: null,
    is_rectified: true,
  }
  const formData = ref<Partial<AttendanceForm>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false

      if (isUpdate.value) {
        const { employee, ...itemData } = props.itemData as Attendance
        formData.value = {
          ...itemData,
          am_time_in: getTime24Hour(itemData.am_time_in) as string,
          am_time_out: getTime24Hour(itemData.am_time_out) as string,
          pm_time_in: getTime24Hour(itemData.pm_time_in) as string,
          pm_time_out: getTime24Hour(itemData.pm_time_out) as string,
          date: getDate(itemData.am_time_in) as string,
        }
      } else formData.value = { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    if (!isUpdate.value) {
      const hasAttendance = attendancesStore.attendances.find((attendance) => {
        const attendanceDate = new Date(formData.value.date as string)

        if (
          getDate(attendance.am_time_in) === getDate(attendanceDate) &&
          attendance.employee_id === formData.value.employee_id
        )
          return true
      })

      if (hasAttendance) {
        formAction.value = {
          ...formActionDefault,
          formMessage: 'Attendance for this date and employee already exists.',
          formStatus: 400,
          formProcess: false,
          formAlert: true,
        }
        return
      }
    }

    const { date, ...newFormData } = {
      ...formData.value,
      am_time_in: formData.value.am_time_in
        ? formData.value.date + ' ' + formData.value.am_time_in
        : null,
      am_time_out: formData.value.am_time_out
        ? formData.value.date + ' ' + formData.value.am_time_out
        : null,
      pm_time_in: formData.value.pm_time_in
        ? formData.value.date + ' ' + formData.value.pm_time_in
        : null,
      pm_time_out: formData.value.pm_time_out
        ? formData.value.date + ' ' + formData.value.pm_time_out
        : null,
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
      formAction.value.formMessage = `Successfully Added Attendance.`

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
    if (valid) onSubmit()
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
    onFormSubmit,
    onFormReset,
    employeesStore,
  }
}
