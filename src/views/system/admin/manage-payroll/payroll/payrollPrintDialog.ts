import { formActionDefault } from '@/utils/helpers/constants'
import html2pdf from 'html2pdf.js'
import { ref, watch, type Ref } from 'vue'
import type PayrollPrint from './PayrollPrint.vue'

export function usePayrollPrintDialog(
  propsGetter: () => {
    isDialogVisible: boolean
    itemId?: number
    employeeData?: {
      lastname?: string
      firstname?: string
    }
    payrollData?: {
      month?: string
      year?: number
    }
  },
  emit: (event: 'update:isDialogVisible', value: boolean) => void,
  payrollPrintRef?: Ref<InstanceType<typeof PayrollPrint> | null>,
) {
  // States
  const formAction = ref({ ...formActionDefault })
  const isPrinting = ref(false)

  // Function to generate dynamic filename
  const generateFilename = () => {
    // Get fresh props values at the time this function is called
    const props = propsGetter()

    // Access props to get current values
    const employeeName = props.employeeData?.lastname || 'employee'
    const month = props.payrollData?.month || 'unknown'
    const year = props.payrollData?.year || new Date().getFullYear()

    // Format the filename: lastname-month-year-payroll.pdf
    const formattedMonth = month.toLowerCase().replace(/\s+/g, '-')
    const filename = `${employeeName}-${formattedMonth}-${year}-payroll.pdf`

    // console.log('[PayrollPrintDialog] Generating filename:', {
    //   employeeName,
    //   month,
    //   year,
    //   filename,
    //   fullEmployeeData: props.employeeData
    // })

    return filename
  }

  watch(
    () => propsGetter().isDialogVisible,
    async () => {},
  )
  /* https://www.npmjs.com/package/html2pdf.js/v/0.9.0 */
  // Actions
  const onPrint = async () => {
    // Set printing state to true para ma-show ang loading overlay
    isPrinting.value = true

    // Check if currently in dark mode from localStorage
    const currentTheme = localStorage.getItem('theme') || 'light'
    const isDarkMode = currentTheme === 'dark'

    // If in dark mode, temporarily switch to light mode for printing
    if (isDarkMode) {
      // Trigger theme toggle by simulating click on theme button
      const themeToggleButton = document.querySelector(
        'button[aria-label*="weather"], button[title*="theme"], .v-btn:has(.mdi-weather-night), .v-btn:has(.mdi-weather-sunny)',
      )
      if (themeToggleButton) {
        ;(themeToggleButton as HTMLButtonElement).click()
      } else {
        // Fallback: directly update localStorage and trigger theme change
        localStorage.setItem('theme', 'light')
        const vApp = document.querySelector('.v-application') as HTMLElement
        if (vApp) {
          vApp.setAttribute('data-theme', 'light')
        }
      }

      // Wait a moment for theme to apply
      await new Promise((resolve) => setTimeout(resolve, 100))
    }

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
      // Get the count from PayrollPrint component if available, otherwise count manually
      let actualParticularsCount = 0

      if (payrollPrintRef?.value?.visibleParticularsCount) {
        // Use the computed count from PayrollPrint component
        actualParticularsCount = payrollPrintRef.value.visibleParticularsCount
        console.log(
          '[PayrollPrintDialog] Using computed particulars count:',
          actualParticularsCount,
        )
      } else {
        // Fallback: Count the number of particulars rows manually (excluding header and gross salary rows)
        const particularsTable = payrollElement.querySelector(
          '.v-table:nth-child(3)',
        ) as HTMLElement
        const particularsRows = particularsTable?.querySelectorAll('tbody tr') || []
        // Exclude header row (1st), gross salary row (last), and loading/empty rows
        actualParticularsCount = Array.from(particularsRows).filter((row) => {
          const rowElement = row as HTMLElement
          // Skip header rows with colspan="4" or "5" that contain "PARTICULARS"
          const hasParticularsHeader = rowElement.textContent?.includes('PARTICULARS')
          // Skip gross salary row
          const hasGrossSalary = rowElement.textContent?.includes('Gross Salary')
          // Skip loading/empty rows
          const hasLoadingOrEmpty = rowElement.querySelector('.v-progress-circular') !== null

          return !hasParticularsHeader && !hasGrossSalary && !hasLoadingOrEmpty
        }).length
        console.log('[PayrollPrintDialog] Using manual particulars count:', actualParticularsCount)
      }

      // Inject a print-specific stylesheet to reduce font sizes for the generated PDF
      const printStyleId = 'pdf-print-styles'
      let styleEl = document.getElementById(printStyleId) as HTMLStyleElement | null
      if (!styleEl) {
        styleEl = document.createElement('style')
        styleEl.id = printStyleId

        // Adjust font sizes based on number of particulars
        const baseFontSize = actualParticularsCount > 6 ? 8 : 10
        const tableFontSize = actualParticularsCount > 6 ? 7 : 9
        const headingH1Size = actualParticularsCount > 6 ? 12 : 14
        const headingH2Size = actualParticularsCount > 6 ? 10 : 12
        const headingH3Size = actualParticularsCount > 6 ? 9 : 11

        // Make fonts smaller for PDF output. Use !important to override component styles.
        styleEl.innerHTML = `
          /* Scoped to the element(s) we mark with .pdf-print-active */
          .pdf-print-active, .pdf-print-active * {
            font-size: ${baseFontSize}px !important;
            line-height: 1.1 !important;
          }
          .pdf-print-active table, .pdf-print-active th, .pdf-print-active td {
            font-size: ${tableFontSize}px !important;
            padding: 2px !important;
          }
          /* Reduce heading sizes */
          .pdf-print-active h1 { font-size: ${headingH1Size}px !important; }
          .pdf-print-active h2 { font-size: ${headingH2Size}px !important; }
          .pdf-print-active h3 { font-size: ${headingH3Size}px !important; }
          /* Reduce spacing when many rows */
          ${
            actualParticularsCount > 6
              ? `
          .pdf-print-active .v-container { padding: 8px !important; }
          .pdf-print-active .mt-6 { margin-top: 8px !important; }
          .pdf-print-active .mt-3 { margin-top: 4px !important; }
          .pdf-print-active .v-img { max-height: 40px !important; }
          `
              : ''
          }
        `
        document.head.appendChild(styleEl)
      }

      // Add class to enable PDF-specific styles (components can target .pdf-print-active)
      if (payrollElement) {
        payrollElement.classList.add('pdf-print-active')
        // Add compact mode class when there are many rows
        if (actualParticularsCount > 6) {
          payrollElement.classList.add('compact-mode')
        }
      }
      const vAppElm = document.querySelector('.v-application') as HTMLElement | null
      if (vAppElm) vAppElm.classList.add('pdf-print-active')

      // Apply transformations para sa PDF generation
      if (miniPayrollSection) {
        miniPayrollSection.style.display = 'block'
        miniPayrollSection.style.transformOrigin = 'top left'
        miniPayrollSection.style.position = 'absolute'

        // Adjust scale and position based on number of particulars
        if (actualParticularsCount > 6) {
          // Smaller scale to fit more content on one page
          miniPayrollSection.style.transform = 'rotate(90deg) scale(0.65)'
          miniPayrollSection.style.top = '1000px' // Position higher to fit on one page
          miniPayrollSection.style.left = '800px'
        } else {
          // Original position and scale
          miniPayrollSection.style.transform = 'rotate(90deg) scale(0.8)'
          miniPayrollSection.style.top = '800px'
          miniPayrollSection.style.left = '790px'
        }

        miniPayrollSection.style.width = '800px'
        miniPayrollSection.style.height = '800px'
      }

      if (mainContainer) {
        // Adjust scale based on content size
        const containerScale = actualParticularsCount > 6 ? 1.2 : 1.4
        mainContainer.style.transform = `scale(${containerScale})`
        mainContainer.style.transformOrigin = 'top center'
        mainContainer.style.position = 'absolute'
        mainContainer.style.left = actualParticularsCount > 6 ? '300px' : '320px'
      }

      // Generate PDF with optimized settings - always use single page height
      const pdfHeight = 1850
      // Remove margins when there are many rows to maximize space
      const pdfMargin = actualParticularsCount > 6 ? 0 : 0.1

      await html2pdf(payrollElement, {
        margin: pdfMargin,
        filename: generateFilename(),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 1.5, // Higher scale para mas clear ang bigger content
          useCORS: true,
          allowTaint: true,
          width: 1400, // Larger width para sa bigger content
          height: pdfHeight, // Single page height
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

      // Restore original theme only if we changed it (was in dark mode)
      if (isDarkMode) {
        // Trigger theme toggle again to restore dark mode
        const themeToggleButton = document.querySelector(
          'button[aria-label*="weather"], button[title*="theme"], .v-btn:has(.mdi-weather-night), .v-btn:has(.mdi-weather-sunny)',
        )
        if (themeToggleButton) {
          ;(themeToggleButton as HTMLButtonElement).click()
        } else {
          // Fallback: directly restore dark theme
          localStorage.setItem('theme', 'dark')
          const vApp = document.querySelector('.v-application') as HTMLElement
          if (vApp) {
            vApp.setAttribute('data-theme', 'dark')
          }
        }
      }
      // Remove PDF-specific classes so UI returns to normal
      if (payrollElement) {
        payrollElement.classList.remove('pdf-print-active')
        payrollElement.classList.remove('compact-mode')
      }
      const vAppElm2 = document.querySelector('.v-application') as HTMLElement | null
      if (vAppElm2) vAppElm2.classList.remove('pdf-print-active')

      // Remove the injected print stylesheet
      const injected = document.getElementById('pdf-print-styles')
      if (injected && injected.parentNode) injected.parentNode.removeChild(injected)

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
