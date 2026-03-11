/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  type CashAdvanceRequest,
  type CashAdvanceRequestTableFilter,
  useCashAdvanceRequestsStore,
} from '@/stores/cashAdvanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { useCashAdvancesStore } from '@/stores/cashAdvances'
import { type TableOptions } from '@/utils/helpers/tables'
import { useLogsStore } from '@/stores/logs'
import { ref, watch } from 'vue'

export function useCashAdvanceStatusFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: CashAdvanceRequest | null
    tableOptions: TableOptions
    tableFilters: CashAdvanceRequestTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const cashAdvanceRequestsStore = useCashAdvanceRequestsStore()
  const cashAdvancesStore = useCashAdvancesStore()
  const logsStore = useLogsStore()

  // States
  const formDataDefault = {
    status: 'Pending' as 'Pending' | 'Approved' | 'Rejected',
    reason: '',
  }
  const formData = ref({ ...formDataDefault })
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  watch(
    () => props.isDialogVisible,
    () => {
      formData.value = { ...formDataDefault }
    },
  )

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    if (formData.value.status === 'Approved') {
      const { id, created_at, employee, status, ...newFormData } = {
        ...props.itemData,
      }

      const { data, error } = await cashAdvancesStore.addCashAdvance(newFormData)

      if (error) {
        formAction.value = {
          ...formActionDefault,
          formMessage: error.message,
          formStatus: 400,
          formProcess: false,
        }
      } else if (data) {
        formAction.value.formMessage = 'Approved Cash Advance Request.'

        await cashAdvanceRequestsStore.deleteCashAdvanceRequest(props.itemData?.id as number)
      }
    } else if (formData.value.status === 'Rejected') {
      const { data, error } = await cashAdvanceRequestsStore.updateCashAdvanceRequest({
        ...props.itemData,
        status: formData.value.status,
      } as CashAdvanceRequest)

      if (error) {
        formAction.value = {
          ...formActionDefault,
          formMessage: error.message,
          formStatus: 400,
          formProcess: false,
        }
      } else if (data) {
        formAction.value.formMessage = 'Rejected Cash Advance Request.'

        await logsStore.addLog({
          type: 'cash advance',
          employee_id: props.itemData?.employee_id as number,
          cash_advance_request_id: props.itemData?.id as number,
          description: formData.value.reason,
        })
      }
    }

    await cashAdvanceRequestsStore.getCashAdvanceRequestsTable(
      props.tableOptions,
      props.tableFilters,
    )

    setTimeout(() => {
      onFormReset()
    }, 1500)

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
