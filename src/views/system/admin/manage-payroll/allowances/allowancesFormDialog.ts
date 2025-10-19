import {
  type Allowance,
  type AllowanceForm,
  type AllowanceTableFilter,
  useAllowancesStore,
} from '@/stores/allowances'
import { useTripLocationsStore } from '@/stores/tripLocations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref, watch } from 'vue'

export function useAllowancesFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Allowance | null
    tableOptions: TableOptions
    tableFilters: AllowanceTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const allowancesStore = useAllowancesStore()
  const employeesStore = useEmployeesStore()
  const tripLocationsStore = useTripLocationsStore()

  // States
  const formDataDefault = {
    employee_id: null,
    trip_location_id: null,
    trip_range_at: [new Date()],
    activities: '',
    amount: undefined,
  }
  const formData = ref<Partial<AllowanceForm>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData
        ? { ...props.itemData, trip_range_at: [new Date(props.itemData.trip_at)] }
        : { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = isUpdate.value
      ? await allowancesStore.updateAllowance(formData.value)
      : await allowancesStore.addAllowance(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Allowance.`

      await allowancesStore.getAllowancesTable(props.tableOptions, props.tableFilters)

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
    tripLocationsStore,
  }
}
