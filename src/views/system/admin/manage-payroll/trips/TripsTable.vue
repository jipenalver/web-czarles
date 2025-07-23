<script setup lang="ts">
import TripsFormDialog from '@/views/system/admin/manage-payroll/trips/TripsFormDialog.vue'
import { useTripsTable } from '@/views/system/admin/manage-payroll/trips/tripsTable.ts'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { useTripLocationsStore } from '@/stores/tripLocation'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'




const date = useDate()
const { mobile } = useDisplay()


const tripLocationsStore = useTripLocationsStore()
tripLocationsStore.getTripLocations()

const tableHeaders: TableHeader[] = [
  {
    title: 'Trip No.',
    key: 'trip_no',
    align: 'center',
  },
  {
    title: 'Date',
    key: 'date',
    align: 'center',
  },
  {
    title: 'Employee',
    key: 'employee_id',
    align: 'start',
  },
  {
    title: 'Unit',
    key: 'unit_id',
    align: 'start',
  },
  {
    title: 'Location',
    key: 'trip_location_id',
    align: 'start',
  },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center',
  },
]

import { ref } from 'vue'
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
  tripsStore,
} = useTripsTable()

// Expanded row state
const expanded = ref([])
</script>

<template>
  <AppAlert
    v-model:is-alert-visible="formAction.formAlert"
    :form-message="formAction.formMessage"
    :form-status="formAction.formStatus"
  ></AppAlert>

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
        show-expand
        expand-on-click
        v-model:expanded="expanded"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="tableFilters.search"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search Trip No, Materials, Description"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-map-marker-plus" color="primary" block @click="onAdd">
                Add Trip
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.trip_no="{ item }">
          <span class="font-weight-bold"> {{ item.trip_no }} </span>
        </template>

        <template #item.date="{ item }">
          <span class="font-weight-bold">
            {{ item.date ? date.format(item.date, 'keyboardDate') : 'N/A' }}
          </span>
        </template>

        <template #item.employee_id="{ item }">
          <span> {{ item.employee_id || 'N/A' }} </span>
        </template>

        <template #item.unit_id="{ item }">
          <span> {{ item.units?.name || 'N/A' }} </span>
        </template>

        <template #item.trip_location_id="{ item }">
          <span>
            {{ item.trips_location?.location ||
              tripLocationsStore.tripLocations.find(loc => loc.id === item.trip_location_id)?.location ||
              'N/A' }}
          </span>
        </template>

        <!-- KM, Per Trip, Materials, and Created Date moved to expanded row -->

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

        <template #expanded-row="{ columns, item }">
          <tr>
            <td :colspan="columns.length">
              <v-row>
                <v-col cols="12" sm="6">
                  <strong>Description:</strong> {{ item.description || 'N/A' }}
                </v-col>
               
                <v-col cols="12" sm="3">
                  <strong>KM:</strong> {{ item.km || 'N/A' }}
                </v-col>
                <v-col cols="12" sm="3">
                  <strong>Per Trip:</strong> {{ item.per_trip ? `₱${item.per_trip}` : 'N/A' }}
                </v-col>
                <v-col cols="12" sm="3">
                  <strong>Materials:</strong> {{ item.materials || 'N/A' }}
                </v-col>
                <v-col cols="12" sm="3">
                  <strong>Created Date:</strong> <span class="font-weight-bold">{{ date.format(item.created_at, 'fullDateTime') }}</span>
                </v-col>
              </v-row>
            </td>
          </tr>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

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