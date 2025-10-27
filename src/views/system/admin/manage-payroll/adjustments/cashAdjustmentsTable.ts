import { type CashAdjustment, useCashAdjustmentsStore } from '@/stores/cashAdjustments'
import { getDateISO, getFirstAndLastDateOfMonth } from '@/utils/helpers/dates'
import { generateCSV, getMoneyText, prepareCSV } from '@/utils/helpers/others'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useCashAdjustmentsTable() {
  const date = useDate()

  const cashAdjustmentsStore = useCashAdjustmentsStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Date', key: 'adjustment_at', align: 'start' },
    { title: 'Name', key: 'name', align: 'start' },
    { title: 'Remarks', key: 'remarks', align: 'start' },
    { title: 'Amount', key: 'amount', align: 'center' },
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
    adjustment_at: getFirstAndLastDateOfMonth() as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<CashAdjustment | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: CashAdjustment) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await cashAdjustmentsStore.deleteCashAdjustment(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Salary Add-on.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.adjustment_at = null

    onLoadItems(tableOptions.value)

    await cashAdjustmentsStore.getCashAdjustmentsExport(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)

    await cashAdjustmentsStore.getCashAdjustmentsExport(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await cashAdjustmentsStore.getCashAdjustmentsTable(
      { page, itemsPerPage, sortBy },
      tableFilters.value,
    )

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-cash-adjustments`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = ['Lastname', 'Firstname', 'Middlename', ...defaultHeaders].join(',')

      const csvRows = cashAdjustmentsStore.cashAdjustmentsExport.map((item) => {
        const csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),

          item.adjustment_at ? prepareCSV(date.format(item.adjustment_at, 'fullDate')) : '',
          prepareCSV(item.name),
          prepareCSV(item.remarks),
          prepareCSV(getMoneyText(item.amount)),
        ]

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (cashAdjustmentsStore.cashAdjustmentsExport.length === 0)
      await cashAdjustmentsStore.getCashAdjustmentsExport(tableOptions.value, tableFilters.value)
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
    cashAdjustmentsStore,
    employeesStore,
  }
}
