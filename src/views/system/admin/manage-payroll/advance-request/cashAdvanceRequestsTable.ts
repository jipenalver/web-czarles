import { type CashAdvanceRequest, useCashAdvanceRequestsStore } from '@/stores/cashAdvanceRequests'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { getFirstAndLastDateOfMonth } from '@/utils/helpers/dates'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'

export function useCashAdvanceRequestsTable() {
  const cashAdvanceRequestsStore = useCashAdvanceRequestsStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Amount', key: 'amount', align: 'start' },
    { title: 'Description', key: 'description', align: 'start' },
    { title: 'Date Requested', key: 'request_at', align: 'center' },
    { title: 'Status', key: 'status', align: 'center' },
    { title: 'Actions', key: 'actions', sortable: false, align: 'center' },
  ]
  const tableHeaders = ref<TableHeader[]>(baseHeaders)
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    employee_id: null,
    request_at: getFirstAndLastDateOfMonth() as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<CashAdvanceRequest | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: CashAdvanceRequest) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await cashAdvanceRequestsStore.deleteCashAdvanceRequest(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Cash Advance Request.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.request_at = null

    onLoadItems(tableOptions.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await cashAdvanceRequestsStore.getCashAdvanceRequestsTable(
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
    isDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onAdd,
    onUpdate,
    onDelete,
    onConfirmDelete,
    onFilterDate,
    onFilterItems,
    onLoadItems,
    employeesStore,
  }
}
