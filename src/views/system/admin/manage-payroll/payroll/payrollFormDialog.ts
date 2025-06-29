import { type EmployeeTableFilter } from '@/stores/employees'
import { type EmployeeDeduction } from '@/stores/benefits'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { onMounted, ref, watch } from 'vue'

export function usePayrollFormDialog(
  props: {
    isDialogVisible: boolean
    itemId?: number
    tableOptions: TableOptions
    tableFilters: EmployeeTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // const employeesStore = useEmployeesStore()
  // const benefitsStore = useBenefitsStore()

  // States
  const formDataDefault: Partial<EmployeeDeduction>[] = []
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  watch(
    () => props.isDialogVisible,
    async () => {},
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // formData.value = benefitsStore.benefits.map((benefit, index) => ({
    //   employee_id: props.itemId as number,
    //   benefit_id: benefit.id,
    //   amount: formAmounts.value[index],
    // }))

    // const { data, error } = await benefitsStore.updateDeductionsById(formData.value)

    // if (error) {
    //   formAction.value = {
    //     ...formActionDefault,
    //     formMessage: error.message,
    //     formStatus: 400,
    //     formProcess: false,
    //   }
    // } else if (data) {
    //   formAction.value.formMessage = `Successfully Updated Employee Deduction(s).`

    //   await employeesStore.getEmployeesTable(props.tableOptions, props.tableFilters)

    //   setTimeout(() => {
    //     onFormReset()
    //   }, 1500)
    // }

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
    // if (benefitsStore.benefits.length === 0) await benefitsStore.getBenefits()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    onFormSubmit,
    onFormReset,
  }
}
