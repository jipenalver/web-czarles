import {
  type EmployeeTableFilter,
  // useEmployeesStore
} from '@/stores/employees'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useBenefitsStore } from '@/stores/benefits'
import { onMounted, ref, watch } from 'vue'

export function useDeductionsFormDialog(
  props: {
    isDialogVisible: boolean
    itemId?: number
    tableOptions: TableOptions
    tableFilters: EmployeeTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // const employeesStore = useEmployeesStore()
  const benefitsStore = useBenefitsStore()

  // States
  const formDataDefault = {
    amount: [] as number[],
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  watch(
    () => props.isDialogVisible,
    () => {
      // formData.value = props.itemData ? { ...props.itemData } : { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // const { data, error } = await employeesStore.updateEmployee(formData.value)

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
    if (benefitsStore.benefits.length === 0) await benefitsStore.getBenefits()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    refVForm,
    onFormSubmit,
    onFormReset,
    benefitsStore,
  }
}
