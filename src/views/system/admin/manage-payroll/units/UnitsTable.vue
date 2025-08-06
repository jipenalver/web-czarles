<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import LoadingDialog from '@/components/common/LoadingDialog.vue'
import UnitsFormDialog from './UnitsFormDialog.vue'
import { useUnitsTable } from './unitsTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Name',
    key: 'name',
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
  unitsStore,
} = useUnitsTable()
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
        :items="unitsStore.unitsTable"
        :items-length="unitsStore.unitsTableTotal"
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
                placeholder="Search Unit, Description"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Unit
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.name="{ item }">
          <span class="font-weight-bold"> {{ item.name }} </span>
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
              <v-tooltip activator="parent" location="top">Edit Unit</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Unit</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <!-- PDF Export Container - hidden table para sa PDF generation -->
  <div style="display: none;" id="units-table">
    <h2 class="text-center mb-4">UNITS REPORT</h2>
    <table class="w-100" style="border-collapse: collapse;">
      <thead>
        <tr>
          <th v-for="header in tableHeaders.filter(h => h.key !== 'actions')" :key="header.key"
              style="border: 1px solid #ddd; padding: 8px; text-align: left; background-color: #f5f5f5;">
            {{ header.title }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in unitsStore.unitsTable" :key="item.id">
          <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">{{ item.name }}</td>
          <td style="border: 1px solid #ddd; padding: 6px;">{{ item.description }}</td>
          <td style="border: 1px solid #ddd; padding: 6px; font-weight: bold;">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>

  <UnitsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></UnitsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this unit?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
