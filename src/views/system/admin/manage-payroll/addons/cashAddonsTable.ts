import { getDateISO, getFirstAndLastDateOfMonth } from '@/utils/helpers/dates'
import { generateCSV, getMoneyText, prepareCSV } from '@/utils/helpers/others'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type CashAddon, useCashAddonsStore } from '@/stores/cashAddons'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useCashAddonsTable() {
  const date = useDate()

  const cashAddonsStore = useCashAddonsStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Date', key: 'addon_at', align: 'start' },
    { title: 'Name', key: 'name', align: 'start' },
    { title: 'Remarks', key: 'remarks', align: 'start' },
    { title: 'Amount', key: 'amount', sortable: false, align: 'center' },
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
    addon_at: getFirstAndLastDateOfMonth() as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<CashAddon | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: CashAddon) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await cashAddonsStore.deleteCashAddon(deleteId.value)

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
    if (isCleared) tableFilters.value.addon_at = null

    onLoadItems(tableOptions.value)

    await cashAddonsStore.getCashAddonsExport(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)

    await cashAddonsStore.getCashAddonsExport(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await cashAddonsStore.getCashAddonsTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-cash-addons`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = ['Lastname', 'Firstname', 'Middlename', ...defaultHeaders].join(',')

      const csvRows = cashAddonsStore.cashAddonsExport.map((item) => {
        const csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),

          item.addon_at ? prepareCSV(date.format(item.addon_at, 'fullDate')) : '',
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
    if (cashAddonsStore.cashAddonsExport.length === 0)
      await cashAddonsStore.getCashAddonsExport(tableOptions.value, tableFilters.value)
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
    cashAddonsStore,
    employeesStore,
  }
}
