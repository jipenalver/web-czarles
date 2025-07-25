import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { type Trip, useTripsStore } from '@/stores/trips'
import { ref } from 'vue'

export function useTripsTable() {
  const tripsStore = useTripsStore()

  // States
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    search: '',
    unit_id: undefined as number | undefined,
    trip_location_id: undefined as number | undefined,
    employee_id: undefined as number | undefined,
    trip_at: [] as string[],
  })
  const isDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Trip | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  // Add Trip - with error handling
  const onAdd = () => {
    try {
      itemData.value = null
      isDialogVisible.value = true
    } catch (err) {
      // Error pag open dialog, rare pero handle lang gihapon
      formAction.value.formMessage = 'Error opening add trip dialog: ' + (err instanceof Error ? err.message : String(err))
      formAction.value.formStatus = 400
      formAction.value.formAlert = true
    }
  }

  // Update Trip - with error handling
  const onUpdate = (item: Trip) => {
    try {
      itemData.value = item
      isDialogVisible.value = true
    } catch (err) {
      formAction.value.formMessage = 'Error opening update dialog: ' + (err instanceof Error ? err.message : String(err))
      formAction.value.formStatus = 400
      formAction.value.formAlert = true
    }
  }

  // Delete Trip - with error handling
  const onDelete = (id: number) => {
    try {
      deleteId.value = id
      isConfirmDeleteDialog.value = true
    } catch (err) {
      formAction.value.formMessage = 'Error preparing delete: ' + (err instanceof Error ? err.message : String(err))
      formAction.value.formStatus = 400
      formAction.value.formAlert = true
    }
  }

  // Confirm Delete - async with error handling
  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }
    try {
      const { data, error } = await tripsStore.deleteTrip(deleteId.value)

      if (error) {
        // Error handling, basin walay message property, so safe access ta
        formAction.value.formMessage = (error as { message?: string }).message || 'Unknown error'
        formAction.value.formStatus = 400
      } else if (data) {
        formAction.value.formMessage = 'Successfully Deleted Trip.'
        try {
          await onLoadItems(tableOptions.value)
          await tripsStore.getTrips()
        } catch (loadErr) {
          // Error pag reload, i-report lang pud
          formAction.value.formMessage = 'Trip deleted, pero error pag reload: ' + (loadErr instanceof Error ? loadErr.message : String(loadErr))
        }
      }
    } catch (err) {
      formAction.value.formMessage = 'Error deleting trip: ' + (err instanceof Error ? err.message : String(err))
      formAction.value.formStatus = 400
    } finally {
      formAction.value.formAlert = true
      formAction.value.formProcess = false
    }
  }

  // Filter Items - with error handling
  const onFilterItems = () => {
    try {
      onLoadItems(tableOptions.value)
    } catch (err) {
      formAction.value.formMessage = 'Error filtering trips: ' + (err instanceof Error ? err.message : String(err))
      formAction.value.formStatus = 400
      formAction.value.formAlert = true
    }
  }

  // Load Items - async with error handling
  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true
    try {
      await tripsStore.getTripsTable({ page, itemsPerPage, sortBy }, tableFilters.value)
    } catch (err) {
      // Error pag load sa trips table
      formAction.value.formMessage = 'Error loading trips: ' + (err instanceof Error ? err.message : String(err))
      formAction.value.formStatus = 400
      formAction.value.formAlert = true
    } finally {
      tableOptions.value.isLoading = false
    }
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
    onFilterItems,
    onLoadItems,
    tripsStore,
  }
}