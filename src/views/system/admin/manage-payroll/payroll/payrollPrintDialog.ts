import { type EmployeeTableFilter } from '@/stores/employees'
import { formActionDefault } from '@/utils/helpers/constants'
import { type TableOptions } from '@/utils/helpers/tables'
import html2pdf from 'html2pdf.js'
import { ref, watch } from 'vue'

export function usePayrollPrintDialog(
  props: {
    isDialogVisible: boolean
    itemId?: number
    tableOptions: TableOptions
    tableFilters: EmployeeTableFilter
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
) {
  // States
  const formAction = ref({ ...formActionDefault })

  watch(
    () => props.isDialogVisible,
    async () => {},
  )

  const onPrint = () => {
    html2pdf(document.getElementById('generate-payroll'), {
      margin: 0.25,
      filename: 'myfile.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    })
  }

  const onDialogClose = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formAction,
    onPrint,
    onDialogClose,
  }
}
