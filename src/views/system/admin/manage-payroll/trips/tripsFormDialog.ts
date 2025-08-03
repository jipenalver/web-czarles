import { type Trip, type TripTableFilter, useTripsStore } from '@/stores/trips'
import { useTripLocationsStore } from '@/stores/tripLocations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { onMounted, ref, watch } from 'vue'

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
  const employeesStore = useEmployeesStore()
  const unitsStore = useUnitsStore()
  const tripLocationsStore = useTripLocationsStore()

  // States
  const formDataDefault = {
    employee_id: null,
    unit_id: null,
    trip_location_id: null,
    trip_at: new Date(),
    materials: '',
    km: undefined,
    trip_no: undefined,
    per_trip: undefined,
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

    const { data, error } = isUpdate.value
      ? await tripsStore.updateTrip(formData.value)
      : await tripsStore.addTrip(formData.value)

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

  onMounted(async () => {
    if (employeesStore.employees.length === 0) await employeesStore.getEmployees()
    if (unitsStore.units.length === 0) await unitsStore.getUnits()
    if (tripLocationsStore.tripLocations.length === 0) await tripLocationsStore.getTripLocations()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
    employeesStore,
    unitsStore,
    tripLocationsStore,
  }
}
