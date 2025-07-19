import { formActionDefault } from '@/utils/helpers/constants'
import { type Employee } from '@/stores/employees'
import { ref, watch } from 'vue'

export function usePayrollTableDialog(
  props: {
    isDialogVisible: boolean
    itemData: Employee | null
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // States
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 12,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    year: new Date().getFullYear(),
  })
  const formAction = ref({ ...formActionDefault })

  watch(
    () => props.isDialogVisible,
    async () => {},
  )

  const onDialogClose = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    tableOptions,
    tableFilters,
    formAction,
    onDialogClose,
  }
}
