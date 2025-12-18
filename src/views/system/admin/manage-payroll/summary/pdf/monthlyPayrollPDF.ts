import { formActionDefault } from '@/utils/helpers/constants'
import { getDateISO } from '@/utils/helpers/dates'
import html2pdf from 'html2pdf.js'
import { ref } from 'vue'

interface MonthlyPayrollFilters {
  selectedMonth: string
  selectedYear: number
}

export function useMonthlyPayrollPDF() {
  // States
  const formAction = ref({ ...formActionDefault })
  const isLoadingPDF = ref(false)

  // Actions
  const onExport = async (filters: MonthlyPayrollFilters) => {
    // Set printing state to true to show loading overlay
    isLoadingPDF.value = true

    try {
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

      // Get the monthly payroll table element
      const payrollTableElement = document.getElementById('monthly-payroll-table')

      if (!payrollTableElement) {
        throw new Error('Monthly payroll table element not found')
      }

      // Store original styles to restore later
      const originalStyles = {
        transform: payrollTableElement.style.transform || '',
        transformOrigin: payrollTableElement.style.transformOrigin || '',
        position: payrollTableElement.style.position || '',
        width: payrollTableElement.style.width || '',
        backgroundColor: payrollTableElement.style.backgroundColor || '',
        display: payrollTableElement.style.display || '',
      }

      // Apply styles for PDF generation
      payrollTableElement.style.transform = 'scale(1)'
      payrollTableElement.style.transformOrigin = 'top left'
      payrollTableElement.style.position = 'relative'
      payrollTableElement.style.width = '100%'
      payrollTableElement.style.backgroundColor = 'white'
      payrollTableElement.style.display = 'block'

      // Generate filename based on filters
      const filename = generateFilename(filters)

      // Generate PDF with landscape orientation for wide table
      await html2pdf(payrollTableElement, {
        margin: [5, 5, 5, 5], // Minimal margins to maximize content area
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 2 },
        html2canvas: {
          scale: 2, // Good scale for quality
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
        },
        jsPDF: {
          format: 'a4',
          orientation: 'landscape', // Landscape for wide payroll table
        },
      })

      // Restore original styles
      Object.assign(payrollTableElement.style, originalStyles)

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

      formAction.value = {
        formProcess: false,
        formAlert: true,
        formMessage: 'PDF successfully generated!',
        formStatus: 200,
      }
    } catch (error) {
      console.error('Error generating PDF:', error)
      formAction.value = {
        formProcess: false,
        formAlert: true,
        formMessage: 'Error occurred while generating PDF. Please try again.',
        formStatus: 500,
      }
    } finally {
      // Reset printing state
      isLoadingPDF.value = false
    }
  }

  const generateFilename = (filters: MonthlyPayrollFilters) => {
    const baseDate = getDateISO(new Date())
    const month = filters.selectedMonth.toLowerCase()
    const year = filters.selectedYear
    return `${baseDate}-monthly-payroll-${month}-${year}`
  }

  // Expose State and Actions
  return {
    formAction,
    isLoadingPDF,
    onExport,
  }
}
