import { formActionDefault } from '@/utils/helpers/constants'
import { type Employee } from '@/stores/employees'
import { ref, watch } from 'vue'

type TableData = {
  month: string
  basic_salary: number
  gross_pay: number
  deductions: number
  net_pay: number
}
export type PayrollData = {
  year: number
  month: string
  employee_id: number
}

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
  const tableData = ref<TableData[]>([])
  const formAction = ref({ ...formActionDefault })
  const isPrintDialogVisible = ref(false)
  const payrollData = ref<PayrollData>({
    year: 0,
    month: '',
    employee_id: 0,
  })
  const selectedTableData = ref<TableData | null>(null)

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

  // Actions
  const onView = (item: TableData) => {
    payrollData.value = {
      year: tableFilters.value.year,
      month: item.month,
      employee_id: props.itemData?.id || 0,
    }
    selectedTableData.value = item
    isPrintDialogVisible.value = true
  }

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
    isPrintDialogVisible,
    payrollData,
    selectedTableData,
    onView,
    onDialogClose,
  }
}
