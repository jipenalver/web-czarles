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

          <!-- November 9, 2025 -->
          <v-divider class="mb-4"></v-divider>
          <h3 class="text-h6 mb-3">November 9, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Improved the calculation of work hours to include standard hours and fine-tuned how
                field staff hours are handled.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Enhanced Memo form setup to automatically include employee IDs when creating or
                updating records.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 8, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 8, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Updated payroll deductions for late and undertime entries so that field staff
                calculations are now processed directly on the server for better accuracy.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Refined the payroll layout for better visibility and readability of smaller details.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Added new features to handle employee allowances and improved how total earnings are
                computed.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Adjusted gross pay calculations to use allowances instead of COLA for all staff
                types.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Improved the overall accuracy of payroll data by updating both client and
                server-side calculations.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 7, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 7, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Cleaned up report generation and improved the clarity of on-screen messages for
                payroll reports.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Added new job position fields and improved how data is displayed in payroll
                summaries.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Enhanced holiday handling in payroll to ensure correct pay rates for different
                holiday types.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Updated designation and form fields for better consistency in data entry.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 6, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 6, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Added support for cash adjustments in payroll, now fully reflected in monthly
                processing.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Optimized how payroll data is loaded, reducing processing time for both field and
                non-field employees.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Introduced a faster data fetching method to gather all payroll-related details in a
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
                Simplified cross-month payroll handling and improved data refresh when toggling
                months.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Enhanced payroll computation for field staff by improving how total worked hours are
                recorded and reflected in pay.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 4, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 4, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Combined multiple cash advance records into a single summary for clearer payroll
                display.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Improved attendance validation and fetching for more reliable payroll calculations.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Enhanced how holidays and half-day attendances are included in payroll to ensure
                complete accuracy.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Fixed how overtime hours are recalculated after reloading payroll data.
              </v-list-item-title>
            </v-list-item>
          </v-list>

          <!-- November 3, 2025 -->
          <v-divider class="my-4"></v-divider>
          <h3 class="text-h6 mb-3">November 3, 2025</h3>
          <v-list density="comfortable">
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Added utilization details to payroll summaries for better insight into employee
                activities.
              </v-list-item-title>
            </v-list-item>
            <v-list-item>
              <v-list-item-title class="text-wrap">
                Improved how attendance records are processed to include half-day entries for better
                accuracy.
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-container>
    </template>
  </LandingLayout>
</template>
