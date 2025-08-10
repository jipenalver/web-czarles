import {
  type Utilization,
  type UtilizationTableFilter,
  useUtilizationsStore,
} from '@/stores/utilizations'
import { useTripLocationsStore } from '@/stores/tripLocations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { useUnitsStore } from '@/stores/units'
import { onMounted, ref, watch } from 'vue'

export function useUtilizationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Utilization | null
    tableOptions: TableOptions
    tableFilters: UtilizationTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const utilizationsStore = useUtilizationsStore()
  const employeesStore = useEmployeesStore()
  const unitsStore = useUnitsStore()
  const tripLocationsStore = useTripLocationsStore()

  // States
  const formDataDefault = {
    employee_id: null,
    unit_id: null,
    trip_location_id: null,
    utilization_at: new Date(),
    am_time_in: '',
    am_time_out: '',
    pm_time_in: '',
    pm_time_out: '',
    overtime_in: '',
    overtime_out: '',
    hours: undefined,
    per_hour: undefined,
  }
  const formData = ref<Partial<Utilization>>({ ...formDataDefault })
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
      ? await utilizationsStore.updateUtilization(formData.value)
      : await utilizationsStore.addUtilization(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Fuel Utilization.`

      await utilizationsStore.getUtilizationsTable(props.tableOptions, props.tableFilters)

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
