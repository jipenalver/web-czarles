import { type TripLocation, useTripLocationsStore } from '@/stores/tripLocation'
import { formActionDefault } from '@/utils/helpers/constants'
import { ref } from 'vue'

export function useLocationsTable() {
  const tripLocationsStore = useTripLocationsStore()

  // State
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  // Table filters: search, location, description
  const tableFilters = ref({
    search: '',
    location: '',
    description: '',
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<TripLocation | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: TripLocation) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await tripLocationsStore.deleteTripLocation(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Location.'
      await onLoadItems(tableOptions.value)
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  // Search and pagination integration (server-side)
  // Bisaya-English: trigger table reload kung naay changes sa filters
  const onSearchItems = () => {
    // Allow search if any filter is set (search, location, description)
    const hasSearch = tableFilters.value.search?.length >= 2 || tableFilters.value.search?.length === 0
    const hasLocation = tableFilters.value.location?.length >= 2 || tableFilters.value.location?.length === 0
    const hasDescription = tableFilters.value.description?.length >= 2 || tableFilters.value.description?.length === 0
    if (hasSearch || hasLocation || hasDescription) {
      onLoadItems(tableOptions.value)
    }
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: any) => {
    tableOptions.value.isLoading = true
    // Bisaya-English: pass all filters to store (search, location, description)
    await tripLocationsStore.getTripLocationsTable(
      {
        page,
        itemsPerPage,
        sortBy: sortBy && sortBy.length > 0 ? sortBy : [{ key: 'location', order: 'asc' }],
      },
      {
        search: tableFilters.value.search,
        location: tableFilters.value.location,
        description: tableFilters.value.description,
      }
    )
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
    tripLocationsStore,
  }
}
