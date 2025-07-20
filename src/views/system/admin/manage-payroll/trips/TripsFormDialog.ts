import { type Trip, type TripTableFilter, useTripsStore } from '@/stores/trips'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch, computed } from 'vue'

export function useTripsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Trip | null
    tableOptions: TableOptions
    tableFilters: TripTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const tripsStore = useTripsStore()

  // State
  const formDataDefault = {
    unit_id: null as any,
    trip_location_id: null as any,
    date: null as string | null,
    materials: '',
    km: null as number | null,
    trip_no: null as number | null,
    per_trip: null as number | null,
    employee_id: null as any,
    user_id: null as string | null,
    description: '',
  }
  const formData = ref<Partial<Trip>>({ ...formDataDefault })
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

    // Convert form data to match API expectations
    const submitData = {
      ...formData.value,
      unit_id: formData.value.unit_id || null,
      trip_location_id: formData.value.trip_location_id || null,
      employee_id: formData.value.employee_id || null,
    }

    const { data, error } = isUpdate.value
      ? await tripsStore.updateTrip(submitData)
      : await tripsStore.addTrip(submitData)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Trip.`

      await tripsStore.getTripsTable(props.tableOptions, props.tableFilters)
      await tripsStore.getTrips()

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
