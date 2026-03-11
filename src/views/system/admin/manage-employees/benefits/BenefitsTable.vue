<script setup lang="ts">
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import { type TableHeader } from '@/utils/helpers/tables'
import BenefitsFormDialog from './BenefitsFormDialog.vue'
import AppAlert from '@/components/common/AppAlert.vue'
import { useBenefitsTable } from './benefitsTable'
import { useDisplay } from 'vuetify'
import { useDate } from 'vuetify'

const date = useDate()
const { smAndDown } = useDisplay()

const tableHeaders: TableHeader[] = [
  {
    title: 'Benefit',
    key: 'benefit',
    align: 'start',
  },
  {
    title: 'Type',
    key: 'is_deduction',
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
  isDialogVisible,
  isConfirmDeleteDialog,
  itemData,
  formAction,
  onAdd,
  onUpdate,
  onDelete,
  onConfirmDelete,
  onLoadItems,
  benefitsStore,
} = useBenefitsTable()
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
        :items="benefitsStore.benefitsTable"
        :items-length="benefitsStore.benefitsTableTotal"
        @update:options="onLoadItems"
        :hide-default-header="smAndDown"
        :mobile="smAndDown"
      >
        <template #top>
          <v-row dense>
            <v-spacer></v-spacer>

            <v-col cols="12" sm="3">
              <v-btn class="my-1" prepend-icon="mdi-plus" color="primary" block @click="onAdd">
                Add Benefit
              </v-btn>
            </v-col>
          </v-row>

          <v-divider class="my-5"></v-divider>
        </template>

        <template #item.benefit="{ item }">
          <span class="font-weight-bold"> {{ item.benefit }} </span>
        </template>

        <template #item.is_deduction="{ item }">
          <span class="font-weight-bold"> {{ item.is_deduction ? 'Deduction' : 'Addon' }} </span>
        </template>

        <template #item.created_at="{ item }">
          <span class="font-weight-bold">
            {{ date.format(item.created_at, 'fullDateTime') }}
          </span>
        </template>

        <template #item.actions="{ item }">
          <div class="d-flex align-center" :class="smAndDown ? 'justify-end' : 'justify-center'">
            <v-btn variant="text" density="comfortable" @click="onUpdate(item)" icon>
              <v-icon icon="mdi-pencil"></v-icon>
              <v-tooltip activator="parent" location="top">Edit Benefit</v-tooltip>
            </v-btn>

            <v-btn variant="text" density="comfortable" @click="onDelete(item.id)" icon>
              <v-icon icon="mdi-trash-can" color="secondary"></v-icon>
              <v-tooltip activator="parent" location="top">Delete Benefit</v-tooltip>
            </v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card-text>
  </v-card>

  <BenefitsFormDialog
    v-model:is-dialog-visible="isDialogVisible"
    :item-data="itemData"
    :table-options="tableOptions"
  ></BenefitsFormDialog>

  <ConfirmDialog
    v-model:is-dialog-visible="isConfirmDeleteDialog"
    title="Confirm Delete"
    text="Are you sure you want to delete this benefit?"
    @confirm="onConfirmDelete"
  ></ConfirmDialog>
</template>
