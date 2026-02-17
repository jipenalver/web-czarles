import { type AttendanceRequest, useAttendanceRequestsStore } from '@/stores/attendanceRequests'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type Attendance, type AttendanceImage } from '@/stores/attendances'
import { getFirstAndLastDateOfMonth } from '@/utils/helpers/dates'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { useAuthUserStore } from '@/stores/authUser'
import { onMounted, ref } from 'vue'

export function useAttendanceRequestsTable(props: {
  componentView: 'leave-requests' | 'overtime-requests'
}) {
  const authUserStore = useAuthUserStore()
  const attendanceRequestsStore = useAttendanceRequestsStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Date', key: 'date', align: 'start' },
  ]
  const getTableHeaders = (componentView: string): TableHeader[] => {
    const headers = [...baseHeaders]

    if (componentView === 'leave-requests')
      headers.push(
        { title: 'Leave Type', key: 'leave_type', align: 'start' },
        { title: 'Leave Reason', key: 'leave_reason', align: 'start' },
        { title: 'Requestor', key: 'user_fullname', align: 'start' },
        { title: 'Leave Status', key: 'leave_status', align: 'center' },
      )

    if (componentView === 'overtime-requests')
      headers.push(
        { title: 'Overtime In', key: 'overtime_in', align: 'start' },
        { title: 'Overtime Out', key: 'overtime_out', align: 'start' },
        { title: 'Overtime Status', key: 'overtime_status', align: 'center' },
      )

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
    attendance_at: getFirstAndLastDateOfMonth() as Date[] | null,
    component_view: props.componentView,
  })
  const isApprover = ref(false)
  const isRequestor = ref(false)
  const isViewDialogVisible = ref(false)
  const isStatusDialogVisible = ref(false)
  const isLogsDialogVisible = ref(false)
  const isLeaveDialogVisible = ref(false)
  const isOvertimeDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<AttendanceRequest | null>(null)
  const attendanceData = ref<Attendance | null>(null)
  const formAction = ref({ ...formActionDefault })
  const viewType = ref<
    'am_time_in' | 'am_time_out' | 'pm_time_in' | 'pm_time_out' | 'overtime_in' | 'overtime_out'
  >('am_time_in')

  // Actions
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
    attendanceData.value = item
    viewType.value = timeType
    isViewDialogVisible.value = true
  }

  const onStatus = (item: AttendanceRequest) => {
    itemData.value = item
    isStatusDialogVisible.value = true
  }

  const onLogs = (item: AttendanceRequest) => {
    itemData.value = item
    isLogsDialogVisible.value = true
  }

  const onLeave = (item: AttendanceRequest | null = null) => {
    itemData.value = item
    isLeaveDialogVisible.value = true
  }

  const onOvertime = (item: AttendanceRequest | null = null) => {
    itemData.value = item
    isOvertimeDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await attendanceRequestsStore.deleteAttendanceRequest(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Attendance Request.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.attendance_at = null

    onLoadItems(tableOptions.value)
  }

  const onFilterItems = async () => {
    const headers = getTableHeaders(props.componentView)

    if (tableFilters.value.employee_id !== null) tableHeaders.value = headers.slice(1)
    else tableHeaders.value = headers

    onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await attendanceRequestsStore.getAttendanceRequestsTable(
      { page, itemsPerPage, sortBy },
      tableFilters.value,
    )

    tableOptions.value.isLoading = false
  }

  const onLoadOvertimes = async () => {
    tableOptions.value.isLoading = true
    formAction.value = { ...formActionDefault, formProcess: true }

    await attendanceRequestsStore.syncOvertimeRequest(tableOptions.value, tableFilters.value)

    formAction.value.formProcess = false
    tableOptions.value.isLoading = false
  }

  const hasAttendanceImage = (images: AttendanceImage[], type: string) => {
    return images.some((image) => image.image_type === type)
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()

    if (authUserStore.userRole === 'Super Administrator') {
      isApprover.value = true
      isRequestor.value = true
    }

    if (authUserStore.userRole !== 'Super Administrator') {
      const userRole = await authUserStore.getUserRole(authUserStore.userRole as string)

      isApprover.value = userRole?.is_approver ?? false
      isRequestor.value = userRole?.is_requestor ?? false
    }
  })

  // Expose State and Actions
  return {
    tableHeaders,
    tableOptions,
    tableFilters,
    isApprover,
    isRequestor,
    isViewDialogVisible,
    isStatusDialogVisible,
    isLogsDialogVisible,
    isLeaveDialogVisible,
    isOvertimeDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    attendanceData,
    formAction,
    viewType,
    onView,
    onStatus,
    onLogs,
    onLeave,
    onOvertime,
    onDelete,
    onConfirmDelete,
    onFilterDate,
    onFilterItems,
    onLoadItems,
    onLoadOvertimes,
    hasAttendanceImage,
    authUserStore,
    attendanceRequestsStore,
    employeesStore,
  }
}
