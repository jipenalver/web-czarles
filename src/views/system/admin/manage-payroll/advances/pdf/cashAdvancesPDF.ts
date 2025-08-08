import { formActionDefault } from '@/utils/helpers/constants'
import { getDateISO } from '@/utils/helpers/dates'
import html2pdf from 'html2pdf.js'
import { ref } from 'vue'

interface CashAdvancesFilters {
  employee_id: number | null
  request_at: Date[] | null
}

export function useCashAdvancesPDF() {
  // States
  const formAction = ref({ ...formActionDefault })
  const isLoadingPDF = ref(false)

  // Actions
  const onExport = async (filters: CashAdvancesFilters) => {
    // Set printing state to true para ma-show ang loading overlay
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

      // Get the cash advances table element
      const cashAdvancesTableElement = document.getElementById('cash-advances-table')

      if (!cashAdvancesTableElement) {
        throw new Error('Cash advances table element not found')
      }

      // Store original styles para ma-restore later
      const originalStyles = {
        transform: cashAdvancesTableElement.style.transform || '',
        transformOrigin: cashAdvancesTableElement.style.transformOrigin || '',
        position: cashAdvancesTableElement.style.position || '',
        width: cashAdvancesTableElement.style.width || '',
        backgroundColor: cashAdvancesTableElement.style.backgroundColor || '',
        display: cashAdvancesTableElement.style.display || '',
      }

      // Apply styles para sa PDF generation
      cashAdvancesTableElement.style.transform = 'scale(1)'
      cashAdvancesTableElement.style.transformOrigin = 'top left'
      cashAdvancesTableElement.style.position = 'relative'
      cashAdvancesTableElement.style.width = '100%'
      cashAdvancesTableElement.style.backgroundColor = 'white'
      cashAdvancesTableElement.style.display = 'block'

      // Generate filename based on filters
      const filename = generateFilename(filters)

      // Generate PDF with landscape orientation and full width/height
      await html2pdf(cashAdvancesTableElement, {
        margin: [0.3, 0.3, 0.3, 0.3], // Small margins for full utilization
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          /*         width: 1680, // Landscape width
          height: 1190, // Landscape height */
        },
        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'landscape', // Landscape orientation
        },
      })

      // Restore original styles
      Object.assign(cashAdvancesTableElement.style, originalStyles)

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

  const generateFilename = (filters: CashAdvancesFilters) => {
    const baseDate = getDateISO(new Date())
    let filename = `${baseDate}-cash-advances-report`

    if (filters.employee_id) {
      filename += '-employee-specific'
    }

    if (filters.request_at && filters.request_at.length > 0) {
      const startDate = getDateISO(filters.request_at[0])
      filename += `-${startDate}`
      if (filters.request_at.length > 1) {
        const endDate = getDateISO(filters.request_at[1])
        filename += `-to-${endDate}`
      }
    }

    return filename
  }

  // Expose State and Actions
  return {
    formAction,
    isLoadingPDF,
    onExport,
  }
}
