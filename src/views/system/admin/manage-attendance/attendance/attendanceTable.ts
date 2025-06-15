import { type Attendance, useAttendanceStore } from '@/stores/attendances'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'

export function useAttendanceTable() {
  const attendanceStore = useAttendanceStore()
  const employeeStore = useEmployeesStore()

  // States
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

  const onFilterItems = () => {
    onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await attendanceStore.getAttendancesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  onMounted(async () => {
    if (employeeStore.employees.length === 0) await employeeStore.getEmployees()
  })

  // Expose State and Actions
  return {
    tableOptions,
    tableFilters,
    isDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onAdd,
    onUpdate,
    onFilterItems,
    onLoadItems,
    attendanceStore,
    employeeStore,
  }
}
