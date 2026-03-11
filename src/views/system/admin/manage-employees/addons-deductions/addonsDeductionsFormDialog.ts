import {
  type EmployeeDeduction,
  type EmployeeDeductionForm,
  useBenefitsStore,
} from '@/stores/benefits'
import { type EmployeeTableFilter, useEmployeesStore } from '@/stores/employees'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useLogsStore } from '@/stores/logs'
import { onMounted, ref, watch } from 'vue'

export function useAddonsDeductionsFormDialog(
  props: {
    isDialogVisible: boolean
    itemId?: number
    tableOptions: TableOptions
    tableFilters: EmployeeTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const employeesStore = useEmployeesStore()
  const benefitsStore = useBenefitsStore()
  const logsStore = useLogsStore()

  // States
  const formDataDefault: Partial<EmployeeDeduction>[] = []
  const formData = ref({ ...formDataDefault })
  const formAddons = ref<EmployeeDeductionForm>({ amount: [], is_quincena: [] })
  const formDeductions = ref<EmployeeDeductionForm>({ amount: [], is_quincena: [] })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()
  const isConfirmSubmitDialog = ref(false)

  watch(
    () => props.isDialogVisible,
    async () => {
      const benefitsData = await benefitsStore.getDeductionsById(props.itemId as number)

      const sortedBenefits = benefitsData.sort((a, b) =>
        a.benefit.benefit.localeCompare(b.benefit.benefit),
      )

      const addons: EmployeeDeductionForm = { amount: [], is_quincena: [] }
      const deductions: EmployeeDeductionForm = { amount: [], is_quincena: [] }

      sortedBenefits.forEach((item) => {
        if (item.benefit.is_deduction) {
          deductions.amount.push(item.amount)
          deductions.is_quincena.push(item.is_quincena)
        } else {
          addons.amount.push(item.amount)
          addons.is_quincena.push(item.is_quincena)
        }
      })

      formAddons.value = addons
      formDeductions.value = deductions
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    formData.value = [
      ...benefitsStore.addons.map((benefit, index) => ({
        employee_id: props.itemId as number,
        benefit_id: benefit.id,
        amount: formAddons.value.amount[index] || undefined,
        is_quincena: formAddons.value.is_quincena[index],
      })),
      ...benefitsStore.deductions.map((benefit, index) => ({
        employee_id: props.itemId as number,
        benefit_id: benefit.id,
        amount: formDeductions.value.amount[index] || undefined,
        is_quincena: formDeductions.value.is_quincena[index],
      })),
    ]

    const { data, error } = await benefitsStore.updateDeductionsById(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully Updated Employee Deduction(s).`

      const description = `Updated employee add-on benefits
        (${benefitsStore.addons.map((benefit) => benefit.benefit).join(', ')}) with
        (${formAddons.value.amount.map((amount) => amount || 0).join(', ')}) and deduction benefits
        (${benefitsStore.deductions.map((benefit) => benefit.benefit).join(', ')}) with
        (${formDeductions.value.amount.map((amount) => amount || 0).join(', ')}).`

      await logsStore.addLog({
        type: 'benefits',
        employee_id: props.itemId,
        description,
      })

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
    if (valid) isConfirmSubmitDialog.value = true
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    formData.value = { ...formDataDefault }
    emit('update:isDialogVisible', false)
  }

  onMounted(async () => {
    if (benefitsStore.addons.length === 0 || benefitsStore.deductions.length === 0)
      await benefitsStore.getBenefits()
  })

  // Expose State and Actions
  return {
    formData,
    formAction,
    formAddons,
    formDeductions,
    refVForm,
    isConfirmSubmitDialog,
    onSubmit,
    onFormSubmit,
    onFormReset,
    benefitsStore,
  }
}
