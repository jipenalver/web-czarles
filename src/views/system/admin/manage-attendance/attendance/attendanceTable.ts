import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type Attendance, useAttendancesStore } from '@/stores/attendances'
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
    attendance_at: null as Date[] | null,
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

  const onFilterDate = (isCleared = false) => {
    if (isCleared) tableFilters.value.attendance_at = null

    onLoadItems(tableOptions.value)
  }

  const onFilterItems = () => {
    const headers = getTableHeaders(props.componentView)

    if (tableFilters.value.employee_id !== null) tableHeaders.value = headers.slice(1)
    else tableHeaders.value = headers

    onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await attendancesStore.getAttendancesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const hasAttendanceImage = (images: AttendanceImage[], type: string) => {
    return images.some((image) => image.image_type === type)
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
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
    attendancesStore,
    employeesStore,
  }
}
