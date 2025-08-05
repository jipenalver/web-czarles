import { getDateISO } from '@/utils/helpers/dates'
import { formActionDefault } from '@/utils/helpers/constants'
import html2pdf from 'html2pdf.js'
import { ref } from 'vue'

interface TripsFilters {
  employee_id: number | null
  trip_at: Date[] | null
}

export function useTripsPDF() {
  // States
  const formAction = ref({ ...formActionDefault })
  const isPrinting = ref(false)

  // Actions
  const onExportPDF = async (filters: TripsFilters) => {
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

      // Get the trips table element
      const tripsTableElement = document.getElementById('trips-table')

      if (!tripsTableElement) {
        throw new Error('Trips table element not found')
      }

      // Store original styles para ma-restore later
      const originalStyles = {
        transform: tripsTableElement.style.transform || '',
        transformOrigin: tripsTableElement.style.transformOrigin || '',
        position: tripsTableElement.style.position || '',
        width: tripsTableElement.style.width || '',
        backgroundColor: tripsTableElement.style.backgroundColor || '',
        display: tripsTableElement.style.display || '',
      }

      // Apply styles para sa PDF generation
      tripsTableElement.style.transform = 'scale(1)'
      tripsTableElement.style.transformOrigin = 'top left'
      tripsTableElement.style.position = 'relative'
      tripsTableElement.style.width = '100%'
      tripsTableElement.style.backgroundColor = 'white'
      tripsTableElement.style.display = 'block'

      // Generate filename based on filters
      const filename = generateFilename(filters)

      // Generate PDF with landscape orientation and full width/height
      await html2pdf(tripsTableElement, {
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
      Object.assign(tripsTableElement.style, originalStyles)

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

  const generateFilename = (filters: TripsFilters) => {
    const baseDate = getDateISO(new Date())
    let filename = `${baseDate}-trips-report`
    
    if (filters.employee_id) {
      filename += '-employee-specific'
    }
    
    if (filters.trip_at && filters.trip_at.length > 0) {
      const startDate = getDateISO(filters.trip_at[0])
      filename += `-${startDate}`
      if (filters.trip_at.length > 1) {
        const endDate = getDateISO(filters.trip_at[1])
        filename += `-to-${endDate}`
      }
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