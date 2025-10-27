import {
  type CashAdjustment,
  type CashAdjustmentTableFilter,
  useCashAdjustmentsStore,
} from '@/stores/cashAdjustments'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { onMounted, ref, watch } from 'vue'

export function useCashAdjustmentsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: CashAdjustment | null
    tableOptions: TableOptions
    tableFilters: CashAdjustmentTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const cashAdjustmentsStore = useCashAdjustmentsStore()
  const employeesStore = useEmployeesStore()

  // States
  const formDataDefault = {
    employee_id: null,
    adjustment_at: new Date(),
    name: '',
    remarks: '',
    amount: undefined,
  }
  const formData = ref<Partial<CashAdjustment>>({ ...formDataDefault })
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
      ? await cashAdjustmentsStore.updateCashAdjustment(formData.value)
      : await cashAdjustmentsStore.addCashAdjustment(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Cash Add-on.`

      await cashAdjustmentsStore.getCashAdjustmentsTable(props.tableOptions, props.tableFilters)

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
  }
}
