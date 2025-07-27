import { type TripLocation, useTripLocationsStore } from '@/stores/tripLocation'
import { formActionDefault } from '@/utils/helpers/constants'
import { useEmployeesStore } from '@/stores/employees'
import { ref, watch } from 'vue'

export function useLocationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: TripLocation | null
  },
  emit: {
    (event: 'update:isDialogVisible', value: boolean): void
    (event: 'refresh-table', value: undefined): void
  },
) {
  const tripLocationsStore = useTripLocationsStore()
  const employeesStore = useEmployeesStore()

  // State
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
    async (visible) => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData ? { ...props.itemData } : { ...formDataDefault }
      // Fetch employees when dialog opens
      if (visible) {
        await employeesStore.getEmployees()
      }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // Convert form data to match API expectations
    const submitData = {
      ...formData.value,
    }

    const { data, error } = isUpdate.value
      ? await tripLocationsStore.updateTripLocation(submitData)
      : await tripLocationsStore.addTripLocation(submitData)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Location.`

      // Emit event to parent to refresh table after add/update
      emit('refresh-table', undefined)
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
    employees: employeesStore.employees,
  }
}
