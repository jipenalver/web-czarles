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
  const onPrint = async () => {
    // Get both elements
    const fullPayrollElement = document.getElementById('generate-payroll')
    const miniPayrollElement = document.getElementById('mini-payroll-print')
    
    if (!fullPayrollElement || !miniPayrollElement) return // wala element, di mag proceed

    // Create a container div para sa combined content
    const combinedContainer = document.createElement('div')
    combinedContainer.style.display = 'block'
    combinedContainer.style.width = '100%'
    
    // Save original styles
    const fullOriginalTransform = fullPayrollElement.style.transform
    const fullOriginalTransformOrigin = fullPayrollElement.style.transformOrigin
    const miniOriginalDisplay = miniPayrollElement.style.display
    const miniOriginalTransform = miniPayrollElement.style.transform
    const miniOriginalTransformOrigin = miniPayrollElement.style.transformOrigin
    
    // Clone both elements para di ma-disturb ang original
    const fullClone = fullPayrollElement.cloneNode(true) as HTMLElement
    const miniClone = miniPayrollElement.cloneNode(true) as HTMLElement
    
    // Apply transforms to clones
    fullClone.style.transform = 'scaleY(0.7)'
    fullClone.style.transformOrigin = 'top center'
    fullClone.style.marginBottom = '20px' // spacing between pages
    
    miniClone.style.transform = 'scale(1)'
    miniClone.style.transformOrigin = 'top center'
    miniClone.style.display = 'block'
    miniClone.style.pageBreakBefore = 'always' // force new page
    
    // Append clones to container
    combinedContainer.appendChild(fullClone)
    combinedContainer.appendChild(miniClone)
    
    // Temporarily add container to body
    document.body.appendChild(combinedContainer)
    
    // Generate combined PDF
    await html2pdf(combinedContainer, {
      margin: 0.25,
      filename: 'payroll-complete.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' },
    }).then(() => {
      // Cleanup - remove ang temporary container
      document.body.removeChild(combinedContainer)
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
