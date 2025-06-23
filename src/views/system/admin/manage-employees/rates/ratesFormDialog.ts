import { type Employee, type EmployeeTableFilter, useEmployeesStore } from '@/stores/employees'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useRatesFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Employee | null
    tableOptions: TableOptions
    tableFilters: EmployeeTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const employeesStore = useEmployeesStore()

  // States
  const formDataDefault = {
    daily_rate: undefined,
    is_flexible: false,
    is_insured: false,
  }
  const formData = ref<Partial<Employee>>({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  watch(
    () => props.isDialogVisible,
    () => {
      formData.value = props.itemData ? { ...props.itemData } : { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await employeesStore.updateEmployee(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully Updated Employee Rate.`

      await employeesStore.getEmployeesTable(props.tableOptions, props.tableFilters)

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
    onFormSubmit,
    onFormReset,
  }
}
