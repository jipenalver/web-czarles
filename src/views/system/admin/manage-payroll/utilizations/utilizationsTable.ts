import { getDateISO, getFirstAndLastDateOfMonth, getTime } from '@/utils/helpers/dates'
import { generateCSV, getMoneyText, prepareCSV } from '@/utils/helpers/others'
import { type Utilization, useUtilizationsStore } from '@/stores/utilizations'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
// import { useTripsPDF } from './pdf/tripsPDF' // PULIHI RANI MARDE
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useUtilizationsTable() {
  const date = useDate()

  const utilizationsStore = useUtilizationsStore()
  const employeesStore = useEmployeesStore()

  // const { isLoadingPDF, formAction: formActionPDF, onExport } = useTripsPDF() // PULIHI RANI MARDE

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Unit', key: 'unit', sortable: false, align: 'start' },
    { title: 'Date', key: 'utilization_at', align: 'start' },
    { title: 'Location', key: 'trip_location', sortable: false, align: 'start' },
    { title: 'Hours', key: 'hours', align: 'start' },
    { title: 'Per Hour', key: 'per_hour', align: 'start' },
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
    utilization_at: getFirstAndLastDateOfMonth() as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Utilization | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: Utilization) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await utilizationsStore.deleteUtilization(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Utilization.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.utilization_at = null

    onLoadItems(tableOptions.value)

    await utilizationsStore.getUtilizationsExport(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)

    await utilizationsStore.getUtilizationsExport(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await utilizationsStore.getUtilizationsTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-trips`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = [
        'Lastname',
        'Firstname',
        'Middlename',
        ...defaultHeaders,
        'Overtime Hours',
        'Overtime Amount',
        'AM - Time In',
        'AM - Time Out',
        'PM - Time In',
        'PM - Time Out',
        'Overtime In',
        'Overtime Out',
      ].join(',')

      const csvRows = utilizationsStore.utilizationsExport.map((item) => {
        const csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),

          prepareCSV(item.unit.name),
          item.utilization_at ? prepareCSV(date.format(item.utilization_at, 'fullDate')) : '',
          prepareCSV(item.trip_location.location),
          prepareCSV(item.hours.toString()),
          prepareCSV(getMoneyText(item.per_hour)),
          prepareCSV(getMoneyText(item.hours * item.per_hour)),
          item.overtime_hours ? item.overtime_hours.toString() : '',
          prepareCSV(getMoneyText(item.overtime_hours * item.per_hour)),

          item.am_time_in ? getTime(item.am_time_in) : '',
          item.am_time_out ? getTime(item.am_time_out) : '',
          item.pm_time_in ? getTime(item.pm_time_in) : '',
          item.pm_time_out ? getTime(item.pm_time_out) : '',
          item.overtime_in ? getTime(item.overtime_in) : '',
          item.overtime_out ? getTime(item.overtime_out) : '',
        ]

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  // const onExportPDF = async () => {
  //   await onExport(tableFilters.value) // PULIHI RANI MARDE
  // }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (utilizationsStore.utilizationsExport.length === 0)
      await utilizationsStore.getUtilizationsExport(tableOptions.value, tableFilters.value)
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
    // onExportPDF, // PULIHI RANI MARDE
    utilizationsStore,
    employeesStore,
    // isLoadingPDF, // PULIHI RANI MARDE
    // formActionPDF, // PULIHI RANI MARDE
  }
}
