<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import DesignationsFormDialog from './DesignationsFormDialog.vue'
import { useDesignationsTable } from './designationsTable'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { mobile } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Designation',
    key: 'designation',
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
  designationsStore,
} = useDesignationsTable()
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
        :items="designationsStore.designationsTable"
        :items-length="designationsStore.designationsTableTotal"
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
                placeholder="Search Designation, Description"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-tag-plus" color="primary" block @click="onAdd">
                Add Designation
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.designation="{ item }">
          <span class="font-weight-bold"> {{ item.designation }} </span>
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
              <v-tooltip activator="parent" location="top">Edit Designation</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Designation</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <DesignationsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></DesignationsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this designation?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
