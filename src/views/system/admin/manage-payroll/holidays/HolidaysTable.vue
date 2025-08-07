<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { displayHolidayTypes } from '@/utils/helpers/constants'
import HolidaysFormDialog from './HolidaysFormDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useHolidaysTable } from './holidaysTable'
import { useDisplay, useDate } from 'vuetify'

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Date',
    key: 'holiday_at',
    align: 'start',
  },
  {
    title: 'Holiday',
    key: 'name',
    align: 'start',
  },
  {
    title: 'Type',
    key: 'type',
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
  onFilterItems,
  onLoadItems,
  holidaysStore,
} = useHolidaysTable()
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
        :items="holidaysStore.holidaysTable"
        :items-length="holidaysStore.holidaysTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-select
                v-model="tableFilters.year"
                :items="['2023', '2024', '2025', '2026', '2027', '2028', '2029', '2030']"
                density="compact"
                label="Filter by Year"
                clearable
                @update:model-value="onFilterItems"
              ></v-select>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Holiday
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.holiday_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.holiday_at, 'fullDate') }}
          </span>
        </template>

        <template #item.name="{ item }">
          <span class="font-weight-bold"> {{ item.name }} </span>
        </template>

        <template #item.type="{ item }">
          {{ displayHolidayTypes[item.type as keyof typeof displayHolidayTypes] || item.type }}
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
              <v-tooltip activator="parent" location="top">Edit Holiday</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Holiday</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <HolidaysFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></HolidaysFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this holiday?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
