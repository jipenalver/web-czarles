import { getDateISO, getFirstAndLastDateOfMonth } from '@/utils/helpers/dates'
import { generateCSV, getMoneyText, prepareCSV } from '@/utils/helpers/others'
import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { formActionDefault } from '@/utils/helpers/constants'
import { type Trip, useTripsStore } from '@/stores/trips'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useTripsTable() {
  const date = useDate()

  const tripsStore = useTripsStore()
  const employeesStore = useEmployeesStore()

  // States
  const baseHeaders: TableHeader[] = [
    { title: 'Employee', key: 'employee', sortable: false, align: 'start' },
    { title: 'Unit', key: 'unit', sortable: false, align: 'start' },
    { title: 'Date', key: 'trip_at', align: 'start' },
    { title: 'Location-Destination', key: 'trip_location', sortable: false, align: 'start' },
    { title: 'Materials Loaded', key: 'materials', align: 'start' },
    { title: 'KM', key: 'km', align: 'start' },
    { title: 'No. of Trips', key: 'trip_no', align: 'start' },
    { title: 'Per Trip', key: 'per_trip', align: 'start' },
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
    trip_at: getFirstAndLastDateOfMonth() as Date[] | null,
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Trip | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: Trip) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await tripsStore.deleteTrip(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Trip.'

      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterDate = async (isCleared = false) => {
    if (isCleared) tableFilters.value.trip_at = null

    onLoadItems(tableOptions.value)

    await tripsStore.getTripsCSV(tableOptions.value, tableFilters.value)
  }

  const onFilterItems = async () => {
    if (tableFilters.value.employee_id !== null) tableHeaders.value = baseHeaders.slice(1)
    else tableHeaders.value = baseHeaders

    onLoadItems(tableOptions.value)

    await tripsStore.getTripsCSV(tableOptions.value, tableFilters.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await tripsStore.getTripsTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = `${getDateISO(new Date())}-trips`

    const csvData = () => {
      const defaultHeaders = tableHeaders.value
        .filter(({ title }) => !['Actions', 'Employee'].includes(title))
        .map(({ title }) => title)

      const csvHeaders = ['Lastname', 'Firstname', 'Middlename', ...defaultHeaders].join(',')

      const csvRows = tripsStore.tripsCSV.map((item) => {
        const csvData = [
          prepareCSV(item.employee.lastname),
          prepareCSV(item.employee.firstname),
          prepareCSV(item.employee.middlename),

          prepareCSV(item.unit.name),
          item.trip_at ? prepareCSV(date.format(item.trip_at, 'fullDate')) : '',
          prepareCSV(item.trip_location.location),
          prepareCSV(item.materials),
          prepareCSV(item.km.toString()),
          prepareCSV(item.trip_no.toString()),
          prepareCSV(getMoneyText(item.per_trip)),
          prepareCSV(getMoneyText(item.trip_no * item.per_trip)),
        ]

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (tripsStore.tripsCSV.length === 0)
      await tripsStore.getTripsCSV(tableOptions.value, tableFilters.value)
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
    tripsStore,
    employeesStore,
  }
}
