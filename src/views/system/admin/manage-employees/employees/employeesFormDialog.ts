import { type Employee, useEmployeesStore } from '@/stores/employees'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref, watch } from 'vue'

export function useDesignationsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Employee | null
    tableOptions: TableOptions
    tableFilters: { search: string }
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const employeesStore = useEmployeesStore()

  // States
  const formDataDefault = {
    firstname: '',
    middlename: '',
    lastname: '',
    email: '',
    phone: '',
    is_field_staff: false,
    hired_at: '',
    birthdate: '',
    tin_no: '',
    sss_no: '',
    pagibig_no: '',
    philhealth_no: '',
    id_no: '',
    address: '',
    designation_id: 0,
  }
  const formData = ref<Partial<Employee>>({ ...formDataDefault })
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
      ? await employeesStore.updateEmployee(formData.value)
      : await employeesStore.addEmployee(formData.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Employee.`

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
    isUpdate,
    onFormSubmit,
    onFormReset,
  }
}
