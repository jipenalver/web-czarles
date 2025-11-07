<script setup lang="ts">
import MonthlyPayrollTable from '@/views/system/admin/manage-payroll/summary/components/MonthlyPayrollTable.vue'
import MonthlyPayrollPDF from '@/views/system/admin/manage-payroll/summary/pdf/MonthlyPayrollPDF.vue'
import { useMonthlyPayroll } from '@/views/system/admin/manage-payroll/summary/composables/monthlyPayroll'
import { useMonthlyPayrollPDF } from '@/views/system/admin/manage-payroll/summary/pdf/monthlyPayrollPDF'
import { monthNames } from '@/views/system/admin/manage-payroll/payroll/helpers'
import { useDesignationsStore } from '@/stores/designations'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { ref, watch, onMounted } from 'vue'

// Use composable for monthly payroll logic
const {
  loading,
  monthlyPayrollData,
  selectedMonth,
  selectedYear,
  loadMonthlyPayroll,
  refreshMonthlyPayroll,
} = useMonthlyPayroll()

// Use PDF composable
const { isLoadingPDF, onExport } = useMonthlyPayrollPDF()

// Use designations store
const designationsStore = useDesignationsStore()

// Set default month to current month and load designations
onMounted(async () => {
  selectedMonth.value = monthNames[new Date().getMonth()]
  await designationsStore.getDesignations()
})

// Watch for changes
watch([selectedMonth, selectedYear], () => {
  if (selectedMonth.value && selectedYear.value) {
    loadMonthlyPayroll()
  }
})

// Alert state
const formAlert = ref(false)
const formMessage = ref('')
const formStatus = ref<number>(200)

// Menu state
const menuOpen = ref(false)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(25)

// Search state
const searchQuery = ref('')

// Designation filter state
const selectedDesignation = ref<number | null>(null)

// Reset to first page when data changes or search query changes
watch(monthlyPayrollData, () => {
  currentPage.value = 1
})

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(selectedDesignation, () => {
  currentPage.value = 1
})

// PDF Export handler
const handleExportPDF = async () => {
  menuOpen.value = false
  await onExport({
    selectedMonth: selectedMonth.value,
    selectedYear: selectedYear.value,
  })
}
</script>

<template>
  <div>
    <AppAlert
      v-model:is-alert-visible="formAlert"
      :form-message="formMessage"
      :form-status="formStatus"
    ></AppAlert>

    <!-- Loading Dialog for PDF -->
    <LoadingDialog
      v-model:is-visible="isLoadingPDF"
      title="Generating PDF..."
      subtitle="Please wait while we create your payroll report"
      description="This may take a few moments"
    />

    <!-- PDF Component (Hidden) -->
    <MonthlyPayrollPDF
      :items="monthlyPayrollData"
      :selected-month="selectedMonth"
      :selected-year="selectedYear"
    />

    <!-- Combined Card with Filters and Table -->
    <v-card>
      <v-card-text class="d-flex align-center">
        <!-- 3-dot menu on the left -->
        <v-menu v-model="menuOpen" :close-on-content-click="false">
          <template v-slot:activator="{ props }">
            <v-btn
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              v-bind="props"
              :disabled="monthlyPayrollData.length === 0"
            ></v-btn>
          </template>
          <v-list density="compact">
            <v-list-item @click="handleExportPDF" :disabled="isLoadingPDF">
              <template v-slot:prepend>
                <v-icon icon="mdi-file-pdf-box"></v-icon>
              </template>
              <v-list-item-title>Export to PDF</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <span class="text-h5">
          <v-icon class="me-2" icon="mdi-calendar-month" size="small"></v-icon>
          Payroll Summary
        </span>
      </v-card-text>

      <!-- Filters Section -->
      <v-card-text>
        <v-row>
          <v-col cols="12" md="3">
            <v-select
              v-model="selectedMonth"
              :items="
                monthNames.map((month, index) => ({
                  title: month,
                  value: month,
                  index: index,
                }))
              "
              label="Select Month"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar"
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="selectedYear"
              :items="Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
              label="Select Year"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-calendar-range"
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="selectedDesignation"
              :items="[
                { title: 'All Designations', value: null },
                ...designationsStore.designations.map((d) => ({
                  title: d.designation,
                  value: d.id,
                })),
              ]"
              label="Filter by Designation"
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-briefcase"
              clearable
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              v-model="searchQuery"
              label="Search Employee"
              placeholder="Enter employee name..."
              variant="outlined"
              density="compact"
              prepend-inner-icon="mdi-account-search"
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-btn
              class="mt-1"
              color="primary"
              @click="refreshMonthlyPayroll"
              :loading="loading"
              :disabled="!selectedMonth || !selectedYear"
              block
            >
              <v-icon icon="mdi-refresh" class="me-2"></v-icon>
              Generate Report
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-divider v-if="monthlyPayrollData.length > 0"></v-divider>

      <!-- Table Section -->
      <MonthlyPayrollTable
        v-if="monthlyPayrollData.length > 0"
        :items="monthlyPayrollData"
        :loading="loading"
        :search-query="searchQuery"
        :selected-designation="selectedDesignation"
        v-model:current-page="currentPage"
        v-model:items-per-page="itemsPerPage"
      />

      <!-- Empty State -->
      <v-card-text v-else-if="!loading">
        <v-alert type="info" variant="tonal">
          <v-icon icon="mdi-information" class="me-2"></v-icon>
          Select a month and year, then click "Generate Report" to view the monthly payroll summary.
        </v-alert>
      </v-card-text>
    </v-card>
  </div>
</template>
