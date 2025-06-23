import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type Attendance, useAttendancesStore } from '@/stores/attendances'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'

export function useAttendanceTable() {
  const attendancesStore = useAttendancesStore()
  const employeesStore = useEmployeesStore()

  // States
  const tableHeadersDefault: TableHeader[] = [
    {
      title: 'Employee',
      key: 'employee',
      sortable: false,
      align: 'start',
    },
    {
      title: 'Date',
      key: 'date',
      sortable: false,
      align: 'start',
    },
    {
      title: 'AM - Time In',
      key: 'am_time_in',
      sortable: false,
      align: 'start',
    },
    {
      title: 'AM - Time Out',
      key: 'am_time_out',
      sortable: false,
      align: 'start',
    },
    {
      title: 'PM - Time In',
      key: 'pm_time_in',
      sortable: false,
      align: 'start',
    },
    {
      title: 'PM - Time Out',
      key: 'pm_time_out',
      sortable: false,
      align: 'start',
    },
    {
      title: 'Actions',
      key: 'actions',
      sortable: false,
      align: 'center',
    },
  ]
  const tableHeaders = ref<TableHeader[]>(tableHeadersDefault)
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    employee_id: null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Attendance | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: Attendance) => {
    itemData.value = item
    isDialogVisible.value = true
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

  const onFilterItems = () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = tableHeadersDefault.slice(1)
    else tableHeaders.value = tableHeadersDefault

    onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await attendancesStore.getAttendancesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

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
    isDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onAdd,
    onUpdate,
    onDelete,
    onConfirmDelete,
    onFilterItems,
    onLoadItems,
    attendancesStore,
    employeesStore,
  }
}
