import { type Trip, type TripTableFilter, useTripsStore } from '@/stores/trips'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useAuthUserStore } from '@/stores/authUser'
import { ref, watch } from 'vue'

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
  const authUserStore = useAuthUserStore()

  // State
  const formDataDefault = {
    unit_id: undefined as number | undefined,
    trip_location_id: undefined as number | undefined,
    trip_at: undefined as string | undefined,
    materials: '',
    km: undefined as number | undefined,
    trip_no: undefined as number | undefined,
    per_trip: undefined as number | undefined,
    employee_id: undefined as number | undefined,
    description: '',
  }
  // Extend Trip type to allow trip_at for form usage
  type TripWithTripAt = Trip & { trip_at?: string }
  const formData = ref<Partial<TripWithTripAt>>({ ...formDataDefault })
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

    // Kuhaon ang user_id gikan sa authUserStore
    const submitData = {
      ...formData.value,
      unit_id: formData.value.unit_id || undefined,
      trip_location_id: formData.value.trip_location_id || undefined,
      employee_id: formData.value.employee_id || undefined,
      user_id: authUserStore.userData?.id,
    }

    const { data, error } = isUpdate.value
      ? await tripsStore.updateTrip(submitData)
      : await tripsStore.addTrip(submitData)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        // Error message handling "I-check nato if naa bay message ang error, else generic error"
        formMessage: (error && typeof error === 'object' && 'message' in error)
          ? (error as { message: string }).message
          : 'Unknown error occurred.',
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
