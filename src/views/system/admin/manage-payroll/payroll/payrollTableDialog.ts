import { formActionDefault } from '@/utils/helpers/constants'
import { ref, watch } from 'vue'

export function usePayrollTableDialog(
  props: {
    isDialogVisible: boolean
    itemId?: number
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // States
  const formAction = ref({ ...formActionDefault })

  watch(
    () => props.isDialogVisible,
    async () => {},
  )

  // Actions
  const onPreview = () => {}

  const onDialogClose = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formAction,
    onPreview,
    onDialogClose,
  }
}
