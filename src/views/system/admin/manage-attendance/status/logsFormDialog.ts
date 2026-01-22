import {
  type AttendanceRequest,
  type AttendanceRequestTableFilter,
} from '@/stores/attendanceRequests'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import { ref } from 'vue'

export function useLogsFormDialog(
  props: {
    isDialogVisible: boolean
    itemData: AttendanceRequest | null
    tableOptions: TableOptions
    tableFilters: AttendanceRequestTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // States
  const formAction = ref({ ...formActionDefault })
  const refVForm = ref()

  // Actions
  const onSubmit = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    // Simulate form submission delay
  }

  // Trigger Validators
  const onFormSubmit = async () => {
    const { valid } = await refVForm.value.validate()
    if (valid) onSubmit()
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
    onFormReset,
  }
}
