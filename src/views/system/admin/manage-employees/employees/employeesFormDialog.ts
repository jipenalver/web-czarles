import { type Employee, type EmployeeTableFilter, useEmployeesStore } from '@/stores/employees'
import { useDesignationsStore } from '@/stores/designations'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useAreasStore } from '@/stores/areas'
import { onMounted, ref, watch } from 'vue'

export function useEmployeesFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: Employee | null
    tableOptions: TableOptions
    tableFilters: EmployeeTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const employeesStore = useEmployeesStore()
  const designationsStore = useDesignationsStore()
  const areasStore = useAreasStore()

  // States
  const formDataDefault = {
    firstname: '',
    middlename: '',
    lastname: '',
    email: '',
    phone: '',
    hired_at: '',
    birthdate: '',
    address: '',
    tin_no: '',
    sss_no: '',
    pagibig_no: '',
    philhealth_no: '',
    is_field_staff: false,
    is_permanent: false,
    designation_id: null,
    area_origin_id: null,
    area_assignment_id: null,
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
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
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

  onMounted(async () => {
    if (designationsStore.designations.length === 0) await designationsStore.getDesignations()
    if (areasStore.areas.length === 0) await areasStore.getAreas()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    isUpdate,
    onFormSubmit,
    onFormReset,
    designationsStore,
    areasStore,
  }
}
