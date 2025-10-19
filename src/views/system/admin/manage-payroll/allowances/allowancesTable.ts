import { getDateISO, getFirstAndLastDateOfMonth } from '@/utils/helpers/dates'
import { generateCSV, getMoneyText, prepareCSV } from '@/utils/helpers/others'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type Allowance, useAllowancesStore } from '@/stores/allowances'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
// import { useAllowancesPDF } from './pdf/allowancesPDF'
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useAllowancesTable() {
  const date = useDate()

  const allowancesStore = useAllowancesStore()
  const employeesStore = useEmployeesStore()

  // const { isLoadingPDF, formAction: formActionPDF, onExport } = useAllowancesPDF()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Date', key: 'trip_at', align: 'start' },
    { title: 'Location', key: 'trip_location', sortable: false, align: 'start' },
    { title: 'Activities', key: 'activities', align: 'start' },
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
    trip_at: getFirstAndLastDateOfMonth() as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Allowance | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: Allowance) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await allowancesStore.deleteAllowance(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Allowance.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.trip_at = null

    onLoadItems(tableOptions.value)

    await allowancesStore.getAllowancesExport(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)

    await allowancesStore.getAllowancesExport(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await allowancesStore.getAllowancesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-allowances`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = ['Lastname', 'Firstname', 'Middlename', ...defaultHeaders].join(',')

      const csvRows = allowancesStore.allowancesExport.map((item) => {
        const csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),

          item.trip_at ? prepareCSV(date.format(item.trip_at, 'fullDate')) : '',
          prepareCSV(item.trip_location.location),
          prepareCSV(item.activities),
          prepareCSV(getMoneyText(item.amount)),
        ]

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  // const onExportPDF = async () => {
  //   await onExport(tableFilters.value)
  // }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (allowancesStore.allowancesExport.length === 0)
      await allowancesStore.getAllowancesExport(tableOptions.value, tableFilters.value)
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
    // onExportPDF,
    allowancesStore,
    employeesStore,
    // isLoadingPDF,
    // formActionPDF,
  }
}
