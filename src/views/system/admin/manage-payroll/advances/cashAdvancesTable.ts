import { type CashAdvance, useCashAdvancesStore } from '@/stores/cashAdvances'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { generateCSV, prepareCSV } from '@/utils/helpers/others'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { getDateISO } from '@/utils/helpers/dates'
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useCashAdvancesTable() {
  const date = useDate()

  const cashAdvancesStore = useCashAdvancesStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Amount', key: 'amount', align: 'start' },
    { title: 'Description', key: 'description', align: 'start' },
    { title: 'Date Requested', key: 'request_at', align: 'center' },
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
    request_at: null as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<CashAdvance | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: CashAdvance) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await cashAdvancesStore.deleteCashAdvance(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Cash Advance.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.request_at = null

    onLoadItems(tableOptions.value)

    await cashAdvancesStore.getCashAdvancesCSV(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)

    await cashAdvancesStore.getCashAdvancesCSV(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await cashAdvancesStore.getCashAdvancesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-cash-advances`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = ['Lastname', 'Firstname', 'Middlename', ...defaultHeaders].join(',')

      const csvRows = cashAdvancesStore.cashAdvancesCSV.map((item) => {
        const csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),

          prepareCSV(item.amount.toString()),
          prepareCSV(item.description),
          item.request_at ? prepareCSV(date.format(item.request_at, 'fullDate')) : '',
        ]

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (cashAdvancesStore.cashAdvancesCSV.length === 0)
      await cashAdvancesStore.getCashAdvancesCSV(tableOptions.value, tableFilters.value)
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
    onExportCSV,
    cashAdvancesStore,
    employeesStore,
  }
}
