import {
  type CashAdvanceRequest,
  type CashAdvanceRequestTableFilter,
  useCashAdvanceRequestsStore,
} from '@/stores/cashAdvanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { useEmployeesStore } from '@/stores/employees'
import { getMoneyText } from '@/utils/helpers/others'
import { useAuthUserStore } from '@/stores/authUser'
import { onMounted, ref, watch } from 'vue'
import { useDate } from 'vuetify'

export function useCashAdvancesFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: CashAdvanceRequest | null
    tableOptions: TableOptions
    tableFilters: CashAdvanceRequestTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  const date = useDate()

  const cashAdvanceRequestsStore = useCashAdvanceRequestsStore()
  const employeesStore = useEmployeesStore()
  const authUserStore = useAuthUserStore()

  // States
  const formDataDefault = {
    employee_id: null,
    amount: undefined,
    description: '',
    request_at: new Date(),
    status: 'Pending' as 'Pending' | 'Approved' | 'Rejected',
  }
  const formData = ref<Partial<CashAdvanceRequest>>({ ...formDataDefault })
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
      ? await cashAdvanceRequestsStore.updateCashAdvanceRequest(formData.value)
      : await cashAdvanceRequestsStore.addCashAdvanceRequest(formData.value)

    if (error) {
      formAction.value = {
        ...formActionDefault,
        formMessage: error.message,
        formStatus: 400,
        formProcess: false,
      }
    } else if (data) {
      formAction.value.formMessage = `Successfully ${isUpdate.value ? 'Updated' : 'Added'} Cash Advance Request.`

      if (!isUpdate.value) {
        const employee = await employeesStore.getEmployeesById(formData.value.employee_id as number)

        await authUserStore.sendToApprovers({
          subject: 'Cash Advance Request Notification',
          message: `<p>Good Day!</p>
            <p>A cash advance request has been applied by employee <strong>${employee?.firstname} ${employee?.lastname}</strong> with an amount of <strong>${getMoneyText(formData.value.amount as number)}</strong> for date <strong>${date.format(formData.value.request_at as string, 'fullDate')}</strong>.</p>
            <p>Please review the request at your earliest convenience.</p>
            <p>Best Regards,<br>C'Zarles System</p>`,
        })
      }

      await cashAdvanceRequestsStore.getCashAdvanceRequestsTable(
        props.tableOptions,
        props.tableFilters,
      )

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
