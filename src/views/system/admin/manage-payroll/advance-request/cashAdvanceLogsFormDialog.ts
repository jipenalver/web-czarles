import {
  useCashAdvanceRequestsStore,
  type CashAdvanceRequest,
  type CashAdvanceRequestTableFilter
} from '@/stores/cashAdvanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref } from 'vue'

export function useCashAdvanceLogsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: CashAdvanceRequest | null
    tableOptions: TableOptions
    tableFilters: CashAdvanceRequestTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void
) {
  const cashAdvanceRequestsStore = useCashAdvanceRequestsStore()

  // States
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onFormSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await cashAdvanceRequestsStore.updateCashAdvanceRequest({
      ...props.itemData,
      status: 'Pending'
    } as CashAdvanceRequest)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false
      }
    } else if (data) {
      formAction.value.formMessage = 'Cash Advance Request Resubmitted Successfully.'

      await cashAdvanceRequestsStore.getCashAdvanceRequestsTable(
        props.tableOptions,
        props.tableFilters
      )

      setTimeout(() => {
        onFormReset()
      }, 1500)
    }

    formAction.value.formAlert = true
  }

  const onFormReset = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formAction,
    refVForm,
    onFormSubmit,
    onFormReset
  }
}
