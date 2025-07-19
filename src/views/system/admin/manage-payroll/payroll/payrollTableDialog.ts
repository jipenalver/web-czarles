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
  type TableData = {
    month: string
    basic_salary: number
    gross_pay: number
    deductions: number
    net_pay: number
  }
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
  const tableData = ref<TableData[]>([])
  const formAction = ref({ ...formActionDefault })

  watch(
    () => props.isDialogVisible,
    async () => {
      // query sa payroll data based on itemData.id = Employee ID
      tableData.value = [
        {
          month: 'January',
          basic_salary: 5000,
          gross_pay: 6000,
          deductions: 1000,
          net_pay: 5000,
        },
        {
          month: 'February',
          basic_salary: 5000,
          gross_pay: 6000,
          deductions: 1000,
          net_pay: 5000,
        },
      ]
    },
  )

  const onDialogClose = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    tableOptions,
    tableFilters,
    tableData,
    formAction,
    onDialogClose,
  }
}
