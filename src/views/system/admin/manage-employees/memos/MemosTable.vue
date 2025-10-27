<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import AppAlert from '@/components/common/AppAlert.vue'
import MemosFormDialog from './MemosFormDialog.vue'
import { useMemosTable } from './memosTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { smAndDown } = useDisplay()

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
    title: 'Employees',
    key: 'employees',
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
  memosStore,
} = useMemosTable()
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
        :items="memosStore.memosTable"
        :items-length="memosStore.memosTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="smAndDown"
        :mobile="smAndDown"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="4">
              <v-text-field
                v-model="tableFilters.search"
                density="compact"
                prepend-inner-icon="mdi-magnify"
                placeholder="Search Name, Description"
                clearable
                @click:clear="onSearchItems"
                @input="onSearchItems"
              ></v-text-field>
            </v-col>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Memo
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.name="{ item }">
          <span class="font-weight-bold"> {{ item.name }} </span>
        </template>

        <template #item.employees="{ item }">
          <div v-if="item.employee_memos && item.employee_memos.length > 0">
            <v-chip
              v-for="memo in item.employee_memos"
              :key="memo.id"
              class="mx-1 font-weight-bold"
              variant="flat"
              color="secondary"
              size="x-small"
            >
              {{ memo.employee.firstname }} {{ memo.employee.lastname }}
            </v-chip>
          </div>
          <div v-else>
            <v-chip class="mx-1 font-weight-bold" variant="flat" color="default" size="x-small">
              For Everybody
            </v-chip>
          </div>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="smAndDown ? 'justify-end' : 'justify-center'">
            <a :href="item.file_path" target="_blank" rel="noopener noreferrer">
              <v-btn variant="text" density="comfortable" icon>
                <v-icon icon="mdi-download"></v-icon>
                <v-tooltip activator="parent" location="top">Download Memo</v-tooltip>
              </v-btn>
            </a>

            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Memo</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Memo</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <MemosFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
    :table-filters="tableFilters"
  ></MemosFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this memo?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
