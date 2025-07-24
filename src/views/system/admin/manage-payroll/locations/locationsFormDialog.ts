
import { type TripLocation, type TripLocationTableFilter, useTripLocationsStore } from '@/stores/tripLocation'
import { formActionDefault } from '@/utils/helpers/constants'
import type { TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'
export function useLocationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: TripLocation | null
    tableOptions: TableOptions
    tableFilters: TripLocationTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void | ((event: 'refresh-table') => void),
) {
  const tripLocationsStore = useTripLocationsStore()

  // State variables diri ta magbantay sa form data ug action state
  const formDataDefault = {
    location: '',
    description: '',
  }
  const formData = ref<Partial<TripLocation>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  // Watch dialog visibility, reset or populate form depende kung edit or add
  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData ? { ...props.itemData } : { ...formDataDefault }
    },
  )

  // Actions
  // --- Form submit logic, gi-copy gikan sa unitsFormDialog.ts para consistency ---
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // Call store action depende kung update or add
    const { data, error } = isUpdate.value
      ? await tripLocationsStore.updateTripLocation(formData.value)
      : await tripLocationsStore.addTripLocation(formData.value)

    if (error) {
      // Error handling, ipakita ang error message
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      // Success, ipakita success message
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Location.`

      // Refresh table ug locations list after add/update
      await tripLocationsStore.getTripLocationsTable(props.tableOptions, props.tableFilters)
      await tripLocationsStore.getTripLocations()

      setTimeout(() => {
        onFormReset()
      }, 1500)
    }

    formAction.value.formAlert = true
  }

  // Trigger Validators, check valid ba ang form before submit
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  // Reset form, close dialog ra, ang refresh handled by store fetch
  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    formData.value = { ...formDataDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions, para magamit sa component
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
  }
}
