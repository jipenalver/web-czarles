import { type EmployeeTableFilter, useEmployeesStore } from '@/stores/employees'
import { type EmployeeDeduction, useBenefitsStore } from '@/stores/benefits'
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
  const formAddons = ref<number[]>([])
  const formDeductions = ref<number[]>([])
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  watch(
    () => props.isDialogVisible,
    async () => {
      const benefitsData = await benefitsStore.getDeductionsById(props.itemId as number)

      const sortedBenefits = benefitsData.sort((a, b) =>
        a.benefit.benefit.localeCompare(b.benefit.benefit),
      )

      const addons: number[] = []
      const deductions: number[] = []

      sortedBenefits.forEach((item) => {
        if (item.benefit.is_deduction) deductions.push(item.amount)
        else addons.push(item.amount)
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
        amount: formAddons.value[index] || undefined,
      })),
      ...benefitsStore.deductions.map((benefit, index) => ({
        employee_id: props.itemId as number,
        benefit_id: benefit.id,
        amount: formDeductions.value[index] || undefined,
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
        (${formAddons.value.map((amount) => amount || 0).join(', ')}) and deduction benefits
        (${benefitsStore.deductions.map((benefit) => benefit.benefit).join(', ')}) with
        (${formDeductions.value.map((amount) => amount || 0).join(', ')}).`

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
    if (valid) onSubmit()
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
    onFormSubmit,
    onFormReset,
    benefitsStore,
  }
}
