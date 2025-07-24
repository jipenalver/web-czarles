<script setup lang="ts">
import TripsFormDialog from '@/views/system/admin/manage-payroll/trips/TripsFormDialog.vue'
import TripsExpandedRow from '@/views/system/admin/manage-payroll/trips/TripsExpandedRow.vue'
import { useTripsTable } from '@/views/system/admin/manage-payroll/trips/tripsTable.ts'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'
import { ref } from 'vue'

const date = useDate()
const { mobile } = useDisplay()

// Expanded row state
const expanded = ref([])

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
    key: 'employee_fullname',
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
  onFilterItems,
  onLoadItems,
  tripsStore,
} = useTripsTable()
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
                label="Search Trip No, Materials, Description"
                clearable
                @update:model-value="onFilterItems"
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
          <span> {{ item.employee_fullname  }} </span>
        </template>

        <template #item.unit_id="{ item }">
          <span> {{ item.units?.name  }} </span>
        </template>

        <template #item.trip_location_id="{ item }">
          <span> {{ item.trip_location?.location  }} </span>
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

        <template #expanded-row="{ columns, item }">
          <TripsExpandedRow :columns-length="columns.length" :item-data="item" />
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
  />
</template>