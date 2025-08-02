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
    // Get the payroll element na naka-contain sa both full ug mini payroll
    const payrollElement = document.getElementById('generate-payroll')
    const miniPayrollSection = document.getElementById('mini-payroll-section')
    
    if (!payrollElement) return // wala element, di mag proceed

    // Temporarily show and transform ang mini payroll section para sa printing
    if (miniPayrollSection) {
      miniPayrollSection.style.display = 'block'
      // Apply CSS transformations programmatically para sure na ma-apply
      miniPayrollSection.style.transform = 'rotate(90deg) scale(0.8)'
      miniPayrollSection.style.transformOrigin = 'top left'
      miniPayrollSection.style.position = 'absolute'
      miniPayrollSection.style.top = '750px'
      miniPayrollSection.style.left = '800px'
      miniPayrollSection.style.width = '800px'
      miniPayrollSection.style.height = '800px'
    
    }

    // Apply scaling to main container
    const mainContainer = payrollElement.querySelector('.v-container') as HTMLElement
    if (mainContainer) {
      mainContainer.style.transform = 'scale(1.3)'
      mainContainer.style.transformOrigin = 'top center'
      mainContainer.style.position = 'absolute'
      mainContainer.style.left = '320px'
 
    }

    try {
      // Generate PDF with optimized settings para sa scaled content
      await html2pdf(payrollElement, {
        margin: 0.1,
        filename: 'payroll-complete.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 1.5, // Higher scale para mas clear ang bigger content
          useCORS: true,
          allowTaint: true,
          width: 1400, // Larger width para sa bigger content
          height: 1850 // Larger height
        },
        jsPDF: { 
          unit: 'in', 
          format: 'a4', 
          orientation: 'portrait'
        }
      })
    } finally {
      // Reset styles after printing
      if (miniPayrollSection) {
        miniPayrollSection.style.display = 'none'
        miniPayrollSection.style.transform = ''
        miniPayrollSection.style.transformOrigin = ''
        miniPayrollSection.style.position = ''
        miniPayrollSection.style.top = ''
        miniPayrollSection.style.left = ''
        miniPayrollSection.style.width = ''
        miniPayrollSection.style.height = ''
      }
      
      if (mainContainer) {
        mainContainer.style.transform = ''
        mainContainer.style.transformOrigin = ''
      }
    }
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
