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
  const isPrinting = ref(false)

  watch(
    () => props.isDialogVisible,
    async () => {},
  )
  /* https://www.npmjs.com/package/html2pdf.js/v/0.9.0 */
  // Actions
  const onPrint = async () => {
    // Set printing state to true para ma-show ang loading overlay
    isPrinting.value = true

    // Get the payroll element na naka-contain sa both full ug mini payroll
    const payrollElement = document.getElementById('generate-payroll')
    const miniPayrollSection = document.getElementById('mini-payroll-section')

    if (!payrollElement) {
      isPrinting.value = false
      return // wala element, di mag proceed
    }

    // Store original styles para ma-restore later
    const originalStyles = {
      miniPayroll: {
        display: miniPayrollSection?.style.display || '',
        transform: miniPayrollSection?.style.transform || '',
        transformOrigin: miniPayrollSection?.style.transformOrigin || '',
        position: miniPayrollSection?.style.position || '',
        top: miniPayrollSection?.style.top || '',
        left: miniPayrollSection?.style.left || '',
        width: miniPayrollSection?.style.width || '',
        height: miniPayrollSection?.style.height || '',
      },
      mainContainer: null as {
        transform: string
        transformOrigin: string
        position: string
        left: string
      } | null,
    }

    const mainContainer = payrollElement.querySelector('.v-container') as HTMLElement
    if (mainContainer) {
      originalStyles.mainContainer = {
        transform: mainContainer.style.transform || '',
        transformOrigin: mainContainer.style.transformOrigin || '',
        position: mainContainer.style.position || '',
        left: mainContainer.style.left || '',
      }
    }

    try {
      // Apply transformations para sa PDF generation
      if (miniPayrollSection) {
        miniPayrollSection.style.display = 'block'
        miniPayrollSection.style.transform = 'rotate(90deg) scale(0.8)'
        miniPayrollSection.style.transformOrigin = 'top left'
        miniPayrollSection.style.position = 'absolute'
        miniPayrollSection.style.top = '750px'
        miniPayrollSection.style.left = '680px'
        miniPayrollSection.style.width = '800px'
        miniPayrollSection.style.height = '800px'
      }

      if (mainContainer) {
        mainContainer.style.transform = 'scale(1.3)'
        mainContainer.style.transformOrigin = 'top center'
        mainContainer.style.position = 'absolute'
        mainContainer.style.left = '320px'
      }

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
          height: 1850, // Larger height
        },
        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'portrait',
        },
      })
    } catch (error) {
      console.error('Error generating PDF:', error)
      formAction.value = {
        formProcess: false,
        formAlert: true,
        formMessage: 'Error occurred while generating PDF. Please try again.',
        formStatus: 500,
      }
    } finally {
      // Reset all styles to original values
      if (miniPayrollSection && originalStyles.miniPayroll) {
        Object.assign(miniPayrollSection.style, originalStyles.miniPayroll)
      }

      if (mainContainer && originalStyles.mainContainer) {
        Object.assign(mainContainer.style, originalStyles.mainContainer)
      }

      // Reset printing state
      isPrinting.value = false
    }
  }

  const onDialogClose = () => {
    formAction.value = { ...formActionDefault }
    emit('update:isDialogVisible', false)
  }

  // Expose State and Actions
  return {
    formAction,
    isPrinting,
    onPrint,
    onDialogClose,
  }
}
