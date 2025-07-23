import { formActionDefault } from '@/utils/helpers/constants'
import { type Employee } from '@/stores/employees'
import { ref, watch, computed } from 'vue'

export type TableData = {
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
  const selectedData = ref<TableData | null>(null)

  watch(
    () => props.isDialogVisible,
    async () => {
      // query sa payroll data based on itemData.id = Employee ID
      // load tanan months sa selected year with sample data
      tableData.value = [
        {
          month: 'January',
          basic_salary: 25000,
          gross_pay: 28500,
          deductions: 3200,
          net_pay: 25300,
        },
        {
          month: 'February',
          basic_salary: 25000,
          gross_pay: 29200,
          deductions: 3100,
          net_pay: 26100,
        },
        {
          month: 'March',
          basic_salary: 25000,
          gross_pay: 27800,
          deductions: 2900,
          net_pay: 24900,
        },
        {
          month: 'April',
          basic_salary: 25000,
          gross_pay: 30100,
          deductions: 3400,
          net_pay: 26700,
        },
        {
          month: 'May',
          basic_salary: 25000,
          gross_pay: 28900,
          deductions: 3000,
          net_pay: 25900,
        },
        {
          month: 'June',
          basic_salary: 25000,
          gross_pay: 31200,
          deductions: 3600,
          net_pay: 27600,
        },
        {
          month: 'July',
          basic_salary: 25000,
          gross_pay: 29800,
          deductions: 3300,
          net_pay: 26500,
        },
        {
          month: 'August',
          basic_salary: 25000,
          gross_pay: 28700,
          deductions: 3150,
          net_pay: 25550,
        },
        {
          month: 'September',
          basic_salary: 25000,
          gross_pay: 30500,
          deductions: 3500,
          net_pay: 27000,
        },
        {
          month: 'October',
          basic_salary: 25000,
          gross_pay: 29300,
          deductions: 3250,
          net_pay: 26050,
        },
        {
          month: 'November',
          basic_salary: 25000,
          gross_pay: 32100,
          deductions: 3800,
          net_pay: 28300,
        },
        {
          month: 'December',
          basic_salary: 25000,
          gross_pay: 35400,
          deductions: 4200,
          net_pay: 31200,
        },
      ]
    },
  )

  // No filteredTableData, use tableData directly

  // Actions
  const onView = (item: TableData) => {
    payrollData.value = {
      year: tableFilters.value.year,
      month: item.month,
      employee_id: props.itemData?.id || 0,
    }
    selectedData.value = item
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
    selectedData,
    onView,
    onDialogClose,
  }
}
