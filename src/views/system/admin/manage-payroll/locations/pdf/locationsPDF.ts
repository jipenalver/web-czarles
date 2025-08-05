import { getDateISO } from '@/utils/helpers/dates'
import { formActionDefault } from '@/utils/helpers/constants'
import html2pdf from 'html2pdf.js'
import { ref } from 'vue'

interface TripLocationsFilters {
  search: string | null
}

export function useTripLocationsPDF() {
  // States
  const formAction = ref({ ...formActionDefault })
  const isPrinting = ref(false)

  // Actions
  const onExportPDF = async (filters: TripLocationsFilters) => {
    // Set printing state to true para ma-show ang loading overlay
    isPrinting.value = true

    try {
      // Check if currently in dark mode from localStorage
      const currentTheme = localStorage.getItem('theme') || 'light'
      const isDarkMode = currentTheme === 'dark'

      // If in dark mode, temporarily switch to light mode for printing
      if (isDarkMode) {
        // Trigger theme toggle by simulating click on theme button
        const themeToggleButton = document.querySelector('button[aria-label*="weather"], button[title*="theme"], .v-btn:has(.mdi-weather-night), .v-btn:has(.mdi-weather-sunny)')
        if (themeToggleButton) {
          (themeToggleButton as HTMLButtonElement).click()
        } else {
          // Fallback: directly update localStorage and trigger theme change
          localStorage.setItem('theme', 'light')
          const vApp = document.querySelector('.v-application') as HTMLElement
          if (vApp) {
            vApp.setAttribute('data-theme', 'light')
          }
        }

        // Wait a moment for theme to apply
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // Get the trip locations table element
      const tripLocationsTableElement = document.getElementById('trip-locations-table')

      if (!tripLocationsTableElement) {
        throw new Error('Trip locations table element not found')
      }

      // Store original styles para ma-restore later
      const originalStyles = {
        transform: tripLocationsTableElement.style.transform || '',
        transformOrigin: tripLocationsTableElement.style.transformOrigin || '',
        position: tripLocationsTableElement.style.position || '',
        width: tripLocationsTableElement.style.width || '',
        backgroundColor: tripLocationsTableElement.style.backgroundColor || '',
        display: tripLocationsTableElement.style.display || '',
      }

      // Apply styles para sa PDF generation
      tripLocationsTableElement.style.transform = 'scale(1)'
      tripLocationsTableElement.style.transformOrigin = 'top left'
      tripLocationsTableElement.style.position = 'relative'
      tripLocationsTableElement.style.width = '100%'
      tripLocationsTableElement.style.backgroundColor = 'white'
      tripLocationsTableElement.style.display = 'block'

      // Generate filename based on filters
      const filename = generateFilename(filters)

      // Generate PDF with landscape orientation and full width/height
      await html2pdf(tripLocationsTableElement, {
        margin: [0.3, 0.3, 0.3, 0.3], // Small margins for full utilization
        filename: `${filename}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
        },
        jsPDF: {
          unit: 'in',
          format: 'a4',
          orientation: 'landscape', // Landscape orientation
        },
      })

      // Restore original styles
      Object.assign(tripLocationsTableElement.style, originalStyles)

      // Restore original theme only if we changed it (was in dark mode)
      if (isDarkMode) {
        // Trigger theme toggle again to restore dark mode
        const themeToggleButton = document.querySelector('button[aria-label*="weather"], button[title*="theme"], .v-btn:has(.mdi-weather-night), .v-btn:has(.mdi-weather-sunny)')
        if (themeToggleButton) {
          (themeToggleButton as HTMLButtonElement).click()
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
      isPrinting.value = false
    }
  }

  const generateFilename = (filters: TripLocationsFilters) => {
    const baseDate = getDateISO(new Date())
    let filename = `${baseDate}-trip-locations-report`

    if (filters.search) {
      filename += '-filtered'
    }

    return filename
  }

  // Expose State and Actions
  return {
    formAction,
    isPrinting,
    onExportPDF,
  }
}
