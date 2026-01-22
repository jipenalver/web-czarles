import { type AttendanceRequest, useAttendanceRequestsStore } from '@/stores/attendanceRequests'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
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
      headers.push({ title: 'Overtime Status', key: 'overtime_status', align: 'center' })

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
  const isLeaveDialogVisible = ref(false)
  const isOvertimeDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<AttendanceRequest | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
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

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
  })

  // Expose State and Actions
  return {
    tableHeaders,
    tableOptions,
    tableFilters,
    isLeaveDialogVisible,
    isOvertimeDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onLeave,
    onOvertime,
    onDelete,
    onConfirmDelete,
    onFilterDate,
    onFilterItems,
    onLoadItems,
    authUserStore,
    attendanceRequestsStore,
    employeesStore,
  }
}
