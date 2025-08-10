<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { getMoneyText } from '@/utils/helpers/others'
import TripsFormDialog from './TripsFormDialog.vue'
import { useTripsTable } from './tripsTable'
import TripsPDF from './pdf/TripsPDF.vue'
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
  onExportPDF,
  tripsStore,
  employeesStore,
  isLoadingPDF,
  formActionPDF,
} = useTripsTable()
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

  <AppAlert
    v-model:is-alert-visible="formActionPDF.formAlert"
    :form-message="formActionPDF.formMessage"
    :form-status="formActionPDF.formStatus"
  ></AppAlert>

  <!-- Loading dialog para sa PDF generation -->
  <LoadingDialog
    v-model:is-visible="isLoadingPDF"
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

                <v-list slim>
                  <v-list-item @click="onExportCSV" prepend-icon="mdi-file-delimited">
                    <v-list-item-title>Export to CSV</v-list-item-title>
                  </v-list-item>
                  <v-list-item @click="onExportPDF" prepend-icon="mdi-file-pdf">
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

  <TripsPDF :table-filters="tableFilters" />

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
