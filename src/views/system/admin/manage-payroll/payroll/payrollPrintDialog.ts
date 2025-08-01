import { formActionDefault } from '@/utils/helpers/constants'
import html2pdf from 'html2pdf.js'
import { ref, watch } from 'vue'

export function usePayrollPrintDialog(
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
  /* https://www.npmjs.com/package/html2pdf.js/v/0.9.0 */
  // Actions
  const onPrint = () => {
    // Scale down payroll content before PDF generation
    const element = document.getElementById('generate-payroll')
    if (!element) return // wala element, di mag proceed

    const originalTransform = element.style.transform
    const originalTransformOrigin = element.style.transformOrigin
    // scale for y-axis only
    element.style.transform = 'scaleY(0.7)'
    element.style.transformOrigin = 'top center'

    html2pdf(element, {
      margin: 0.25,
      filename: 'myfile.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    }).then(() => {
      // Ibalik ang original transform after PDF generation
      element.style.transform = originalTransform
      element.style.transformOrigin = originalTransformOrigin
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
