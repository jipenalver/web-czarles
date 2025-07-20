import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { type Trip, useTripsStore } from '@/stores/trips'
import { ref } from 'vue'

export function useTripsTable() {
  const tripsStore = useTripsStore()

  // State
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    search: '',
    unit_id: null as number | null,
    trip_location_id: null as number | null,
    employee_id: null as number | null,
    date_from: null as string | null,
    date_to: null as string | null,
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
      await tripsStore.getTrips()
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onSearchItems = () => {
    if (
      tableFilters.value.search?.length >= 2 ||
      tableFilters.value.search?.length == 0 ||
      tableFilters.value.search === null ||
      tableFilters.value.unit_id !== null ||
      tableFilters.value.trip_location_id !== null ||
      tableFilters.value.employee_id !== null ||
      tableFilters.value.date_from !== null ||
      tableFilters.value.date_to !== null
    )
      onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await tripsStore.getTripsTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

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
    onDelete,
    onConfirmDelete,
    onSearchItems,
    onLoadItems,
    tripsStore,
  }
}