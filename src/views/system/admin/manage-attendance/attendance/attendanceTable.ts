import {
  getLateUndertimeHoursDecimal,
  getOvertimeHoursDecimal,
  getWorkHoursDecimal,
} from '@/utils/helpers/attendance'
import { getDate, getDateISO, getDateWithWeekday, getTime } from '@/utils/helpers/dates'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type Attendance, useAttendancesStore } from '@/stores/attendances'
import { generateCSV, prepareCSV } from '@/utils/helpers/others'
import { formActionDefault } from '@/utils/helpers/constants'
import { type AttendanceImage } from '@/stores/attendances'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'

export function useAttendanceTable(props: { componentView: 'attendance' | 'leave' | 'overtime' }) {
  const attendancesStore = useAttendancesStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Date', key: 'date', sortable: false, align: 'start' },
    { title: 'AM - Time In', key: 'am_time_in', sortable: false, align: 'start' },
    { title: 'AM - Time Out', key: 'am_time_out', sortable: false, align: 'start' },
    { title: 'PM - Time In', key: 'pm_time_in', sortable: false, align: 'start' },
    { title: 'PM - Time Out', key: 'pm_time_out', sortable: false, align: 'start' },
  ]
  const getTableHeaders = (componentView: string): TableHeader[] => {
    const headers = [...baseHeaders]

    if (componentView === 'overtime')
      headers.push({ title: 'Overtime Applied?', key: 'is_overtime_applied', align: 'center' })

    headers.push({ title: 'Actions', key: 'actions', sortable: false, align: 'center' })
    return headers
  }
  const tableHeaders = ref<TableHeader[]>(getTableHeaders(props.componentView))
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    employee_id: null,
    attendance_at: [new Date()] as Date[] | null,
    component_view: props.componentView,
  })
  const isDialogVisible = ref(false)
  const isViewDialogVisible = ref(false)
  const isLeaveDialogVisible = ref(false)
  const isOvertimeDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Attendance | null>(null)
  const formAction = ref({ ...formActionDefault })
  const viewType = ref<
    'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out' | 'overtime_in' | 'overtime_out'
  >('am_time_in')

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onView = (
    item: Attendance,
    timeType:
      | 'am_time_in'
      | 'am_time_out'
      | 'pm_time_in'
      | 'pm_time_out'
      | 'overtime_in'
      | 'overtime_out',
  ) => {
    itemData.value = item
    viewType.value = timeType
    isViewDialogVisible.value = true
  }

  const onUpdate = (item: Attendance) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onLeave = (item: Attendance | null = null) => {
    itemData.value = item
    isLeaveDialogVisible.value = true
  }

  const onOvertime = (item: Attendance) => {
    itemData.value = item
    isOvertimeDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await attendancesStore.deleteAttendance(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Attendance.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.attendance_at = [new Date()]

    onLoadItems(tableOptions.value)

    await attendancesStore.getAttendancesExport(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    const headers = getTableHeaders(props.componentView)

    if (tableFilters.value.employee_id !== null) tableHeaders.value = headers.slice(1)
    else tableHeaders.value = headers

    onLoadItems(tableOptions.value)

    await attendancesStore.getAttendancesExport(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await attendancesStore.getAttendancesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const hasAttendanceImage = (images: AttendanceImage[], type: string) => {
    return images.some((image) => image.image_type === type)
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-${props.componentView}`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee', 'Overtime Applied?'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = [
        'Lastname',
        'Firstname',
        'Middlename',
        'Day of the Week',
        ...defaultHeaders,
        'Rendered Time',
        'Late/Undertime',
        ...(props.componentView === 'overtime'
          ? ['Overtime In', 'Overtime Out', 'Rendered Overtime']
          : []),
      ].join(',')

      const csvRows = attendancesStore.attendancesExport.map((item) => {
        let csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),
          getDateWithWeekday(item.am_time_in as string)?.split(',')[0] ?? '',

          prepareCSV(getDate(item.am_time_in) as string),
          item.is_am_leave ? item.leave_type : item.am_time_in ? getTime(item.am_time_in) : '',
          item.am_time_out ? getTime(item.am_time_out) : item.is_am_leave ? item.leave_type : '',
          item.pm_time_in ? getTime(item.pm_time_in) : item.is_pm_leave ? item.leave_type : '',
          item.pm_time_out ? getTime(item.pm_time_out) : item.is_pm_leave ? item.leave_type : '',
          getWorkHoursDecimal(
            item.am_time_in,
            item.am_time_out,
            item.pm_time_in,
            item.pm_time_out,
            item.employee.is_field_staff,
          ),
          getLateUndertimeHoursDecimal(
            item.am_time_in,
            item.am_time_out,
            item.pm_time_in,
            item.pm_time_out,
            item.employee.is_field_staff,
          ),
        ]

        if (props.componentView === 'overtime') {
          csvData = [
            ...csvData,
            item.overtime_in ? getTime(item.overtime_in) : '',
            item.overtime_out ? getTime(item.overtime_out) : '',
            getOvertimeHoursDecimal(item.overtime_in, item.overtime_out),
          ]
        }

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (attendancesStore.attendancesExport.length === 0)
      await attendancesStore.getAttendancesExport(tableOptions.value, tableFilters.value)
  })

  // Expose State and Actions
  return {
    tableHeaders,
    tableOptions,
    tableFilters,
    isDialogVisible,
    isViewDialogVisible,
    isLeaveDialogVisible,
    isOvertimeDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    viewType,
    onAdd,
    onView,
    onUpdate,
    onLeave,
    onOvertime,
    onDelete,
    onConfirmDelete,
    onFilterDate,
    onFilterItems,
    onLoadItems,
    hasAttendanceImage,
    onExportCSV,
    attendancesStore,
    employeesStore,
  }
}
