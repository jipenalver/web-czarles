import { type TableHeader, type TableOptions } from '@/utils/helpers/tables'
import { type Employee, useEmployeesStore } from '@/stores/employees'
import { getDateISO, getYearsOfService } from '@/utils/helpers/dates'
import { generateCSV, prepareCSV } from '@/utils/helpers/others'
import { formActionDefault } from '@/utils/helpers/constants'
import { useDesignationsStore } from '@/stores/designations'
import { useBenefitsStore } from '@/stores/benefits'
import { onMounted, ref } from 'vue'
import { useDate } from 'vuetify'

export function useEmployeesTable(
  props: {
    componentView: 'employees' | 'benefits' | 'payroll'
  },
  tableHeaders: TableHeader[],
) {
  const date = useDate()

  const employeesStore = useEmployeesStore()
  const designationsStore = useDesignationsStore()
  const benefitsStore = useBenefitsStore()

  // States
  const tableOptions = ref({
    page: 1,
    itemsPerPage: 10,
    sortBy: [],
    isLoading: false,
  })
  const tableFilters = ref({
    search: '',
    designation_id: null,
  })
  const isDialogVisible = ref(false)
  const isRateDialogVisible = ref(false)
  const isDeductionsDialogVisible = ref(false)
  const isPayrollDialogVisible = ref(false)
  const isConfirmDeleteDialog = ref(false)
  const deleteId = ref<number>(0)
  const itemData = ref<Employee | null>(null)
  const formAction = ref({ ...formActionDefault })

  // Actions
  const onAdd = () => {
    itemData.value = null
    isDialogVisible.value = true
  }

  const onUpdate = (item: Employee) => {
    itemData.value = item
    isDialogVisible.value = true
  }

  const onRate = (item: Employee) => {
    itemData.value = item
    isRateDialogVisible.value = true
  }

  const onDeductions = (item: Employee) => {
    itemData.value = item
    isDeductionsDialogVisible.value = true
  }

  const onPayroll = (item: Employee) => {
    itemData.value = item
    isPayrollDialogVisible.value = true
  }

  const onDelete = (id: number) => {
    deleteId.value = id
    isConfirmDeleteDialog.value = true
  }

  const onConfirmDelete = async () => {
    formAction.value = { ...formActionDefault, formProcess: true }

    const { data, error } = await employeesStore.deleteEmployee(deleteId.value)

    if (error) {
      formAction.value.formMessage = error.message
      formAction.value.formStatus = 400
    } else if (data) {
      formAction.value.formMessage = 'Successfully Deleted Employee.'

      await onLoadItems(tableOptions.value)
      await employeesStore.getEmployees()
    }

    formAction.value.formAlert = true
    formAction.value.formProcess = false
  }

  const onFilterItems = () => {
    onLoadItems(tableOptions.value)
  }

  const onSearchItems = () => {
    if (
      tableFilters.value.search?.length >= 2 ||
      tableFilters.value.search?.length == 0 ||
      tableFilters.value.search === null
    )
      onLoadItems(tableOptions.value)
  }

  const onLoadItems = async ({ page, itemsPerPage, sortBy }: TableOptions) => {
    tableOptions.value.isLoading = true

    await employeesStore.getEmployeesTable({ page, itemsPerPage, sortBy }, tableFilters.value)

    tableOptions.value.isLoading = false
  }

  const onExportCSV = () => {
    const filename = getDateISO(new Date()) + '-employees'

    const csvData = () => {
      const defaultHeaders = tableHeaders
        .filter(({ title }) => title !== 'Actions' && title !== 'Fullname')
        .map(({ title }) => title)

      const csvHeaders = [
        'Lastname',
        'Firstname',
        'Middlename',
        ...defaultHeaders,
        'Birthdate',
        'Address',
        'Years of Service',
        'Contract Status',
        'Field or Office',
        'TIN',
        'SSS',
        'PhilHealth',
        'Pag-IBIG',
        'Origin',
        'Assignment',
        ...(props.componentView === 'benefits'
          ? [
              'Daily Rate',
              'Accident Insurance',
              ...benefitsStore.addons.map(({ benefit }) => benefit),
              ...benefitsStore.deductions.map(({ benefit }) => benefit),
            ]
          : []),
        ...(props.componentView === 'payroll' ? [] : []),
      ].join(',')

      const csvRows = employeesStore.employees.map((item) => {
        let csvData = [
          prepareCSV(item.lastname),
          prepareCSV(item.firstname),
          prepareCSV(item.middlename),

          prepareCSV(item.phone),
          prepareCSV(item.email),
          prepareCSV(item.designation.designation),
          item.hired_at ? prepareCSV(date.format(item.hired_at, 'fullDate')) : '',

          item.birthdate ? prepareCSV(date.format(item.birthdate, 'fullDate')) : '',
          prepareCSV(item.address),
          getYearsOfService(item.hired_at),
          item.is_permanent ? 'Permanent' : 'Contractual',
          item.is_field_staff ? 'Field' : 'Office',
          prepareCSV(item.tin_no),
          prepareCSV(item.sss_no),
          prepareCSV(item.philhealth_no),
          prepareCSV(item.pagibig_no),
          item.area_origin ? prepareCSV(item.area_origin.area) : '',
          item.area_assignment ? prepareCSV(item.area_assignment.area) : '',
        ]

        if (props.componentView === 'benefits') {
          const getBenefits = (benefitType: 'addons' | 'deductions') => {
            return benefitsStore[benefitType].map((benefit) => {
              const activeBenefit = item.employee_deductions.find(
                ({ benefit_id }) => benefit_id === benefit.id,
              )?.amount

              return activeBenefit ? activeBenefit.toString() : '0.00'
            })
          }

          csvData = [
            ...csvData,
            item.daily_rate ? prepareCSV(item.daily_rate.toFixed(2)) : '',
            prepareCSV(item.is_insured ? 'Yes' : 'No'),

            ...getBenefits('addons'),
            ...getBenefits('deductions'),
          ]
        }

        if (props.componentView === 'payroll') csvData = [...csvData]

        return csvData.join(',')
      })

      return [csvHeaders, ...csvRows].join('\n')
    }

    generateCSV(filename, csvData())
  }

  onMounted(async () => {
    await employeesStore.getEmployees()
  })

  // Expose State and Actions
  return {
    tableOptions,
    tableFilters,
    isDialogVisible,
    isRateDialogVisible,
    isDeductionsDialogVisible,
    isPayrollDialogVisible,
    isConfirmDeleteDialog,
    itemData,
    formAction,
    onAdd,
    onUpdate,
    onRate,
    onDeductions,
    onPayroll,
    onDelete,
    onConfirmDelete,
    onSearchItems,
    onFilterItems,
    onLoadItems,
    onExportCSV,
    employeesStore,
    designationsStore,
  }
}
