import {
  type TripLocation,
  type TripLocationTableFilter,
  useTripLocationsStore,
} from '@/stores/tripLocations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useTripLocationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: TripLocation | null
    tableOptions: TableOptions
    tableFilters: TripLocationTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const tripLocationsStore = useTripLocationsStore()

  // States
  const formDataDefault = {
    location: '',
    description: '',
  }
  const formData = ref<Partial<TripLocation>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData ? { ...props.itemData } : { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = isUpdate.value
      ? await tripLocationsStore.updateTripLocation(formData.value)
      : await tripLocationsStore.addTripLocation(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Trip Location.`

      await tripLocationsStore.getTripLocationsTable(props.tableOptions, props.tableFilters)
      await tripLocationsStore.getTripLocations()

      setTimeout(() => {
        onFormReset()
      }, 1500)
    }

    formAction.value.formAlert = true
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    formData.value = { ...formDataDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
  }
}
