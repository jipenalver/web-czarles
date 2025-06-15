<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useAreasTable } from './areasTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Area',
    key: 'area',
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
  areasStore,
} = useAreasTable()
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
        :items="areasStore.areasTable"
        :items-length="areasStore.areasTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="mobile"
        :mobile="mobile"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="tableFilters.search"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search Area, Description"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn
                class="my-1"
                prepend-icon="mdi-map-marker-plus"
                color="primary"
                block
                @click="onAdd"
              >
                Add Area
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.area="{ item }">
          <span class="font-weight-bold"> {{ item.area }} </span>
        </template>

        <template #item.description="{ item }">
          {{ item.description }}
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
              <v-tooltip activator="parent" location="top">Edit Area</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Area</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this area?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
