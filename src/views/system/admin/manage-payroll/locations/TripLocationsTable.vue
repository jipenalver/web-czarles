<script setup lang="ts">
import TripLocationsFormDialog from './TripLocationsFormDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useTripLocationsTable } from './tripLocationsTable'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Location',
    key: 'location',
    align: 'start',
  },
  {
    title: 'Description',
    key: 'description',
    align: 'start',
  },
  {
    title: 'Added Date',
    key: 'created_at',
    align: 'center',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

const {
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
  onSearchItems,
  onLoadItems,
  onExportPDFHandler,
  isPrinting,
  pdfFormAction,
  tripLocationsStore,
} = useTripLocationsTable()
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
        :items="tripLocationsStore.tripLocationsTable"
        :items-length="tripLocationsStore.tripLocationsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
      >
        <template #top>
          <v-row dense>
            <v-col cols="12" sm="1">
              <v-menu>
                <template v-slot:activator="{ props }">
                  <v-btn icon="mdi-dots-vertical" variant="text" v-bind="props"></v-btn>
                </template>

                <v-list>
                  <v-list-item @click="onExportPDFHandler">
                    <v-list-item-title>Export to PDF</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-menu>
            </v-col>

            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="tableFilters.search"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search Location, Description"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Location
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.location="{ item }">
          <span class="font-weight-bold"> {{ item.location }} </span>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="mobile ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Location</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Location</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <!-- PDF Export Container - hidden table para sa PDF generation -->
  <div style="display: none;" id="trip-locations-table">
    <div style="text-align: center; margin-bottom: 20px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: bold;">TRIP LOCATIONS REPORT</h2>
    </div>
    <div style="width: 100%; display: flex; justify-content: center;">
      <table style="border-collapse: collapse; font-size: 11px; font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0 auto;">
        <thead>
          <tr>
            <th v-for="header in tableHeaders.filter(h => h.key !== 'actions')" :key="header.key" style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: bold; background-color: #f5f5f5;">
              {{ header.title }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in tripLocationsStore.tripLocationsTable" :key="item.id">
            <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #f5f5f5;">{{ item.location }}</td>
            <td style="border: 1px solid #ddd; padding: 6px; background-color: #f5f5f5;">{{ item.description }}</td>
            <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold; background-color: #f5f5f5;">
              {{ date.format(item.created_at, 'fullDateTime') }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <TripLocationsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></TripLocationsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this location?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
