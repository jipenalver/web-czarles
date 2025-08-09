import { formActionDefault } from '@/utils/helpers/constants'
import { getDateISO } from '@/utils/helpers/dates'
import html2pdf from 'html2pdf.js'
import { ref } from 'vue'

interface EmployeesFilters {
  search: string | null
  designation_id: number | null
}

export function useEmployeesPDF() {
  // States
  const formAction = ref({ ...formActionDefault })
  const isLoadingPDF = ref(false)

  // Actions
  const onExport = async (
    filters: EmployeesFilters,
    componentView: 'employees' | 'benefits' | 'payroll',
  ) => {
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

      // Get the employees table element
      const employeesTableElement = document.getElementById('employees-table')

      if (!employeesTableElement) {
        throw new Error('Employees table element not found')
      }

      // Store original styles para ma-restore later
      const originalStyles = {
        transform: employeesTableElement.style.transform || '',
        transformOrigin: employeesTableElement.style.transformOrigin || '',
        position: employeesTableElement.style.position || '',
        width: employeesTableElement.style.width || '',
        backgroundColor: employeesTableElement.style.backgroundColor || '',
        display: employeesTableElement.style.display || '',
      }

      // Apply styles para sa PDF generation
      employeesTableElement.style.transform = 'scale(1)'
      employeesTableElement.style.transformOrigin = 'top left'
      employeesTableElement.style.position = 'relative'
      employeesTableElement.style.width = '100%'
      employeesTableElement.style.backgroundColor = 'white'
      employeesTableElement.style.display = 'block'

      // Generate filename based on filters and component view
      const filename = generateFilename(filters, componentView)

      // Generate PDF with portrait orientation and automatic page breaks
      await html2pdf(employeesTableElement, {
        margin: [0.3, 0.3, 0.3, 0.3], // Smaller margins for more compact layout
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: {
          scale: 1.8, // Increased scale for better readability despite small font
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          width: 800, // Adjusted width for portrait
          height: 1100, // Adjusted height for portrait
        },
        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'portrait', // Portrait orientation
        },
      })

      // Restore original styles
      Object.assign(employeesTableElement.style, originalStyles)

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

  const generateFilename = (
    filters: EmployeesFilters,
    componentView: 'employees' | 'benefits' | 'payroll',
  ) => {
    const baseDate = getDateISO(new Date())
    let filename = `${baseDate}-employees-${componentView}-report`

    if (filters.search) {
      filename += '-filtered'
    }

    if (filters.designation_id) {
      filename += '-by-designation'
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
