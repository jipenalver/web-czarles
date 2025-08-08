<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { getMoneyText } from '@/utils/helpers/others'
import TripsFormDialog from './TripsFormDialog.vue'
import { useTripsTable } from './tripsTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile, xs } = useDisplay()

const {
  tableHeaders,
  tableOptions,
  tableFilters,
  isDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onAdd,
  onUpdate,
  onDelete,
  onConfirmDelete,
  onFilterDate,
  onFilterItems,
  onLoadItems,
  onExportCSV,
  onExportPDFHandler,
  isPrinting,
  pdfFormAction,
  tripsStore,
  employeesStore,
} = useTripsTable()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <AppAlert
    v-model:is-alert-visible="pdfFormAction.formAlert"
    :form-message="pdfFormAction.formMessage"
    :form-status="pdfFormAction.formStatus"
  ></AppAlert>

  <!-- Loading dialog para sa PDF generation -->
  <LoadingDialog
    v-model:is-visible="isPrinting"
    title="Generating PDF..."
    subtitle="Please wait while we prepare your report"
    description="This may take a few moments"
  ></LoadingDialog>

  <v-card>
    <v-card-text>
      <!-- eslint-disable vue/valid-v-slot -->
      <v-data-table-server
        v-model:items-per-page="tableOptions.itemsPerPage"
        v-model:page="tableOptions.page"
        v-model:sort-by="tableOptions.sortBy"
        :loading="tableOptions.isLoading"
        :headers="tableHeaders"
        :items="tripsStore.tripsTable"
        :items-length="tripsStore.tripsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
      >
        <template #top>
          <v-row dense>
            <v-col cols="12" sm="1" :class="xs ? 'd-flex justify-end' : ''">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                </template>

                <v-list>
                  <v-list-item @click="onExportCSV">
                    <v-list-item-title>Export to CSV</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="onExportPDFHandler">
                    <v-list-item-title>Export to PDF</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>

            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-autocomplete
                v-model="tableFilters.employee_id"
                :items="employeesStore.employees"
                density="compact"
                label="Filter by Employee"
                item-title="label"
                item-value="id"
                clearable
                @update:model-value="onFilterItems"
              ></v-autocomplete>
            </v-col>

            <v-col cols="12" sm="3">
              <v-date-input
                v-model="tableFilters.trip_at"
                prepend-icon=""
                prepend-inner-icon="mdi-calendar"
                density="compact"
                label="Trip Date"
                multiple="range"
                clearable
                @click:clear="onFilterDate(true)"
                @update:model-value="onFilterDate(false)"
              ></v-date-input>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Trip
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.employee="{ item }">
          <span class="font-weight-bold">
            {{ item.employee.lastname + ', ' + item.employee.firstname }}
          </span>
        </template>

        <template #item.unit="{ item }">
          {{ item.unit.name }}
        </template>

        <template #item.trip_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.trip_at, 'fullDate') }}
          </span>
        </template>

        <template #item.trip_location="{ item }">
          {{ item.trip_location.location }}
        </template>

        <template #item.per_trip="{ item }">
          {{ getMoneyText(item.per_trip) }}
        </template>

        <template #item.amount="{ item }">
          <span class="font-weight-black">
            {{ getMoneyText(item.trip_no * item.per_trip) }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Trip</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Trip</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <!-- PDF Export Container - hidden table para sa PDF generation -->
  <div style="display: none;" id="trips-table">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: bold;">TRIPS REPORT</h2>
      <p style="margin: 5px 0; font-size: 12px; color: #666;">Generated on {{ date.format(new Date(), 'fullDate') }}</p>
    </div>

    <!-- Employee filter info para sa PDF -->
    <div v-if="tableFilters.employee_id" style="margin-bottom: 15px; padding: 10px; background-color: #f5f5f5; border-left: 4px solid #ddd;">
      <strong style="font-size: 14px;">Employee: </strong>
      <span style="font-size: 14px;">
        {{
          (employeesStore.employees.find(e => e.id === tableFilters.employee_id)?.lastname || '') +
          ', ' +
          (employeesStore.employees.find(e => e.id === tableFilters.employee_id)?.firstname || '')
        }}
      </span>
    </div>

    <div style="width: 100%; display: flex; justify-content: center;">
      <table style="border-collapse: collapse; font-size: 11px; font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0 auto;">
        <thead>
          <tr>
            <th v-if="!tableFilters.employee_id" style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background-color: #f5f5f5;">
              Employee
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background-color: #f5f5f5;">
              Unit
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background-color: #f5f5f5;">
              Trip Date
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background-color: #f5f5f5;">
              Location
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background-color: #f5f5f5;">
              Materials
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background-color: #f5f5f5;">
              KM
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: center; font-weight: bold; background-color: #f5f5f5;">
              Trips
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background-color: #f5f5f5;">
              Rate
            </th>
            <th style="border: 1px solid #ddd; padding: 8px; text-align: right; font-weight: bold; background-color: #f5f5f5;">
              Total Amount
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tripsStore.tripsTable" :key="item.id">
            <td v-if="!tableFilters.employee_id" style="border: 1px solid #ddd; padding: 6px; vertical-align: top; background-color: #f5f5f5;">
              <div style="font-weight: bold; font-size: 10px;">
                {{ item.employee.lastname + ', ' + item.employee.firstname }}
              </div>
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; vertical-align: top; font-size: 10px; background-color: #f5f5f5;">
              {{ item.unit.name }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; vertical-align: top; font-size: 10px; background-color: #f5f5f5;">
              {{ date.format(item.trip_at, 'fullDate') }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; vertical-align: top; font-size: 10px; word-break: break-word; background-color: #f5f5f5;">
              {{ item.trip_location.location }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; vertical-align: top; font-size: 10px; word-break: break-word; background-color: #f5f5f5;">
              {{ item.materials }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center; vertical-align: top; font-size: 10px; background-color: #f5f5f5;">
              {{ item.km }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: center; vertical-align: top; font-size: 10px; font-weight: bold; background-color: #f5f5f5;">
              {{ item.trip_no }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; vertical-align: top; font-size: 10px; background-color: #f5f5f5;">
              {{ getMoneyText(item.per_trip) }}
            </td>
            <td style="border: 1px solid #ddd; padding: 6px; text-align: right; vertical-align: top; font-size: 10px; font-weight: bold; background-color: #f5f5f5;">
              {{ getMoneyText(item.trip_no * item.per_trip) }}
            </td>
          </tr>
          <!-- Summary row para sa total -->
          <tr v-if="tripsStore.tripsTable.length > 0" style="font-weight: bold; background-color: #f5f5f5;">
            <td :colspan="tableFilters.employee_id ? 7 : 8" style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; background-color: #f5f5f5;">
              <strong>TOTAL AMOUNT:</strong>
            </td>
            <td style="border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; font-weight: bold; background-color: #f5f5f5;">
              {{ getMoneyText(tripsStore.tripsTable.reduce((sum, item) => sum + (item.trip_no * item.per_trip), 0)) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

   
  </div>

  <TripsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></TripsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this trip?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
