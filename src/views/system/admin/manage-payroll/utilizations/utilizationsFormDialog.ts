import {
  type Utilization,
  type UtilizationTableFilter,
  useUtilizationsStore,
} from '@/stores/utilizations'
import {
  getDate,
  getDateISO,
  getDateTimeISO,
  getTime24Hour,
  prepareDateTime,
} from '@/utils/helpers/dates'
import { getOvertimeHoursDecimal, getWorkHoursDecimal } from '@/utils/helpers/attendance'
import { useTripLocationsStore } from '@/stores/tripLocations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { computed, onMounted, ref, watch } from 'vue'
import { useUnitsStore } from '@/stores/units'

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
    overtime_hours: undefined,
  }
  const formData = ref<Partial<Utilization>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isUpdate = ref(false)
  const isOvertimeApplied = ref(false)

  watch(
    () => props.isDialogVisible,
    () => {
      isUpdate.value = props.itemData ? true : false
      formData.value = props.itemData
        ? {
            ...props.itemData,
            am_time_in: getTime24Hour(props.itemData.am_time_in) as string,
            am_time_out: getTime24Hour(props.itemData.am_time_out) as string,
            pm_time_in: getTime24Hour(props.itemData.pm_time_in) as string,
            pm_time_out: getTime24Hour(props.itemData.pm_time_out) as string,
            overtime_in: getTime24Hour(props.itemData.overtime_in) as string,
            overtime_out: getTime24Hour(props.itemData.overtime_out) as string,
          }
        : { ...formDataDefault }
      isOvertimeApplied.value = formData.value.overtime_hours ? true : false
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const baseDate = getDate(formData.value.utilization_at as string)

    const prepareTimeField = (timeValue: string, baseDate: string): string | null => {
      if (!timeValue || timeValue.trim() === '') return null
      return prepareDateTime(`${baseDate} ${timeValue}`)
    }

    const newFormData = {
      ...formData.value,
      am_time_in: prepareTimeField(formData.value.am_time_in as string, baseDate as string),
      am_time_out: prepareTimeField(formData.value.am_time_out as string, baseDate as string),
      pm_time_in: prepareTimeField(formData.value.pm_time_in as string, baseDate as string),
      pm_time_out: prepareTimeField(formData.value.pm_time_out as string, baseDate as string),
      overtime_in: prepareTimeField(formData.value.overtime_in as string, baseDate as string),
      overtime_out: prepareTimeField(formData.value.overtime_out as string, baseDate as string),
    }

    const { data, error } = isUpdate.value
      ? await utilizationsStore.updateUtilization(newFormData)
      : await utilizationsStore.addUtilization(newFormData)

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

  const computedWorkHours = computed(() => {
    const { am_time_in, am_time_out, pm_time_in, pm_time_out, utilization_at } = formData.value

    const baseDate = getDateISO(utilization_at as string)

    return getWorkHoursDecimal(
      getDateTimeISO(`${baseDate} ${am_time_in}`),
      getDateTimeISO(`${baseDate} ${am_time_out}`),
      getDateTimeISO(`${baseDate} ${pm_time_in}`),
      getDateTimeISO(`${baseDate} ${pm_time_out}`),
      false,
      true,
    )
  })

  const computedOvertimeHours = computed(() => {
    if (!isOvertimeApplied.value) return undefined

    const { overtime_in, overtime_out } = formData.value

    const baseDate = getDateISO(formData.value.utilization_at as string)

    return getOvertimeHoursDecimal(
      getDateTimeISO(`${baseDate} ${overtime_in}`),
      getDateTimeISO(`${baseDate} ${overtime_out}`),
    )
  })

  watch(computedWorkHours, (newHours) => (formData.value.hours = newHours), { immediate: true })

  watch(computedOvertimeHours, (newHours) => (formData.value.overtime_hours = newHours), {
    immediate: true,
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    isOvertimeApplied,
    onFormSubmit,
    onFormReset,
    employeesStore,
    unitsStore,
    tripLocationsStore,
  }
}
