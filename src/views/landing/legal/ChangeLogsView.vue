<script setup lang="ts">
import LandingLayout from '@/components/landing/LandingLayout.vue'
import { computed, onMounted, ref } from 'vue'
import { useDisplay } from 'vuetify'

const isVisible = ref(false)
const { mobile, lgAndUp } = useDisplay()

const heroTitleClass = computed(() =>
  mobile.value ? 'text-h4' : lgAndUp.value ? 'text-h2' : 'text-h3',
)

const heroSubtitleClass = computed(() => (mobile.value ? 'text-body-1' : 'text-h6'))

onMounted(() => {
  isVisible.value = true
})
</script>

<template>
  <LandingLayout :hideBg="true">
    <template #hero>
      <div
        class="text-center white--text animate-hero-container"
        :class="{ 'animate-hero-container-visible': isVisible }"
        style="max-width: 900px"
      >
        <div class="hero-content">
          <h1
            :class="[
              heroTitleClass,
              'font-weight-bold mb-4 text-white animate-hero-title',
              { 'animate-hero-title-visible': isVisible },
            ]"
          >
            Change Logs
          </h1>
          <p
            :class="[
              heroSubtitleClass,
              'mb-6 text-white font-weight-light animate-hero-subtitle',
              { 'animate-hero-subtitle-visible': isVisible },
            ]"
          >
            Change Logs provide a detailed history of updates, improvements, and fixes made to our
            platform. Stay informed about the latest changes and enhancements.
          </p>
        </div>

        <div
          class="text-caption text-white animate-hero-breadcrumb"
          :class="{ 'animate-hero-breadcrumb-visible': isVisible }"
        >
          <v-icon size="small" class="mr-1 text-orange-lighten-2">mdi-home</v-icon>
          <RouterLink to="/" class="text-white text-decoration-none hover-orange">Home</RouterLink>
          <v-icon size="small" class="mx-2">mdi-chevron-right</v-icon>
          <span class="text-orange-lighten-2">Change Logs</span>
        </div>
      </div>
    </template>

    <template #content>
      <v-container class="py-8">
        <v-card class="pa-6" elevation="2" rounded="xl">
          <v-card-title class="text-h5 font-weight-bold mb-4">
            📜 System Updates Changelog
          </v-card-title>

          <!-- December 18, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">December 18, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Refactor) Removed leftover debug console logs from attendance and payroll
                components.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Corrected the type definition for attendance parameters in the unified
                late/undertime calculator.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Fixed formatting issues affecting the visibility of the mini payroll view.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added support for Sunday duty records, including fractional values for
                more precise payroll results.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Improved attendance record handling by refining the AttendanceRecord type
                and enhancing date interpretation.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- December 10, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">December 10, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Refactor) Removed unused effective date logic from the payroll print footer to
                simplify maintenance.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Fixed live price updates in the payroll print footer to ensure values
                refresh correctly.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Refactor) Cleaned up remaining effective date logic and improved template
                formatting in the payroll print footer.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- December 8, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">December 8, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Ensured proper handling of live price updates in the payroll print footer
                component.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- December 6–7, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">December 6–7, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Enhanced holiday payroll calculations to account for actual attendance on
                regular holidays.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added admin-specific handling for attendance calculations and display in
                payroll components.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Improved attendance calculations using a unified AttendanceRecord model
                with better holiday handling.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Implemented Regular Holiday rules consistently across all payroll-related
                attendance calculations.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- December 5, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">December 5, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added CSV export capability to the payroll summary table for easier
                reporting.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 28, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 28, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added a payable benefits column to the payroll summary table for clearer
                earnings breakdown.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 27, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 27, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Fixed formatting issues affecting the visibility of the mini payroll view.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added support for Sunday duty records, including fractional values for
                more precise payroll results.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 26, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 26, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Exempted admin employees from late and undertime deductions in payroll
                calculations.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Unified late and undertime rules for both field and office staff for more
                consistent payroll computation.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 25, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 25, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Added holiday amount calculation and updated how holiday values are
                displayed in Payroll Print.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Improved payroll handling for admin employees with more accurate day-based
                calculations and clearer tooltips.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 23, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 23, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Enhanced the payroll summary with new filtering options and added more
                detailed calculations for utilizations and cash adjustments.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Added full support for cash adjustments in payroll printing, including both
                deductions and additions.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 22, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 22, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Integrate overtime setting by adding an field to attendance records and
                updated overtime calculations accordingly.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 19, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 19, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Fixed an issue on hours displayed on utilizations expanded row not matching
                the actual logged time for employee.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Fixed an issue where rectified attendance entries were not being properly
                saved when modified by an admin user.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 17, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 17, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Filename correction for payroll export to ensure proper file naming based
                on employee.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 16, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 16, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Improved payroll print handling by passing date filters more cleanly for
                easier maintenance.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Unified payroll calculations for field and office staff and improved
                late/undertime rules for more consistent results.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Added better cross-month filtering and improved tooltips for displaying
                days worked.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Added admin support in payroll and adjusted calculations to handle
                admin-specific logic.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 15, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 15, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Removed unused table columns and improved how month selection is displayed.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Improved holiday earnings and refined attendance logging for field
                personnel.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Updated day tooltips to hide hour values and improved formatting for
                clarity.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Streamlined payroll data processing and cleaned up type imports for better
                maintainability.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 14, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 14, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Updated Sunday duty label and adjusted payroll dialogs to disable
                cross-month calculations where unnecessary.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added cross-month payroll calculations along with improved loading
                indicators.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added Sunday duty calculations and display for better tracking of weekend
                work.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 12, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 12, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title>
                (Feature) Improved payroll management by remembering selected date ranges using
                local storage, allowing users to easily return to their last viewed period.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title>
                (Feature) Enhanced holiday calculations to ensure more accurate pay and leave
                processing during special dates.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 11, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 11, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title>
                (Feature) Added attendance tracking and display components in payroll management for
                better visibility of employee attendance details.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 10, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 10, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Allowed access to public pages that do not require authentication.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Implemented automatic calculation of late and early departure penalties
                based on field minutes.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 9, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 9, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Improved work hour calculations to include standard hours and refined how
                field staff hours are processed.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Enhanced Memo form setup to automatically include employee IDs when
                creating or updating records.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 8, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 8, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Updated payroll deductions for late and undertime entries, ensuring field
                staff calculations are now processed server-side for higher accuracy.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Refined payroll layout for improved visibility and readability of details.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added new allowance handling features and improved total earnings
                computation.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Updated gross pay calculations to use allowances instead of COLA across
                all staff types.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Enhanced payroll accuracy by updating both client‑side and server‑side
                calculations.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 7, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 7, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Cleaned up report generation and improved clarity of on‑screen report
                messages.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added new job position fields and improved payroll summary display
                formatting.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Enhanced holiday processing to ensure correct pay rates for each holiday
                type.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Updated designation and form fields for more consistent data entry.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 6, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 6, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added cash adjustment support in payroll, now fully integrated into
                monthly calculations.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Optimized payroll data loading to reduce processing time for field and
                office staff.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Introduced faster data fetching to retrieve all payroll information in a
                single step.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 5, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 5, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Simplified cross‑month payroll handling and improved data refresh behavior
                when switching months.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Improved field staff payroll calculations by refining how total work hours
                are computed and displayed.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 4, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 4, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Consolidated multiple cash advance records into a single summary for
                clearer payroll display.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Improved attendance validation and data fetching for more reliable payroll
                results.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Enhanced processing of holidays and half‑day attendance to ensure full
                accuracy.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Bugfix) Fixed overtime recalculation issues when payroll data is refreshed.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 3, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 3, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Added utilization details to payroll summaries for improved insights on
                employee activities.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                (Feature) Enhanced attendance processing to properly include half‑day entries for
                better accuracy.
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-container>
    </template>
  </LandingLayout>
</template>
